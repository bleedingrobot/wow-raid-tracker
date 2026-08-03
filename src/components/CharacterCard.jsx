import { Card, CardBody, CardHeader } from "./ui/Card";
import Badge from "./ui/Badge";
import { FALLBACK_ICON } from "../utils/classIcons";

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

  return (
    <Card>
      <CardHeader
        title={character.name}
        subtitle={`${character.class || "Unknown"} · ${character.realm || "Unknown realm"}`}
        actions={
          <img
            className="h-9 w-9 rounded-lg border border-border"
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
          <Badge tone={factionTone}>{character.faction || "Unknown"}</Badge>
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
                <li key={need.itemName} className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{need.itemName}</span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-soft">
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
