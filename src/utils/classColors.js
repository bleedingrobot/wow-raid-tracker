const CLASS_COLORS = {
  druid: "#FF7D0A",
  hunter: "#ABD473",
  mage: "#69CCF0",
  paladin: "#F58CBA",
  priest: "#F2F2F2",
  rogue: "#FFF569",
  shaman: "#0070DE",
  warlock: "#9482C9",
  warrior: "#C79C6E"
};

export const DEFAULT_CLASS_COLOR = "#8f7d5c";

export function getClassColor(className = "") {
  const key = String(className || "").toLowerCase().trim();
  return CLASS_COLORS[key] || DEFAULT_CLASS_COLOR;
}
