import { useMemo, useState } from "react";
import {
  findDuplicateCharacterGroups,
  pickPrimaryCharacter,
  buildMergedCharacterPayload,
  pickBetterRaidStatus
} from "../utils/characterMerge";
import {
  updateCharacter,
  deleteCharacter,
  updateLootItem,
  updateRaidStatus,
  deleteRaidStatus
} from "../services/dataService";
import { Card, CardHeader, CardBody } from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

const CONFIDENCE_BADGE = {
  auto: { tone: "good", label: "Likely duplicate" },
  manual: { tone: "warn", label: "Needs review" },
  distinct: { tone: "neutral", label: "Probably not a duplicate" }
};

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

async function mergeCharacters(docsToMerge, { raidStatuses, lootItems }) {
  const primary = pickPrimaryCharacter(docsToMerge);
  const others = docsToMerge.filter((doc) => doc.id !== primary.id);

  const payload = buildMergedCharacterPayload(primary, others);
  if (Object.keys(payload).length) {
    await updateCharacter(primary.id, payload);
  }

  const primaryStatusByRaid = new Map(
    raidStatuses
      .filter((status) => status.characterId === primary.id)
      .map((status) => [status.raidName, status])
  );

  for (const loser of others) {
    const loserLoot = lootItems.filter((item) => item.characterId === loser.id);
    await Promise.all(loserLoot.map((item) => updateLootItem(item.id, { characterId: primary.id })));

    const loserStatuses = raidStatuses.filter((status) => status.characterId === loser.id);
    for (const loserStatus of loserStatuses) {
      const existingPrimaryStatus = primaryStatusByRaid.get(loserStatus.raidName);

      if (!existingPrimaryStatus) {
        await updateRaidStatus(loserStatus.id, { characterId: primary.id });
        primaryStatusByRaid.set(loserStatus.raidName, { ...loserStatus, characterId: primary.id });
        continue;
      }

      const winner = pickBetterRaidStatus(existingPrimaryStatus, loserStatus);
      if (winner === loserStatus) {
        await updateRaidStatus(existingPrimaryStatus.id, {
          completed: loserStatus.completed,
          lastRunDate: loserStatus.lastRunDate,
          resetDate: loserStatus.resetDate,
          updatedAt: new Date().toISOString()
        });
      }
      await deleteRaidStatus(loserStatus.id);
    }

    await deleteCharacter(loser.id);
  }

  return primary;
}

function DocRow({ doc, accountLabel, checked, onToggle, selectable }) {
  return (
    <tr className="border-b border-border last:border-0">
      {selectable ? (
        <td className="px-3 py-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onToggle(doc.id, event.target.checked)}
            className="h-4 w-4"
          />
        </td>
      ) : null}
      <td className="px-3 py-2 text-ink-soft">{doc.class || "Unknown"}</td>
      <td className="px-3 py-2 text-ink-soft">{typeof doc.level === "number" ? doc.level : "-"}</td>
      <td className="px-3 py-2 text-ink-soft">
        {Array.isArray(doc.equippedItems) ? doc.equippedItems.length : "-"}
      </td>
      <td className="px-3 py-2 text-ink-soft">{doc.guildName || "-"}</td>
      <td className="px-3 py-2 text-ink-soft">{accountLabel || "(unlabeled)"}</td>
      <td className="px-3 py-2 text-xs text-ink-faint">
        {doc.importedFromNova ? "Nova " : ""}
        {doc.importedFromDataStore ? "DataStore" : ""}
        {!doc.importedFromNova && !doc.importedFromDataStore ? "-" : ""}
      </td>
      <td className="px-3 py-2 text-xs text-ink-faint">{formatDate(doc.createdAt)}</td>
    </tr>
  );
}

export default function DuplicateCharacterReview({ characters, raidStatuses, lootItems, accounts }) {
  const groups = useMemo(
    () => findDuplicateCharacterGroups(characters, accounts),
    [characters, accounts]
  );
  const accountLabelById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.battleNetId])),
    [accounts]
  );

  const [manualSelections, setManualSelections] = useState({});
  const [mergingKey, setMergingKey] = useState(null);
  const [results, setResults] = useState({});

  const toggleManualSelection = (groupKey, docId, checked) => {
    setManualSelections((prev) => {
      const current = new Set(prev[groupKey] || []);
      if (checked) {
        current.add(docId);
      } else {
        current.delete(docId);
      }
      return { ...prev, [groupKey]: current };
    });
  };

  const onMerge = async (group, docsToMerge) => {
    if (docsToMerge.length < 2 || mergingKey) {
      return;
    }

    const names = docsToMerge.map((doc) => doc.class || "Unknown").join(" + ");
    const confirmed = window.confirm(
      `Merge ${docsToMerge.length} docs for ${group.name} (${group.realm}) [${names}] into one character? ` +
        "The most complete doc is kept; the others' raid lockouts and loot wishlist entries move over, then they're deleted. This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    setMergingKey(group.key);
    setResults((prev) => ({ ...prev, [group.key]: null }));
    try {
      await mergeCharacters(docsToMerge, { raidStatuses, lootItems });
      setResults((prev) => ({ ...prev, [group.key]: { status: "success", message: "Merged." } }));
      setManualSelections((prev) => ({ ...prev, [group.key]: new Set() }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [group.key]: { status: "error", message: error?.message || "Merge failed." }
      }));
    } finally {
      setMergingKey(null);
    }
  };

  if (!groups.length) {
    return (
      <Card className="mt-6">
        <CardHeader title="Duplicate Characters" subtitle="No name/realm groups with more than one doc found." />
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader
        title="Duplicate Characters"
        subtitle={`${groups.length} name/realm group(s) with more than one doc. Review before merging — some are legitimately separate characters on different accounts.`}
      />
      <CardBody className="space-y-6">
        {groups.map((group) => {
          const badge = CONFIDENCE_BADGE[group.confidence];
          const result = results[group.key];
          const selectable = group.confidence === "manual";
          const selectedIds = manualSelections[group.key] || new Set();
          const docsToMerge = group.confidence === "auto" ? group.docs : group.docs.filter((doc) => selectedIds.has(doc.id));
          const isMerging = mergingKey === group.key;

          return (
            <div key={group.key} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-ink">{group.name}</span>
                  <span className="ml-2 text-sm text-ink-soft">{group.realm}</span>
                </div>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-faint">{group.reason}</p>

              <div className="scrollbar-thin mt-3 overflow-x-auto">
                <table className="w-full min-w-max border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted text-xs text-ink-soft">
                      {selectable ? <th className="px-3 py-2 font-medium">Merge</th> : null}
                      <th className="px-3 py-2 font-medium">Class</th>
                      <th className="px-3 py-2 font-medium">Level</th>
                      <th className="px-3 py-2 font-medium">Items</th>
                      <th className="px-3 py-2 font-medium">Guild</th>
                      <th className="px-3 py-2 font-medium">Account</th>
                      <th className="px-3 py-2 font-medium">Source</th>
                      <th className="px-3 py-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.docs.map((doc) => (
                      <DocRow
                        key={doc.id}
                        doc={doc}
                        accountLabel={accountLabelById.get(doc.accountId)}
                        selectable={selectable}
                        checked={selectedIds.has(doc.id)}
                        onToggle={(docId, checked) => toggleManualSelection(group.key, docId, checked)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {group.confidence !== "distinct" ? (
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => onMerge(group, docsToMerge)}
                    disabled={docsToMerge.length < 2 || isMerging}
                  >
                    {isMerging ? "Merging..." : `Merge ${docsToMerge.length || ""} selected`}
                  </Button>
                  {result ? (
                    <span className={`text-xs ${result.status === "success" ? "text-good" : "text-bad"}`}>
                      {result.message}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}
