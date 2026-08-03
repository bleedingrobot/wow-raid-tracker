// Shared character-identity helpers per docs/identity-contract.md.
// All DataStore parsers must resolve `Default.<Realm>.<Name>` keys through
// this single implementation so canonical identity is deterministic across
// Containers / Inventory / Characters imports.

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

// Splits on the FIRST dot after the "Default." prefix (realm names cannot
// contain dots, so this is unambiguous and matches the majority of the
// original DataStore parsers).
export function parseCharacterKey(rawKey) {
  const raw = String(rawKey || "");
  const match = raw.match(/^Default\.([^.]+)\.(.+)$/);
  if (!match) {
    return { realm: "", name: raw };
  }

  return {
    realm: match[1],
    name: match[2]
  };
}

// Builds the composite canonical key defined by the identity contract:
// normalizedAccount|normalizedRealm|normalizedCharacterName
export function buildCanonicalKey({ accountLabel, realm, characterName } = {}) {
  return `${normalize(accountLabel)}|${normalize(realm)}|${normalize(characterName)}`;
}
