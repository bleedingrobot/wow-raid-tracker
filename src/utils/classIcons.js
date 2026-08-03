const BASE = "https://wow.zamimg.com/images/wow/icons/large";

const iconMap = {
  warrior: `${BASE}/classicon_warrior.jpg`,
  paladin: `${BASE}/classicon_paladin.jpg`,
  hunter: `${BASE}/classicon_hunter.jpg`,
  rogue: `${BASE}/classicon_rogue.jpg`,
  priest: `${BASE}/classicon_priest.jpg`,
  shaman: `${BASE}/classicon_shaman.jpg`,
  mage: `${BASE}/classicon_mage.jpg`,
  warlock: `${BASE}/classicon_warlock.jpg`,
  druid: `${BASE}/classicon_druid.jpg`
};

export const FALLBACK_ICON = `${BASE}/inv_misc_questionmark.jpg`;

export function getClassIcon(className = "") {
  const key = className.toLowerCase().trim();
  return iconMap[key] || FALLBACK_ICON;
}
