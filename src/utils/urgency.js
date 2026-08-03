import { isRaidLocked } from "./raidReset";

const PRIORITY_WEIGHTS = {
  high: 5,
  medium: 3,
  low: 1
};

const LOCKED_OUT_PENALTY = 2;

export function calculateUrgency(lootItems, raidStatuses) {
  const remainingLoot = lootItems.filter((item) => !item.obtained);

  const counts = {
    high: 0,
    medium: 0,
    low: 0
  };

  remainingLoot.forEach((item) => {
    const p = (item.priority || "low").toLowerCase();
    if (counts[p] !== undefined) {
      counts[p] += 1;
    }
  });

  const lockedOut = raidStatuses.filter((status) => isRaidLocked(status)).length;

  const score =
    counts.high * PRIORITY_WEIGHTS.high +
    counts.medium * PRIORITY_WEIGHTS.medium +
    counts.low * PRIORITY_WEIGHTS.low +
    lockedOut * LOCKED_OUT_PENALTY;

  return {
    score,
    counts,
    lockedOut,
    totalLoot: lootItems.length,
    remaining: remainingLoot.length,
    obtained: lootItems.length - remainingLoot.length
  };
}

export function sortCharactersByUrgency(entries) {
  return [...entries].sort((a, b) => {
    if (b.metrics.score !== a.metrics.score) {
      return b.metrics.score - a.metrics.score;
    }

    if (b.metrics.counts.high !== a.metrics.counts.high) {
      return b.metrics.counts.high - a.metrics.counts.high;
    }

    if (b.metrics.totalLoot !== a.metrics.totalLoot) {
      return b.metrics.totalLoot - a.metrics.totalLoot;
    }

    return a.character.name.localeCompare(b.character.name);
  });
}
