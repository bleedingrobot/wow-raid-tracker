import { useMemo, useState } from "react";
import { findDuplicateAccountGroups } from "../utils/accountMerge";
import { updateCharacter, deleteAccount } from "../services/dataService";
import { Card, CardHeader, CardBody } from "./ui/Card";
import Button from "./ui/Button";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

async function mergeAccountGroup(group, characters) {
  const [primary, ...losers] = group.accounts;

  for (const loser of losers) {
    const affected = characters.filter((character) => character.accountId === loser.id);
    await Promise.all(affected.map((character) => updateCharacter(character.id, { accountId: primary.id })));
    await deleteAccount(loser.id);
  }

  return primary;
}

export default function DuplicateAccountReview({ accounts, characters }) {
  const groups = useMemo(() => findDuplicateAccountGroups(accounts, characters), [accounts, characters]);
  const [mergingLabel, setMergingLabel] = useState(null);
  const [results, setResults] = useState({});

  const onMerge = async (group) => {
    if (mergingLabel) {
      return;
    }

    const confirmed = window.confirm(
      `Merge ${group.accounts.length} "${group.accounts[0].battleNetId}" account docs into one? ` +
        "Characters pointing at the extra docs are repointed to the surviving one, then the extras are deleted. This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    setMergingLabel(group.label);
    setResults((prev) => ({ ...prev, [group.label]: null }));
    try {
      await mergeAccountGroup(group, characters);
      setResults((prev) => ({ ...prev, [group.label]: { status: "success", message: "Merged." } }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [group.label]: { status: "error", message: error?.message || "Merge failed." }
      }));
    } finally {
      setMergingLabel(null);
    }
  };

  if (!groups.length) {
    return (
      <Card className="mt-6">
        <CardHeader title="Duplicate Accounts" subtitle="No account labels with more than one doc found." />
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader
        title="Duplicate Accounts"
        subtitle={`${groups.length} account label(s) with more than one doc — a sync-timing bug used to create these (see dataService.addAccount).`}
      />
      <CardBody className="space-y-6">
        {groups.map((group) => {
          const result = results[group.label];
          const isMerging = mergingLabel === group.label;

          return (
            <div key={group.label} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-ink">{group.accounts[0].battleNetId}</span>
                <Button size="sm" onClick={() => onMerge(group)} disabled={isMerging}>
                  {isMerging ? "Merging..." : "Merge"}
                </Button>
              </div>

              <div className="scrollbar-thin mt-3 overflow-x-auto">
                <table className="w-full min-w-max border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted text-xs text-ink-soft">
                      <th className="px-3 py-2 font-medium">Account Doc ID</th>
                      <th className="px-3 py-2 font-medium">Characters</th>
                      <th className="px-3 py-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.accounts.map((account, index) => (
                      <tr key={account.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-mono text-xs text-ink-soft">
                          {account.id}
                          {index === 0 ? <span className="ml-2 text-xs text-good">(kept)</span> : null}
                        </td>
                        <td className="px-3 py-2 text-ink-soft">{group.characterCounts[index]}</td>
                        <td className="px-3 py-2 text-xs text-ink-faint">{formatDate(account.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result ? (
                <p className={`mt-2 text-xs ${result.status === "success" ? "text-good" : "text-bad"}`}>
                  {result.message}
                </p>
              ) : null}
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}
