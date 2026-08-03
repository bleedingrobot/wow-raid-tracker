import { useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { RAIDS } from "../data/raids";
import { useUserCollections } from "../hooks/useUserCollections";
import { formatCountdown, isRaidLocked } from "../utils/raidReset";
import PageHeader from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function factionOrder(faction) {
  const value = String(faction || "").toLowerCase();
  if (value === "alliance") return 0;
  if (value === "horde") return 1;
  return 2;
}

function StatusCell({ status }) {
  const locked = isRaidLocked(status);
  if (!locked) {
    return <Badge tone="good">Open</Badge>;
  }

  if (!status?.resetDate) {
    return <Badge tone="bad">Locked</Badge>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge tone="bad">Locked</Badge>
      <span className="text-xs text-ink-faint">{formatCountdown(new Date(status.resetDate))}</span>
    </div>
  );
}

export default function RaidsPage() {
  const { user } = useAuth();
  const { data } = useUserCollections(user?.uid);
  const visibleCharacters = data.characters.filter((character) => character.showOnDashboard !== false);

  const accountNameById = useMemo(
    () => new Map(data.accounts.map((account) => [account.id, account.battleNetId])),
    [data.accounts]
  );

  const getStatus = useCallback(
    (characterId, raidName) =>
      data.raidStatuses.find((status) => status.characterId === characterId && status.raidName === raidName),
    [data.raidStatuses]
  );

  const sortedCharacters = useMemo(() => {
    return [...visibleCharacters].sort((a, b) => {
      const factionDiff = factionOrder(a.faction) - factionOrder(b.faction);
      if (factionDiff !== 0) return factionDiff;

      const lockedCountA = RAIDS.reduce((count, raid) => count + (isRaidLocked(getStatus(a.id, raid.name)) ? 1 : 0), 0);
      const lockedCountB = RAIDS.reduce((count, raid) => count + (isRaidLocked(getStatus(b.id, raid.name)) ? 1 : 0), 0);
      if (lockedCountA !== lockedCountB) return lockedCountB - lockedCountA;

      return a.name.localeCompare(b.name);
    });
  }, [visibleCharacters, getStatus]);

  if (!user) {
    return (
      <div>
        <PageHeader title="Raid Lockouts" />
        <EmptyState title="Sign in required" description="Sign in to view raid lockouts." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Raid Lockouts" subtitle="Weekly reset tracking across all of your characters." />

      {!visibleCharacters.length ? (
        <EmptyState title="No characters yet" description="Add characters first from the Characters page." />
      ) : !data.raidStatuses.length ? (
        <EmptyState
          title="No synced lockout data"
          description="Use Settings to connect your addon export files and sync."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  <th className="px-4 py-3 font-medium text-ink-soft">Character</th>
                  <th className="px-4 py-3 font-medium text-ink-soft">Realm</th>
                  <th className="px-4 py-3 font-medium text-ink-soft">Account</th>
                  {RAIDS.map((raid) => (
                    <th key={raid.name} className="px-4 py-3 font-medium text-ink-soft">
                      {raid.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCharacters.map((character) => (
                  <tr key={character.id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                    <td className="px-4 py-3 font-medium text-ink">{character.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{character.realm || "-"}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {character.accountId
                        ? accountNameById.get(character.accountId) || "Unknown account"
                        : "Unassigned"}
                    </td>
                    {RAIDS.map((raid) => (
                      <td key={raid.name} className="px-4 py-3">
                        <StatusCell status={getStatus(character.id, raid.name)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
