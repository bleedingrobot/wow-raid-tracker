function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getAccountLabel(character, accountNameById) {
  if (character.accountName) {
    return character.accountName;
  }

  if (character.accountId && accountNameById?.get) {
    return accountNameById.get(character.accountId) || "";
  }

  return "";
}

export function getCharacterFilterOptions(characters, accountNameById) {
  const classOptions = Array.from(new Set(characters.map((character) => character.class).filter(Boolean))).sort();
  const factionOptions = Array.from(new Set(characters.map((character) => character.faction).filter(Boolean))).sort();
  const realmOptions = Array.from(new Set(characters.map((character) => character.realm).filter(Boolean))).sort();
  const activeRaidTagOptions = Array.from(
    new Set(characters.map((character) => character.activeRaidTag).filter(Boolean))
  ).sort();

  const accountOptionsMap = new Map();
  characters.forEach((character) => {
    const value = character.accountId || "unassigned";
    const label = getAccountLabel(character, accountNameById) || "Unassigned";

    if (!accountOptionsMap.has(value)) {
      accountOptionsMap.set(value, label);
    }
  });

  const accountOptions = [...accountOptionsMap.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    classOptions,
    factionOptions,
    realmOptions,
    accountOptions,
    activeRaidTagOptions
  };
}

export function matchesCharacterFilters(character, filters, accountNameById) {
  const searchValue = normalize(filters.searchTerm);
  const accountValue = character.accountId || "unassigned";
  const accountLabel = getAccountLabel(character, accountNameById);
  const visibilityValue = character.showOnDashboard !== false ? "visible" : "hidden";
  const activeRaidTag = String(character.activeRaidTag || "").trim();
  const minLevelValue = Number(filters.minLevelFilter);
  const hasMinLevel = filters.minLevelFilter !== "" && !Number.isNaN(minLevelValue);
  const levelValue = Number(character.level);
  const searchMatch = !searchValue || [
    character.name,
    character.realm,
    character.class,
    character.faction,
    accountLabel,
    activeRaidTag
  ].some((value) => normalize(value).includes(searchValue));
  const classMatch = filters.classFilter === "all" || character.class === filters.classFilter;
  const factionMatch = filters.factionFilter === "all" || character.faction === filters.factionFilter;
  const realmMatch = filters.realmFilter === "all" || character.realm === filters.realmFilter;
  const accountMatch = filters.accountFilter === "all" || accountValue === filters.accountFilter;
  const visibilityMatch = filters.visibilityFilter === "all" || visibilityValue === filters.visibilityFilter;
  const levelMatch = !hasMinLevel || (!Number.isNaN(levelValue) && levelValue >= minLevelValue);

  let activeRaidTagMatch = true;
  if (filters.activeRaidTagFilter === "tagged") {
    activeRaidTagMatch = Boolean(activeRaidTag);
  } else if (filters.activeRaidTagFilter === "untagged") {
    activeRaidTagMatch = !activeRaidTag;
  } else if (filters.activeRaidTagFilter !== "all") {
    activeRaidTagMatch = activeRaidTag === filters.activeRaidTagFilter;
  }

  return (
    searchMatch
    && classMatch
    && factionMatch
    && realmMatch
    && accountMatch
    && visibilityMatch
    && levelMatch
    && activeRaidTagMatch
  );
}

export function resolveRaidTagLabel(activeRaidTag, raids = []) {
  const tag = String(activeRaidTag || "").trim();
  if (!tag) {
    return "";
  }

  const match = raids.find((raid) => raid.name === tag || raid.short === tag);
  if (!match) {
    return tag;
  }

  return match.short ? `${match.short} · ${match.name}` : match.name;
}
