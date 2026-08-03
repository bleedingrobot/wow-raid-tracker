import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserCollections } from "../hooks/useUserCollections";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Input, Select } from "../components/ui/Field";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatNumber(value) {
  const safe = Number(value);
  if (!Number.isFinite(safe) || safe < 0) {
    return "0";
  }
  return Math.floor(safe).toLocaleString();
}

function getRestedXp(character) {
  const lowerCamel = Number(character?.restedXp);
  if (Number.isFinite(lowerCamel) && lowerCamel > 0) {
    return lowerCamel;
  }

  const upperCamel = Number(character?.restedXP);
  if (Number.isFinite(upperCamel) && upperCamel > 0) {
    return upperCamel;
  }

  return 0;
}

function factionTone(faction) {
  const value = String(faction || "").toLowerCase();
  if (value === "alliance") return "brand";
  if (value === "horde") return "bad";
  return "neutral";
}

export default function RestedXpPage() {
  const { user, loading: authLoading, hasFirebaseConfig } = useAuth();
  const { data, loading } = useUserCollections(user?.uid);

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [factionFilter, setFactionFilter] = useState("all");
  const [realmFilter, setRealmFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [minRestedFilter, setMinRestedFilter] = useState("");

  const accountNameById = useMemo(
    () => new Map(data.accounts.map((account) => [account.id, account.battleNetId])),
    [data.accounts]
  );

  const allCharacters = useMemo(() => data.characters, [data.characters]);

  const classOptions = useMemo(
    () => Array.from(new Set(allCharacters.map((character) => character.class).filter(Boolean))).sort(),
    [allCharacters]
  );
  const factionOptions = useMemo(
    () => Array.from(new Set(allCharacters.map((character) => character.faction).filter(Boolean))).sort(),
    [allCharacters]
  );
  const realmOptions = useMemo(
    () => Array.from(new Set(allCharacters.map((character) => character.realm).filter(Boolean))).sort(),
    [allCharacters]
  );
  const accountOptions = useMemo(() => {
    const map = new Map();

    allCharacters.forEach((character) => {
      const value = character.accountId || "unassigned";
      const label = character.accountId
        ? accountNameById.get(character.accountId) || "Unknown account"
        : "Unassigned";

      if (!map.has(value)) {
        map.set(value, label);
      }
    });

    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allCharacters, accountNameById]);

  const rows = useMemo(() => {
    const threshold = Number(minRestedFilter);
    const hasThreshold = minRestedFilter !== "" && !Number.isNaN(threshold);

    return allCharacters
      .filter((character) => {
        const level = Number(character.level);
        if (!Number.isFinite(level) || level < 15 || level >= 60) {
          return false;
        }

        const safeRestedXp = getRestedXp(character);
        if (safeRestedXp <= 0) {
          return false;
        }
        const classMatch = classFilter === "all" || character.class === classFilter;
        const factionMatch = factionFilter === "all" || character.faction === factionFilter;
        const realmMatch = realmFilter === "all" || character.realm === realmFilter;
        const accountValue = character.accountId || "unassigned";
        const accountMatch = accountFilter === "all" || accountValue === accountFilter;
        const nameMatch = !searchTerm.trim() || normalize(character.name).includes(normalize(searchTerm));
        const restedMatch = !hasThreshold || safeRestedXp >= threshold;

        return classMatch && factionMatch && realmMatch && accountMatch && nameMatch && restedMatch;
      })
      .map((character) => {
        const safeRestedXp = getRestedXp(character);

        return {
          id: character.id,
          name: character.name,
          realm: character.realm || "Unknown",
          account: character.accountId ? accountNameById.get(character.accountId) || "Unknown account" : "Unassigned",
          className: character.class || "Unknown",
          faction: character.faction || "Unknown",
          level: character.level,
          restedXp: safeRestedXp
        };
      })
      .sort((a, b) => b.restedXp - a.restedXp || a.name.localeCompare(b.name));
  }, [
    allCharacters,
    classFilter,
    factionFilter,
    realmFilter,
    accountFilter,
    searchTerm,
    minRestedFilter,
    accountNameById
  ]);

  const resetFilters = () => {
    setSearchTerm("");
    setClassFilter("all");
    setFactionFilter("all");
    setRealmFilter("all");
    setAccountFilter("all");
    setMinRestedFilter("");
  };

  if (!hasFirebaseConfig) {
    return (
      <div>
        <PageHeader title="Rested XP Boost List" />
        <EmptyState
          title="Firebase not configured"
          description="Add Firebase keys in your .env to enable Auth and data sync."
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="Rested XP Boost List" />
        <EmptyState title="Sign in required" description="Sign in to view rested XP for your characters." />
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div>
        <PageHeader title="Rested XP Boost List" />
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-soft">
          <Spinner className="h-5 w-5" />
          Loading rested XP...
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Rested XP Boost List" subtitle="Characters level 15-59, sorted by most rested XP first." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search character name"
          className="w-48"
        />
        <Select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="w-40">
          <option value="all">All classes</option>
          {classOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select value={factionFilter} onChange={(event) => setFactionFilter(event.target.value)} className="w-40">
          <option value="all">All factions</option>
          {factionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select value={realmFilter} onChange={(event) => setRealmFilter(event.target.value)} className="w-40">
          <option value="all">All realms</option>
          {realmOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)} className="w-44">
          <option value="all">All accounts</option>
          {accountOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          min="0"
          step="1"
          value={minRestedFilter}
          onChange={(event) => setMinRestedFilter(event.target.value)}
          placeholder="Rested XP >= X"
          className="w-40"
        />
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader title={`Eligible Characters (${rows.length})`} />
        {!rows.length ? (
          <div className="px-5 pb-5">
            <EmptyState
              title="No matching characters"
              description="No sub-60 characters with rested XP matched your filters. Run Nova sync to refresh rested XP values."
            />
          </div>
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  <th className="px-4 py-3 font-medium text-ink-soft">Character</th>
                  <th className="px-4 py-3 font-medium text-ink-soft">Level</th>
                  <th className="px-4 py-3 font-medium text-ink-soft">Class</th>
                  <th className="px-4 py-3 font-medium text-ink-soft">Faction</th>
                  <th className="px-4 py-3 font-medium text-ink-soft">Realm</th>
                  <th className="px-4 py-3 font-medium text-ink-soft">Account</th>
                  <th className="px-4 py-3 font-medium text-ink-soft">Rested XP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                    <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{row.level ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-soft">{row.className}</td>
                    <td className="px-4 py-3">
                      <Badge tone={factionTone(row.faction)}>{row.faction}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{row.realm}</td>
                    <td className="px-4 py-3 text-ink-soft">{row.account}</td>
                    <td className="px-4 py-3 text-ink">{formatNumber(row.restedXp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
