const BASE = "https://wow.zamimg.com/images/wow/icons/large";

export const FACTION_ICONS = {
  alliance: `${BASE}/achievement_pvp_a_01.jpg`,
  horde: `${BASE}/achievement_pvp_h_01.jpg`
};

export function getFactionIcon(faction = "") {
  const key = String(faction || "").toLowerCase().trim();
  return FACTION_ICONS[key] || null;
}
