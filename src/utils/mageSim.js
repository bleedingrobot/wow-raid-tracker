import mageSimTemplate from "../data/mageSimTemplate.json";
import {
  extractEnchantIdFromItemLink,
  getWowSimsClassicClassPath,
  normalizeEnchantId,
  SLOT_LABELS,
  WOW_CLASSIC_LABEL
} from "./warriorSim";

export { SLOT_LABELS, WOW_CLASSIC_LABEL };

export const MAGE_SIM_PAYLOAD_KEY = "wrt-mage-sim-payload";

export function getMageSimUrl() {
  const classicMagePath = getWowSimsClassicClassPath("mage");
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return `/wowsims${classicMagePath}`;
  }
  return `https://wowsims.github.io${classicMagePath}`;
}

const MAGE_SIM_EQUIPMENT_ORDER = [1, 2, 3, 15, 5, 9, 10, 6, 7, 8, 11, 12, 13, 14, 16, 17, 18];
const MAGE_SIM_RACE_BY_CHARACTER_RACE = {
  Human: "RaceHuman",
  Orc: "RaceOrc",
  Dwarf: "RaceDwarf",
  "Night Elf": "RaceNightElf",
  Undead: "RaceUndead",
  Tauren: "RaceTauren",
  Gnome: "RaceGnome",
  Troll: "RaceTroll"
};

function extractItemFields(equipped, fallback) {
  const item = {};
  const itemId = Number(equipped?.itemId || fallback?.id || 0);
  if (!Number.isFinite(itemId) || itemId <= 0) {
    return { id: 0 };
  }

  item.id = itemId;

  const enchantId = normalizeEnchantId(equipped?.enchantId)
    || extractEnchantIdFromItemLink(equipped?.itemLink)
    || normalizeEnchantId(fallback?.enchant);
  if (enchantId > 0) {
    item.enchant = enchantId;
  }

  const randomSuffixId = Number(equipped?.randomSuffixId || fallback?.randomSuffix || 0);
  if (Number.isFinite(randomSuffixId) && randomSuffixId !== 0) {
    item.randomSuffix = randomSuffixId;
  }

  return item;
}

export function buildMageSimExport(character, equippedBySlot) {
  const next = JSON.parse(JSON.stringify(mageSimTemplate));
  const templateItems = Array.isArray(next?.player?.equipment?.items)
    ? next.player.equipment.items
    : [];

  const missingSlots = [];
  const items = MAGE_SIM_EQUIPMENT_ORDER.map((slot, index) => {
    const equipped = equippedBySlot.get(slot);
    const equippedId = Number(equipped?.itemId || 0);

    if (Number.isFinite(equippedId) && equippedId > 0) {
      return extractItemFields(equipped, templateItems[index]);
    }

    missingSlots.push(slot);
    return extractItemFields(null, templateItems[index]);
  });

  if (!next.player || !next.player.equipment) {
    throw new Error("Mage simulator template is missing equipment data.");
  }

  next.player.equipment.items = items;
  if (character?.name) {
    next.player.name = String(character.name);
  }

  const mappedRace = MAGE_SIM_RACE_BY_CHARACTER_RACE[String(character?.race || "").trim()];
  if (mappedRace) {
    next.player.race = mappedRace;
  }

  return {
    jsonText: JSON.stringify(next, null, 2),
    missingSlots
  };
}
