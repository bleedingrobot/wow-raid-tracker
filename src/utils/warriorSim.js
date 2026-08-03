import warriorSimTemplate from "../data/warriorSimTemplate.json";

export const WOWSIMS_CLASSIC_PATH_PREFIX = "/classic";
export const WOW_CLASSIC_LABEL = "WoW Classic";

export const SLOT_LABELS = {
  1: "Head",
  2: "Neck",
  3: "Shoulder",
  4: "Shirt",
  5: "Chest",
  6: "Waist",
  7: "Legs",
  8: "Feet",
  9: "Wrist",
  10: "Hands",
  11: "Finger 1",
  12: "Finger 2",
  13: "Trinket 1",
  14: "Trinket 2",
  15: "Back",
  16: "Main Hand",
  17: "Off Hand",
  18: "Ranged",
  19: "Tabard"
};

export const WARRIOR_SIM_PAYLOAD_KEY = "wrt-warrior-sim-payload";

export function getWowSimsClassicClassPath(classSlug) {
  return `${WOWSIMS_CLASSIC_PATH_PREFIX}/${String(classSlug || "").trim().toLowerCase()}/`;
}

export function getWarriorSimUrl() {
  const classicWarriorPath = getWowSimsClassicClassPath("warrior");
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return `/wowsims${classicWarriorPath}`;
  }
  return `https://wowsims.github.io${classicWarriorPath}`;
}

const WARRIOR_SIM_EQUIPMENT_ORDER = [1, 2, 3, 15, 5, 9, 10, 6, 7, 8, 11, 12, 13, 14, 16, 17, 18];
const WARRIOR_SIM_RACE_BY_CHARACTER_RACE = {
  Human: "RaceHuman",
  Orc: "RaceOrc",
  Dwarf: "RaceDwarf",
  "Night Elf": "RaceNightElf",
  Undead: "RaceUndead",
  Tauren: "RaceTauren",
  Gnome: "RaceGnome",
  Troll: "RaceTroll"
};

export function normalizeEnchantId(value) {
  const enchantId = Number(value);
  if (!Number.isFinite(enchantId) || enchantId <= 0) {
    return 0;
  }
  return enchantId;
}

export function extractEnchantIdFromItemLink(itemLink) {
  const text = String(itemLink || "");
  if (!text) {
    return 0;
  }

  const match = text.match(/(?:\|H)?item:\d+:(-?\d*)/i);
  if (!match) {
    return 0;
  }

  return normalizeEnchantId(match[1]);
}

function buildSimItem(equipped, fallback) {
  const itemId = Number(equipped?.itemId || fallback?.id || 0);
  if (!Number.isFinite(itemId) || itemId <= 0) {
    return { id: 0 };
  }

  const simItem = { id: itemId };
  const enchantId = normalizeEnchantId(equipped?.enchantId)
    || extractEnchantIdFromItemLink(equipped?.itemLink)
    || normalizeEnchantId(fallback?.enchant);
  if (enchantId > 0) {
    simItem.enchant = enchantId;
  }

  const randomSuffixId = Number(equipped?.randomSuffixId || fallback?.randomSuffix || 0);
  if (Number.isFinite(randomSuffixId) && randomSuffixId !== 0) {
    simItem.randomSuffix = randomSuffixId;
  }

  return simItem;
}

export function buildWarriorSimExport(character, equippedBySlot) {
  const next = JSON.parse(JSON.stringify(warriorSimTemplate));
  const templateItems = Array.isArray(next?.player?.equipment?.items)
    ? next.player.equipment.items
    : [];

  const missingSlots = [];
  const items = WARRIOR_SIM_EQUIPMENT_ORDER.map((slot, index) => {
    const equipped = equippedBySlot.get(slot);
    const equippedId = Number(equipped?.itemId || 0);

    if (Number.isFinite(equippedId) && equippedId > 0) {
      return buildSimItem(equipped, templateItems[index]);
    }

    missingSlots.push(slot);
    const fallbackItem = buildSimItem(null, templateItems[index]);
    if (Number(fallbackItem.id) > 0) {
      return fallbackItem;
    }

    return { id: 0 };
  });

  if (!next.player || !next.player.equipment) {
    throw new Error("Warrior simulator template is missing equipment data.");
  }

  next.player.equipment.items = items;
  if (character?.name) {
    next.player.name = String(character.name);
  }

  const mappedRace = WARRIOR_SIM_RACE_BY_CHARACTER_RACE[String(character?.race || "").trim()];
  if (mappedRace) {
    next.player.race = mappedRace;
  }

  return {
    jsonText: JSON.stringify(next, null, 2),
    missingSlots
  };
}
