import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { COLLECTIONS, deleteAllUserData, subscribeAllCollection } from "../services/dataService";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import DuplicateCharacterReview from "../components/DuplicateCharacterReview";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function AdminPage() {
  const { user, isAdmin, hasFirebaseConfig } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [lootItems, setLootItems] = useState([]);
  const [raidStatuses, setRaidStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    const unsubscribers = [];
    unsubscribers.push(subscribeAllCollection(COLLECTIONS.accounts, (docs) => setAccounts(docs)));
    unsubscribers.push(subscribeAllCollection(COLLECTIONS.characters, (docs) => setCharacters(docs)));
    unsubscribers.push(subscribeAllCollection(COLLECTIONS.lootItems, (docs) => setLootItems(docs)));
    unsubscribers.push(
      subscribeAllCollection(COLLECTIONS.raidStatuses, (docs) => {
        setRaidStatuses(docs);
        setLoading(false);
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [isAdmin]);

  const users = useMemo(() => {
    const map = new Map();
    const addCount = (uid, key, increment = 1) => {
      if (!uid) return;
      if (!map.has(uid)) {
        map.set(uid, { uid, accounts: 0, characters: 0, lootItems: 0, raidStatuses: 0, accountHints: new Set() });
      }
      map.get(uid)[key] += increment;
    };

    accounts.forEach((item) => {
      addCount(item.userId, "accounts");
      if (item.userId && item.battleNetId) {
        map.get(item.userId)?.accountHints.add(item.battleNetId);
      }
    });
    characters.forEach((item) => addCount(item.userId, "characters"));
    lootItems.forEach((item) => addCount(item.userId, "lootItems"));
    raidStatuses.forEach((item) => addCount(item.userId, "raidStatuses"));

    return [...map.values()]
      .map((item) => ({
        ...item,
        accountHints: [...item.accountHints],
        totalDocs: item.accounts + item.characters + item.lootItems + item.raidStatuses
      }))
      .sort((a, b) => b.totalDocs - a.totalDocs || a.uid.localeCompare(b.uid));
  }, [accounts, characters, lootItems, raidStatuses]);

  useEffect(() => {
    if (!users.length) {
      setSelectedUserId("");
      return;
    }
    if (!selectedUserId || !users.some((entry) => entry.uid === selectedUserId)) {
      setSelectedUserId(users[0].uid);
    }
  }, [users, selectedUserId]);

  const selectedCharacters = useMemo(
    () => characters.filter((item) => item.userId === selectedUserId),
    [characters, selectedUserId]
  );
  const selectedAccounts = useMemo(
    () => accounts.filter((item) => item.userId === selectedUserId),
    [accounts, selectedUserId]
  );
  const selectedLoot = useMemo(
    () => lootItems.filter((item) => item.userId === selectedUserId),
    [lootItems, selectedUserId]
  );
  const selectedLootVisible = selectedLoot.slice(0, 100);
  const selectedRaidStatuses = useMemo(
    () => raidStatuses.filter((item) => item.userId === selectedUserId),
    [raidStatuses, selectedUserId]
  );

  const onDeleteUserData = async () => {
    if (!selectedUserId || isDeleting) return;
    const confirmed = window.confirm(`Delete ALL stored data for user ${selectedUserId}? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAllUserData(selectedUserId);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hasFirebaseConfig) {
    return (
      <div>
        <PageHeader title="Admin" />
        <EmptyState
          title="Firebase not configured"
          description="Add Firebase keys in your .env to enable Admin tools."
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="Admin" />
        <EmptyState title="Sign in required" description="Sign in to use admin tools." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Admin" />
        <EmptyState title="Access denied" description="You do not have admin access." />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Admin" />
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Admin" subtitle="Cross-user data management console." />

      <Card className="overflow-hidden">
        <CardHeader title="Users" subtitle={`${users.length} user(s) with stored data.`} />
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                <th className="px-4 py-3 font-medium text-ink-soft">User ID</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Account Hints</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Accounts</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Characters</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Loot Items</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Raid Statuses</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Total</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((entry) => (
                  <tr
                    key={entry.uid}
                    onClick={() => setSelectedUserId(entry.uid)}
                    className={`cursor-pointer border-b border-border last:border-0 hover:bg-surface-muted/60 ${
                      selectedUserId === entry.uid ? "bg-brand-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-ink">{entry.uid}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {entry.accountHints.length ? entry.accountHints.join(", ") : "-"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{entry.accounts}</td>
                    <td className="px-4 py-3 text-ink-soft">{entry.characters}</td>
                    <td className="px-4 py-3 text-ink-soft">{entry.lootItems}</td>
                    <td className="px-4 py-3 text-ink-soft">{entry.raidStatuses}</td>
                    <td className="px-4 py-3 font-medium text-ink">{entry.totalDocs}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">
                    No user data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedUserId ? (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              Viewing data for <span className="font-medium text-ink">{selectedUserId}</span>
            </p>
            <Button variant="dangerSolid" onClick={onDeleteUserData} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete All User Data"}
            </Button>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader title="Accounts" subtitle={`${selectedAccounts.length} account(s)`} />
              <CardBody>
                {selectedAccounts.length ? (
                  <ul className="divide-y divide-border text-sm">
                    {selectedAccounts.map((account) => (
                      <li key={account.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="text-ink">{account.battleNetId || "Unnamed account"}</span>
                        <span className="text-xs text-ink-faint">{formatDate(account.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-soft">No accounts.</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Characters" subtitle={`${selectedCharacters.length} character(s)`} />
              <CardBody>
                {selectedCharacters.length ? (
                  <ul className="divide-y divide-border text-sm">
                    {selectedCharacters.map((character) => (
                      <li key={character.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="min-w-0 truncate text-ink">{character.name || "Unnamed"}</span>
                        <span className="shrink-0 text-xs text-ink-faint">
                          {character.realm || "-"} · Lvl {character.level || "?"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-soft">No characters.</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Loot Items" subtitle={`${selectedLoot.length} item(s)`} />
              <CardBody>
                {selectedLootVisible.length ? (
                  <ul className="divide-y divide-border text-sm">
                    {selectedLootVisible.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="min-w-0 truncate text-ink">{item.itemName || "Unnamed item"}</span>
                        <Badge tone={item.obtained ? "good" : "neutral"}>
                          {item.obtained ? "Obtained" : item.priority || "-"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-soft">No loot items.</p>
                )}
                {selectedLoot.length > 100 ? (
                  <p className="mt-2 text-xs text-ink-faint">Showing first 100 items.</p>
                ) : null}
              </CardBody>
            </Card>
          </div>

          <DuplicateCharacterReview
            characters={selectedCharacters}
            raidStatuses={selectedRaidStatuses}
            lootItems={selectedLoot}
            accounts={selectedAccounts}
          />
        </>
      ) : null}

      <Card className="mt-6">
        <CardHeader title="Admin Limits" />
        <CardBody>
          <p className="text-sm text-ink-soft">
            This console reads and deletes Firestore documents only. Managing Firebase Auth users (disabling,
            deleting, or resetting sign-in) requires the Firebase Admin SDK running on a trusted backend and is not
            available from this client-side app.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
