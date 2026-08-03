const RAID_NAME_MAP = {
  "Molten Core": "Molten Core",
  MC: "Molten Core",
  "Blackwing Lair": "Blackwing Lair",
  BWL: "Blackwing Lair",
  "Temple of Ahn'Qiraj": "Ahn'Qiraj 40",
  "Ahn'Qiraj Temple": "Ahn'Qiraj 40",
  AQ40: "Ahn'Qiraj 40",
  "Ruins of Ahn'Qiraj": "Ruins of Ahn'Qiraj",
  AQ20: "Ruins of Ahn'Qiraj",
  "Naxxramas": "Naxxramas",
  NAXX: "Naxxramas",
  "Zul'Gurub": "Zul'Gurub",
  ZG: "Zul'Gurub",
  "Onyxia's Lair": "Onyxia's Lair"
};

const ALLIANCE_RACES = new Set(["Human", "Dwarf", "NightElf", "Gnome"]);
const HORDE_RACES = new Set(["Orc", "Undead", "Scourge", "Tauren", "Troll"]);
const WORLD_BUFF_NAME_MAP = {
  "rallying cry of the dragonslayer": "Rallying Cry of the Dragonslayer",
  rallying: "Rallying Cry of the Dragonslayer",
  ony: "Rallying Cry of the Dragonslayer",
  nef: "Rallying Cry of the Dragonslayer",
  "warchief's blessing": "Warchief's Blessing",
  wcb: "Warchief's Blessing",
  rend: "Warchief's Blessing",
  "spirit of zandalar": "Spirit of Zandalar",
  zandalar: "Spirit of Zandalar",
  zg: "Spirit of Zandalar",
  zan: "Spirit of Zandalar",
  "sayge's dark fortune of damage": "Sayge's Dark Fortune of Damage",
  "sayges dark fortune of damage": "Sayge's Dark Fortune of Damage",
  dmf: "Sayge's Dark Fortune of Damage",
  "songflower serenade": "Songflower Serenade",
  songflower: "Songflower Serenade",
  "fengus' ferocity": "Fengus' Ferocity",
  "fengus ferocity": "Fengus' Ferocity",
  fengus: "Fengus' Ferocity",
  "mol'dar's moxie": "Mol'dar's Moxie",
  "moldar's moxie": "Mol'dar's Moxie",
  moldar: "Mol'dar's Moxie",
  "slip'kik's savvy": "Slip'kik's Savvy",
  "slipkik's savvy": "Slip'kik's Savvy",
  slipkik: "Slip'kik's Savvy"
};

function normalizeRaidName(name) {
  const rawName = String(name || "").trim();
  const baseName = rawName.replace(/\s*\((?:10|20|40) Player\)\s*$/i, "");
  const compactName = baseName.replace(/\s+/g, "").toUpperCase();
  return RAID_NAME_MAP[baseName] || RAID_NAME_MAP[rawName] || RAID_NAME_MAP[compactName] || null;
}

export function parseNovaActiveInstances(luaText) {
  const lines = luaText.split(/\r?\n/);
  const stack = [];
  const results = [];

  const pushContext = (ctx) => {
    stack.push(ctx);
  };

  const popContext = () => {
    const ctx = stack.pop();
    if (ctx?.isInstanceEntry) {
      const raidName = normalizeRaidName(ctx.entry.instanceName);
      if (raidName && ctx.entry.enteredTime && !ctx.entry.leftTime) {
        results.push({
          playerName: ctx.entry.playerName || null,
          raidName,
          enteredTime: ctx.entry.enteredTime
        });
      }
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    const keyedOpen = trimmed.match(/^\["([^"]+)"\]\s*=\s*\{$/);
    if (keyedOpen) {
      pushContext({ key: keyedOpen[1], isInstanceEntry: false });
      return;
    }

    const indexedOpen = trimmed.match(/^\[(\d+)\]\s*=\s*\{$/);
    if (indexedOpen) {
      pushContext({ key: indexedOpen[1], isInstanceEntry: true, entry: { instanceName: null, playerName: null, enteredTime: null, leftTime: null } });
      return;
    }

    if (trimmed === "{" || trimmed.endsWith("= {")) {
      pushContext({ key: null, isInstanceEntry: false });
      return;
    }

    const current = stack[stack.length - 1];
    if (current?.isInstanceEntry) {
      const instanceNameMatch = trimmed.match(/^\["instanceName"\]\s*=\s*"([^"]+)",?$/);
      if (instanceNameMatch) {
        current.entry.instanceName = instanceNameMatch[1];
      }

      const playerNameMatch = trimmed.match(/^\["playerName"\]\s*=\s*"([^"]+)",?$/);
      if (playerNameMatch) {
        current.entry.playerName = playerNameMatch[1];
      }

      const enteredTimeMatch = trimmed.match(/^\["enteredTime"\]\s*=\s*(\d+),?$/);
      if (enteredTimeMatch) {
        current.entry.enteredTime = Number(enteredTimeMatch[1]);
      }

      const leftTimeMatch = trimmed.match(/^\["leftTime"\]\s*=\s*(\d+),?$/);
      if (leftTimeMatch) {
        current.entry.leftTime = Number(leftTimeMatch[1]);
      }
    }

    const closes = (trimmed.match(/}/g) || []).length;
    for (let index = 0; index < closes; index += 1) {
      if (stack.length) {
        popContext();
      }
    }
  });

  const deduped = new Map();
  results.forEach((entry) => {
    const key = `${entry.raidName}|${entry.enteredTime}`;
    if (!deduped.has(key) || (deduped.get(key).enteredTime || 0) < entry.enteredTime) {
      deduped.set(key, entry);
    }
  });

  return [...deduped.values()].sort((a, b) => b.enteredTime - a.enteredTime);
}

export function parseNovaSavedInstances(luaText) {
  const lines = luaText.split(/\r?\n/);
  const stack = [];
  const results = [];

  const pushContext = (ctx) => {
    stack.push(ctx);
  };

  const popContext = () => {
    const ctx = stack.pop();
    if (ctx?.isSavedEntry) {
      const raidName = normalizeRaidName(ctx.entry.name);
      if (ctx.entry.locked && raidName && typeof ctx.entry.resetTime === "number") {
        results.push({
          characterName: ctx.characterName,
          realm: ctx.realm,
          raidName,
          resetDate: new Date(ctx.entry.resetTime * 1000).toISOString()
        });
      }
    }
  };

  const findNearest = (predicate) => {
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (predicate(stack[index])) {
        return stack[index];
      }
    }
    return null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    const keyedOpen = trimmed.match(/^\["([^"]+)"\]\s*=\s*\{$/);
    if (keyedOpen) {
      const key = keyedOpen[1];
      const parent = stack[stack.length - 1];

      const ctx = {
        key,
        isRealm: false,
        isChar: false,
        isSavedInstances: false,
        isSavedEntry: false
      };

      if (parent?.key === "global") {
        ctx.isRealm = true;
        ctx.realm = key;
      }

      if (parent?.key === "myChars") {
        ctx.isChar = true;
        ctx.characterName = key;
      }

      if (key === "savedInstances") {
        ctx.isSavedInstances = true;
      }

      pushContext(ctx);
      return;
    }

    const indexedOpen = trimmed.match(/^\[(\d+)\]\s*=\s*\{$/);
    if (indexedOpen) {
      const parent = stack[stack.length - 1];
      if (parent?.isSavedInstances) {
        const charCtx = findNearest((item) => item.isChar);
        const realmCtx = findNearest((item) => item.isRealm);

        pushContext({
          key: indexedOpen[1],
          isSavedEntry: true,
          characterName: charCtx?.characterName || null,
          realm: realmCtx?.realm || null,
          entry: {
            name: null,
            locked: false,
            resetTime: null
          }
        });
      } else {
        pushContext({ key: indexedOpen[1] });
      }
      return;
    }

    if (trimmed === "{" || trimmed.endsWith("= {")) {
      pushContext({ key: null });
      return;
    }

    const current = stack[stack.length - 1];
    if (current?.isSavedEntry) {
      const nameMatch = trimmed.match(/^\["name"\]\s*=\s*"([^"]+)",?$/);
      if (nameMatch) {
        current.entry.name = nameMatch[1];
      }

      if (/^\["locked"\]\s*=\s*true,?$/.test(trimmed)) {
        current.entry.locked = true;
      }

      const resetMatch = trimmed.match(/^\["resetTime"\]\s*=\s*(\d+),?$/);
      if (resetMatch) {
        current.entry.resetTime = Number(resetMatch[1]);
      }
    }

    const closes = (trimmed.match(/}/g) || []).length;
    for (let index = 0; index < closes; index += 1) {
      if (stack.length) {
        popContext();
      }
    }
  });

  return results;
}

function inferFaction(raceEnglish) {
  if (ALLIANCE_RACES.has(raceEnglish)) {
    return "Alliance";
  }
  if (HORDE_RACES.has(raceEnglish)) {
    return "Horde";
  }
  return "Unknown";
}

function normalizeWorldBuffName(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const compact = raw.toLowerCase();
  return WORLD_BUFF_NAME_MAP[compact] || raw;
}

export function parseNovaCharacters(luaText) {
  const lines = luaText.split(/\r?\n/);
  const stack = [];
  const results = [];

  const pushContext = (ctx) => stack.push(ctx);

  const popContext = () => {
    const ctx = stack.pop();
    if (ctx?.isChar && ctx.characterName && ctx.realm) {
      results.push({
        name: ctx.characterName,
        realm: ctx.realm,
        className: ctx.classLocalized || "Unknown",
        faction: inferFaction(ctx.raceEnglish),
        level: typeof ctx.level === "number" ? ctx.level : null,
        restedXp: typeof ctx.restedXp === "number" ? ctx.restedXp : null
      });
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    const keyedOpen = trimmed.match(/^\["([^"]+)"\]\s*=\s*\{$/);
    if (keyedOpen) {
      const key = keyedOpen[1];
      const parent = stack[stack.length - 1];

      const ctx = {
        key,
        isRealm: false,
        isChar: false,
        realm: null,
        characterName: null,
        classLocalized: null,
        raceEnglish: null,
        level: null,
        restedXp: null
      };

      if (parent?.key === "global") {
        ctx.isRealm = true;
        ctx.realm = key;
      }

      if (parent?.key === "myChars") {
        const realmCtx = [...stack].reverse().find((entry) => entry.isRealm);
        ctx.isChar = true;
        ctx.characterName = key;
        ctx.realm = realmCtx?.realm || null;
      }

      pushContext(ctx);
      return;
    }

    if (trimmed === "{" || trimmed.endsWith("= {")) {
      pushContext({ key: null });
      return;
    }

    const current = stack[stack.length - 1];
    if (current?.isChar) {
      const classMatch = trimmed.match(/^\["classLocalized"\]\s*=\s*"([^"]+)",?$/);
      if (classMatch) {
        current.classLocalized = classMatch[1];
      }

      const raceMatch = trimmed.match(/^\["raceEnglish"\]\s*=\s*"([^"]+)",?$/);
      if (raceMatch) {
        current.raceEnglish = raceMatch[1];
      }

      const levelMatch = trimmed.match(/^\["level"\]\s*=\s*(\d+),?$/);
      if (levelMatch) {
        current.level = Number(levelMatch[1]);
      }

      const restedXpMatch = trimmed.match(/^\["restedXP"\]\s*=\s*(\d+),?$/);
      if (restedXpMatch) {
        current.restedXp = Number(restedXpMatch[1]);
      }
    }

    const closes = (trimmed.match(/}/g) || []).length;
    for (let index = 0; index < closes; index += 1) {
      if (stack.length) {
        popContext();
      }
    }
  });

  const deduped = new Map();
  results.forEach((entry) => {
    const key = `${entry.name.toLowerCase()}|${entry.realm.toLowerCase()}`;
    if (!deduped.has(key)) {
      deduped.set(key, entry);
    }
  });

  return [...deduped.values()];
}

export function parseNovaWorldBuffs(luaText) {
  const lines = String(luaText || "").split(/\r?\n/);
  const stack = [];
  const results = [];

  const pushContext = (ctx) => stack.push(ctx);

  const findNearest = (predicate) => {
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (predicate(stack[index])) {
        return stack[index];
      }
    }
    return null;
  };

  const popContext = () => {
    const ctx = stack.pop();
    if (ctx?.kind === "char") {
      if (ctx.onyCount > 0 || ctx.nefCount > 0) {
        ctx.storedBuffs.add("Rallying Cry of the Dragonslayer");
      }
      if (ctx.rendCount > 0) {
        ctx.storedBuffs.add("Warchief's Blessing");
      }
      if (ctx.zanCount > 0) {
        ctx.storedBuffs.add("Spirit of Zandalar");
      }
      if (ctx.dmfCount > 0) {
        ctx.storedBuffs.add("Sayge's Dark Fortune of Damage");
      }

      results.push({
        name: ctx.name,
        realm: ctx.realm,
        faction: ctx.faction,
        className: ctx.className,
        level: ctx.level,
        buffs: [...ctx.buffs],
        storedBuffs: [...ctx.storedBuffs],
        chronoCount: ctx.chronoCount,
        chronoCooldown: ctx.chronoCooldown,
        onyCount: ctx.onyCount,
        nefCount: ctx.nefCount,
        rendCount: ctx.rendCount,
        zanCount: ctx.zanCount,
        dmfCount: ctx.dmfCount
      });
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    const keyedOpen = trimmed.match(/^\["([^"]+)"\]\s*=\s*\{$/);
    if (keyedOpen) {
      const key = keyedOpen[1];
      const parent = stack[stack.length - 1];

      if (key === "global") {
        pushContext({ kind: "global", key });
        return;
      }

      if (parent?.kind === "global") {
        pushContext({ kind: "realm", key, realm: key });
        return;
      }

      if (parent?.kind === "realm" && (key === "Alliance" || key === "Horde")) {
        pushContext({ kind: "faction", key, faction: key });
        return;
      }

      if (key === "myChars") {
        pushContext({ kind: "myChars", key });
        return;
      }

      if (parent?.kind === "myChars") {
        const realmCtx = findNearest((entry) => entry.kind === "realm");
        const factionCtx = findNearest((entry) => entry.kind === "faction");
        pushContext({
          kind: "char",
          key,
          name: key,
          realm: realmCtx?.realm || "",
          faction: factionCtx?.faction || "Unknown",
          className: "Unknown",
          level: null,
          chronoCount: 0,
          chronoCooldown: null,
          onyCount: 0,
          nefCount: 0,
          rendCount: 0,
          zanCount: 0,
          dmfCount: 0,
          buffs: new Set(),
          storedBuffs: new Set()
        });
        return;
      }

      if (parent?.kind === "char" && (key === "buffs" || key === "storedBuffs")) {
        pushContext({ kind: "buffTable", key, tableType: key });
        return;
      }

      if (parent?.kind === "buffTable") {
        const charCtx = findNearest((entry) => entry.kind === "char");
        if (charCtx) {
          const buffName = normalizeWorldBuffName(key);
          if (parent.tableType === "buffs") {
            charCtx.buffs.add(buffName);
          } else {
            charCtx.storedBuffs.add(buffName);
          }
        }
        pushContext({ kind: "buffEntry", key });
        return;
      }

      pushContext({ kind: "object", key });
      return;
    }

    if (trimmed === "{" || trimmed.endsWith("= {")) {
      pushContext({ kind: "object", key: null });
      return;
    }

    const charCtx = findNearest((entry) => entry.kind === "char");
    const buffTableCtx = findNearest((entry) => entry.kind === "buffTable");
    const buffEntryCtx = findNearest((entry) => entry.kind === "buffEntry");
    // Only match buff entries directly in the buffTable, not properties within buff entries
    if (buffTableCtx && charCtx && !buffEntryCtx) {
      const buffValueMatch = trimmed.match(/^\["([^"]+)"\]\s*=\s*(?:true|false|\d+|"[^"]*"),?$/);
      if (buffValueMatch) {
        const buffName = normalizeWorldBuffName(buffValueMatch[1]);
        if (buffTableCtx.tableType === "buffs") {
          charCtx.buffs.add(buffName);
        } else {
          charCtx.storedBuffs.add(buffName);
        }
      }
    }

    if (charCtx) {
      const classMatch = trimmed.match(/^\["localizedClass"\]\s*=\s*"([^"]+)",?$/);
      if (classMatch) {
        charCtx.className = classMatch[1];
      }

      const levelMatch = trimmed.match(/^\["level"\]\s*=\s*(\d+),?$/);
      if (levelMatch) {
        charCtx.level = Number(levelMatch[1]);
      }

      const chronoCountMatch = trimmed.match(/^\["chronoCount"\]\s*=\s*(\d+),?$/);
      if (chronoCountMatch) {
        charCtx.chronoCount = Number(chronoCountMatch[1]);
      }

      const chronoCooldownMatch = trimmed.match(/^\["chronoCooldown"\]\s*=\s*([0-9.]+),?$/);
      if (chronoCooldownMatch) {
        charCtx.chronoCooldown = Number(chronoCooldownMatch[1]);
      }

      const onyCountMatch = trimmed.match(/^\["onyCount"\]\s*=\s*(\d+),?$/);
      if (onyCountMatch) {
        charCtx.onyCount = Number(onyCountMatch[1]);
      }

      const nefCountMatch = trimmed.match(/^\["nefCount"\]\s*=\s*(\d+),?$/);
      if (nefCountMatch) {
        charCtx.nefCount = Number(nefCountMatch[1]);
      }

      const rendCountMatch = trimmed.match(/^\["rendCount"\]\s*=\s*(\d+),?$/);
      if (rendCountMatch) {
        charCtx.rendCount = Number(rendCountMatch[1]);
      }

      const zanCountMatch = trimmed.match(/^\["zanCount"\]\s*=\s*(\d+),?$/);
      if (zanCountMatch) {
        charCtx.zanCount = Number(zanCountMatch[1]);
      }

      const dmfCountMatch = trimmed.match(/^\["dmfCount"\]\s*=\s*(\d+),?$/);
      if (dmfCountMatch) {
        charCtx.dmfCount = Number(dmfCountMatch[1]);
      }
    }

    const closes = (trimmed.match(/}/g) || []).length;
    for (let index = 0; index < closes; index += 1) {
      if (stack.length) {
        popContext();
      }
    }
  });

  const deduped = new Map();
  results.forEach((entry) => {
    if (!entry.name || !entry.realm) {
      return;
    }

    const key = `${entry.name.toLowerCase()}|${entry.realm.toLowerCase()}`;
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, entry);
      return;
    }

    deduped.set(key, {
      ...existing,
      buffs: Array.from(new Set([...(existing.buffs || []), ...(entry.buffs || [])])),
      storedBuffs: Array.from(new Set([...(existing.storedBuffs || []), ...(entry.storedBuffs || [])])),
      chronoCount: Math.max(existing.chronoCount || 0, entry.chronoCount || 0),
      onyCount: Math.max(existing.onyCount || 0, entry.onyCount || 0),
      nefCount: Math.max(existing.nefCount || 0, entry.nefCount || 0),
      rendCount: Math.max(existing.rendCount || 0, entry.rendCount || 0),
      zanCount: Math.max(existing.zanCount || 0, entry.zanCount || 0),
      dmfCount: Math.max(existing.dmfCount || 0, entry.dmfCount || 0)
    });
  });

  return [...deduped.values()];
}
