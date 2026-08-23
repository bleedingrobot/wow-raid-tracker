import { Card, CardBody, CardHeader } from "./ui/Card";
import Badge from "./ui/Badge";
import { FALLBACK_ICON } from "../utils/classIcons";
import { getClassColor } from "../utils/classColors";
import { getFactionIcon } from "../utils/factionIcons";
import { getItemIcon } from "../utils/itemIcons";

const FACTION_TONE = {
  alliance: "brand",
  horde: "bad"
};

export default function CharacterCard({
  character,
  remainingLootCount,
  lockedRaidCount,
  raidSummary,
  lockedRaidSummary,
  raidItemsByRaid,
  classIcon,
  shoppingNeeds,
  activeRaidTagLabel
}) {
  const factionTone = FACTION_TONE[String(character.faction || "").toLowerCase()] || "neutral";
  const classColor = getClassColor(character.class);
  const factionIcon = getFactionIcon(character.faction);

  return (
    <Card style={{ borderLeft: `3px solid ${classColor}` }}>
      <CardHeader
        title={character.name}
        subtitle={`${character.class || "Unknown"} · ${character.realm || "Unknown realm"}`}
        actions={
          <img
            className="h-11 w-11 rounded-lg border-2"
            style={{ borderColor: classColor }}
            src={classIcon}
            alt={`${character.class || "Unknown"} icon`}
            onError={(event) => {
              event.currentTarget.src = FALLBACK_ICON;
            }}
          />
        }
      />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={factionTone}>
            {factionIcon ? (
              <img src={factionIcon} alt="" className="h-3.5 w-3.5 rounded-sm" />
            ) : null}
            {character.faction || "Unknown"}
          </Badge>
          <Badge tone={remainingLootCount ? "warn" : "good"}>{remainingLootCount} wishlist</Badge>
          <Badge tone={lockedRaidCount ? "bad" : "good"}>{lockedRaidCount} locked</Badge>
          {activeRaidTagLabel ? <Badge tone="brand">{activeRaidTagLabel}</Badge> : null}
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Locked Raids</p>
          <p className="text-sm text-ink-soft">{lockedRaidSummary || "None"}</p>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Raid Needs</p>
          <p className="mb-2 text-sm text-ink-soft">{raidSummary}</p>
          {raidItemsByRaid?.length ? (
            <ul className="space-y-1.5">
              {raidItemsByRaid.map((raidEntry) => (
                <li key={raidEntry.raidName} className="text-sm">
                  <span className="font-medium text-ink">{raidEntry.raidShort}:</span>{" "}
                  <span className="text-ink-soft">{raidEntry.items.join(", ")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-faint">No wishlist items in currently available raids.</p>
          )}
        </div>

        {shoppingNeeds?.length ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Shopping List</p>
            <ul className="space-y-1">
              {shoppingNeeds.map((need) => (
                <li key={need.itemName} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5 text-ink-soft">
                    <img src={getItemIcon(need.itemName)} alt="" className="h-5 w-5 shrink-0 rounded border border-border" />
                    <span className="truncate">{need.itemName}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft">
                    {need.have}/{need.required}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
