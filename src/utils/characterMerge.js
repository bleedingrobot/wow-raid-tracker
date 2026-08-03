// Groups characters that share a name+realm and were probably split into
// multiple Firestore docs by the account-scoping sync bug (see
// docs/identity-contract.md and useLuaSync.js characterKey/characterProfileKey),
// and computes a merged payload for collapsing a chosen group back into one doc.

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function characterGroupKey(name, realm) {
  return `${normalize(name)}|${normalize(realm)}`;
}

function completenessScore(character) {
  let score = 0;
  if (character.class && character.class !== "Unknown") score += 2;
  if (typeof character.level === "number" && character.level > 0) score += 1;
  if (Array.isArray(character.equippedItems) && character.equippedItems.length) score += 2;
  if (character.guildName) score += 1;
  if (character.zone) score += 1;
  if (Array.isArray(character.buffs) && character.buffs.length) score += 1;
  if (character.accountId) score += 1;
  return score;
}

// confidence:
// - "auto": exactly one Nova-sourced doc + one DataStore-sourced doc, no
//   conflicting accountId — the classic split-duplicate signature, safe to
//   suggest merging as a single pair.
// - "distinct": docs carry two or more different accountId values — these
//   are almost certainly separate real characters (e.g. same-named alts on
//   different WoW accounts), not duplicates. Shown for visibility only.
// - "manual": anything else (3+ docs, or 2 docs that aren't one-Nova/one-
//   DataStore) — ambiguous, needs a human to pick which docs actually belong
//   together.
export function findDuplicateCharacterGroups(characters) {
  const byKey = new Map();

  characters.forEach((character) => {
    const key = characterGroupKey(character.name, character.realm);
    if (!byKey.has(key)) {
      byKey.set(key, []);
    }
    byKey.get(key).push(character);
  });

  return [...byKey.entries()]
    .filter(([, docs]) => docs.length > 1)
    .map(([key, docs]) => {
      const novaDocs = docs.filter((doc) => doc.importedFromNova);
      const dataStoreDocs = docs.filter((doc) => doc.importedFromDataStore);
      const accountIds = new Set(docs.map((doc) => doc.accountId).filter(Boolean));

      let confidence = "manual";
      let reason = "Multiple characters share this name/realm — review before merging.";

      if (accountIds.size > 1) {
        confidence = "distinct";
        reason = "These docs have different accountId values, so they're likely separate real characters (e.g. alts on different WoW accounts), not duplicates.";
      } else if (docs.length === 2 && novaDocs.length === 1 && dataStoreDocs.length === 1) {
        confidence = "auto";
        reason = "One Nova-sourced doc + one DataStore-sourced doc with no conflicting account — the typical split-duplicate pattern from the sync bug.";
      }

      return {
        key,
        name: docs[0].name,
        realm: docs[0].realm,
        docs: [...docs].sort((a, b) => completenessScore(b) - completenessScore(a)),
        confidence,
        reason
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.realm.localeCompare(b.realm));
}

export function pickPrimaryCharacter(docs) {
  return [...docs].sort((a, b) => {
    const scoreDiff = completenessScore(b) - completenessScore(a);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  })[0];
}

const FALLBACK_SCALAR_FIELDS = [
  "guildName",
  "guildRankName",
  "zone",
  "subZone",
  "bindLocation",
  "avatarUrl",
  "activeRaidTag",
  "accountId"
];

const FALLBACK_NUMERIC_FIELDS = [
  "level",
  "averageItemLevel",
  "overallItemLevel",
  "money",
  "played",
  "playedThisLevel",
  "xp",
  "xpMax",
  "restXp",
  "restedXp",
  "guildRankIndex"
];

const UNION_ARRAY_FIELDS = ["buffs", "storedBuffs"];

// Returns only the fields that should change on `primary` — pass this
// directly to updateCharacter(primary.id, payload).
export function buildMergedCharacterPayload(primary, others) {
  const payload = {};

  if (!primary.class || primary.class === "Unknown") {
    const better = others.find((doc) => doc.class && doc.class !== "Unknown");
    if (better) {
      payload.class = better.class;
    }
  }

  if (!primary.faction || primary.faction === "Unknown") {
    const better = others.find((doc) => doc.faction && doc.faction !== "Unknown");
    if (better) {
      payload.faction = better.faction;
    }
  }

  const primaryItems = Array.isArray(primary.equippedItems) ? primary.equippedItems : [];
  const bestItemsDoc = [primary, ...others].reduce(
    (best, doc) => {
      const items = Array.isArray(doc.equippedItems) ? doc.equippedItems : [];
      return items.length > best.items.length ? { doc, items } : best;
    },
    { doc: primary, items: primaryItems }
  );
  if (bestItemsDoc.doc !== primary && bestItemsDoc.items.length > primaryItems.length) {
    payload.equippedItems = bestItemsDoc.items;
  }

  FALLBACK_SCALAR_FIELDS.forEach((field) => {
    if (!primary[field]) {
      const better = others.find((doc) => doc[field]);
      if (better) {
        payload[field] = better[field];
      }
    }
  });

  FALLBACK_NUMERIC_FIELDS.forEach((field) => {
    if (primary[field] === undefined || primary[field] === null) {
      const better = others.find((doc) => doc[field] !== undefined && doc[field] !== null);
      if (better) {
        payload[field] = better[field];
      }
    }
  });

  UNION_ARRAY_FIELDS.forEach((field) => {
    const union = new Set(primary[field] || []);
    const before = union.size;
    others.forEach((doc) => (doc[field] || []).forEach((value) => union.add(value)));
    if (union.size !== before) {
      payload[field] = [...union].sort((a, b) => a.localeCompare(b));
    }
  });

  if (others.some((doc) => doc.importedFromNova) && !primary.importedFromNova) {
    payload.importedFromNova = true;
  }
  if (others.some((doc) => doc.importedFromDataStore) && !primary.importedFromDataStore) {
    payload.importedFromDataStore = true;
  }

  return payload;
}

// Used when two raidStatus docs for the same raid collide after reassigning
// a merged-away character's lockouts onto the surviving character.
export function pickBetterRaidStatus(a, b) {
  if (Boolean(a.completed) !== Boolean(b.completed)) {
    return a.completed ? a : b;
  }
  const aTime = new Date(a.resetDate || a.updatedAt || 0).getTime();
  const bTime = new Date(b.resetDate || b.updatedAt || 0).getTime();
  return aTime >= bTime ? a : b;
}
