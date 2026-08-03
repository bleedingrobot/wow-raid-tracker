import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RAIDS } from "../data/raids";
import {
  addAccount,
  addCharacter,
  replaceInventoryItems,
  updateCharacter,
  upsertRaidStatus
} from "../services/dataService";
import {
  parseNovaActiveInstances,
  parseNovaCharacters,
  parseNovaSavedInstances,
  parseNovaWorldBuffs
} from "../utils/novaInstanceParser";
import { parseDataStoreContainers } from "../utils/dataStoreContainersParser";
import { parseDataStoreInventory } from "../utils/dataStoreInventoryParser";
import { parseDataStoreCharacters } from "../utils/dataStoreCharactersParser";
import {
  characterProfileKey,
  detectDataStoreSourceType,
  parseDataStoreCharacterIndexMap,
  mergeCharacterProfiles,
  mergeInventoryProfiles
} from "../utils/dataStoreProfileHelpers";
import {
  formatImportWarnings,
  validateDataStoreSourceHealth,
  validateNovaSourceHealth
} from "../utils/importHealthChecks";
import {
  buildConnectedFileEntries,
  loadConnectedHandles,
  mergeConnectedHandles,
  readConnectedFileMeta,
  saveConnectedFileMeta,
  saveConnectedHandles
} from "../utils/novaFileConnections";
import {
  buildConnectedFileEntries as buildBagnonConnectedFileEntries,
  loadConnectedHandles as loadBagnonConnectedHandles,
  mergeConnectedHandles as mergeBagnonConnectedHandles,
  readConnectedFileMeta as readBagnonConnectedFileMeta,
  saveConnectedFileMeta as saveBagnonConnectedFileMeta,
  saveConnectedHandles as saveBagnonConnectedHandles
} from "../utils/bagnonFileConnections";

// ---------------------------------------------------------------------------
// Storage keys (shared by Dashboard + Settings; previously duplicated).
// ---------------------------------------------------------------------------
const NIT_PATHS_KEY = "nit_savedvariables_paths";
const NIT_SELECTED_FILE_INDEXES_KEY = "nit_selected_file_indexes";
const BAGNON_PATHS_KEY = "bagnon_savedvariables_paths";
const BAGNON_SELECTED_FILE_INDEXES_KEY = "bagnon_selected_file_indexes";
const NOVA_SYNC_ACCOUNT_FILTERS_KEY = "nit_sync_account_filters";
const INVENTORY_SYNC_ACCOUNT_FILTERS_KEY = "inventory_sync_account_filters";
const INVENTORY_SYNC_HISTORY_KEY = "inventory_sync_history_by_account";
const DASHBOARD_AUTOSYNC_KEY = "dashboard_auto_sync_settings";

export const NOVA_EXPECTED_FILES = ["NovaInstanceTracker.lua", "NovaWorldBuffs.lua"];
export const INVENTORY_EXPECTED_FILES = [
  "DataStore_Containers.lua",
  "DataStore_Inventory.lua",
  "DataStore_Characters.lua",
  "DataStore.lua"
];

// ---------------------------------------------------------------------------
// Small pure helpers shared by both sync pipelines.
// ---------------------------------------------------------------------------
function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeLoose(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// accountId scopes the key so that two different WoW accounts with a
// same-name/same-realm character (common for bank-alt farms) are never
// treated as one character, per docs/identity-contract.md's Account
// Scoping Rule and canonical key (accountLabel|realm|characterName).
function characterKey(name, realm, accountId) {
  return `${normalize(accountId)}|${normalize(name)}|${normalize(realm)}`;
}

function characterLooseKey(name, realm) {
  return `${normalizeLoose(name)}|${normalizeLoose(realm)}`;
}

function extractAccountFromPath(path) {
  const match = String(path || "").match(/[\\/]Account[\\/]([^\\/]+)[\\/]SavedVariables/i);
  return match?.[1] || "";
}

function getUniqueAccountHint(paths) {
  const accounts = Array.from(new Set((paths || []).map((path) => extractAccountFromPath(path)).filter(Boolean)));
  return accounts.length === 1 ? accounts[0] : "";
}

function getDefaultAccountLabel(accounts, userEmail) {
  if (Array.isArray(accounts) && accounts.length === 1) {
    return String(accounts[0]?.battleNetId || "").trim();
  }

  const emailLocalPart = String(userEmail || "").split("@")[0]?.trim();
  return emailLocalPart || "";
}

function readJsonArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readSelectedIndexes(key) {
  return readJsonArray(key).filter((value) => Number.isInteger(value) && value >= 0);
}

function saveSelectedIndexes(key, indexes) {
  localStorage.setItem(key, JSON.stringify(indexes));
}

function summarizeLinkedFiles(files, expectedFiles) {
  const linkedNames = files
    .map((file) => String(file.fileName || file.name || "").trim().toLowerCase())
    .filter(Boolean);

  const expectedStates = expectedFiles.map((expectedName) => {
    const lowerExpected = expectedName.toLowerCase();
    const linked = linkedNames.some((name) => name === lowerExpected || name.endsWith(`/${lowerExpected}`));
    return { fileName: expectedName, linked };
  });

  const linkedCount = expectedStates.filter((entry) => entry.linked).length;
  return {
    expectedStates,
    linkedCount,
    allLinked: linkedCount === expectedFiles.length
  };
}

function getMissingExpectedFilesFromSources(sources, expectedFiles) {
  const selectedNames = (sources || [])
    .map((source) => String(source?.fileName || "").trim().toLowerCase())
    .filter(Boolean);
  const selectedSet = new Set(selectedNames);
  return expectedFiles.filter((expectedName) => !selectedSet.has(String(expectedName || "").toLowerCase()));
}

function getMissingExpectedFilesByAccountFromSources(sources, expectedFiles) {
  const byAccount = new Map();

  (sources || []).forEach((source) => {
    const accountLabel = String(source?.accountHintName || "").trim() || "(unlabeled account)";
    if (!byAccount.has(accountLabel)) {
      byAccount.set(accountLabel, new Set());
    }
    byAccount.get(accountLabel).add(String(source?.fileName || "").trim().toLowerCase());
  });

  return [...byAccount.entries()]
    .map(([accountLabel, selectedNames]) => ({
      accountLabel,
      missing: expectedFiles.filter((expectedName) => !selectedNames.has(String(expectedName || "").toLowerCase()))
    }))
    .filter((entry) => entry.missing.length)
    .sort((a, b) => a.accountLabel.localeCompare(b.accountLabel));
}

function downloadJsonFile(fileName, payload) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function readInventorySyncHistory() {
  try {
    const raw = localStorage.getItem(INVENTORY_SYNC_HISTORY_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveInventorySyncHistory(historyByAccount) {
  localStorage.setItem(INVENTORY_SYNC_HISTORY_KEY, JSON.stringify(historyByAccount || {}));
}

function readAutoSyncSettings() {
  const defaults = { enabled: false, minutes: 5 };

  try {
    const raw = localStorage.getItem(DASHBOARD_AUTOSYNC_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return defaults;
    }

    const parsedMinutes = Number(parsed.minutes);
    const safeMinutes = Number.isFinite(parsedMinutes)
      ? Math.min(60, Math.max(1, Math.round(parsedMinutes)))
      : defaults.minutes;

    return {
      enabled: parsed.enabled === true,
      minutes: safeMinutes
    };
  } catch {
    return defaults;
  }
}

// ---------------------------------------------------------------------------
// Generic connected-file-set controller. Nova and Bagnon connections are
// identical in shape (only the underlying IndexedDB namespace differs), so
// this is instantiated twice inside useLuaSync instead of being copy-pasted.
// ---------------------------------------------------------------------------
function useAddonFileConnectionSet({ addonUtils, selectedIndexesKey, pathsKey, setMessage }) {
  const [connectedFiles, setConnectedFiles] = useState([]);
  const [paths, setPaths] = useState([]);
  const [pendingConnectHandles, setPendingConnectHandles] = useState([]);
  const [pendingAccountName, setPendingAccountName] = useState("");
  const [bulkAccountName, setBulkAccountName] = useState("");

  useEffect(() => {
    const savedRaw = localStorage.getItem(pathsKey);
    if (!savedRaw) {
      return;
    }

    try {
      const parsed = JSON.parse(savedRaw);
      if (Array.isArray(parsed)) {
        setPaths(parsed.filter(Boolean));
        return;
      }
    } catch {
      // Backward compatibility with old single-path storage.
    }

    if (savedRaw.trim()) {
      setPaths([savedRaw.trim()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePaths = useCallback((nextPaths) => {
    setPaths(nextPaths);
    localStorage.setItem(pathsKey, JSON.stringify(nextPaths));
  }, [pathsKey]);

  const hydrate = useCallback(() => {
    if (!window.indexedDB) {
      setConnectedFiles([]);
      return;
    }

    addonUtils.loadConnectedHandles()
      .then((handles) => {
        const selectedIndexes = readSelectedIndexes(selectedIndexesKey);
        const meta = addonUtils.readConnectedFileMeta();
        setConnectedFiles(addonUtils.buildConnectedFileEntries(handles, meta, selectedIndexes));
      })
      .catch(() => {
        setConnectedFiles([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const onConnectFiles = useCallback(async (accounts, userEmail) => {
    if (!window.showOpenFilePicker) {
      setMessage("Your browser does not support direct file connections. Use Update and pick files.");
      return;
    }

    try {
      const handles = await window.showOpenFilePicker({
        multiple: true,
        types: [{ description: "Lua files", accept: { "text/plain": [".lua"] } }]
      });

      if (!handles.length) {
        return;
      }

      const defaultAccountLabel = getDefaultAccountLabel(accounts, userEmail);
      setPendingConnectHandles(handles);
      setPendingAccountName(
        getUniqueAccountHint(paths)
        || getUniqueAccountHint(connectedFiles.map((item) => item.accountName))
        || defaultAccountLabel
      );
      setMessage("Select or type an account name for selected files, then confirm.");
    } catch {
      // User cancelled picker.
    }
  }, [connectedFiles, paths, setMessage]);

  const onCancelPendingConnect = useCallback(() => {
    setPendingConnectHandles([]);
    setPendingAccountName("");
  }, []);

  const onConfirmPendingConnect = useCallback(async (accounts, userEmail) => {
    if (!pendingConnectHandles.length) {
      return;
    }

    try {
      const defaultAccountLabel = getDefaultAccountLabel(accounts, userEmail);
      const accountHintName = pendingAccountName.trim() || defaultAccountLabel;
      const existingHandles = await addonUtils.loadConnectedHandles();
      const existingMeta = addonUtils.readConnectedFileMeta();

      const merged = await addonUtils.mergeConnectedHandles(existingHandles, pendingConnectHandles);
      const addedCount = merged.length - existingHandles.length;
      const nextMeta = [...existingMeta];
      for (let index = 0; index < addedCount; index += 1) {
        nextMeta.push({ accountName: accountHintName, fileName: pendingConnectHandles[index]?.name || "" });
      }

      await addonUtils.saveConnectedHandles(merged);
      addonUtils.saveConnectedFileMeta(nextMeta);
      setConnectedFiles(addonUtils.buildConnectedFileEntries(merged, nextMeta));
      saveSelectedIndexes(selectedIndexesKey, merged.map((_, index) => index));
      if (accountHintName) {
        savePaths([accountHintName]);
      }
      setMessage(`Added ${pendingConnectHandles.length} file selection(s). ${merged.length} file(s) now connected.`);
      setPendingConnectHandles([]);
      setPendingAccountName("");
    } catch {
      setMessage("Could not connect selected files. Try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingConnectHandles, pendingAccountName, savePaths, setMessage]);

  const onReconnectConnectedFile = useCallback(async (index) => {
    if (!window.showOpenFilePicker) {
      setMessage("Your browser does not support direct file connections. Use the connect button to pick files.");
      return;
    }

    try {
      const handles = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: "Lua files", accept: { "text/plain": [".lua"] } }]
      });

      if (!handles.length) {
        return;
      }

      const nextHandles = await addonUtils.loadConnectedHandles();
      nextHandles[index] = handles[0];
      const nextMeta = addonUtils.readConnectedFileMeta();
      nextMeta[index] = {
        accountName: connectedFiles[index]?.accountName || nextMeta[index]?.accountName || "",
        fileName: handles[0].name || ""
      };

      await addonUtils.saveConnectedHandles(nextHandles);
      addonUtils.saveConnectedFileMeta(nextMeta);
      setConnectedFiles(
        addonUtils.buildConnectedFileEntries(nextHandles, nextMeta, readSelectedIndexes(selectedIndexesKey))
      );
      setMessage(`Reconnected ${handles[0].name || "selected file"}.`);
    } catch {
      setMessage("Could not reconnect the file. Try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedFiles, setMessage]);

  const onToggleConnectedFile = useCallback((id, checked) => {
    setConnectedFiles((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, selected: checked } : item));
      const selectedIndexes = next
        .map((item, index) => (item.selected ? index : -1))
        .filter((value) => value >= 0);
      saveSelectedIndexes(selectedIndexesKey, selectedIndexes);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeConnectedFileAccountName = useCallback(async (id, accountName) => {
    const next = connectedFiles.map((item) => (item.id === id ? { ...item, accountName } : item));
    setConnectedFiles(next);

    try {
      await addonUtils.saveConnectedHandles(next.map((item) => item.handle));
      addonUtils.saveConnectedFileMeta(
        next.map((item) => ({
          accountName: String(item.accountName || "").trim(),
          fileName: item.fileName || item.name || ""
        }))
      );
    } catch {
      setMessage("Could not update account label for the connected file.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedFiles, setMessage]);

  const onApplyBulkAccountName = useCallback(async () => {
    const value = bulkAccountName.trim();
    if (!value) {
      setMessage("Type an account label to apply to selected files.");
      return;
    }

    const selectedCount = connectedFiles.filter((item) => item.selected).length;
    if (!selectedCount) {
      setMessage("Select at least one file to apply the bulk account label.");
      return;
    }

    const next = connectedFiles.map((item) => (item.selected ? { ...item, accountName: value } : item));
    setConnectedFiles(next);

    try {
      await addonUtils.saveConnectedHandles(next.map((item) => item.handle));
      addonUtils.saveConnectedFileMeta(
        next.map((item) => ({
          accountName: String(item.accountName || "").trim(),
          fileName: item.fileName || item.name || ""
        }))
      );
      setMessage(`Applied account label "${value}" to ${selectedCount} selected file(s).`);
    } catch {
      setMessage("Could not apply bulk account label to selected files.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkAccountName, connectedFiles, setMessage]);

  const onRemoveConnectedFile = useCallback(async (id) => {
    const next = connectedFiles.filter((item) => item.id !== id);
    setConnectedFiles(next);
    await addonUtils.saveConnectedHandles(next.map((item) => item.handle));
    addonUtils.saveConnectedFileMeta(
      next.map((item) => ({ accountName: item.accountName || "", fileName: item.fileName || item.name || "" }))
    );
    const selectedIndexes = next
      .map((item, index) => (item.selected ? index : -1))
      .filter((value) => value >= 0);
    saveSelectedIndexes(selectedIndexesKey, selectedIndexes);
    setMessage(`Connected file removed. ${next.length} remaining.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedFiles, setMessage]);

  const reset = useCallback(async () => {
    localStorage.removeItem(pathsKey);
    await addonUtils.saveConnectedHandles([]);
    setPaths([]);
    setConnectedFiles([]);
    saveSelectedIndexes(selectedIndexesKey, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    connectedFiles,
    paths,
    savePaths,
    hydrate,
    pendingConnectHandles,
    pendingAccountName,
    setPendingAccountName,
    onConnectFiles,
    onCancelPendingConnect,
    onConfirmPendingConnect,
    bulkAccountName,
    setBulkAccountName,
    onApplyBulkAccountName,
    onReconnectConnectedFile,
    onToggleConnectedFile,
    onChangeConnectedFileAccountName,
    onRemoveConnectedFile,
    reset
  };
}

const novaAddonUtils = {
  buildConnectedFileEntries,
  loadConnectedHandles,
  mergeConnectedHandles,
  readConnectedFileMeta,
  saveConnectedFileMeta,
  saveConnectedHandles
};

const bagnonAddonUtils = {
  buildConnectedFileEntries: buildBagnonConnectedFileEntries,
  loadConnectedHandles: loadBagnonConnectedHandles,
  mergeConnectedHandles: mergeBagnonConnectedHandles,
  readConnectedFileMeta: readBagnonConnectedFileMeta,
  saveConnectedFileMeta: saveBagnonConnectedFileMeta,
  saveConnectedHandles: saveBagnonConnectedHandles
};

// ---------------------------------------------------------------------------
// useLuaSync - single canonical implementation of the addon-export sync
// pipeline, shared by Dashboard.jsx and Settings.jsx. This replaces two
// ~250-line copies of syncFromLuaTexts/syncBagnonFromLuaTexts that had
// already drifted apart (e.g. only one of them set activeRaidTag on newly
// created characters).
// ---------------------------------------------------------------------------
export function useLuaSync({ user, data }) {
  const [syncMessage, setSyncMessage] = useState("");
  const [bagnonSyncMessage, setBagnonSyncMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBagnonSyncing, setIsBagnonSyncing] = useState(false);
  const [bagnonIntegrityReport, setBagnonIntegrityReport] = useState(null);
  const [inventorySyncHistoryByAccount, setInventorySyncHistoryByAccount] = useState({});
  const [syncStatus, setSyncStatus] = useState("idle");
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [activeRaidNames, setActiveRaidNames] = useState([]);
  const [selectedNovaSyncAccounts, setSelectedNovaSyncAccounts] = useState([]);
  const [selectedInventorySyncAccounts, setSelectedInventorySyncAccounts] = useState([]);
  const [requiredFilesCheckMessage, setRequiredFilesCheckMessage] = useState("");
  const [requiredFilesCheckRun, setRequiredFilesCheckRun] = useState(false);
  const [autoSyncSettings, setAutoSyncSettings] = useState(() => readAutoSyncSettings());
  const [autoSyncFailures, setAutoSyncFailures] = useState(0);
  const [autoSyncWarning, setAutoSyncWarning] = useState("");
  const [nextAutoSyncAt, setNextAutoSyncAt] = useState(null);
  const autoSyncInFlightRef = useRef(false);

  const nova = useAddonFileConnectionSet({
    addonUtils: novaAddonUtils,
    selectedIndexesKey: NIT_SELECTED_FILE_INDEXES_KEY,
    pathsKey: NIT_PATHS_KEY,
    setMessage: setSyncMessage
  });
  const bagnon = useAddonFileConnectionSet({
    addonUtils: bagnonAddonUtils,
    selectedIndexesKey: BAGNON_SELECTED_FILE_INDEXES_KEY,
    pathsKey: BAGNON_PATHS_KEY,
    setMessage: setBagnonSyncMessage
  });

  // Load persisted account-scoped sync filters + inventory sync history.
  useEffect(() => {
    const rawNovaFilters = readJsonArray(NOVA_SYNC_ACCOUNT_FILTERS_KEY);
    if (rawNovaFilters.length) {
      setSelectedNovaSyncAccounts(rawNovaFilters.filter((entry) => String(entry || "").trim()));
    }

    const rawInventoryFilters = readJsonArray(INVENTORY_SYNC_ACCOUNT_FILTERS_KEY);
    if (rawInventoryFilters.length) {
      setSelectedInventorySyncAccounts(rawInventoryFilters.filter((entry) => String(entry || "").trim()));
    }

    setInventorySyncHistoryByAccount(readInventorySyncHistory());
  }, []);

  useEffect(() => {
    localStorage.setItem(NOVA_SYNC_ACCOUNT_FILTERS_KEY, JSON.stringify(selectedNovaSyncAccounts));
  }, [selectedNovaSyncAccounts]);

  useEffect(() => {
    localStorage.setItem(INVENTORY_SYNC_ACCOUNT_FILTERS_KEY, JSON.stringify(selectedInventorySyncAccounts));
  }, [selectedInventorySyncAccounts]);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_AUTOSYNC_KEY, JSON.stringify(autoSyncSettings));
  }, [autoSyncSettings]);

  const novaAccountOptions = useMemo(
    () => Array.from(
      new Set(nova.connectedFiles.map((item) => String(item.accountName || "").trim() || "(unlabeled account)"))
    ).sort((a, b) => a.localeCompare(b)),
    [nova.connectedFiles]
  );

  const inventoryAccountOptions = useMemo(
    () => Array.from(
      new Set(bagnon.connectedFiles.map((item) => String(item.accountName || "").trim() || "(unlabeled account)"))
    ).sort((a, b) => a.localeCompare(b)),
    [bagnon.connectedFiles]
  );

  useEffect(() => {
    setSelectedNovaSyncAccounts((prev) => {
      const available = new Set(novaAccountOptions.map(normalize));
      return prev.filter((label) => available.has(normalize(label)));
    });
  }, [novaAccountOptions]);

  useEffect(() => {
    setSelectedInventorySyncAccounts((prev) => {
      const available = new Set(inventoryAccountOptions.map(normalize));
      return prev.filter((label) => available.has(normalize(label)));
    });
  }, [inventoryAccountOptions]);

  const novaLinkedSummary = useMemo(
    () => summarizeLinkedFiles(nova.connectedFiles, NOVA_EXPECTED_FILES),
    [nova.connectedFiles]
  );
  const inventoryLinkedSummary = useMemo(
    () => summarizeLinkedFiles(bagnon.connectedFiles, INVENTORY_EXPECTED_FILES),
    [bagnon.connectedFiles]
  );

  const validateRequiredFiles = useCallback(() => {
    const missingNova = novaLinkedSummary.expectedStates.filter((entry) => !entry.linked).map((entry) => entry.fileName);
    const missingInventory = inventoryLinkedSummary.expectedStates.filter((entry) => !entry.linked).map((entry) => entry.fileName);
    const missing = [...missingNova, ...missingInventory];

    setRequiredFilesCheckRun(true);
    if (!missing.length) {
      setRequiredFilesCheckMessage("All required files are linked. Settings are ready to sync.");
      return;
    }

    setRequiredFilesCheckMessage(`Missing required files: ${missing.join(", ")}.`);
  }, [novaLinkedSummary, inventoryLinkedSummary]);

  const onToggleNovaSyncAccount = useCallback((accountLabel, checked) => {
    setSelectedNovaSyncAccounts((prev) => {
      if (checked) {
        return prev.includes(accountLabel) ? prev : [...prev, accountLabel];
      }
      return prev.filter((value) => value !== accountLabel);
    });
  }, []);

  const onToggleInventorySyncAccount = useCallback((accountLabel, checked) => {
    setSelectedInventorySyncAccounts((prev) => {
      if (checked) {
        return prev.includes(accountLabel) ? prev : [...prev, accountLabel];
      }
      return prev.filter((value) => value !== accountLabel);
    });
  }, []);

  const onClearNovaSyncAccounts = useCallback(() => setSelectedNovaSyncAccounts([]), []);
  const onClearInventorySyncAccounts = useCallback(() => setSelectedInventorySyncAccounts([]), []);

  // -------------------------------------------------------------------------
  // Canonical Nova sync (raid lockouts, world buffs, character discovery).
  // -------------------------------------------------------------------------
  const syncFromLuaTexts = useCallback(async (luaTexts, { silent = false } = {}) => {
    if (!user) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus("syncing");
    if (!silent) {
      setSyncMessage("Sync in progress...");
    }

    try {
      const accountMap = new Map(data.accounts.map((account) => [normalize(account.battleNetId), account.id]));
      const parsedCharacters = [];
      const parsed = [];
      const activeRaids = [];
      const parsedWorldBuffStates = [];
      const sourceWarnings = [];

      for (const source of luaTexts) {
        const sourceAccount = (source.accountHintName || "").trim();
        let sourceAccountId = "";
        if (sourceAccount) {
          const normalized = normalize(sourceAccount);
          sourceAccountId = accountMap.get(normalized) || "";
          if (!sourceAccountId) {
            const created = await addAccount(user.uid, sourceAccount);
            sourceAccountId = created.id;
            accountMap.set(normalized, sourceAccountId);
          }
        }

        const parsedFromSource = parseNovaCharacters(source.text).map((entry) => ({
          ...entry,
          accountId: sourceAccountId
        }));
        parsedCharacters.push(...parsedFromSource);

        const worldBuffStates = parseNovaWorldBuffs(source.text).map((entry) => ({
          ...entry,
          accountId: sourceAccountId
        }));
        parsedWorldBuffStates.push(...worldBuffStates);
        parsedCharacters.push(...worldBuffStates.map((entry) => ({
          name: entry.name,
          realm: entry.realm,
          className: entry.className || "Unknown",
          faction: entry.faction || "Unknown",
          level: typeof entry.level === "number" ? entry.level : null,
          restedXp: null,
          accountId: sourceAccountId
        })));

        const savedEntries = parseNovaSavedInstances(source.text).map((entry) => ({
          ...entry,
          accountId: sourceAccountId
        }));
        const activeEntries = parseNovaActiveInstances(source.text).map((entry) => ({
          ...entry,
          accountId: sourceAccountId
        }));
        parsed.push(...savedEntries);
        activeRaids.push(...activeEntries);

        sourceWarnings.push(
          ...validateNovaSourceHealth({
            fileName: source.fileName || "",
            text: source.text,
            parsedCharactersCount: parsedFromSource.length,
            parsedSavedCount: savedEntries.length,
            parsedWorldBuffCount: worldBuffStates.length
          })
        );
      }

      // Falls back to the sole known account when a parsed/stored entity has no
      // explicit accountId, so single-account setups keep colliding onto one
      // key (unchanged behavior) while genuinely distinct accounts stay apart.
      const defaultAccountId = data.accounts.length === 1 ? data.accounts[0].id : "";
      const resolveKeyAccountId = (accountId) => accountId || defaultAccountId;

      const dedupedParsedCharacters = new Map();
      parsedCharacters.forEach((entry) => {
        const key = characterKey(entry.name, entry.realm, resolveKeyAccountId(entry.accountId));
        if (!dedupedParsedCharacters.has(key)) {
          dedupedParsedCharacters.set(key, entry);
        }
      });

      const charactersByKey = new Map(
        data.characters.map((character) => [
          characterKey(character.name, character.realm, resolveKeyAccountId(character.accountId)),
          character
        ])
      );
      const createdCharacters = [];

      for (const parsedCharacter of dedupedParsedCharacters.values()) {
        const key = characterKey(parsedCharacter.name, parsedCharacter.realm, resolveKeyAccountId(parsedCharacter.accountId));
        if (!charactersByKey.has(key)) {
          const payload = {
            name: parsedCharacter.name,
            class: parsedCharacter.className || "Unknown",
            faction: parsedCharacter.faction || "Unknown",
            realm: parsedCharacter.realm,
            accountId: parsedCharacter.accountId || defaultAccountId,
            level: typeof parsedCharacter.level === "number" ? parsedCharacter.level : null,
            restedXp: typeof parsedCharacter.restedXp === "number" ? parsedCharacter.restedXp : 0,
            avatarUrl: "",
            showOnDashboard: true,
            activeRaidTag: "",
            importedFromNova: true
          };
          const created = await addCharacter(user.uid, payload);
          const createdCharacter = { id: created.id, ...payload };
          charactersByKey.set(key, createdCharacter);
          createdCharacters.push(createdCharacter);
        } else {
          const existing = charactersByKey.get(key);
          if (existing) {
            const updates = {};
            if (!existing.accountId && (parsedCharacter.accountId || defaultAccountId)) {
              updates.accountId = parsedCharacter.accountId || defaultAccountId;
              existing.accountId = parsedCharacter.accountId || defaultAccountId;
            }
            if (typeof parsedCharacter.level === "number" && existing.level !== parsedCharacter.level) {
              updates.level = parsedCharacter.level;
              existing.level = parsedCharacter.level;
            }
            if (typeof parsedCharacter.restedXp === "number" && existing.restedXp !== parsedCharacter.restedXp) {
              updates.restedXp = parsedCharacter.restedXp;
              existing.restedXp = parsedCharacter.restedXp;
            }

            if (Object.keys(updates).length) {
              await updateCharacter(existing.id, updates);
            }
          }
        }
      }

      const allCharacters = [...data.characters, ...createdCharacters];
      const parsedByCharacter = new Map();

      parsed.forEach((entry) => {
        const key = characterKey(entry.characterName, entry.realm, resolveKeyAccountId(entry.accountId));
        if (!parsedByCharacter.has(key)) {
          parsedByCharacter.set(key, []);
        }
        parsedByCharacter.get(key).push(entry);
      });

      const raidStatusUpdates = [];

      allCharacters.forEach((character) => {
        const key = characterKey(character.name, character.realm, resolveKeyAccountId(character.accountId));
        if (!parsedByCharacter.has(key)) {
          return;
        }

        const entries = parsedByCharacter.get(key) || [];
        const lockedRaids = new Map(entries.map((item) => [item.raidName, item]));

        RAIDS.forEach((raid) => {
          const locked = lockedRaids.get(raid.name);
          raidStatusUpdates.push(
            upsertRaidStatus(user.uid, {
              characterId: character.id,
              raidName: raid.name,
              completed: Boolean(locked),
              lastRunDate: null,
              resetDate: locked ? locked.resetDate : null
            })
          );
        });
      });

      await Promise.all(raidStatusUpdates);

      const worldBuffStateByCharacter = new Map();
      parsedWorldBuffStates.forEach((entry) => {
        const key = characterKey(entry.name, entry.realm, resolveKeyAccountId(entry.accountId));
        const existing = worldBuffStateByCharacter.get(key);

        if (!existing) {
          worldBuffStateByCharacter.set(key, {
            buffs: new Set(entry.buffs || []),
            storedBuffs: new Set(entry.storedBuffs || []),
            chronoCount: entry.chronoCount || 0,
            onyCount: entry.onyCount || 0,
            nefCount: entry.nefCount || 0,
            rendCount: entry.rendCount || 0,
            zanCount: entry.zanCount || 0,
            dmfCount: entry.dmfCount || 0
          });
          return;
        }

        (entry.buffs || []).forEach((buff) => existing.buffs.add(buff));
        (entry.storedBuffs || []).forEach((buff) => existing.storedBuffs.add(buff));
        existing.chronoCount = Math.max(existing.chronoCount || 0, entry.chronoCount || 0);
        existing.onyCount = Math.max(existing.onyCount || 0, entry.onyCount || 0);
        existing.nefCount = Math.max(existing.nefCount || 0, entry.nefCount || 0);
        existing.rendCount = Math.max(existing.rendCount || 0, entry.rendCount || 0);
        existing.zanCount = Math.max(existing.zanCount || 0, entry.zanCount || 0);
        existing.dmfCount = Math.max(existing.dmfCount || 0, entry.dmfCount || 0);
      });

      const buffUpdateOps = [];
      allCharacters.forEach((character) => {
        const key = characterKey(character.name, character.realm, resolveKeyAccountId(character.accountId));
        const buffState = worldBuffStateByCharacter.get(key);
        if (!buffState) {
          return;
        }

        buffUpdateOps.push(
          updateCharacter(character.id, {
            buffs: [...buffState.buffs].sort((a, b) => a.localeCompare(b)),
            storedBuffs: [...buffState.storedBuffs].sort((a, b) => a.localeCompare(b)),
            chronoCount: buffState.chronoCount || 0,
            buffCounts: {
              ony: buffState.onyCount || 0,
              nef: buffState.nefCount || 0,
              rend: buffState.rendCount || 0,
              zan: buffState.zanCount || 0,
              dmf: buffState.dmfCount || 0
            },
            lastBuffSyncAt: new Date().toISOString()
          })
        );
      });

      if (buffUpdateOps.length) {
        await Promise.all(buffUpdateOps);
      }

      const stamp = new Date().toLocaleTimeString();
      const currentRaidNames = Array.from(new Set(activeRaids.map((entry) => entry.raidName)));
      setActiveRaidNames(currentRaidNames);
      setLastSyncAt(new Date());
      setSyncStatus("success");

      if (silent) {
        const warningSummary = formatImportWarnings(sourceWarnings);
        setSyncMessage(`Auto-sync complete at ${stamp}.${warningSummary ? ` Validation warnings: ${warningSummary}.` : ""}`);
      } else {
        const createdCharacterNames = createdCharacters.map((c) => c.name).sort();
        const createdText = createdCharacterNames.length ? `Added: ${createdCharacterNames.join(", ")}.` : "";

        const lockedCharacters = new Map();
        parsed.forEach((entry) => {
          if (!lockedCharacters.has(entry.characterName)) {
            lockedCharacters.set(entry.characterName, []);
          }
          lockedCharacters.get(entry.characterName).push(entry.raidName);
        });
        const lockedText = lockedCharacters.size
          ? ` Lockouts: ${Array.from(lockedCharacters.entries())
            .map(([name, raids]) => `${name} (${raids.join(", ")})`)
            .join("; ")}.`
          : "";

        const activeCharacters = Array.from(new Set(activeRaids.map((entry) => entry.playerName))).filter(Boolean);
        const raidActivityText = activeCharacters.length
          ? ` In raid: ${activeCharacters.join(", ")} (${currentRaidNames.join(", ")}).`
          : "";
        const warningSummary = formatImportWarnings(sourceWarnings);

        setSyncMessage(
          `Sync complete. Imported ${parsed.length} saved raid entries, ${parsedWorldBuffStates.length} buff snapshots, and added ${createdCharacters.length} new characters. ${createdText}${lockedText}${raidActivityText}${warningSummary ? ` Validation warnings: ${warningSummary}.` : ""}`.trim()
        );
      }
    } catch (error) {
      setSyncStatus("error");
      if (!silent) {
        setSyncMessage("Sync failed. Ensure you selected valid NovaInstanceTracker.lua / NovaWorldBuffs.lua files.");
      } else {
        // Keep a trace of unexpected background failures without spamming the UI.
        console.error("Nova auto-sync failed:", error);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [data.accounts, data.characters, user]);

  // -------------------------------------------------------------------------
  // Canonical DataStore/"Bagnon" sync (inventory + character profile data).
  // This is the more complete of the two old implementations: it resolves
  // characterIndex references via DataStore.lua, blocks on unresolved
  // mappings instead of silently dropping data, creates missing characters,
  // and records a per-account sync history + integrity report.
  // -------------------------------------------------------------------------
  const updateInventorySyncHistory = useCallback((entryUpdates) => {
    setInventorySyncHistoryByAccount((prev) => {
      const next = { ...prev };
      const labels = Array.isArray(entryUpdates.accountLabels) && entryUpdates.accountLabels.length
        ? entryUpdates.accountLabels
        : ["(unlabeled account)"];

      labels.forEach((label) => {
        const key = String(label || "").trim() || "(unlabeled account)";
        next[key] = {
          accountLabel: key,
          lastRunAt: new Date().toISOString(),
          status: entryUpdates.status || "failed",
          stage: entryUpdates.stage || "unknown",
          reason: entryUpdates.reason || "",
          unresolvedProfiles: entryUpdates.unresolvedProfiles || 0,
          unresolvedItems: entryUpdates.unresolvedItems || 0,
          totals: {
            itemStacks: entryUpdates.totals?.itemStacks || 0,
            totalItemQuantity: entryUpdates.totals?.totalItemQuantity || 0,
            uniqueItems: entryUpdates.totals?.uniqueItems || 0,
            ownersWithItems: entryUpdates.totals?.ownersWithItems || 0,
            snapshotCharacters: entryUpdates.totals?.snapshotCharacters || 0
          },
          warningsCount: Array.isArray(entryUpdates.warnings) ? entryUpdates.warnings.length : 0
        };
      });

      saveInventorySyncHistory(next);
      return next;
    });
  }, []);

  const syncBagnonFromLuaTexts = useCallback(async (sources, { silent = false } = {}) => {
    if (!user) {
      return;
    }

    setIsBagnonSyncing(true);
    if (!silent) {
      setBagnonSyncMessage("Sync in progress...");
    }
    setBagnonIntegrityReport(null);

    let syncStage = "initializing";
    const syncDiagnostics = {
      files: []
    };
    const integrityReport = {
      status: "in-progress",
      stage: syncStage,
      reason: "",
      totals: {
        itemStacks: 0,
        totalItemQuantity: 0,
        uniqueItems: 0,
        ownersWithItems: 0,
        snapshotCharacters: 0,
        equipmentProfiles: 0,
        characterProfiles: 0
      },
      files: syncDiagnostics.files,
      unresolvedProfiles: 0,
      unresolvedItems: 0,
      indexedAccountLabels: [],
      accountBreakdown: [],
      warnings: []
    };

    try {
      syncStage = "parsing-sources";
      const parsedItems = [];
      const parsedInventoryProfiles = [];
      const parsedCharacterProfiles = [];
      const characterIndexMapByAccount = new Map();
      const sourceWarnings = [];

      const getAccountKey = (value) => normalize(value) || "__default__";
      const getEntryAccountKey = (entry) => getAccountKey(entry?.accountHintName);
      const getCharacterMapForEntry = (entry) => characterIndexMapByAccount.get(getEntryAccountKey(entry)) || null;
      const indexKey = (entry) => {
        if (!Number.isInteger(entry?.characterIndex)) {
          return "";
        }
        return `${getEntryAccountKey(entry)}|${entry.characterIndex}`;
      };

      for (const source of sources) {
        const sourceType = detectDataStoreSourceType(source.fileName, source.text);
        let parsedFromSourceCount = 0;

        if (sourceType === "containers") {
          const items = parseDataStoreContainers(source.text, source.fileName || "", source.accountHintName || "");
          parsedItems.push(...items);
          parsedFromSourceCount = items.length;
        }
        if (sourceType === "inventory") {
          const profiles = parseDataStoreInventory(source.text, source.fileName || "", source.accountHintName || "");
          parsedInventoryProfiles.push(...profiles);
          parsedFromSourceCount = profiles.length;
        }
        if (sourceType === "characters") {
          const profiles = parseDataStoreCharacters(source.text, source.fileName || "", source.accountHintName || "");
          parsedCharacterProfiles.push(...profiles);
          parsedFromSourceCount = profiles.length;
        }
        if (sourceType === "core") {
          const accountKey = getAccountKey(source.accountHintName);
          if (!characterIndexMapByAccount.has(accountKey)) {
            characterIndexMapByAccount.set(accountKey, new Map());
          }
          const accountIndexMap = characterIndexMapByAccount.get(accountKey);
          const map = parseDataStoreCharacterIndexMap(source.text);
          map.forEach((value, index) => {
            if (!accountIndexMap.has(index)) {
              accountIndexMap.set(index, value);
            }
          });
          parsedFromSourceCount = map.size;
        }

        syncDiagnostics.files.push({ fileName: source.fileName || "", sourceType, parsedCount: parsedFromSourceCount });

        sourceWarnings.push(
          ...validateDataStoreSourceHealth({
            fileName: source.fileName || "",
            text: source.text,
            sourceType,
            parsedCount: parsedFromSourceCount
          })
        );
      }

      const characterByIndex = new Map();
      syncStage = "resolving-identities";
      const resolveProfile = (profile) => {
        const sourceCharacterMap = getCharacterMapForEntry(profile);
        const key = indexKey(profile);
        const mapped = Number.isInteger(profile.characterIndex)
          ? sourceCharacterMap?.get(profile.characterIndex) || null
          : null;
        const fallback = Number.isInteger(profile.characterIndex) ? characterByIndex.get(key) : null;
        const characterName = profile.characterName || mapped?.name || fallback?.characterName || "";
        const realm = profile.realm || mapped?.realm || fallback?.realm || "";
        const resolved = { ...profile, characterName, realm };

        if (key && characterName) {
          characterByIndex.set(key, { characterName, realm });
        }

        return resolved;
      };

      const resolvedCharacterProfiles = parsedCharacterProfiles.map(resolveProfile);
      const resolvedInventoryProfiles = parsedInventoryProfiles.map(resolveProfile);
      const resolvedItemsRaw = parsedItems.map(resolveProfile);
      const resolvedItems = resolvedItemsRaw.filter((item) => item.characterName && item.realm);

      const requiresCoreMap = parsedItems.concat(parsedInventoryProfiles, parsedCharacterProfiles)
        .some((entry) => Number.isInteger(entry.characterIndex));

      const indexedAccounts = new Set(
        parsedItems.concat(parsedInventoryProfiles, parsedCharacterProfiles)
          .filter((entry) => Number.isInteger(entry.characterIndex))
          .map((entry) => getEntryAccountKey(entry))
      );
      const missingCoreAccounts = [...indexedAccounts].filter(
        (accountKey) => !(characterIndexMapByAccount.get(accountKey)?.size)
      );
      integrityReport.indexedAccountLabels = Array.from(
        new Set(
          parsedItems.concat(parsedInventoryProfiles, parsedCharacterProfiles)
            .filter((entry) => Number.isInteger(entry.characterIndex))
            .map((entry) => String(entry.accountHintName || "").trim() || "(unlabeled account)")
        )
      ).sort((a, b) => a.localeCompare(b));

      const unresolvedProfileRecords = [...resolvedInventoryProfiles, ...resolvedCharacterProfiles]
        .filter((profile) => !profile.characterName || !profile.realm);
      const unresolvedItemRecords = resolvedItemsRaw.filter((item) => !item.characterName || !item.realm);
      integrityReport.unresolvedProfiles = unresolvedProfileRecords.length;
      integrityReport.unresolvedItems = unresolvedItemRecords.length;

      if (requiresCoreMap && missingCoreAccounts.length) {
        const missingAccountLabels = Array.from(
          new Set(
            parsedItems.concat(parsedInventoryProfiles, parsedCharacterProfiles)
              .filter((entry) => Number.isInteger(entry.characterIndex) && missingCoreAccounts.includes(getEntryAccountKey(entry)))
              .map((entry) => String(entry.accountHintName || "").trim() || "(unlabeled account)")
          )
        );
        integrityReport.status = "failed";
        integrityReport.stage = syncStage;
        integrityReport.reason = `Missing DataStore.lua for account(s): ${missingAccountLabels.join(", ")}`;
        integrityReport.warnings = [...sourceWarnings];
        setBagnonIntegrityReport(integrityReport);
        updateInventorySyncHistory({ accountLabels: missingAccountLabels, ...integrityReport });
        throw new Error(
          `Sync blocked: DataStore.lua is required for deterministic character mapping for account(s): ${missingAccountLabels.join(", ")}. Connect DataStore.lua from the same SavedVariables folder for each listed account and sync again.`
        );
      }

      const unresolvedProfilesCount = integrityReport.unresolvedProfiles;
      if (unresolvedProfilesCount > 0) {
        integrityReport.status = "failed";
        integrityReport.stage = syncStage;
        integrityReport.reason = `${unresolvedProfilesCount} profile record(s) could not be mapped to character+realm.`;
        integrityReport.warnings = [...sourceWarnings];
        setBagnonIntegrityReport(integrityReport);
        updateInventorySyncHistory({ accountLabels: integrityReport.indexedAccountLabels, ...integrityReport });
        throw new Error(
          `Sync blocked: ${unresolvedProfilesCount} profile record(s) could not be mapped to character+realm. Ensure DataStore.lua, DataStore_Characters.lua, and DataStore_Inventory.lua come from the same account snapshot.`
        );
      }

      syncStage = "merging-profiles";
      const mergedInventoryProfiles = mergeInventoryProfiles(
        resolvedInventoryProfiles.filter((profile) => profile.characterName && profile.realm)
      );
      const mergedCharacterProfiles = mergeCharacterProfiles(
        resolvedCharacterProfiles.filter((profile) => profile.characterName && profile.realm)
      );

      const accountByNormalizedName = new Map(data.accounts.map((account) => [normalize(account.battleNetId), account]));
      const resolveAccountId = async (accountHintName) => {
        const normalized = normalize(accountHintName);
        if (!normalized) {
          return "";
        }

        const existing = accountByNormalizedName.get(normalized);
        if (existing?.id) {
          return existing.id;
        }

        const created = await addAccount(user.uid, accountHintName.trim());
        const createdAccount = { id: created.id, battleNetId: accountHintName.trim() };
        accountByNormalizedName.set(normalized, createdAccount);
        return created.id;
      };

      syncStage = "resolving-accounts";
      for (const profile of mergedCharacterProfiles) {
        if (!profile.accountId && profile.accountHintName) {
          profile.accountId = await resolveAccountId(profile.accountHintName);
        }
      }
      for (const profile of mergedInventoryProfiles) {
        if (!profile.accountId && profile.accountHintName) {
          profile.accountId = await resolveAccountId(profile.accountHintName);
        }
      }

      // Same single-account fallback as the Nova sync path: keeps single-account
      // setups keying identically to before, while genuinely distinct accounts
      // (bank-alt farms with a same-name/realm character on each) stay apart.
      const defaultAccountId = data.accounts.length === 1 ? data.accounts[0].id : "";
      const resolveKeyAccountId = (accountId) => accountId || defaultAccountId;

      const charactersByKey = new Map(
        data.characters.map((character) => [
          characterProfileKey(character.name, character.realm, resolveKeyAccountId(character.accountId)),
          character
        ])
      );
      const createOrGetCharacter = async (profile) => {
        const key = characterProfileKey(profile.characterName, profile.realm, resolveKeyAccountId(profile.accountId));
        const existing = charactersByKey.get(key);
        if (existing) {
          return existing;
        }

        const payload = {
          name: profile.characterName,
          class: profile.className || "Unknown",
          faction: profile.faction || "Unknown",
          realm: profile.realm,
          accountId: profile.accountId || "",
          level: typeof profile.level === "number" ? profile.level : null,
          restedXp: typeof profile.restXp === "number" ? profile.restXp : 0,
          avatarUrl: "",
          showOnDashboard: true,
          activeRaidTag: "",
          importedFromDataStore: true
        };

        const created = await addCharacter(user.uid, payload);
        const createdCharacter = { id: created.id, ...payload };
        charactersByKey.set(key, createdCharacter);
        return createdCharacter;
      };

      syncStage = "ensuring-characters";
      for (const profile of mergedCharacterProfiles) {
        await createOrGetCharacter(profile);
      }
      for (const profile of mergedInventoryProfiles) {
        await createOrGetCharacter(profile);
      }

      const profileOps = [];

      mergedInventoryProfiles.forEach((profile) => {
        const character = charactersByKey.get(
          characterProfileKey(profile.characterName, profile.realm, resolveKeyAccountId(profile.accountId))
        );
        if (!character) {
          return;
        }

        profileOps.push(
          updateCharacter(character.id, {
            averageItemLevel: typeof profile.averageItemLevel === "number" ? profile.averageItemLevel : null,
            overallItemLevel: typeof profile.overallItemLevel === "number" ? profile.overallItemLevel : null,
            equippedItems: Array.isArray(profile.equippedItems) ? profile.equippedItems : [],
            lastInventoryUpdate: profile.lastInventoryUpdate || null,
            lastInventorySyncAt: new Date().toISOString()
          })
        );
      });

      mergedCharacterProfiles.forEach((profile) => {
        const character = charactersByKey.get(
          characterProfileKey(profile.characterName, profile.realm, resolveKeyAccountId(profile.accountId))
        );
        if (!character) {
          return;
        }

        profileOps.push(updateCharacter(character.id, {
          zone: profile.zone || "",
          subZone: profile.subZone || "",
          bindLocation: profile.bindLocation || "",
          guildName: profile.guildName || "",
          guildRankName: profile.guildRankName || "",
          guildRankIndex: typeof profile.guildRankIndex === "number" ? profile.guildRankIndex : null,
          money: typeof profile.money === "number" ? profile.money : null,
          isResting: typeof profile.isResting === "boolean" ? profile.isResting : null,
          played: typeof profile.played === "number" ? profile.played : null,
          playedThisLevel: typeof profile.playedThisLevel === "number" ? profile.playedThisLevel : null,
          xp: typeof profile.xp === "number" ? profile.xp : null,
          xpMax: typeof profile.xpMax === "number" ? profile.xpMax : null,
          restXp: typeof profile.restXp === "number" ? profile.restXp : null,
          lastCharacterUpdate: profile.lastCharacterUpdate || null,
          lastLogoutTimestamp: profile.lastLogoutTimestamp || null,
          lastCharacterSyncAt: new Date().toISOString()
        }));
      });

      if (profileOps.length) {
        syncStage = "writing-profiles";
        await Promise.all(profileOps);
      }

      syncStage = "finalizing";
      const uniqueItems = new Set(resolvedItems.map((item) => `${item.itemId || ""}|${normalize(item.itemName)}`));
      const totalItemQuantity = resolvedItems.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
      const ownersWithItems = new Set(
        resolvedItems.map((item) => `${normalize(item.characterName)}|${normalize(item.realm)}`)
      ).size;

      const importedCharacterMap = new Map();
      resolvedItems.forEach((item) => {
        if (!item.characterName || !item.realm) {
          return;
        }
        const key = characterLooseKey(item.characterName, item.realm);
        if (!importedCharacterMap.has(key)) {
          importedCharacterMap.set(key, `${item.characterName} (${item.realm})`);
        }
      });
      mergedCharacterProfiles.forEach((profile) => {
        if (!profile.characterName || !profile.realm) {
          return;
        }
        const key = characterLooseKey(profile.characterName, profile.realm);
        if (!importedCharacterMap.has(key)) {
          importedCharacterMap.set(key, `${profile.characterName} (${profile.realm})`);
        }
      });

      const importedCharacterLabels = [...importedCharacterMap.values()].sort((a, b) => a.localeCompare(b));
      const snapshotCharacterCount = importedCharacterLabels.length;
      const missingKnownCharacters = data.characters
        .filter((character) => !importedCharacterMap.has(characterLooseKey(character.name, character.realm)))
        .map((character) => `${character.name} (${character.realm})`)
        .sort((a, b) => a.localeCompare(b));
      const importedPreview = importedCharacterLabels.slice(0, 12).join(", ");
      const missingPreview = missingKnownCharacters.slice(0, 12).join(", ");

      const accountBreakdownMap = new Map();
      const ensureAccountStats = (accountLabel) => {
        if (!accountBreakdownMap.has(accountLabel)) {
          accountBreakdownMap.set(accountLabel, { owners: new Set(), snapshotCharacters: new Set() });
        }
        return accountBreakdownMap.get(accountLabel);
      };
      const resolveAccountLabel = (value) => String(value || "").trim() || "(unlabeled account)";

      resolvedItems.forEach((item) => {
        const stats = ensureAccountStats(resolveAccountLabel(item.accountHintName));
        stats.owners.add(characterLooseKey(item.characterName, item.realm));
        stats.snapshotCharacters.add(characterLooseKey(item.characterName, item.realm));
      });
      mergedCharacterProfiles.forEach((profile) => {
        const stats = ensureAccountStats(resolveAccountLabel(profile.accountHintName));
        stats.snapshotCharacters.add(characterLooseKey(profile.characterName, profile.realm));
      });

      const accountBreakdown = [...accountBreakdownMap.entries()]
        .map(([accountName, stats]) => ({
          accountName,
          ownersWithItems: stats.owners.size,
          snapshotCharacters: stats.snapshotCharacters.size
        }))
        .sort((a, b) => a.accountName.localeCompare(b.accountName));
      const accountBreakdownText = accountBreakdown
        .map((entry) => `${entry.accountName}: ${entry.ownersWithItems} owners / ${entry.snapshotCharacters} snapshot`)
        .join(" | ");

      syncStage = "writing-inventory-items";
      await replaceInventoryItems(user.uid, resolvedItems, {
        ownersWithItems,
        snapshotCharacterCount,
        equipmentProfileCount: mergedInventoryProfiles.length,
        characterProfileCount: mergedCharacterProfiles.length,
        uniqueItemCount: uniqueItems.size,
        totalItemQuantity,
        accountBreakdown
      });

      integrityReport.status = "passed";
      integrityReport.stage = syncStage;
      integrityReport.reason = "All deterministic mapping checks passed.";
      integrityReport.totals = {
        itemStacks: resolvedItems.length,
        totalItemQuantity,
        uniqueItems: uniqueItems.size,
        ownersWithItems,
        snapshotCharacters: snapshotCharacterCount,
        equipmentProfiles: mergedInventoryProfiles.length,
        characterProfiles: mergedCharacterProfiles.length
      };
      integrityReport.accountBreakdown = accountBreakdown;
      integrityReport.warnings = [...sourceWarnings];
      setBagnonIntegrityReport(integrityReport);
      updateInventorySyncHistory({
        accountLabels: accountBreakdown.map((entry) => entry.accountName),
        ...integrityReport
      });

      const warningSummary = formatImportWarnings(sourceWarnings);
      if (!silent) {
        setBagnonSyncMessage(
          `Sync complete. Imported ${resolvedItems.length} item stacks (${totalItemQuantity} total item count) across ${uniqueItems.size} unique item(s). Owners with items: ${ownersWithItems}. Snapshot characters: ${snapshotCharacterCount}. Equipment profile(s): ${mergedInventoryProfiles.length}. Character profile snapshot(s): ${mergedCharacterProfiles.length}.${accountBreakdownText ? ` Per-account: ${accountBreakdownText}.` : ""} Snapshot characters (${importedCharacterLabels.length}): ${importedPreview}${importedCharacterLabels.length > 12 ? ", ..." : ""}.${missingKnownCharacters.length ? ` Nova characters not present in this inventory snapshot (${missingKnownCharacters.length}): ${missingPreview}${missingKnownCharacters.length > 12 ? ", ..." : ""}.` : ""}${warningSummary ? ` Validation warnings: ${warningSummary}.` : ""}`
        );
      }
    } catch (error) {
      if (integrityReport.status === "in-progress") {
        integrityReport.status = "failed";
        integrityReport.stage = syncStage;
        integrityReport.reason = error?.message || "Sync failed.";
        setBagnonIntegrityReport(integrityReport);
        updateInventorySyncHistory({ accountLabels: integrityReport.indexedAccountLabels, ...integrityReport });
      }
      if (!silent) {
        setBagnonSyncMessage(error?.message || "Sync failed.");
      } else {
        console.error("Inventory auto-sync failed:", error);
      }
    } finally {
      setIsBagnonSyncing(false);
    }
  }, [user, data.accounts, data.characters, updateInventorySyncHistory]);

  // -------------------------------------------------------------------------
  // Loading sources from connected (File System Access API) file handles.
  // -------------------------------------------------------------------------
  const loadSelectedSources = useCallback(async (kind, allowedAccountLabels = []) => {
    const addonUtils = kind === "nova" ? novaAddonUtils : bagnonAddonUtils;
    const selectedIndexesKey = kind === "nova" ? NIT_SELECTED_FILE_INDEXES_KEY : BAGNON_SELECTED_FILE_INDEXES_KEY;

    const handles = await addonUtils.loadConnectedHandles();
    const selectedIndexes = readSelectedIndexes(selectedIndexesKey);
    const meta = addonUtils.readConnectedFileMeta();
    const entries = selectedIndexes.length
      ? selectedIndexes.map((index) => ({ handle: handles[index], sourceIndex: index })).filter((entry) => entry.handle)
      : handles.map((handle, sourceIndex) => ({ handle, sourceIndex }));
    const allowedAccounts = new Set((allowedAccountLabels || []).map(normalize));

    const sources = [];
    for (const entry of entries) {
      const accountHintName = String(meta[entry.sourceIndex]?.accountName || "").trim();
      const accountLabel = accountHintName || "(unlabeled account)";
      if (allowedAccounts.size && !allowedAccounts.has(normalize(accountLabel))) {
        continue;
      }

      let permission = "granted";
      if (entry.handle.queryPermission) {
        permission = await entry.handle.queryPermission({ mode: "read" });
      }
      if (permission !== "granted") {
        permission = await entry.handle.requestPermission({ mode: "read" });
      }
      if (permission !== "granted") {
        throw new Error(`${kind}-permission-denied`);
      }

      const file = await entry.handle.getFile();
      sources.push({ text: await file.text(), fileName: file.name, accountHintName });
    }

    return sources;
  }, []);

  // -------------------------------------------------------------------------
  // Canonical "sync everything from connected files" orchestration. Used by
  // both the manual Settings button and Dashboard's auto-sync timer.
  // -------------------------------------------------------------------------
  const syncFromConnectedFiles = useCallback(async ({ silent = false } = {}) => {
    if (!user) {
      return { ok: false, reason: "no-user" };
    }

    if (!window.indexedDB) {
      setSyncStatus("warn");
      if (!silent) {
        setSyncMessage("Browser does not support connected file sync. Use manual file picker sync.");
      }
      return { ok: false, reason: "no-indexeddb" };
    }

    let novaSources = [];
    try {
      novaSources = await loadSelectedSources("nova", selectedNovaSyncAccounts);
    } catch {
      setSyncStatus("warn");
      if (!silent) {
        setSyncMessage("Reconnect Nova files in Settings to restore file access.");
      }
      return { ok: false, reason: "nova-permission" };
    }

    let bagnonSources = [];
    try {
      bagnonSources = await loadSelectedSources("bagnon", selectedInventorySyncAccounts);
    } catch {
      setSyncStatus("warn");
      if (!silent) {
        setBagnonSyncMessage("Reconnect Bagnon/DataStore files in Settings to restore file access.");
      }
      return { ok: false, reason: "bagnon-permission" };
    }

    if (!novaSources.length && !bagnonSources.length) {
      setSyncStatus("warn");
      if (!silent) {
        setSyncMessage("No connected files matched your selected sync-account filters.");
      }
      return { ok: false, reason: "no-sources" };
    }

    if (bagnonSources.length) {
      const missingOverall = getMissingExpectedFilesFromSources(bagnonSources, INVENTORY_EXPECTED_FILES);
      const missingByAccount = getMissingExpectedFilesByAccountFromSources(bagnonSources, INVENTORY_EXPECTED_FILES);
      if (missingOverall.length || missingByAccount.length) {
        const reason = missingByAccount.length
          ? `Missing required inventory file(s) by account: ${missingByAccount.map((entry) => `${entry.accountLabel}: ${entry.missing.join(", ")}`).join(" | ")}`
          : `Missing required inventory file(s): ${missingOverall.join(", ")}`;

        setBagnonIntegrityReport({
          status: "failed",
          stage: "pre-parse-validation",
          reason,
          totals: {
            itemStacks: 0, totalItemQuantity: 0, uniqueItems: 0, ownersWithItems: 0,
            snapshotCharacters: 0, equipmentProfiles: 0, characterProfiles: 0
          },
          files: bagnonSources.map((source) => ({
            fileName: source.fileName || "",
            sourceType: detectDataStoreSourceType(source.fileName || "", source.text || ""),
            parsedCount: 0
          })),
          unresolvedProfiles: 0,
          unresolvedItems: 0,
          indexedAccountLabels: Array.from(new Set(bagnonSources.map((source) => source.accountHintName || "(unlabeled account)"))),
          accountBreakdown: [],
          warnings: []
        });
        updateInventorySyncHistory({
          accountLabels: missingByAccount.length
            ? missingByAccount.map((entry) => entry.accountLabel)
            : Array.from(new Set(bagnonSources.map((source) => String(source.accountHintName || "").trim() || "(unlabeled account)"))),
          status: "failed",
          stage: "pre-parse-validation",
          reason
        });
        setSyncStatus("warn");
        if (!silent) {
          setBagnonSyncMessage(`Sync blocked before parse. ${reason}. If a file is connected but unchecked, tick it under Connected Files.`);
        }
        return { ok: false, reason: "missing-required-files" };
      }
    }

    try {
      if (novaSources.length) {
        await syncFromLuaTexts(novaSources, { silent });
      }
      if (bagnonSources.length) {
        await syncBagnonFromLuaTexts(bagnonSources, { silent });
      }

      setSyncStatus("success");
      setLastSyncAt(new Date());
      setAutoSyncFailures(0);
      setAutoSyncWarning("");
      return { ok: true, novaCount: novaSources.length, bagnonCount: bagnonSources.length };
    } catch (error) {
      setSyncStatus("error");
      if (!silent) {
        setSyncMessage("Could not read selected connected files. Reconnect files in Settings.");
      } else {
        console.error("Connected-file auto-sync failed:", error);
      }
      return { ok: false, reason: "sync-error" };
    }
  }, [user, selectedNovaSyncAccounts, selectedInventorySyncAccounts, loadSelectedSources, syncFromLuaTexts, syncBagnonFromLuaTexts, updateInventorySyncHistory]);

  // -------------------------------------------------------------------------
  // Auto-sync scheduling (Dashboard only). Fix: the interval callback is
  // read through a ref that is refreshed every render, so the setInterval
  // effect only depends on stable primitives and is never torn down/rebuilt
  // by unrelated Firestore snapshot updates (which previously reset the
  // "next auto-sync" countdown on almost every cycle).
  // -------------------------------------------------------------------------
  const syncFromConnectedFilesRef = useRef(syncFromConnectedFiles);
  useEffect(() => {
    syncFromConnectedFilesRef.current = syncFromConnectedFiles;
  });

  const hasUser = Boolean(user);
  useEffect(() => {
    if (!autoSyncSettings.enabled || !hasUser) {
      setNextAutoSyncAt(null);
      if (!autoSyncSettings.enabled) {
        setAutoSyncFailures(0);
        setAutoSyncWarning("");
      }
      return undefined;
    }

    const minutes = Math.min(60, Math.max(1, Number(autoSyncSettings.minutes) || 5));
    const intervalMs = minutes * 60 * 1000;
    setNextAutoSyncAt(new Date(Date.now() + intervalMs));

    const timerId = window.setInterval(async () => {
      if (autoSyncInFlightRef.current) {
        return;
      }

      autoSyncInFlightRef.current = true;
      try {
        const result = await syncFromConnectedFilesRef.current({ silent: true });
        if (!result?.ok) {
          setAutoSyncFailures((prev) => {
            const next = prev + 1;
            setAutoSyncWarning(
              `Auto-sync retry warning: ${next} failed attempt${next === 1 ? "" : "s"}. Check connected file permissions in Settings if this continues.`
            );
            return next;
          });
        } else {
          setAutoSyncFailures(0);
          setAutoSyncWarning("");
        }
      } finally {
        autoSyncInFlightRef.current = false;
        setNextAutoSyncAt(new Date(Date.now() + intervalMs));
      }
    }, intervalMs);

    return () => {
      window.clearInterval(timerId);
      autoSyncInFlightRef.current = false;
    };
  }, [autoSyncSettings.enabled, autoSyncSettings.minutes, hasUser]);

  // -------------------------------------------------------------------------
  // Misc shared actions (delete-all-data cleanup, integrity report export).
  // -------------------------------------------------------------------------
  const resetAllSyncState = useCallback(async () => {
    localStorage.removeItem(NOVA_SYNC_ACCOUNT_FILTERS_KEY);
    localStorage.removeItem(INVENTORY_SYNC_ACCOUNT_FILTERS_KEY);
    localStorage.removeItem(INVENTORY_SYNC_HISTORY_KEY);
    await Promise.all([nova.reset(), bagnon.reset()]);
    setSelectedNovaSyncAccounts([]);
    setSelectedInventorySyncAccounts([]);
    setInventorySyncHistoryByAccount({});
    setBagnonIntegrityReport(null);
    setSyncMessage("");
    setBagnonSyncMessage("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDownloadBagnonIntegrityReport = useCallback(() => {
    if (!bagnonIntegrityReport) {
      return;
    }

    downloadJsonFile("inventory-integrity-report.json", {
      generatedAt: new Date().toISOString(),
      selectedInventorySyncAccounts,
      report: bagnonIntegrityReport
    });
  }, [bagnonIntegrityReport, selectedInventorySyncAccounts]);

  return {
    // Nova (raid/buff) sync state + connected-file management.
    syncMessage,
    setSyncMessage,
    isSyncing,
    nova,
    novaAccountOptions,
    novaLinkedSummary,
    selectedNovaSyncAccounts,
    onToggleNovaSyncAccount,
    onClearNovaSyncAccounts,

    // Bagnon/DataStore (inventory) sync state + connected-file management.
    bagnonSyncMessage,
    setBagnonSyncMessage,
    isBagnonSyncing,
    bagnonIntegrityReport,
    inventorySyncHistoryByAccount,
    bagnon,
    inventoryAccountOptions,
    inventoryLinkedSummary,
    selectedInventorySyncAccounts,
    onToggleInventorySyncAccount,
    onClearInventorySyncAccounts,
    onDownloadBagnonIntegrityReport,

    // Setup / required-files check.
    validateRequiredFiles,
    requiredFilesCheckMessage,
    requiredFilesCheckRun,

    // Raw sync entry points (rarely needed directly - prefer syncFromConnectedFiles).
    syncFromLuaTexts,
    syncBagnonFromLuaTexts,

    // Canonical "sync now" orchestration + status.
    syncFromConnectedFiles,
    syncStatus,
    lastSyncAt,
    activeRaidNames,

    // Auto-sync (Dashboard).
    autoSyncSettings,
    setAutoSyncSettings,
    autoSyncFailures,
    autoSyncWarning,
    nextAutoSyncAt,

    // Cleanup helper for "delete all data".
    resetAllSyncState
  };
}
