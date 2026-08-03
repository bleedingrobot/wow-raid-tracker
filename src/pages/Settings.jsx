import { useState } from "react";
import { Download, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useUserCollections } from "../hooks/useUserCollections";
import { useLuaSync, INVENTORY_EXPECTED_FILES, NOVA_EXPECTED_FILES } from "../hooks/useLuaSync";
import { clearInventoryData, deleteAllUserData, COLLECTIONS } from "../services/dataService";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Field";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function AddonFileList({ files, onToggle, onRename, onReconnect, onRemove, disabled }) {
  if (!files.length) {
    return <p className="text-sm text-ink-faint">No connected files yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {files.map((item, index) => (
        <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
          <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={item.selected}
              onChange={(event) => onToggle(item.id, event.target.checked)}
            />
            <span className="truncate">
              {item.name}
              {item.accountName ? ` (${item.accountName})` : ""}
            </span>
          </label>
          <Input
            className="w-48"
            value={item.accountName || ""}
            onChange={(event) => onRename(item.id, event.target.value)}
            placeholder="Account label"
          />
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="secondary" disabled={disabled} onClick={() => onReconnect(index)}>
              Reconnect
            </Button>
            <Button size="sm" variant="danger" disabled={disabled} onClick={() => onRemove(item.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ExpectedFilesChecklist({ title, expectedStates }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">{title}</p>
      <ul className="space-y-1.5">
        {expectedStates.map((entry) => (
          <li key={entry.fileName} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink-soft">{entry.fileName}</span>
            <Badge tone={entry.linked ? "good" : "bad"}>{entry.linked ? "Linked" : "Missing"}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SettingsPage() {
  const { user, hasFirebaseConfig, signInWithGoogle, signOutUser } = useAuth();
  const { data } = useUserCollections(user?.uid);
  const luaSync = useLuaSync({ user, data });

  const [isClearingInventory, setIsClearingInventory] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [dangerMessage, setDangerMessage] = useState("");

  if (!hasFirebaseConfig) {
    return (
      <div>
        <PageHeader title="Settings" />
        <EmptyState title="Firebase not configured" description="Firebase env vars are missing. Copy .env.example into .env.local." />
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Manage file connections, sync, and account controls." />
        <EmptyState
          title="Sign in required"
          description="Sign in with Google to sync your characters and loot across devices."
          action={<Button variant="primary" onClick={signInWithGoogle}>Sign In with Google</Button>}
        />
      </div>
    );
  }

  const totalExpected = NOVA_EXPECTED_FILES.length + INVENTORY_EXPECTED_FILES.length;
  const totalLinked = luaSync.novaLinkedSummary.linkedCount + luaSync.inventoryLinkedSummary.linkedCount;
  const isBusy = luaSync.isSyncing || luaSync.isBagnonSyncing;

  const onClearBagnonInventory = async () => {
    if (!window.confirm("Clear synced inventory data for your account? You can re-sync at any time.")) {
      return;
    }

    setIsClearingInventory(true);
    try {
      await clearInventoryData(user.uid);
      luaSync.setBagnonSyncMessage("Inventory data cleared.");
    } catch {
      luaSync.setBagnonSyncMessage("Could not clear inventory data. Try again.");
    } finally {
      setIsClearingInventory(false);
    }
  };

  const onDeleteAllData = async () => {
    if (!user || isDeletingAll) {
      return;
    }

    const confirmed = window.confirm(
      "Delete ALL your app data (accounts, characters, loot, and raid lockouts)? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    setIsDeletingAll(true);
    setDangerMessage("Deleting all data...");
    try {
      await deleteAllUserData(user.uid, {
        excludeCollections: [COLLECTIONS.shoppingProfiles, COLLECTIONS.buffProfiles]
      });
      await clearInventoryData(user.uid);
      await luaSync.resetAllSyncState();
      setDangerMessage("All data deleted.");
    } catch {
      setDangerMessage("Delete failed. Please try again.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage file connections, sync, and account controls."
        actions={<Button variant="secondary" onClick={signOutUser}>Sign Out</Button>}
      />

      <p className="mb-6 text-sm text-ink-soft">
        Signed in as <span className="font-medium text-ink">{user.email}</span>
      </p>

      <Card className="mb-6">
        <CardHeader
          title="Setup"
          subtitle={`Linked: ${totalLinked}/${totalExpected} required files.`}
          actions={<Button size="sm" variant="secondary" onClick={luaSync.validateRequiredFiles}>Check required files</Button>}
        />
        <CardBody>
          {luaSync.requiredFilesCheckMessage ? (
            <p className={`mb-4 text-sm ${luaSync.requiredFilesCheckRun ? "text-ink" : "text-ink-soft"}`}>
              {luaSync.requiredFilesCheckMessage}
            </p>
          ) : null}
          <details>
            <summary className="cursor-pointer text-sm font-medium text-brand-600">What to connect (expand guide)</summary>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <ExpectedFilesChecklist title="Nova: raids + buffs" expectedStates={luaSync.novaLinkedSummary.expectedStates} />
              <ExpectedFilesChecklist title="DataStore: inventory + gear" expectedStates={luaSync.inventoryLinkedSummary.expectedStates} />
            </div>
          </details>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="Nova Sync"
          subtitle="Raid lockouts, world buffs, and character discovery."
          actions={
            <>
              <Button size="sm" variant="secondary" onClick={() => luaSync.nova.onConnectFiles(data.accounts, user.email)} disabled={isBusy}>
                <Plus className="h-3.5 w-3.5" />
                Connect Nova Files
              </Button>
              <Button size="sm" variant="primary" onClick={() => luaSync.syncFromConnectedFiles()} disabled={isBusy}>
                <RefreshCw className={`h-3.5 w-3.5 ${luaSync.isSyncing ? "animate-spin" : ""}`} />
                {luaSync.isSyncing ? "Syncing..." : "Sync Connected Files"}
              </Button>
            </>
          }
        />
        <CardBody className="space-y-4">
          {!luaSync.novaLinkedSummary.allLinked ? (
            <p className="text-sm text-warn">Missing required Nova file links.</p>
          ) : null}

          <div>
            <p className="mb-1 text-sm font-semibold text-ink">Sync Accounts (Optional Filter)</p>
            <p className="mb-2 text-xs text-ink-faint">If none are checked, all selected Nova files are synced.</p>
            {luaSync.novaAccountOptions.length ? (
              <div className="flex flex-wrap items-center gap-3">
                {luaSync.novaAccountOptions.map((accountLabel) => (
                  <label key={accountLabel} className="flex items-center gap-1.5 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={luaSync.selectedNovaSyncAccounts.includes(accountLabel)}
                      onChange={(event) => luaSync.onToggleNovaSyncAccount(accountLabel, event.target.checked)}
                    />
                    {accountLabel}
                  </label>
                ))}
                <Button size="sm" variant="ghost" onClick={luaSync.onClearNovaSyncAccounts}>Clear Filter</Button>
              </div>
            ) : (
              <p className="text-sm text-ink-faint">No Nova account labels available yet.</p>
            )}
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-ink">Connected Nova Files</p>
            <p className="mb-2 text-xs text-ink-faint">Each connected file can have its own account label.</p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Input
                className="w-64"
                value={luaSync.nova.bulkAccountName}
                onChange={(event) => luaSync.nova.setBulkAccountName(event.target.value)}
                placeholder="Bulk account label for selected files"
              />
              <Button size="sm" variant="secondary" onClick={luaSync.nova.onApplyBulkAccountName}>Apply To Selected</Button>
            </div>
            <AddonFileList
              files={luaSync.nova.connectedFiles}
              onToggle={luaSync.nova.onToggleConnectedFile}
              onRename={luaSync.nova.onChangeConnectedFileAccountName}
              onReconnect={luaSync.nova.onReconnectConnectedFile}
              onRemove={luaSync.nova.onRemoveConnectedFile}
              disabled={isBusy}
            />
          </div>

          {luaSync.syncMessage ? <p className="text-sm text-ink-soft">{luaSync.syncMessage}</p> : null}

          {luaSync.nova.pendingConnectHandles.length ? (
            <Card className="bg-surface-muted">
              <CardBody className="space-y-3">
                <p className="text-sm font-medium text-ink">Set Account For New Files</p>
                <p className="text-xs text-ink-faint">{luaSync.nova.pendingConnectHandles.length} selected file(s) awaiting confirmation.</p>
                <Input
                  list="account-options"
                  value={luaSync.nova.pendingAccountName}
                  onChange={(event) => luaSync.nova.setPendingAccountName(event.target.value)}
                  placeholder="Type or select account"
                />
                <datalist id="account-options">
                  {data.accounts.map((account) => (
                    <option key={account.id} value={account.battleNetId} />
                  ))}
                </datalist>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => luaSync.nova.onConfirmPendingConnect(data.accounts, user.email)}>
                    Confirm Connection
                  </Button>
                  <Button size="sm" variant="secondary" onClick={luaSync.nova.onCancelPendingConnect}>Cancel</Button>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="Inventory Sync"
          subtitle="Bags, bank, and equipped gear via DataStore addon exports."
          actions={
            <>
              <Button size="sm" variant="secondary" onClick={() => luaSync.bagnon.onConnectFiles(data.accounts, user.email)} disabled={isBusy}>
                <Plus className="h-3.5 w-3.5" />
                Connect Inventory Files
              </Button>
              <Button size="sm" variant="primary" onClick={() => luaSync.syncFromConnectedFiles()} disabled={isBusy}>
                <RefreshCw className={`h-3.5 w-3.5 ${luaSync.isBagnonSyncing ? "animate-spin" : ""}`} />
                {luaSync.isBagnonSyncing ? "Syncing..." : "Sync Connected Files"}
              </Button>
              <Button size="sm" variant="danger" onClick={onClearBagnonInventory} disabled={isClearingInventory || isBusy}>
                {isClearingInventory ? "Clearing..." : "Clear Inventory Data"}
              </Button>
            </>
          }
        />
        <CardBody className="space-y-4">
          {!luaSync.inventoryLinkedSummary.allLinked ? (
            <p className="text-sm text-warn">Missing required inventory file links.</p>
          ) : null}

          <div>
            <p className="mb-1 text-sm font-semibold text-ink">Sync Accounts (Optional Filter)</p>
            <p className="mb-2 text-xs text-ink-faint">If none are checked, all selected inventory files are synced.</p>
            {luaSync.inventoryAccountOptions.length ? (
              <div className="flex flex-wrap items-center gap-3">
                {luaSync.inventoryAccountOptions.map((accountLabel) => (
                  <label key={accountLabel} className="flex items-center gap-1.5 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={luaSync.selectedInventorySyncAccounts.includes(accountLabel)}
                      onChange={(event) => luaSync.onToggleInventorySyncAccount(accountLabel, event.target.checked)}
                    />
                    {accountLabel}
                  </label>
                ))}
                <Button size="sm" variant="ghost" onClick={luaSync.onClearInventorySyncAccounts}>Clear Filter</Button>
              </div>
            ) : (
              <p className="text-sm text-ink-faint">No inventory account labels available yet.</p>
            )}
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-ink">Connected Inventory Files</p>
            <p className="mb-2 text-xs text-ink-faint">Each connected file can have its own account label.</p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Input
                className="w-64"
                value={luaSync.bagnon.bulkAccountName}
                onChange={(event) => luaSync.bagnon.setBulkAccountName(event.target.value)}
                placeholder="Bulk account label for selected files"
              />
              <Button size="sm" variant="secondary" onClick={luaSync.bagnon.onApplyBulkAccountName}>Apply To Selected</Button>
            </div>
            <AddonFileList
              files={luaSync.bagnon.connectedFiles}
              onToggle={luaSync.bagnon.onToggleConnectedFile}
              onRename={luaSync.bagnon.onChangeConnectedFileAccountName}
              onReconnect={luaSync.bagnon.onReconnectConnectedFile}
              onRemove={luaSync.bagnon.onRemoveConnectedFile}
              disabled={isBusy}
            />
          </div>

          {luaSync.bagnonSyncMessage ? <p className="text-sm text-ink-soft">{luaSync.bagnonSyncMessage}</p> : null}

          {Object.keys(luaSync.inventorySyncHistoryByAccount || {}).length ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Per-Account Sync History</p>
              <ul className="space-y-2">
                {Object.values(luaSync.inventorySyncHistoryByAccount)
                  .sort((a, b) => String(a.accountLabel || "").localeCompare(String(b.accountLabel || "")))
                  .map((entry) => (
                    <li key={entry.accountLabel} className="rounded-lg border border-border p-3 text-xs text-ink-soft">
                      <p className="text-sm font-medium text-ink">
                        {entry.accountLabel}: {entry.status} at {entry.stage}
                      </p>
                      <p>Last run: {entry.lastRunAt || "unknown"}{entry.reason ? ` · Reason: ${entry.reason}` : ""}</p>
                      <p>
                        Totals: stacks {entry.totals?.itemStacks || 0}, count {entry.totals?.totalItemQuantity || 0}, unique {entry.totals?.uniqueItems || 0}.
                        Unresolved: profiles {entry.unresolvedProfiles || 0}, items {entry.unresolvedItems || 0}. Warnings: {entry.warningsCount || 0}.
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}

          {luaSync.bagnonIntegrityReport ? (
            <div className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Inventory Integrity Report</p>
                <Button size="sm" variant="ghost" onClick={luaSync.onDownloadBagnonIntegrityReport}>
                  <Download className="h-3.5 w-3.5" />
                  Download JSON
                </Button>
              </div>
              <p className="text-xs text-ink-soft">
                Status: {luaSync.bagnonIntegrityReport.status} · Stage: {luaSync.bagnonIntegrityReport.stage}
              </p>
              {luaSync.bagnonIntegrityReport.reason ? (
                <p className="text-xs text-ink-soft">Reason: {luaSync.bagnonIntegrityReport.reason}</p>
              ) : null}
              <p className="text-xs text-ink-soft">
                Totals: stacks {luaSync.bagnonIntegrityReport.totals?.itemStacks || 0}, item count {luaSync.bagnonIntegrityReport.totals?.totalItemQuantity || 0},
                unique items {luaSync.bagnonIntegrityReport.totals?.uniqueItems || 0}, owners with items {luaSync.bagnonIntegrityReport.totals?.ownersWithItems || 0},
                snapshot characters {luaSync.bagnonIntegrityReport.totals?.snapshotCharacters || 0}.
              </p>
              <p className="text-xs text-ink-soft">
                Unresolved: profiles {luaSync.bagnonIntegrityReport.unresolvedProfiles || 0}, items {luaSync.bagnonIntegrityReport.unresolvedItems || 0}.
              </p>
              {luaSync.bagnonIntegrityReport.accountBreakdown?.length ? (
                <p className="text-xs text-ink-soft">
                  Per-account: {luaSync.bagnonIntegrityReport.accountBreakdown
                    .map((entry) => `${entry.accountName}: ${entry.ownersWithItems} owners / ${entry.snapshotCharacters} snapshot`)
                    .join(" | ")}.
                </p>
              ) : null}
            </div>
          ) : null}

          {luaSync.bagnon.pendingConnectHandles.length ? (
            <Card className="bg-surface-muted">
              <CardBody className="space-y-3">
                <p className="text-sm font-medium text-ink">Set Account For New Files</p>
                <p className="text-xs text-ink-faint">{luaSync.bagnon.pendingConnectHandles.length} selected file(s) awaiting confirmation.</p>
                <Input
                  list="account-options-bagnon"
                  value={luaSync.bagnon.pendingAccountName}
                  onChange={(event) => luaSync.bagnon.setPendingAccountName(event.target.value)}
                  placeholder="Type or select account"
                />
                <datalist id="account-options-bagnon">
                  {data.accounts.map((account) => (
                    <option key={account.id} value={account.battleNetId} />
                  ))}
                </datalist>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => luaSync.bagnon.onConfirmPendingConnect(data.accounts, user.email)}>
                    Confirm Connection
                  </Button>
                  <Button size="sm" variant="secondary" onClick={luaSync.bagnon.onCancelPendingConnect}>Cancel</Button>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </CardBody>
      </Card>

      <Card className="border-bad/30">
        <CardHeader title="Danger Zone" subtitle="Permanently remove all synced data for this account." />
        <CardBody className="space-y-3">
          {dangerMessage ? <p className="text-sm text-ink-soft">{dangerMessage}</p> : null}
          <Button variant="dangerSolid" onClick={onDeleteAllData} disabled={isDeletingAll}>
            <X className="h-4 w-4" />
            {isDeletingAll ? "Deleting..." : "Delete All Data"}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
