const BASE = "https://wow.zamimg.com/images/wow/icons/large";

const ITEM_ICONS = {
  "flask of the titans": "inv_potion_62",
  "flask of distilled wisdom": "inv_potion_97",
  "flask of supreme power": "inv_potion_41",
  "flask of chromatic resistance": "inv_potion_48",
  "greater fire protection potion": "inv_potion_24",
  "greater frost protection potion": "inv_potion_20",
  "greater nature protection potion": "inv_potion_22",
  "greater shadow protection potion": "inv_potion_23",
  "greater arcane protection potion": "inv_potion_83",
  "major healing potion": "inv_potion_54",
  "major mana potion": "inv_potion_76",
  "elixir of the mongoose": "inv_potion_32",
  "elixir of greater firepower": "inv_potion_60",
  "greater arcane elixir": "inv_potion_25",
  "elixir of superior defense": "inv_potion_66",
  "brilliant wizard oil": "inv_potion_105",
  "brilliant mana oil": "inv_potion_100",
  "dense sharpening stone": "inv_stone_sharpeningstone_05",
  "elemental sharpening stone": "inv_stone_02",
  "dense weightstone": "inv_stone_weightstone_05",
  "solid weightstone": "inv_stone_weightstone_04"
};

const GENERIC_ITEM_ICON = "inv_potion_18";

export function getItemIcon(itemName = "") {
  const key = String(itemName || "").trim().toLowerCase();
  const slug = ITEM_ICONS[key] || GENERIC_ITEM_ICON;
  return `${BASE}/${slug}.jpg`;
}

export const GENERIC_ITEM_ICON_URL = `${BASE}/${GENERIC_ITEM_ICON}.jpg`;
