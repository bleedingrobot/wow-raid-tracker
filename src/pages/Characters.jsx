import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUserCollections } from "../hooks/useUserCollections";
import { updateCharacter } from "../services/dataService";
import { getClassIcon } from "../utils/classIcons";
import { getCharacterBuffSet } from "../utils/buffCatalog";
import {
  BIS_GUIDE_URL_BY_SPEC,
  BIS_ITEM_IDS_BY_SPEC,
  SPEC_OPTIONS_BY_CLASS
} from "../data/bisLists";
import { BIS_ITEM_NAME_BY_ID } from "../data/bisItemNames";
import {
  getEnchantLabel,
  getMissingEnchantIdsFromCharacters,
  isKnownEnchantId
} from "../data/enchantNames";
import {
  SLOT_LABELS,
  buildWarriorSimExport,
  normalizeEnchantId,
  WARRIOR_SIM_PAYLOAD_KEY
} from "../utils/warriorSim";
import { buildRogueSimExport, ROGUE_SIM_PAYLOAD_KEY } from "../utils/rogueSim";
import { buildMageSimExport, MAGE_SIM_PAYLOAD_KEY } from "../utils/mageSim";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Select } from "../components/ui/Field";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const EQUIPMENT_LEFT_SLOTS = [1, 2, 3, 5, 9, 10, 6, 7, 8];
const EQUIPMENT_RIGHT_SLOTS = [11, 12, 13, 14, 15, 16, 17, 18, 19];
const DEFAULT_SPEC_BY_CLASS = {
  Paladin: "paladin-holy-p6"
};

const ITEM_ID_PLACEHOLDER_PATTERN = /^item\s*#\d+$/i;

const QUALITY_COLORS = {
  poor: "#9d9d9d",
  common: undefined,
  uncommon: "#1eff00",
  rare: "#0070dd",
  epic: "#a335ee",
  legendary: "#ff8000"
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatGold(copperValue) {
  const total = Number(copperValue);
  if (!Number.isFinite(total) || total < 0) {
    return "-";
  }

  const gold = Math.floor(total / 10000);
  const silver = Math.floor((total % 10000) / 100);
  const copper = total % 100;
  return `${gold}g ${silver}s ${copper}c`;
}

function formatHours(secondsValue) {
  const total = Number(secondsValue);
  if (!Number.isFinite(total) || total < 0) {
    return "-";
  }

  const hours = total / 3600;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

function getQualityClass(quality) {
  const value = String(quality || "common").toLowerCase();
  if (["poor", "common", "uncommon", "rare", "epic", "legendary"].includes(value)) {
    return value;
  }
  return "common";
}

function buildKnownItemNameMap() {
  const known = new Map();

  Object.entries(BIS_ITEM_NAME_BY_ID).forEach(([idText, name]) => {
    const id = Number(idText);
    const safeName = String(name || "").trim();
    if (Number.isFinite(id) && id > 0 && safeName) {
      known.set(id, safeName);
    }
  });

  Object.values(BIS_ITEM_IDS_BY_SPEC).forEach((slots) => {
    if (!slots || typeof slots !== "object") {
      return;
    }

    Object.values(slots).forEach((entries) => {
      if (!Array.isArray(entries)) {
        return;
      }

      entries.forEach((entry) => {
        if (!entry || typeof entry !== "object") {
          return;
        }

        const id = Number(entry.itemId);
        const safeName = String(entry.itemName || "").trim();
        if (Number.isFinite(id) && id > 0 && safeName && !known.has(id)) {
          known.set(id, safeName);
        }
      });
    });
  });

  return known;
}

const KNOWN_ITEM_NAME_BY_ID = buildKnownItemNameMap();

function getItemName(item) {
  const name = String(item?.itemName || "").trim();
  const itemId = Number(item?.itemId || 0);
  const hasValidId = Number.isFinite(itemId) && itemId > 0;
  const isIdPlaceholder = ITEM_ID_PLACEHOLDER_PATTERN.test(name);

  if (name && !isIdPlaceholder) {
    return name;
  }

  if (hasValidId) {
    return KNOWN_ITEM_NAME_BY_ID.get(itemId) || BIS_ITEM_NAME_BY_ID[itemId] || `Item #${itemId}`;
  }

  return "Empty";
}

function hasMissingItemName(item) {
  const itemId = Number(item?.itemId || 0);
  if (!Number.isFinite(itemId) || itemId <= 0) {
    return false;
  }

  const name = String(item?.itemName || "").trim();
  if (!name) {
    return true;
  }

  return ITEM_ID_PLACEHOLDER_PATTERN.test(name);
}

function getBisItemNameById(itemId) {
  const id = Number(itemId);
  if (!Number.isFinite(id) || id <= 0) {
    return "Unknown Item";
  }
  return KNOWN_ITEM_NAME_BY_ID.get(id) || BIS_ITEM_NAME_BY_ID[id] || `Item #${id}`;
}

function normalizeBisItems(bisEntry) {
  if (!Array.isArray(bisEntry)) {
    return [];
  }

  return bisEntry
    .map((entry) => {
      if (typeof entry === "number" || typeof entry === "string") {
        const itemId = Number(entry);
        if (!Number.isFinite(itemId) || itemId <= 0) {
          return null;
        }
        return { itemId, name: getBisItemNameById(itemId) };
      }

      if (entry && typeof entry === "object") {
        const itemId = Number(entry.itemId);
        if (!Number.isFinite(itemId) || itemId <= 0) {
          return null;
        }
        const explicitName = String(entry.itemName || "").trim();
        return {
          itemId,
          name: explicitName || getBisItemNameById(itemId)
        };
      }

      return null;
    })
    .filter(Boolean);
}

function getBisTierLabel(index) {
  if (index === 0) {
    return "Best";
  }
  if (index === 1) {
    return "Better";
  }
  if (index === 2) {
    return "Good";
  }
  return `Alt ${index + 1}`;
}

function buildWowheadItemUrl(itemId) {
  const id = Number(itemId);
  if (!Number.isFinite(id) || id <= 0) {
    return "";
  }
  return `https://www.wowhead.com/classic/item=${id}`;
}

const STATUS_TONE = { bis: "good", upgrade: "warn", missing: "neutral" };

export default function CharactersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data } = useUserCollections(user?.uid);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [factionFilter, setFactionFilter] = useState("all");
  const [realmFilter, setRealmFilter] = useState("all");
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [showBisUpgrades, setShowBisUpgrades] = useState(false);
  const [selectedSpecKey, setSelectedSpecKey] = useState("");
  const [isResolvingItemNames, setIsResolvingItemNames] = useState(false);
  const [resolveItemNamesMessage, setResolveItemNamesMessage] = useState("");
  const [simExportMessage, setSimExportMessage] = useState("");
  const [enchantAuditMessage, setEnchantAuditMessage] = useState("");

  const classOptions = useMemo(
    () => Array.from(new Set(data.characters.map((character) => character.class).filter(Boolean))).sort(),
    [data.characters]
  );
  const factionOptions = useMemo(
    () => Array.from(new Set(data.characters.map((character) => character.faction).filter(Boolean))).sort(),
    [data.characters]
  );
  const realmOptions = useMemo(
    () => Array.from(new Set(data.characters.map((character) => character.realm).filter(Boolean))).sort(),
    [data.characters]
  );

  const filteredCharacters = useMemo(() => {
    return data.characters
      .filter((character) => {
        if (classFilter !== "all" && character.class !== classFilter) {
          return false;
        }
        if (factionFilter !== "all" && character.faction !== factionFilter) {
          return false;
        }
        if (realmFilter !== "all" && character.realm !== realmFilter) {
          return false;
        }

        const search = normalize(searchTerm);
        if (!search) {
          return true;
        }

        return (
          normalize(character.name).includes(search) ||
          normalize(character.realm).includes(search) ||
          normalize(character.class).includes(search) ||
          normalize(character.guildName).includes(search)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.characters, classFilter, factionFilter, realmFilter, searchTerm]);

  useEffect(() => {
    if (!filteredCharacters.length) {
      setSelectedCharacterId("");
      return;
    }

    const stillVisible = filteredCharacters.some((character) => character.id === selectedCharacterId);
    if (!stillVisible) {
      setSelectedCharacterId(filteredCharacters[0].id);
    }
  }, [filteredCharacters, selectedCharacterId]);

  const selectedCharacter = useMemo(
    () => filteredCharacters.find((character) => character.id === selectedCharacterId) || null,
    [filteredCharacters, selectedCharacterId]
  );

  const selectedEquipmentBySlot = useMemo(() => {
    const map = new Map();
    (selectedCharacter?.equippedItems || []).forEach((item) => {
      if (Number.isFinite(item.slot)) {
        map.set(Number(item.slot), item);
      }
    });
    return map;
  }, [selectedCharacter]);

  const isSelectedCharacterWarrior = normalize(selectedCharacter?.class) === "warrior";
  const isSelectedCharacterRogue = normalize(selectedCharacter?.class) === "rogue";
  const isSelectedCharacterMage = normalize(selectedCharacter?.class) === "mage";

  const selectedClassicSimConfig = useMemo(() => {
    if (isSelectedCharacterWarrior) {
      return {
        label: "Classic Warrior",
        buildExport: buildWarriorSimExport,
        payloadKey: WARRIOR_SIM_PAYLOAD_KEY,
        route: "/sim/warrior"
      };
    }

    if (isSelectedCharacterRogue) {
      return {
        label: "Classic Rogue",
        buildExport: buildRogueSimExport,
        payloadKey: ROGUE_SIM_PAYLOAD_KEY,
        route: "/sim/rogue"
      };
    }

    if (isSelectedCharacterMage) {
      return {
        label: "Classic Mage",
        buildExport: buildMageSimExport,
        payloadKey: MAGE_SIM_PAYLOAD_KEY,
        route: "/sim/mage"
      };
    }

    return null;
  }, [isSelectedCharacterMage, isSelectedCharacterRogue, isSelectedCharacterWarrior]);

  const selectedSpecOptions = useMemo(() => {
    if (!selectedCharacter?.class) {
      return [];
    }
    return SPEC_OPTIONS_BY_CLASS[selectedCharacter.class] || [];
  }, [selectedCharacter]);

  useEffect(() => {
    if (!selectedCharacter) {
      setSelectedSpecKey("");
      return;
    }

    const currentSpec = String(selectedCharacter.bisSpec || "");
    if (currentSpec && selectedSpecOptions.some((option) => option.key === currentSpec)) {
      setSelectedSpecKey(currentSpec);
      return;
    }

    const classDefault = DEFAULT_SPEC_BY_CLASS[selectedCharacter.class];
    if (classDefault && selectedSpecOptions.some((option) => option.key === classDefault)) {
      setSelectedSpecKey(classDefault);
      return;
    }

    setSelectedSpecKey(selectedSpecOptions[0]?.key || "");
  }, [selectedCharacter, selectedSpecOptions]);

  const selectedGuideUrl = useMemo(() => BIS_GUIDE_URL_BY_SPEC[selectedSpecKey] || "", [selectedSpecKey]);

  const selectedBisBySlot = useMemo(() => BIS_ITEM_IDS_BY_SPEC[selectedSpecKey] || null, [selectedSpecKey]);

  const bisUpgradeRows = useMemo(() => {
    if (!selectedBisBySlot) {
      return [];
    }

    const rows = [];
    Object.entries(selectedBisBySlot).forEach(([slotText, bisItemIds]) => {
      const slot = Number(slotText);
      const equipped = selectedEquipmentBySlot.get(slot) || null;
      const normalizedBisItems = normalizeBisItems(bisItemIds);
      const normalizedBisIds = normalizedBisItems.map((item) => item.itemId);
      const rankedBisItems = normalizedBisItems.map((item, index) => ({
        ...item,
        tier: getBisTierLabel(index),
        index
      }));

      const equippedId = Number(equipped?.itemId || 0);
      const primaryBisId = normalizedBisIds[0] || 0;
      const isBis = equippedId > 0 && primaryBisId > 0 && equippedId === primaryBisId;
      const isAltOption = !isBis && equippedId > 0 && normalizedBisIds.slice(1).includes(equippedId);
      const equippedRankIndex = normalizedBisIds.indexOf(equippedId);
      const equippedTier = equippedRankIndex >= 0 ? getBisTierLabel(equippedRankIndex) : "Not ranked";
      const recommendedItems = isBis
        ? []
        : equippedRankIndex >= 0
          ? rankedBisItems.slice(0, equippedRankIndex)
          : rankedBisItems;

      rows.push({
        slot,
        slotName: SLOT_LABELS[slot] || `Slot ${slot}`,
        equipped,
        bisItems: rankedBisItems,
        recommendedItems,
        equippedTier,
        isAltOption,
        status: isBis ? "bis" : equipped ? "upgrade" : "missing"
      });
    });

    return rows.sort((a, b) => a.slot - b.slot);
  }, [selectedBisBySlot, selectedEquipmentBySlot]);

  const selectedLockouts = useMemo(() => {
    if (!selectedCharacter) {
      return [];
    }

    const now = Date.now();
    return data.raidStatuses
      .filter((status) => status.characterId === selectedCharacter.id && status.completed && status.resetDate)
      .filter((status) => {
        const resetAt = Date.parse(status.resetDate);
        return Number.isFinite(resetAt) && resetAt > now;
      })
      .sort((a, b) => Date.parse(a.resetDate) - Date.parse(b.resetDate));
  }, [data.raidStatuses, selectedCharacter]);

  const selectedBuffs = useMemo(() => {
    if (!selectedCharacter) {
      return [];
    }

    return [...getCharacterBuffSet(selectedCharacter)]
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [selectedCharacter]);

  const missingEnchantIds = useMemo(() => getMissingEnchantIdsFromCharacters(data.characters), [data.characters]);

  useEffect(() => {
    setSimExportMessage("");
    setResolveItemNamesMessage("");
  }, [selectedCharacterId]);

  if (!user) {
    return (
      <div>
        <PageHeader title="Character Armory" />
        <EmptyState title="Sign in required" description="Sign in to view character armory details." />
      </div>
    );
  }

  const onCopyMissingEnchantIds = async () => {
    if (!missingEnchantIds.length) {
      setEnchantAuditMessage("Enchant coverage is complete for current equipped data.");
      return;
    }

    const text = missingEnchantIds.join(", ");
    if (!navigator?.clipboard?.writeText) {
      setEnchantAuditMessage(`Missing enchant IDs: ${text}`);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setEnchantAuditMessage(`Copied ${missingEnchantIds.length} missing enchant ID(s): ${text}`);
    } catch {
      setEnchantAuditMessage(`Missing enchant IDs: ${text}`);
    }
  };

  const onBisSpecChange = async (nextSpec) => {
    setSelectedSpecKey(nextSpec);
    if (!selectedCharacter?.id) {
      return;
    }

    try {
      await updateCharacter(selectedCharacter.id, { bisSpec: nextSpec });
    } catch {
      // Keep UI responsive even if save fails; sync will retry later.
    }
  };

  const onResolveMissingItemNames = async () => {
    if (!selectedCharacter?.id || isResolvingItemNames) {
      return;
    }

    const equippedItems = Array.isArray(selectedCharacter.equippedItems) ? selectedCharacter.equippedItems : [];

    const missingIds = Array.from(
      new Set(
        equippedItems
          .filter((item) => hasMissingItemName(item))
          .map((item) => Number(item.itemId))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

    if (!missingIds.length) {
      setResolveItemNamesMessage("No missing equipped item names found for this character.");
      return;
    }

    setIsResolvingItemNames(true);
    setResolveItemNamesMessage(`Fetching ${missingIds.length} missing item name(s)...`);

    try {
      const resolvedNameById = new Map();

      for (const id of missingIds) {
        const knownName = KNOWN_ITEM_NAME_BY_ID.get(id) || BIS_ITEM_NAME_BY_ID[id];
        if (knownName) {
          resolvedNameById.set(id, knownName);
        }
      }

      const nextEquippedItems = equippedItems.map((item) => {
        if (!hasMissingItemName(item)) {
          return item;
        }

        const id = Number(item.itemId || 0);
        const resolvedName = resolvedNameById.get(id);
        if (!resolvedName) {
          return item;
        }

        return { ...item, itemName: resolvedName };
      });

      const fixedCount = nextEquippedItems.reduce((count, item, index) => {
        const prevName = String(equippedItems[index]?.itemName || "").trim();
        const nextName = String(item?.itemName || "").trim();
        return prevName !== nextName ? count + 1 : count;
      }, 0);

      if (!fixedCount) {
        setResolveItemNamesMessage(
          `Could not resolve ${missingIds.length} missing item name(s) from local data yet. Sync DataStore files again or add IDs to bisItemNames.`
        );
        return;
      }

      await updateCharacter(selectedCharacter.id, { equippedItems: nextEquippedItems });

      setResolveItemNamesMessage(`Updated ${fixedCount} equipped item name(s).`);
    } catch {
      setResolveItemNamesMessage("Failed to fetch missing item names. Please try again.");
    } finally {
      setIsResolvingItemNames(false);
    }
  };

  const onCopyClassicSimExport = async () => {
    if (!selectedCharacter || !selectedClassicSimConfig) {
      return;
    }

    if (!navigator?.clipboard?.writeText) {
      setSimExportMessage("Clipboard access is unavailable in this browser context.");
      return;
    }

    try {
      const { jsonText, missingSlots } = selectedClassicSimConfig.buildExport(selectedCharacter, selectedEquipmentBySlot);
      await navigator.clipboard.writeText(jsonText);

      if (missingSlots.length) {
        const missingSlotLabels = missingSlots.map((slot) => SLOT_LABELS[slot] || `Slot ${slot}`).join(", ");
        setSimExportMessage(
          `Copied ${selectedClassicSimConfig.label} sim JSON. Missing worn items for: ${missingSlotLabels}. Used template fallback IDs for those slots.`
        );
        return;
      }

      setSimExportMessage(`Copied ${selectedClassicSimConfig.label} sim JSON with your currently equipped item IDs.`);
    } catch {
      setSimExportMessage(`Failed to generate or copy ${selectedClassicSimConfig.label} sim JSON. Please try again.`);
    }
  };

  const onLaunchIntegratedClassicSim = async () => {
    if (!selectedCharacter || !selectedClassicSimConfig) {
      return;
    }

    try {
      const { jsonText, missingSlots } = selectedClassicSimConfig.buildExport(selectedCharacter, selectedEquipmentBySlot);

      try {
        localStorage.setItem(selectedClassicSimConfig.payloadKey, jsonText);
      } catch {
        // Continue even if local storage is unavailable.
      }

      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(jsonText);
        } catch {
          // Continue with navigation even if clipboard is blocked.
        }
      }

      navigate(selectedClassicSimConfig.route, {
        state: {
          simJsonText: jsonText,
          missingSlots,
          characterName: selectedCharacter.name || ""
        }
      });

      if (missingSlots.length) {
        const missingSlotLabels = missingSlots.map((slot) => SLOT_LABELS[slot] || `Slot ${slot}`).join(", ");
        setSimExportMessage(
          `Opened integrated ${selectedClassicSimConfig.label} sim. Missing worn items for: ${missingSlotLabels}. Template fallback IDs were used.`
        );
        return;
      }

      setSimExportMessage(`Opened integrated ${selectedClassicSimConfig.label} sim with your currently equipped item IDs.`);
    } catch {
      setSimExportMessage("Failed to prepare Classic sim payload. Please try again.");
    }
  };

  const renderSlot = (slotId) => {
    const item = selectedEquipmentBySlot.get(slotId);
    const slotLabel = SLOT_LABELS[slotId] || `Slot ${slotId}`;

    if (!item) {
      return (
        <li key={slotId} className="flex items-center justify-between gap-3 py-2 text-sm">
          <span className="text-ink-faint">{slotLabel}</span>
          <span className="text-ink-faint">Empty</span>
        </li>
      );
    }

    const quality = getQualityClass(item.quality);
    const enchantId = normalizeEnchantId(item.enchantId);

    return (
      <li key={slotId} className="flex items-center justify-between gap-3 py-2 text-sm">
        <span className="text-ink-faint">{slotLabel}</span>
        <span className="text-right">
          <a
            href={buildWowheadItemUrl(item.itemId)}
            target="_blank"
            rel="noreferrer"
            data-wowhead={`item=${item.itemId}`}
            className="font-medium hover:underline"
            style={{ color: QUALITY_COLORS[quality] }}
          >
            {getItemName(item)}
          </a>
          {enchantId > 0 ? (
            <span
              className={`ml-1 text-xs ${isKnownEnchantId(item.enchantId) ? "text-ink-faint" : "text-bad"}`}
              title={
                isKnownEnchantId(item.enchantId)
                  ? getEnchantLabel(item.enchantId)
                  : `${getEnchantLabel(item.enchantId)} - add this ID to src/data/enchantNames.js`
              }
            >
              [{getEnchantLabel(item.enchantId)}
              {isKnownEnchantId(item.enchantId) ? "" : " (missing name)"}]
            </span>
          ) : null}
        </span>
      </li>
    );
  };

  return (
    <div>
      <PageHeader
        title="Character Armory"
        subtitle="Character data is import-driven from Nova + DataStore files."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardBody>
            <div className="space-y-3">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, class, realm, guild"
              />
              <div className="grid grid-cols-3 gap-2">
                <Select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
                  <option value="all">All classes</option>
                  {classOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Select value={factionFilter} onChange={(event) => setFactionFilter(event.target.value)}>
                  <option value="all">All factions</option>
                  {factionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Select value={realmFilter} onChange={(event) => setRealmFilter(event.target.value)}>
                  <option value="all">All realms</option>
                  {realmOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {filteredCharacters.length ? (
              <ul className="mt-4 divide-y divide-border">
                {filteredCharacters.map((character) => (
                  <li key={character.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCharacterId(character.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors ${
                        selectedCharacterId === character.id ? "bg-brand-50" : "hover:bg-surface-muted"
                      }`}
                    >
                      <img src={getClassIcon(character.class)} alt="" className="h-8 w-8 shrink-0 rounded-md" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{character.name}</span>
                        <span className="block truncate text-xs text-ink-soft">
                          {character.class} · Level {character.level || "?"} · {character.realm}
                        </span>
                        <span className="block truncate text-xs text-ink-faint">
                          {typeof character.averageItemLevel === "number"
                            ? `Avg iLvl ${character.averageItemLevel.toFixed(1)}`
                            : "No iLvl yet"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyState title="No characters found" description="No characters match your current filters." />
              </div>
            )}
          </CardBody>
        </Card>

        {selectedCharacter ? (
          <div className="space-y-6">
            <Card>
              <CardBody className="flex items-center gap-4 pt-5">
                <img src={getClassIcon(selectedCharacter.class)} alt="" className="h-14 w-14 rounded-lg" />
                <div>
                  <h2 className="text-lg font-semibold text-ink">{selectedCharacter.name}</h2>
                  <p className="text-sm text-ink-soft">
                    Level {selectedCharacter.level || "?"} {selectedCharacter.race || "Unknown Race"}{" "}
                    {selectedCharacter.class || "Unknown Class"}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {selectedCharacter.faction || "Unknown Faction"} · {selectedCharacter.realm || "Unknown Realm"}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="BiS Comparison &amp; Sims" />
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={showBisUpgrades}
                      onChange={(event) => setShowBisUpgrades(event.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                    Show BiS upgrades
                  </label>
                  <Select
                    value={selectedSpecKey}
                    onChange={(event) => onBisSpecChange(event.target.value)}
                    disabled={!selectedSpecOptions.length}
                    className="w-auto"
                  >
                    {selectedSpecOptions.length ? (
                      selectedSpecOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))
                    ) : (
                      <option value="">No spec profile for this class</option>
                    )}
                  </Select>
                  {selectedGuideUrl ? (
                    <Button
                      size="sm"
                      onClick={() => window.open(selectedGuideUrl, "_blank", "noopener,noreferrer")}
                    >
                      Source Guide
                    </Button>
                  ) : null}
                  <Button size="sm" onClick={onResolveMissingItemNames} disabled={isResolvingItemNames}>
                    {isResolvingItemNames ? "Fetching item names..." : "Fetch missing item names"}
                  </Button>
                  {selectedClassicSimConfig ? (
                    <>
                      <Button size="sm" variant="primary" onClick={onLaunchIntegratedClassicSim}>
                        Open Integrated {selectedClassicSimConfig.label} Sim
                      </Button>
                      <Button size="sm" onClick={onCopyClassicSimExport}>
                        Copy {selectedClassicSimConfig.label} Sim JSON
                      </Button>
                    </>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-sm text-ink-soft">
                    Enchant coverage:{" "}
                    {missingEnchantIds.length ? `${missingEnchantIds.length} missing ID(s)` : "Complete"}
                  </span>
                  <Button size="sm" onClick={onCopyMissingEnchantIds}>
                    {missingEnchantIds.length ? "Copy Missing Enchant IDs" : "Enchant Coverage OK"}
                  </Button>
                </div>

                {resolveItemNamesMessage ? <p className="text-xs text-ink-soft">{resolveItemNamesMessage}</p> : null}
                {simExportMessage ? <p className="text-xs text-ink-soft">{simExportMessage}</p> : null}
                {enchantAuditMessage ? <p className="text-xs text-ink-soft">{enchantAuditMessage}</p> : null}
                {missingEnchantIds.length ? (
                  <p className="text-xs text-ink-faint">
                    Missing enchant IDs in current data: {missingEnchantIds.join(", ")}
                  </p>
                ) : null}

                {showBisUpgrades ? (
                  selectedBisBySlot ? (
                    <ul className="divide-y divide-border">
                      {bisUpgradeRows.map((row) => {
                        const topBisItems = row.recommendedItems;
                        return (
                          <li key={row.slot} className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-start sm:justify-between">
                            <span>
                              <strong className="text-ink">{row.slotName}</strong>
                              {": "}
                              {row.equipped ? (
                                <a
                                  href={buildWowheadItemUrl(row.equipped.itemId)}
                                  target="_blank"
                                  rel="noreferrer"
                                  data-wowhead={`item=${row.equipped.itemId}`}
                                  className="text-ink-soft hover:underline"
                                >
                                  {getItemName(row.equipped)}
                                </a>
                              ) : (
                                <span className="text-ink-faint">Empty</span>
                              )}
                            </span>
                            <span className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                              <Badge tone={STATUS_TONE[row.status]}>
                                {row.status === "bis" ? "BiS" : row.status === "upgrade" ? "Upgrade" : "Missing"}
                              </Badge>
                              {row.status === "bis" ? (
                                "Best"
                              ) : topBisItems.length ? (
                                <span className="text-ink-soft">
                                  {topBisItems.map((item, index) => (
                                    <span key={item.itemId}>
                                      {index ? ", " : ""}
                                      <a
                                        href={buildWowheadItemUrl(item.itemId)}
                                        target="_blank"
                                        rel="noreferrer"
                                        data-wowhead={`item=${item.itemId}`}
                                        className="hover:underline"
                                      >
                                        {item.name}
                                      </a>{" "}
                                      ({item.tier})
                                    </span>
                                  ))}
                                  {row.isAltOption ? ` (equipped: ${row.equippedTier})` : ""}
                                </span>
                              ) : row.isAltOption ? (
                                <span className="text-ink-soft">No better recommendation (equipped: {row.equippedTier})</span>
                              ) : (
                                <span className="text-ink-faint">No recommendation</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink-soft">
                      BiS mapping for this spec is not populated yet. Guide link is ready for curation.
                    </p>
                  )
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Equipped Items" />
              <CardBody>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <ul className="divide-y divide-border">{EQUIPMENT_LEFT_SLOTS.map((slotId) => renderSlot(slotId))}</ul>
                  <ul className="divide-y divide-border">{EQUIPMENT_RIGHT_SLOTS.map((slotId) => renderSlot(slotId))}</ul>
                </div>
              </CardBody>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader title="Profile" />
                <CardBody>
                  <ul className="divide-y divide-border text-sm">
                    <li className="flex items-center justify-between py-2">
                      <span className="text-ink-soft">Guild</span>
                      <strong className="text-ink">{selectedCharacter.guildName || "-"}</strong>
                    </li>
                    <li className="flex items-center justify-between py-2">
                      <span className="text-ink-soft">Rank</span>
                      <strong className="text-ink">{selectedCharacter.guildRankName || "-"}</strong>
                    </li>
                    <li className="flex items-center justify-between py-2">
                      <span className="text-ink-soft">Zone</span>
                      <strong className="text-ink">{selectedCharacter.zone || "-"}</strong>
                    </li>
                    <li className="flex items-center justify-between py-2">
                      <span className="text-ink-soft">Subzone</span>
                      <strong className="text-ink">{selectedCharacter.subZone || "-"}</strong>
                    </li>
                    <li className="flex items-center justify-between py-2">
                      <span className="text-ink-soft">Hearth</span>
                      <strong className="text-ink">{selectedCharacter.bindLocation || "-"}</strong>
                    </li>
                  </ul>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Progress" />
                <CardBody>
                  <ul className="divide-y divide-border text-sm">
                    <li className="flex items-center justify-between py-2">
                      <span className="text-ink-soft">Money</span>
                      <strong className="text-ink">{formatGold(selectedCharacter.money)}</strong>
                    </li>
                    <li className="flex items-center justify-between py-2">
                      <span className="text-ink-soft">Played</span>
                      <strong className="text-ink">{formatHours(selectedCharacter.played)}</strong>
                    </li>
                    <li className="flex items-center justify-between py-2">
                      <span className="text-ink-soft">This Level</span>
                      <strong className="text-ink">{formatHours(selectedCharacter.playedThisLevel)}</strong>
                    </li>
                    <li className="flex items-center justify-between py-2">
                      <span className="text-ink-soft">Avg iLvl</span>
                      <strong className="text-ink">
                        {typeof selectedCharacter.averageItemLevel === "number"
                          ? selectedCharacter.averageItemLevel.toFixed(1)
                          : "-"}
                      </strong>
                    </li>
                    <li className="flex items-center justify-between py-2">
                      <span className="text-ink-soft">Overall iLvl</span>
                      <strong className="text-ink">
                        {typeof selectedCharacter.overallItemLevel === "number"
                          ? selectedCharacter.overallItemLevel.toFixed(1)
                          : "-"}
                      </strong>
                    </li>
                  </ul>
                </CardBody>
              </Card>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader title="Buff Snapshot" />
                <CardBody>
                  {selectedBuffs.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedBuffs.map((buff) => (
                        <Badge key={buff} tone="good">
                          {buff}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-soft">No synced buff data yet.</p>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Active Lockouts" />
                <CardBody>
                  {selectedLockouts.length ? (
                    <ul className="divide-y divide-border text-sm">
                      {selectedLockouts.map((status) => (
                        <li key={`${status.characterId}-${status.raidName}`} className="flex items-center justify-between py-2">
                          <span className="text-ink-soft">{status.raidName}</span>
                          <strong className="text-ink">{new Date(status.resetDate).toLocaleString()}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink-soft">No active lockouts.</p>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        ) : (
          <EmptyState title="No character selected" description="Select a character to view armory details." />
        )}
      </div>
    </div>
  );
}
