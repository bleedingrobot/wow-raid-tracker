function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

const COMBINING_DIACRITICS_START = 0x0300;
const COMBINING_DIACRITICS_END = 0x036f;

function stripCombiningDiacritics(value) {
  let result = "";
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code >= COMBINING_DIACRITICS_START && code <= COMBINING_DIACRITICS_END) {
      continue;
    }
    result += char;
  }
  return result;
}

function normalizeLoose(value) {
  return stripCombiningDiacritics(String(value || "").normalize("NFKD"))
    .trim()
    .toLowerCase();
}

function normalizeItemKey(value) {
  return normalizeLoose(value)
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ");
}

function isCharacterMatch(inventoryItem, character) {
  const itemName = normalize(inventoryItem.characterName);
  const charName = normalize(character.name);
  if (!itemName || !charName || itemName !== charName) {
    return false;
  }

  const itemRealm = normalize(inventoryItem.realm);
  const charRealm = normalize(character.realm);

  // Some imports (especially Bagnon-style) may not include realm details.
  // If either side is blank, fall back to character-name matching.
  if (!itemRealm || !charRealm) {
    return true;
  }

  return itemRealm === charRealm;
}

function collectCharacterItems(inventoryItems, character, { accountName = "" } = {}) {
  const normalizedAccount = normalizeLoose(accountName);
  const accountScopedItems = normalizedAccount
    ? inventoryItems.filter((item) => {
      const itemAccount = normalizeLoose(item.accountHintName);
      return !itemAccount || itemAccount === normalizedAccount;
    })
    : inventoryItems;

  const exactNameRealm = accountScopedItems.filter((item) => isCharacterMatch(item, character));
  if (exactNameRealm.length) {
    return exactNameRealm;
  }

  const exactNameOnly = accountScopedItems.filter(
    (item) => normalize(item.characterName) === normalize(character.name)
  );
  if (exactNameOnly.length) {
    return exactNameOnly;
  }

  return [];
}

export function computeShoppingNeeds(character, profiles, inventoryItems, { accountName = "" } = {}) {
  const matchingProfiles = profiles.filter(
    (profile) => normalize(profile.className) === normalize(character.class) || profile.className === "All"
  );

  if (!matchingProfiles.length) {
    return [];
  }

  // Merge requirements across all matching profiles, taking the highest quantity for each item
  const required = new Map();
  matchingProfiles.forEach((profile) => {
    (profile.items || []).forEach((item) => {
      const key = normalizeItemKey(item.itemName);
      if (!key) {
        return;
      }
      const existing = required.get(key);
      if (!existing || item.quantity > existing.quantity) {
        required.set(key, { itemName: item.itemName, quantity: Number(item.quantity) || 1 });
      }
    });
  });

  if (!required.size) {
    return [];
  }

  // Sum what this character actually has across all bags and bank.
  // Prefer name matching, but also reconcile through itemId to include stacks
  // that arrived with incomplete/unknown names in SavedVariables parsing.
  const characterItems = collectCharacterItems(inventoryItems, character, { accountName });
  const haveCountsByName = new Map();
  const haveCountsByItemId = new Map();
  const itemIdsByName = new Map();

  characterItems.forEach((item) => {
    const key = normalizeItemKey(item.itemName);
    const itemCount = Number(item.count);
    const safeCount = Number.isFinite(itemCount) && itemCount > 0 ? itemCount : 1;
    const itemId = Number(item.itemId);
    const hasItemId = Number.isFinite(itemId) && itemId > 0;
    const hasKnownName = key && key !== "unknown item";

    if (hasKnownName) {
      haveCountsByName.set(key, (haveCountsByName.get(key) || 0) + safeCount);
    }

    if (hasItemId) {
      haveCountsByItemId.set(itemId, (haveCountsByItemId.get(itemId) || 0) + safeCount);

      if (hasKnownName) {
        if (!itemIdsByName.has(key)) {
          itemIdsByName.set(key, new Set());
        }
        itemIdsByName.get(key).add(itemId);
      }
    }
  });

  const needs = [];
  required.forEach(({ itemName, quantity }, key) => {
    let have = haveCountsByName.get(key) || 0;

    const mappedIds = itemIdsByName.get(key);
    if (mappedIds?.size) {
      const haveById = [...mappedIds].reduce((sum, itemId) => sum + (haveCountsByItemId.get(itemId) || 0), 0);
      if (haveById > have) {
        have = haveById;
      }
    }

    if (have < quantity) {
      needs.push({ itemName, required: quantity, have, need: quantity - have });
    }
  });

  return needs.sort((a, b) => a.itemName.localeCompare(b.itemName));
}
