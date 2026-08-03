import { createAddonFileConnections } from "./addonFileConnections";

const {
  saveConnectedHandles,
  loadConnectedHandles,
  mergeConnectedHandles,
  readConnectedFileMeta,
  saveConnectedFileMeta,
  buildConnectedFileEntries
} = createAddonFileConnections({
  dbName: "wowloot-nit-handles",
  storeName: "handles",
  handleKey: "nova-files",
  fileMetaStorageKey: "nit_connected_file_meta"
});

export {
  saveConnectedHandles,
  loadConnectedHandles,
  mergeConnectedHandles,
  readConnectedFileMeta,
  saveConnectedFileMeta,
  buildConnectedFileEntries
};
