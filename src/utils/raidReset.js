const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKLY_RAIDS = new Set(["Naxxramas", "Blackwing Lair", "Ahn'Qiraj 40"]);
const THREE_DAY_RAIDS = new Set(["Zul'Gurub", "Ruins of Ahn'Qiraj", "Onyxia's Lair"]);
const THREE_DAY_ANCHOR_LOCAL_DAY_NUMBER = Math.floor(Date.UTC(2024, 0, 3) / DAY_MS);

function getNZOffsetHours(date) {
  const timeZoneName = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Auckland",
    timeZoneName: "shortOffset"
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  const match = timeZoneName?.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
  if (!match) {
    return 12;
  }

  const hours = Number(match[1]);
  const mins = Number(match[2] || "0");
  return hours + mins / 60;
}

function localDayNumberToYmd(localDayNumber) {
  const date = new Date(localDayNumber * DAY_MS);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    weekday: date.getUTCDay()
  };
}

function getNZLocalDateParts(date) {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  const year = Number(formatted.year);
  const month = Number(formatted.month);
  const day = Number(formatted.day);

  return {
    year,
    month,
    day,
    hour: Number(formatted.hour),
    minute: Number(formatted.minute),
    second: Number(formatted.second),
    dayNumber: Math.floor(Date.UTC(year, month - 1, day) / DAY_MS)
  };
}

function nzLocalToUtc(year, month, day, hour) {
  const initialGuess = new Date(Date.UTC(year, month - 1, day, hour - 12, 0, 0));
  const offsetHours = getNZOffsetHours(initialGuess);
  return new Date(Date.UTC(year, month - 1, day, hour - offsetHours, 0, 0));
}

function getNextWeeklyReset(fromDate = new Date()) {
  const now = new Date(fromDate);
  const localNow = getNZLocalDateParts(now);

  for (let step = 0; step <= 10; step += 1) {
    const current = localDayNumberToYmd(localNow.dayNumber + step);
    if (current.weekday !== 3) {
      continue;
    }

    const nzNoon = nzLocalToUtc(current.year, current.month, current.day, 12);
    const currentOffset = getNZOffsetHours(nzNoon);
    // Weekly reset is Tuesday 15:00 UTC (see docs/architecture.md). NZST
    // (offset 12) puts that at Wed 03:00 local; NZDT (offset 13) puts it at
    // Wed 04:00 local -- NOT 05:00, which was an earlier off-by-one bug here.
    const targetHour = currentOffset >= 13 ? 4 : 3;
    const candidate = nzLocalToUtc(current.year, current.month, current.day, targetHour);

    if (candidate > now) {
      return candidate;
    }
  }

  return new Date(now.getTime() + 7 * DAY_MS);
}

function getNextThreeDayReset(fromDate = new Date()) {
  const now = new Date(fromDate);
  const localNow = getNZLocalDateParts(now);

  for (let step = 0; step <= 10; step += 1) {
    const dayNumber = localNow.dayNumber + step;
    if ((dayNumber - THREE_DAY_ANCHOR_LOCAL_DAY_NUMBER) % 3 !== 0) {
      continue;
    }

    const current = localDayNumberToYmd(dayNumber);
    const candidate = nzLocalToUtc(current.year, current.month, current.day, 3);

    if (candidate > now) {
      return candidate;
    }
  }

  return new Date(now.getTime() + 3 * DAY_MS);
}

export function getNextRaidReset(raidName, fromDate = new Date()) {
  if (THREE_DAY_RAIDS.has(raidName)) {
    return getNextThreeDayReset(fromDate);
  }

  if (WEEKLY_RAIDS.has(raidName)) {
    return getNextWeeklyReset(fromDate);
  }

  return getNextWeeklyReset(fromDate);
}

export function isRaidLocked(status, now = new Date()) {
  if (!status?.completed) {
    return false;
  }

  if (!status.resetDate) {
    return true;
  }

  return new Date(status.resetDate) > now;
}

export function formatCountdown(targetDate) {
  const now = new Date();
  const diffMs = new Date(targetDate).getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Due now";
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  return `${days}d ${remHours}h`;
}
