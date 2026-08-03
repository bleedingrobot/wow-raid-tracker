import { createAddonFileConnections } from "./addonFileConnections";

const {
  saveConnectedHandles,
  loadConnectedHandles,
  mergeConnectedHandles,
  readConnectedFileMeta,
  saveConnectedFileMeta,
  buildConnectedFileEntries
} = createAddonFileConnections({
  dbName: "wowloot-bagnon-handles",
  storeName: "handles",
  handleKey: "bagnon-files",
  fileMetaStorageKey: "bagnon_connected_file_meta"
});

export {
  saveConnectedHandles,
  loadConnectedHandles,
  mergeConnectedHandles,
  readConnectedFileMeta,
  saveConnectedFileMeta,
  buildConnectedFileEntries
};
