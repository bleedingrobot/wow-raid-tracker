export const AVAILABLE_WORLD_BUFFS = [
  "Rallying Cry of the Dragonslayer",
  "Warchief's Blessing",
  "Spirit of Zandalar",
  "Sayge's Dark Fortune of Damage",
  "Sayge's Dark Fortune of Agility",
  "Sayge's Dark Fortune of Stamina",
  "Sayge's Dark Fortune of Armor",
  "Sayge's Dark Fortune of Spirit",
  "Sayge's Dark Fortune of Intelligence",
  "Songflower Serenade",
  "Fengus' Ferocity",
  "Mol'dar's Moxie",
  "Slip'kik's Savvy"
];

export function normalizeBuffName(value) {
  return String(value || "").trim().toLowerCase();
}

export function getCharacterBuffSet(character) {
  const active = Array.isArray(character?.buffs) ? character.buffs : [];
  const stored = Array.isArray(character?.storedBuffs) ? character.storedBuffs : [];
  return new Set([...active, ...stored].map(normalizeBuffName).filter(Boolean));
}
