import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useUserCollections } from "../hooks/useUserCollections";
import { clearInventoryData, replaceInventoryItems } from "../services/dataService";
import { useInventory } from "../hooks/useInventory";
import { parseDataStoreContainers, summarizeInventoryItems } from "../utils/dataStoreContainersParser";
import { INVENTORY_UPDATED_EVENT, loadInventoryMeta } from "../utils/inventoryLocalStore";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Field";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function characterKey(name, realm) {
  return `${normalize(name)}|${normalize(realm)}`;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const { data } = useUserCollections(user?.uid);
  const inventoryItems = useInventory(user?.uid);
  const fileInputRef = useRef(null);
  const [syncMeta, setSyncMeta] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const refreshInventory = useCallback(() => {
    loadInventoryMeta().then(setSyncMeta).catch(() => setSyncMeta(null));
  }, []);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  useEffect(() => {
    window.addEventListener(INVENTORY_UPDATED_EVENT, refreshInventory);
    return () => window.removeEventListener(INVENTORY_UPDATED_EVENT, refreshInventory);
  }, [refreshInventory]);

  const searchResults = useMemo(() => {
    const query = normalize(searchTerm);
    const grouped = summarizeInventoryItems(inventoryItems, data.characters, data.accounts);

    if (!query) {
      return grouped.slice(0, 12);
    }

    return grouped.filter((group) => {
      const aliasMatch = (group.aliases || []).some((alias) => normalize(alias).includes(query));
      return normalize(group.itemName).includes(query) || aliasMatch || String(group.itemId || "") === query;
    });
  }, [data.accounts, data.characters, inventoryItems, searchTerm]);

  const totalOwners = useMemo(() => {
    const keys = new Set(inventoryItems.map((item) => characterKey(item.characterName, item.realm)));
    return keys.size;
  }, [inventoryItems]);

  const ownersWithItems = typeof syncMeta?.ownersWithItems === "number"
    ? syncMeta.ownersWithItems
    : totalOwners;
  const snapshotCharacters = typeof syncMeta?.snapshotCharacterCount === "number"
    ? syncMeta.snapshotCharacterCount
    : ownersWithItems;
  const accountBreakdown = useMemo(() => {
    if (Array.isArray(syncMeta?.accountBreakdown) && syncMeta.accountBreakdown.length) {
      return syncMeta.accountBreakdown
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => ({
          accountName: String(entry.accountName || "").trim() || "(unlabeled account)",
          ownersWithItems: Number(entry.ownersWithItems) || 0,
          snapshotCharacters: Number(entry.snapshotCharacters) || 0
        }))
        .sort((a, b) => a.accountName.localeCompare(b.accountName));
    }

    const fallback = new Map();
    inventoryItems.forEach((item) => {
      const accountName = String(item.accountHintName || "").trim() || "(unlabeled account)";
      if (!fallback.has(accountName)) {
        fallback.set(accountName, new Set());
      }
      fallback.get(accountName).add(characterKey(item.characterName, item.realm));
    });

    return [...fallback.entries()]
      .map(([accountName, owners]) => ({
        accountName,
        ownersWithItems: owners.size,
        snapshotCharacters: owners.size
      }))
      .sort((a, b) => a.accountName.localeCompare(b.accountName));
  }, [inventoryItems, syncMeta]);

  const totalStacks = inventoryItems.length;

  if (!user) {
    return (
      <div>
        <PageHeader title="Inventory" />
        <EmptyState title="Sign in required" description="Sign in to upload container files and search inventory." />
      </div>
    );
  }

  const onClearInventory = async () => {
    if (!window.confirm("Clear synced inventory data for your account? Sync again to reload from file.")) {
      return;
    }

    setIsClearing(true);
    try {
      await clearInventoryData(user.uid);
      setSyncMeta(null);
      setImportMessage("Inventory cleared.");
    } finally {
      setIsClearing(false);
    }
  };

  const onPickFiles = () => {
    fileInputRef.current?.click();
  };

  const onFilesSelected = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    setIsImporting(true);
    setImportMessage("Reading container files...");

    try {
      const parsedItems = [];

      for (const file of files) {
        const text = await file.text();
        const items = parseDataStoreContainers(text, file.name);
        parsedItems.push(...items);
      }

      const importedCharacters = new Set(parsedItems.map((item) => characterKey(item.characterName, item.realm)));
      const visibleItems = new Set(parsedItems.map((item) => `${item.itemId}|${normalize(item.itemName)}`));

      await replaceInventoryItems(user.uid, parsedItems, {
        ownersWithItems: importedCharacters.size,
        snapshotCharacterCount: importedCharacters.size,
        uniqueItemCount: visibleItems.size,
        totalItemQuantity: parsedItems.reduce((sum, item) => sum + (Number(item.count) || 0), 0)
      });

      setImportMessage(
        `Imported ${files.length} file(s), ${importedCharacters.size} character(s), and ${visibleItems.size} unique item(s).`
      );
    } catch {
      setImportMessage("Import failed. Make sure you selected DataStore_Containers.lua files.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Upload addon container exports and search who's carrying an item." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-fit">
          <CardHeader
            title="Container Inventory"
            subtitle="Upload DataStore_Containers.lua files to index bags and bank items."
          />
          <CardBody className="space-y-4">
            <p className="text-sm text-ink-soft">
              Select every character/account save you want searchable together. The current import replaces the
              previous inventory index.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={onPickFiles} disabled={isImporting}>
                <Upload className="h-4 w-4" />
                {isImporting ? "Importing..." : "Upload Container Files"}
              </Button>
              <Button variant="danger" onClick={onClearInventory} disabled={isClearing || isImporting}>
                <Trash2 className="h-4 w-4" />
                {isClearing ? "Clearing..." : "Clear Inventory"}
              </Button>
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept=".lua"
                multiple
                onChange={onFilesSelected}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-surface-muted p-3 text-center">
                <p className="text-lg font-semibold text-ink">{snapshotCharacters}</p>
                <p className="text-xs text-ink-faint">Snapshot characters</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-muted p-3 text-center">
                <p className="text-lg font-semibold text-ink">{ownersWithItems}</p>
                <p className="text-xs text-ink-faint">Owners with items</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-muted p-3 text-center">
                <p className="text-lg font-semibold text-ink">{totalStacks}</p>
                <p className="text-xs text-ink-faint">Item stacks loaded</p>
              </div>
            </div>

            {syncMeta ? (
              <p className="text-xs text-ink-faint">
                Last synced: {new Date(syncMeta.syncedAt).toLocaleString()} &mdash; {syncMeta.count} stacks written
              </p>
            ) : null}
            {accountBreakdown.length ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-ink-soft">Per-account breakdown</p>
                <ul className="space-y-1 text-xs text-ink-faint">
                  {accountBreakdown.map((entry) => (
                    <li key={entry.accountName}>
                      {entry.accountName}: {entry.ownersWithItems} owners / {entry.snapshotCharacters} snapshot
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {importMessage ? <p className="text-sm text-ink-soft">{importMessage}</p> : null}
          </CardBody>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Item Search" subtitle="Search any item name or ID to see who has it in bags or bank." />
          <CardBody className="space-y-4">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search for an item, like Mageblood Potion or 13444"
            />

            {searchResults.length ? (
              <div className="space-y-3">
                {searchResults.map((group) => (
                  <section key={`${group.itemId}-${group.itemName}`} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-ink">{group.itemName}</h3>
                        <p className="text-xs text-ink-faint">Item ID {group.itemId}</p>
                      </div>
                      <Badge tone="good">{group.owners.length} owner(s)</Badge>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {group.owners.map((owner) => (
                        <div
                          key={`${owner.characterName}|${owner.realm}`}
                          className="rounded-lg border border-border bg-surface-muted p-2.5 text-sm"
                        >
                          <p className="font-medium text-ink">{owner.characterName}</p>
                          <p className="text-xs text-ink-soft">
                            {owner.realm || "Unknown realm"}
                            {owner.accountName ? ` · ${owner.accountName}` : ""}
                          </p>
                          <p className="text-xs text-ink-soft">
                            Bags {owner.bags} · Bank {owner.bank} · Total {owner.total}
                          </p>
                          {owner.fileNames.length ? (
                            <p className="mt-1 truncate text-xs text-ink-faint">
                              Source: {owner.fileNames.join(", ")}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No items found"
                description={
                  searchTerm.trim()
                    ? "No imported inventory matches that item."
                    : "Upload inventory files, then search for an item to see who has it."
                }
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
