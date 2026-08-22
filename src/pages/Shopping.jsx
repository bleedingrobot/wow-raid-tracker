import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserCollections } from "../hooks/useUserCollections";
import { useInventory } from "../hooks/useInventory";
import {
  addShoppingProfile,
  deleteShoppingProfile,
  updateShoppingProfile
} from "../services/dataService";
import { computeShoppingNeeds } from "../utils/shoppingList";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { FormRow, Input, Select } from "../components/ui/Field";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";

const WOW_CLASSES = [
  "Druid", "Hunter", "Mage", "Paladin", "Priest",
  "Rogue", "Shaman", "Warlock", "Warrior"
];

const EMPTY_PROFILE = {
  name: "",
  className: "Warrior",
  items: []
};

function BuyListSummary({ characters, accountNameById, profiles, inventoryItems }) {
  const [classFilter, setClassFilter] = useState("all");
  const [minLevelFilter, setMinLevelFilter] = useState("");

  const filteredCharacters = useMemo(() => {
    const levelThreshold = Number(minLevelFilter);
    const hasLevelThreshold = minLevelFilter !== "" && !Number.isNaN(levelThreshold);

    return characters.filter((character) => {
      const classMatch = classFilter === "all" || character.class === classFilter;
      const levelValue = Number(character.level);
      const levelMatch = !hasLevelThreshold || (!Number.isNaN(levelValue) && levelValue >= levelThreshold);
      return classMatch && levelMatch;
    });
  }, [characters, classFilter, minLevelFilter]);

  const { totals, mailList } = useMemo(() => {
    const totalsByKey = new Map();
    const mail = [];

    filteredCharacters.forEach((character) => {
      const needs = computeShoppingNeeds(character, profiles, inventoryItems, {
        accountName: accountNameById.get(character.accountId) || ""
      });

      if (!needs.length) {
        return;
      }

      mail.push({ character, needs });

      needs.forEach((need) => {
        const key = need.itemName.trim().toLowerCase();
        const existing = totalsByKey.get(key);
        if (existing) {
          existing.total += need.need;
        } else {
          totalsByKey.set(key, { itemName: need.itemName, total: need.need });
        }
      });
    });

    const totals = Array.from(totalsByKey.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
    mail.sort((a, b) => a.character.name.localeCompare(b.character.name));

    return { totals, mailList: mail };
  }, [filteredCharacters, profiles, inventoryItems, accountNameById]);

  return (
    <Card className="mb-6">
      <CardHeader
        title="Buy List"
        subtitle="Total consumables needed to top up every matching character, and who to mail them to."
      />
      <CardBody className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 sm:max-w-md">
          <FormRow label="Class">
            <Select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">All classes</option>
              {WOW_CLASSES.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="Min level">
            <Input
              type="number"
              min="0"
              step="1"
              value={minLevelFilter}
              onChange={(event) => setMinLevelFilter(event.target.value)}
              placeholder="e.g. 60"
            />
          </FormRow>
        </div>

        {!filteredCharacters.length ? (
          <EmptyState
            title="No characters match"
            description="Adjust the class or level filter to see who needs consumables."
          />
        ) : !totals.length ? (
          <EmptyState
            title="Fully stocked"
            description="No shortfalls found for the matching characters. Make sure a shopping profile is set up for their class below."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Total to Buy
              </p>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {totals.map((item) => (
                  <li key={item.itemName} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-ink">{item.itemName}</span>
                    <span className="shrink-0 font-medium text-ink">{item.total}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Who to Mail
              </p>
              <ul className="space-y-3">
                {mailList.map(({ character, needs }) => (
                  <li key={character.id} className="rounded-lg border border-border px-3 py-2">
                    <p className="text-sm font-medium text-ink">
                      {character.name}
                      {character.realm ? <span className="text-ink-soft"> &mdash; {character.realm}</span> : null}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {needs.map((need) => (
                        <li key={need.itemName} className="flex items-center justify-between gap-4 text-sm text-ink-soft">
                          <span className="min-w-0 truncate">{need.itemName}</span>
                          <span className="shrink-0">x{need.need}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default function ShoppingPage() {
  const { user } = useAuth();
  const { data } = useUserCollections(user?.uid);
  const inventoryItems = useInventory(user?.uid);

  const accountNameById = useMemo(
    () => new Map(data.accounts.map((account) => [account.id, account.battleNetId])),
    [data.accounts]
  );

  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_PROFILE });
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const profiles = data.shoppingProfiles;

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) || null,
    [profiles, selectedId]
  );

  useEffect(() => {
    if (selectedProfile) {
      setForm({
        name: selectedProfile.name || "",
        className: selectedProfile.className || "Warrior",
        items: selectedProfile.items || []
      });
    }
  }, [selectedProfile]);

  if (!user) {
    return (
      <div>
        <PageHeader title="Shopping Profiles" />
        <EmptyState title="Sign in required" description="Sign in to manage shopping profiles." />
      </div>
    );
  }

  const onSelectProfile = (id) => {
    setSelectedId(id);
    setMessage("");
  };

  const onNewProfile = () => {
    setSelectedId(null);
    setForm({ ...EMPTY_PROFILE, items: [] });
    setMessage("");
  };

  const onSave = async () => {
    if (!form.name.trim()) {
      setMessage("Profile name is required.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    try {
      if (selectedId) {
        await updateShoppingProfile(selectedId, {
          name: form.name.trim(),
          className: form.className,
          items: form.items
        });
        setMessage("Profile saved.");
      } else {
        const created = await addShoppingProfile(user.uid, {
          name: form.name.trim(),
          className: form.className,
          items: form.items
        });
        setSelectedId(created.id);
        setMessage("Profile created.");
      }
    } catch {
      setMessage("Save failed. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async () => {
    if (!selectedId) {
      return;
    }
    if (!window.confirm(`Delete profile "${selectedProfile?.name}"?`)) {
      return;
    }

    try {
      await deleteShoppingProfile(selectedId);
      setSelectedId(null);
      setForm({ ...EMPTY_PROFILE, items: [] });
      setMessage("Profile deleted.");
    } catch {
      setMessage("Delete failed. Try again.");
    }
  };

  const onAddItem = () => {
    if (!newItemName.trim()) {
      return;
    }

    const qty = Math.max(1, Number(newItemQty) || 1);
    const name = newItemName.trim();
    const exists = form.items.some(
      (item) => item.itemName.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      setForm((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.itemName.toLowerCase() === name.toLowerCase()
            ? { ...item, quantity: qty }
            : item
        )
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        items: [...prev.items, { itemName: name, quantity: qty }]
      }));
    }

    setNewItemName("");
    setNewItemQty(1);
  };

  const onRemoveItem = (itemName) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.itemName !== itemName)
    }));
  };

  const onUpdateItemQty = (itemName, qty) => {
    const safe = Math.max(1, Number(qty) || 1);
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.itemName === itemName ? { ...item, quantity: safe } : item
      )
    }));
  };

  const sortedProfiles = profiles
    .slice()
    .sort((a, b) => String(a.className).localeCompare(String(b.className)) || String(a.name).localeCompare(String(b.name)));

  return (
    <div>
      <PageHeader title="Shopping Profiles" subtitle="Define what each class should carry into raid." />

      <BuyListSummary
        characters={data.characters}
        accountNameById={accountNameById}
        profiles={profiles}
        inventoryItems={inventoryItems}
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader
            title="Profiles"
            actions={
              <Button size="sm" variant="primary" onClick={onNewProfile}>
                New Profile
              </Button>
            }
          />
          <CardBody>
            {sortedProfiles.length ? (
              <ul className="space-y-1.5">
                {sortedProfiles.map((profile) => (
                  <li key={profile.id}>
                    <button
                      type="button"
                      onClick={() => onSelectProfile(profile.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selectedId === profile.id
                          ? "border-brand-200 bg-brand-50"
                          : "border-transparent hover:bg-surface-muted"
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium text-ink">{profile.name}</span>
                        <span className="text-ink-soft"> &mdash; {profile.className}</span>
                      </span>
                      <span className="shrink-0 text-xs text-ink-faint">{(profile.items || []).length} item(s)</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No profiles yet" description="Click New Profile to create one." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={selectedId ? "Edit Profile" : "New Profile"}
            actions={
              <div className="flex items-center gap-2">
                <Button variant="primary" onClick={onSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                {selectedId ? (
                  <Button variant="danger" onClick={onDelete}>
                    Delete
                  </Button>
                ) : null}
              </div>
            }
          />
          <CardBody className="space-y-4">
            {message ? <p className="text-sm text-ink-soft">{message}</p> : null}

            <FormRow label="Profile Name">
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Warrior DPS"
              />
            </FormRow>

            <FormRow label="Class">
              <Select
                value={form.className}
                onChange={(event) => setForm((prev) => ({ ...prev, className: event.target.value }))}
              >
                <option value="All">All classes</option>
                {WOW_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </Select>
            </FormRow>

            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Required Items</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={newItemName}
                  onChange={(event) => setNewItemName(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && onAddItem()}
                  placeholder="Item name, e.g. Elixir of the Mongoose"
                  className="flex-1 min-w-[220px]"
                />
                <Input
                  type="number"
                  min="1"
                  value={newItemQty}
                  onChange={(event) => setNewItemQty(event.target.value)}
                  className="w-20"
                />
                <Button onClick={onAddItem}>Add</Button>
              </div>

              {form.items.length ? (
                <ul className="mt-3 divide-y divide-border">
                  {form.items.map((item) => (
                    <li key={item.itemName} className="flex items-center justify-between gap-4 py-2.5">
                      <span className="min-w-0 truncate text-sm text-ink">{item.itemName}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) => onUpdateItemQty(item.itemName, event.target.value)}
                          className="w-20"
                        />
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onRemoveItem(item.itemName)}
                        >
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ink-soft">No items yet. Add items above.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
