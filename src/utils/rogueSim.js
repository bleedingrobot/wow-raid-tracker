import rogueSimTemplate from "../data/rogueSimTemplate.json";
import {
  getWowSimsClassicClassPath,
  normalizeEnchantId,
  SLOT_LABELS,
  WOW_CLASSIC_LABEL
} from "./warriorSim";

export { SLOT_LABELS, WOW_CLASSIC_LABEL };

export const ROGUE_SIM_PAYLOAD_KEY = "wrt-rogue-sim-payload";

export function getRogueSimUrl() {
  const classicRoguePath = getWowSimsClassicClassPath("rogue");
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return `/wowsims${classicRoguePath}`;
  }
  return `https://wowsims.github.io${classicRoguePath}`;
}

const ROGUE_SIM_EQUIPMENT_ORDER = [1, 2, 3, 15, 5, 9, 10, 6, 7, 8, 11, 12, 13, 14, 16, 17, 18];
const ROGUE_SIM_RACE_BY_CHARACTER_RACE = {
  Human: "RaceHuman",
  Orc: "RaceOrc",
  Dwarf: "RaceDwarf",
  "Night Elf": "RaceNightElf",
  Undead: "RaceUndead",
  Tauren: "RaceTauren",
  Gnome: "RaceGnome",
  Troll: "RaceTroll"
};

function extractEnchantIdFromItemLink(itemLink) {
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

export function buildRogueSimExport(character, equippedBySlot) {
  const next = JSON.parse(JSON.stringify(rogueSimTemplate));
  const templateItems = Array.isArray(next?.player?.equipment?.items)
    ? next.player.equipment.items
    : [];

  const missingSlots = [];
  const items = ROGUE_SIM_EQUIPMENT_ORDER.map((slot, index) => {
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
    throw new Error("Rogue simulator template is missing equipment data.");
  }

  next.player.equipment.items = items;
  if (character?.name) {
    next.player.name = String(character.name);
  }

  const mappedRace = ROGUE_SIM_RACE_BY_CHARACTER_RACE[String(character?.race || "").trim()];
  if (mappedRace) {
    next.player.race = mappedRace;
  }

  return {
    jsonText: JSON.stringify(next, null, 2),
    missingSlots
  };
}
