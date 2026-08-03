import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw, X } from "lucide-react";
import CharacterCard from "../components/CharacterCard";
import { useAuth } from "../context/AuthContext";
import { RAIDS } from "../data/raids";
import { useUserCollections } from "../hooks/useUserCollections";
import { useInventory } from "../hooks/useInventory";
import { useLuaSync } from "../hooks/useLuaSync";
import { getNextRaidReset, formatCountdown, isRaidLocked } from "../utils/raidReset";
import { getClassIcon } from "../utils/classIcons";
import { computeShoppingNeeds } from "../utils/shoppingList";
import { getCharacterBuffSet, normalizeBuffName } from "../utils/buffCatalog";
import { resolveRaidTagLabel } from "../utils/characterFilters";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { FormRow, Input, Select } from "../components/ui/Field";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";

const DASHBOARD_SECTION_STATE_KEY = "dashboard_section_state";

const SYNC_STATUS_TONE = {
  syncing: "brand",
  success: "good",
  error: "bad",
  warn: "warn",
  idle: "neutral"
};

const SYNC_STATUS_LABEL = {
  syncing: "Syncing",
  success: "Healthy",
  error: "Error",
  warn: "Attention",
  idle: "Idle"
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function readDashboardSectionState() {
  const defaults = { buffReadiness: true, filters: true, characters: true };

  try {
    const raw = localStorage.getItem(DASHBOARD_SECTION_STATE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return defaults;
    }

    return {
      ...defaults,
      buffReadiness: parsed.buffReadiness !== false,
      filters: parsed.filters !== false,
      characters: parsed.characters !== false
    };
  } catch {
    return defaults;
  }
}

function CollapsibleSection({ title, subtitle, sectionKey, open, onToggle, children }) {
  return (
    <Card className="mb-6">
      <CardHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(sectionKey)}
            aria-expanded={open}
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {open ? "Collapse" : "Expand"}
          </Button>
        }
      />
      {open ? <CardBody>{children}</CardBody> : null}
    </Card>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading, hasFirebaseConfig } = useAuth();
  const { data, loading } = useUserCollections(user?.uid);
  const inventoryItems = useInventory(user?.uid);
  const luaSync = useLuaSync({ user, data });

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [factionFilter, setFactionFilter] = useState("all");
  const [realmFilter, setRealmFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [minLevelFilter, setMinLevelFilter] = useState("");
  const [needFilter, setNeedFilter] = useState("needed");
  const [availabilityFilter, setAvailabilityFilter] = useState("any");
  const [sortBy, setSortBy] = useState("raids");
  const [buffReadinessClassFilter, setBuffReadinessClassFilter] = useState("all");
  const [buffReadinessRowFilter, setBuffReadinessRowFilter] = useState("all");
  const [buffChipVisibility, setBuffChipVisibility] = useState("all");
  const [sectionOpen, setSectionOpen] = useState(() => readDashboardSectionState());
  const [cooldownAlerts, setCooldownAlerts] = useState([]);
  const previousLockedRaidsRef = useRef(null);

  const nextReset = getNextRaidReset("Naxxramas");

  const visibleCharacters = useMemo(
    () => data.characters.filter((character) => character.showOnDashboard !== false),
    [data.characters]
  );

  const classOptions = useMemo(
    () => Array.from(new Set(visibleCharacters.map((character) => character.class).filter(Boolean))).sort(),
    [visibleCharacters]
  );
  const factionOptions = useMemo(
    () => Array.from(new Set(visibleCharacters.map((character) => character.faction).filter(Boolean))).sort(),
    [visibleCharacters]
  );
  const realmOptions = useMemo(
    () => Array.from(new Set(visibleCharacters.map((character) => character.realm).filter(Boolean))).sort(),
    [visibleCharacters]
  );
  const accountNameById = useMemo(
    () => new Map(data.accounts.map((account) => [account.id, account.battleNetId])),
    [data.accounts]
  );
  const visibleCharacterById = useMemo(
    () => new Map(visibleCharacters.map((character) => [character.id, character])),
    [visibleCharacters]
  );
  const accountOptions = useMemo(() => {
    const map = new Map();

    visibleCharacters.forEach((character) => {
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
  }, [visibleCharacters, accountNameById]);

  const buffReadinessRows = useMemo(() => {
    return visibleCharacters
      .map((character) => {
        const matchingProfiles = data.buffProfiles.filter(
          (profile) => profile.className === "All" || profile.className === character.class
        );
        const required = new Set(
          matchingProfiles.flatMap((profile) => (Array.isArray(profile.buffs) ? profile.buffs : []))
        );
        const requiredBuffs = [...required].sort((a, b) => a.localeCompare(b));
        const activeBuffs = Array.isArray(character.buffs) ? character.buffs : [];
        const boonedBuffs = Array.isArray(character.storedBuffs) ? character.storedBuffs : [];
        const activeSet = new Set(activeBuffs.map(normalizeBuffName).filter(Boolean));
        const boonedSet = new Set(boonedBuffs.map(normalizeBuffName).filter(Boolean));
        const allBuffs = getCharacterBuffSet(character);
        const missingBuffs = requiredBuffs.filter((buff) => !allBuffs.has(String(buff).trim().toLowerCase()));
        const buffStatuses = requiredBuffs.map((buff) => {
          const key = normalizeBuffName(buff);
          if (activeSet.has(key)) {
            return { name: buff, status: "active" };
          }
          if (boonedSet.has(key)) {
            return { name: buff, status: "booned" };
          }
          return { name: buff, status: "missing" };
        });

        return {
          characterId: character.id,
          characterName: character.name,
          className: character.class,
          requiredBuffs,
          missingBuffs,
          buffStatuses,
          readyCount: requiredBuffs.length - missingBuffs.length
        };
      })
      .filter((row) => row.requiredBuffs.length)
      .sort((a, b) => a.missingBuffs.length - b.missingBuffs.length || a.characterName.localeCompare(b.characterName));
  }, [visibleCharacters, data.buffProfiles]);

  const buffReadinessClassOptions = useMemo(
    () => Array.from(new Set(buffReadinessRows.map((row) => row.className).filter(Boolean))).sort(),
    [buffReadinessRows]
  );

  const filteredBuffReadinessRows = useMemo(() => {
    return buffReadinessRows.filter((row) => {
      if (buffReadinessClassFilter !== "all" && row.className !== buffReadinessClassFilter) {
        return false;
      }
      if (buffReadinessRowFilter === "missing" && row.missingBuffs.length === 0) {
        return false;
      }
      if (buffReadinessRowFilter === "ready" && row.missingBuffs.length > 0) {
        return false;
      }
      if (buffChipVisibility === "missing" && row.missingBuffs.length === 0) {
        return false;
      }
      return true;
    });
  }, [buffReadinessRows, buffReadinessClassFilter, buffReadinessRowFilter, buffChipVisibility]);

  const collectLockedRaids = useCallback(() => {
    const now = new Date();
    const locked = new Map();

    data.raidStatuses.forEach((status) => {
      if (!status?.completed || !status?.resetDate) {
        return;
      }

      const character = visibleCharacterById.get(status.characterId);
      if (!character) {
        return;
      }

      const resetTime = new Date(status.resetDate);
      if (!(resetTime > now)) {
        return;
      }

      const key = `${status.characterId}|${status.raidName}`;
      locked.set(key, { key, characterName: character.name, raidName: status.raidName });
    });

    return locked;
  }, [data.raidStatuses, visibleCharacterById]);

  useEffect(() => {
    const checkCooldownTransitions = () => {
      const currentlyLocked = collectLockedRaids();

      if (!previousLockedRaidsRef.current) {
        previousLockedRaidsRef.current = currentlyLocked;
        return;
      }

      const justUnlocked = [];
      previousLockedRaidsRef.current.forEach((entry, key) => {
        if (!currentlyLocked.has(key)) {
          justUnlocked.push(entry);
        }
      });

      if (justUnlocked.length) {
        const nowMs = Date.now();
        const alerts = justUnlocked.map((entry, index) => ({
          id: `${entry.key}-${nowMs}-${index}`,
          text: `${entry.characterName} is now unlocked for ${entry.raidName}.`
        }));

        setCooldownAlerts((prev) => [...alerts, ...prev].slice(0, 6));
      }

      previousLockedRaidsRef.current = currentlyLocked;
    };

    checkCooldownTransitions();
    const intervalId = window.setInterval(checkCooldownTransitions, 30000);
    return () => window.clearInterval(intervalId);
  }, [collectLockedRaids]);

  const dismissCooldownAlert = useCallback((id) => {
    setCooldownAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const toggleSection = useCallback((sectionKey) => {
    setSectionOpen((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  }, []);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_SECTION_STATE_KEY, JSON.stringify(sectionOpen));
  }, [sectionOpen]);

  const filteredEntries = useMemo(() => {
    const entries = visibleCharacters.map((character) => {
      const lootItems = data.lootItems.filter((item) => item.characterId === character.id);
      const remainingLootItems = lootItems.filter((item) => !item.obtained);
      const raidStatuses = data.raidStatuses.filter((status) => status.characterId === character.id);

      const availableRaids = RAIDS.filter((raid) => !isRaidLocked(raidStatuses.find((s) => s.raidName === raid.name)));
      const lockedRaids = RAIDS.filter((raid) => isRaidLocked(raidStatuses.find((s) => s.raidName === raid.name)));

      const lockedRaidSummary = lockedRaids.length ? lockedRaids.map((raid) => raid.short).join(", ") : "None";

      const raidItemsByRaid = availableRaids
        .map((raid) => {
          const raidItems = remainingLootItems
            .filter((item) => item.raidName === raid.name)
            .map((item) => item.itemName);

          if (!raidItems.length) {
            return null;
          }

          return { raidName: raid.name, raidShort: raid.short, items: raidItems };
        })
        .filter(Boolean);

      const raidNeedsSummary = raidItemsByRaid.length
        ? raidItemsByRaid.map((raidEntry) => raidEntry.raidShort).join(", ")
        : "No raid needs";

      return {
        character,
        remainingLootCount: remainingLootItems.length,
        lockedRaidCount: lockedRaids.length,
        raidSummary: raidNeedsSummary,
        lockedRaidSummary,
        raidItemsByRaid,
        classIcon: getClassIcon(character.class),
        shoppingNeeds: computeShoppingNeeds(character, data.shoppingProfiles, inventoryItems, {
          accountName: accountNameById.get(character.accountId) || ""
        })
      };
    });

    const sortedEntries = [...entries].sort((a, b) => {
      if (sortBy === "raids") {
        return b.lockedRaidCount - a.lockedRaidCount || a.character.name.localeCompare(b.character.name);
      }
      return a.character.name.localeCompare(b.character.name);
    });

    return sortedEntries.filter((entry) => {
      const needsMatch = needFilter === "all" || entry.remainingLootCount > 0;
      let availabilityMatch = true;
      if (availabilityFilter === "locked") {
        availabilityMatch = entry.lockedRaidCount > 0;
      }
      if (availabilityFilter === "reset-ready") {
        availabilityMatch = entry.raidItemsByRaid.length > 0;
      }
      const classMatch = classFilter === "all" || entry.character.class === classFilter;
      const factionMatch = factionFilter === "all" || entry.character.faction === factionFilter;
      const realmMatch = realmFilter === "all" || entry.character.realm === realmFilter;
      const accountValue = entry.character.accountId || "unassigned";
      const accountMatch = accountFilter === "all" || accountValue === accountFilter;
      const levelThreshold = Number(minLevelFilter);
      const hasLevelThreshold = minLevelFilter !== "" && !Number.isNaN(levelThreshold);
      const levelValue = Number(entry.character.level);
      const levelMatch = !hasLevelThreshold || (!Number.isNaN(levelValue) && levelValue > levelThreshold);
      const nameMatch = !searchTerm.trim() || normalize(entry.character.name).includes(normalize(searchTerm));

      return needsMatch && availabilityMatch && classMatch && factionMatch && realmMatch && accountMatch && levelMatch && nameMatch;
    });
  }, [
    visibleCharacters,
    data.lootItems,
    data.raidStatuses,
    data.shoppingProfiles,
    accountNameById,
    inventoryItems,
    needFilter,
    availabilityFilter,
    classFilter,
    factionFilter,
    realmFilter,
    accountFilter,
    minLevelFilter,
    searchTerm,
    sortBy
  ]);

  if (!hasFirebaseConfig) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <EmptyState title="Firebase not configured" description="Add Firebase keys in your .env to enable Auth and data sync." />
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <EmptyState title="Sign in required" description="Sign in on Settings to view your raid priority dashboard." />
      </div>
    );
  }

  const resetFilters = () => {
    setSearchTerm("");
    setClassFilter("all");
    setFactionFilter("all");
    setRealmFilter("all");
    setAccountFilter("all");
    setMinLevelFilter("");
    setNeedFilter("needed");
    setAvailabilityFilter("any");
    setSortBy("raids");
  };

  const isSyncing = luaSync.isSyncing || luaSync.isBagnonSyncing;
  const combinedSyncMessage = [luaSync.syncMessage, luaSync.bagnonSyncMessage].filter(Boolean).join(" ");

  return (
    <div>
      {cooldownAlerts.length ? (
        <div className="mb-6 space-y-2" role="status" aria-live="polite">
          {cooldownAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700"
            >
              <span>{alert.text}</span>
              <button
                type="button"
                onClick={() => dismissCooldownAlert(alert.id)}
                className="shrink-0 rounded-lg p-1 text-brand-700 hover:bg-brand-100"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <PageHeader
        title="Raid Dashboard"
        subtitle={`Weekly reset in ${formatCountdown(nextReset)}`}
        actions={
          <>
            <Badge tone={SYNC_STATUS_TONE[luaSync.syncStatus] || "neutral"}>
              Sync: {SYNC_STATUS_LABEL[luaSync.syncStatus] || "Idle"} · Last:{" "}
              {luaSync.lastSyncAt ? luaSync.lastSyncAt.toLocaleTimeString() : "Never"}
            </Badge>
            <Button variant="primary" onClick={() => luaSync.syncFromConnectedFiles()} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Connected Files"}
            </Button>
          </>
        }
      />

      {combinedSyncMessage ? <p className="mb-4 text-sm text-ink-soft">{combinedSyncMessage}</p> : null}

      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={luaSync.autoSyncSettings.enabled}
              onChange={(event) =>
                luaSync.setAutoSyncSettings((prev) => ({ ...prev, enabled: event.target.checked }))
              }
            />
            Auto-sync
          </label>
          <Select
            className="w-auto"
            value={String(luaSync.autoSyncSettings.minutes)}
            onChange={(event) => {
              const minutes = Math.min(60, Math.max(1, Number(event.target.value) || 5));
              luaSync.setAutoSyncSettings((prev) => ({ ...prev, minutes }));
            }}
            disabled={!luaSync.autoSyncSettings.enabled}
          >
            <option value="1">Every 1 minute</option>
            <option value="2">Every 2 minutes</option>
            <option value="5">Every 5 minutes</option>
            <option value="10">Every 10 minutes</option>
            <option value="15">Every 15 minutes</option>
            <option value="30">Every 30 minutes</option>
            <option value="60">Every 60 minutes</option>
          </Select>
          {luaSync.autoSyncSettings.enabled && luaSync.nextAutoSyncAt ? (
            <span className="text-sm text-ink-faint">Next auto-sync: {luaSync.nextAutoSyncAt.toLocaleTimeString()}</span>
          ) : null}
          {luaSync.autoSyncSettings.enabled && luaSync.autoSyncFailures > 0 ? (
            <span className="text-sm text-ink-faint">Retry attempts: {luaSync.autoSyncFailures}</span>
          ) : null}
        </CardBody>
      </Card>

      {luaSync.autoSyncWarning ? (
        <p className="mb-4 text-sm text-warn">{luaSync.autoSyncWarning}</p>
      ) : null}
      {luaSync.activeRaidNames.length ? (
        <p className="mb-4 text-sm text-ink-soft">Live raid activity detected: {luaSync.activeRaidNames.join(", ")}.</p>
      ) : null}

      <CollapsibleSection
        title="Buff Readiness"
        sectionKey="buffReadiness"
        open={sectionOpen.buffReadiness}
        onToggle={toggleSection}
      >
        {buffReadinessRows.length ? (
          <>
            <div className="mb-4 flex flex-wrap gap-3">
              <Select
                className="w-auto"
                value={buffReadinessClassFilter}
                onChange={(event) => setBuffReadinessClassFilter(event.target.value)}
              >
                <option value="all">All classes</option>
                {buffReadinessClassOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Select>
              <Select
                className="w-auto"
                value={buffReadinessRowFilter}
                onChange={(event) => setBuffReadinessRowFilter(event.target.value)}
              >
                <option value="all">All readiness</option>
                <option value="missing">Missing buffs</option>
                <option value="ready">Fully ready</option>
              </Select>
              <Select
                className="w-auto"
                value={buffChipVisibility}
                onChange={(event) => setBuffChipVisibility(event.target.value)}
              >
                <option value="all">Show all chips</option>
                <option value="booned">Show booned</option>
                <option value="missing">Show missing</option>
              </Select>
            </div>

            {filteredBuffReadinessRows.length ? (
              <ul className="space-y-3">
                {filteredBuffReadinessRows.map((row) => {
                  const visibleBuffStatuses =
                    buffChipVisibility === "booned"
                      ? row.buffStatuses.filter((buff) => buff.status === "booned")
                      : buffChipVisibility === "missing"
                        ? row.buffStatuses.filter((buff) => buff.status === "missing")
                        : row.buffStatuses;

                  return (
                    <li key={row.characterId} className="rounded-xl border border-border p-3">
                      <p className="text-sm font-medium text-ink">
                        {row.characterName} <span className="font-normal text-ink-faint">({row.className})</span> —{" "}
                        {row.readyCount}/{row.requiredBuffs.length} ready
                      </p>
                      {visibleBuffStatuses.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {visibleBuffStatuses.map((buff) => (
                            <Badge
                              key={`${row.characterId}-${buff.name}`}
                              tone={buff.status === "active" ? "good" : buff.status === "booned" ? "brand" : "bad"}
                            >
                              {buff.name} — {buff.status === "active" ? "Active" : buff.status === "booned" ? "Booned" : "Missing"}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-ink-faint">All required buffs are active.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-ink-faint">No characters match the selected readiness filters.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-faint">Create Buff Profiles to start tracking class buff readiness.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Filters" sectionKey="filters" open={sectionOpen.filters} onToggle={toggleSection}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormRow label="Search">
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Character name" />
          </FormRow>
          <FormRow label="Sort by">
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="raids">Most raids needed</option>
              <option value="name">Alphabetical</option>
            </Select>
          </FormRow>
          <FormRow label="Loot needs">
            <Select value={needFilter} onChange={(event) => setNeedFilter(event.target.value)}>
              <option value="needed">Needs items only</option>
              <option value="all">Show all visible</option>
            </Select>
          </FormRow>
          <FormRow label="Availability">
            <Select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
              <option value="any">All availability</option>
              <option value="locked">Locked out only</option>
              <option value="reset-ready">Reset-ready only</option>
            </Select>
          </FormRow>
          <FormRow label="Class">
            <Select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">All classes</option>
              {classOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="Faction">
            <Select value={factionFilter} onChange={(event) => setFactionFilter(event.target.value)}>
              <option value="all">All factions</option>
              {factionOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="Realm">
            <Select value={realmFilter} onChange={(event) => setRealmFilter(event.target.value)}>
              <option value="all">All realms</option>
              {realmOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="Account">
            <Select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
              <option value="all">All accounts</option>
              {accountOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="Min level">
            <Input
              type="number"
              min="0"
              step="1"
              value={minLevelFilter}
              onChange={(event) => setMinLevelFilter(event.target.value)}
              placeholder="Level > X"
            />
          </FormRow>
        </div>
        <Button variant="secondary" size="sm" className="mt-4" onClick={resetFilters}>
          Clear Filters
        </Button>
      </CollapsibleSection>

      <CollapsibleSection
        title={`Character Results (${filteredEntries.length})`}
        sectionKey="characters"
        open={sectionOpen.characters}
        onToggle={toggleSection}
      >
        {!filteredEntries.length ? (
          <EmptyState title="No matches" description="No characters match the current dashboard filters." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEntries.map((entry) => (
              <CharacterCard
                key={entry.character.id}
                character={entry.character}
                remainingLootCount={entry.remainingLootCount}
                lockedRaidCount={entry.lockedRaidCount}
                raidSummary={entry.raidSummary}
                lockedRaidSummary={entry.lockedRaidSummary}
                raidItemsByRaid={entry.raidItemsByRaid}
                classIcon={entry.classIcon}
                shoppingNeeds={entry.shoppingNeeds}
                activeRaidTagLabel={resolveRaidTagLabel(entry.character.activeRaidTag, RAIDS)}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
