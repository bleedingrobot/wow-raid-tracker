// Shared implementation behind bagnonFileConnections.js and novaFileConnections.js.
// Both addon-file-handle modules were near-identical except for their
// IndexedDB / localStorage key constants, so the logic lives here once and
// each caller configures its own storage namespace via createAddonFileConnections.

function openHandleDb(dbName, storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function hasSameEntry(handleA, handleB) {
  if (typeof handleA?.isSameEntry !== "function") {
    return false;
  }

  try {
    return await handleA.isSameEntry(handleB);
  } catch {
    return false;
  }
}

// Creates a namespaced set of connected-file-handle helpers.
// - dbName / storeName / handleKey: IndexedDB location for the persisted file handles.
// - fileMetaStorageKey: localStorage key for the per-handle metadata (fileName, accountName).
export function createAddonFileConnections({ dbName, storeName, handleKey, fileMetaStorageKey }) {
  function openDb() {
    return openHandleDb(dbName, storeName);
  }

  async function saveConnectedHandles(handles) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(handles, handleKey);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async function loadConnectedHandles() {
    const db = await openDb();
    const handles = await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).get(handleKey);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return handles;
  }

  async function mergeConnectedHandles(existingHandles, newHandles) {
    const merged = [...existingHandles];

    for (const nextHandle of newHandles) {
      let exists = false;

      for (const currentHandle of merged) {
        if (await hasSameEntry(currentHandle, nextHandle)) {
          exists = true;
          break;
        }
      }

      if (!exists) {
        merged.push(nextHandle);
      }
    }

    return merged;
  }

  function readConnectedFileMeta() {
    try {
      const raw = localStorage.getItem(fileMetaStorageKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveConnectedFileMeta(meta) {
    localStorage.setItem(fileMetaStorageKey, JSON.stringify(meta));
  }

  function buildConnectedFileEntries(handles, meta = [], selectedIndexes = []) {
    const selectedSet = new Set(selectedIndexes);
    const hasSelection = selectedSet.size > 0;

    return handles.map((handle, index) => ({
      id: `${handle?.name || "file"}-${index}`,
      name: handle?.name || "Unknown file",
      fileName: meta[index]?.fileName || handle?.name || "Unknown file",
      selected: hasSelection ? selectedSet.has(index) : true,
      accountName: meta[index]?.accountName || "",
      handle
    }));
  }

  return {
    saveConnectedHandles,
    loadConnectedHandles,
    mergeConnectedHandles,
    readConnectedFileMeta,
    saveConnectedFileMeta,
    buildConnectedFileEntries
  };
}
