import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserCollections } from "../hooks/useUserCollections";
import {
  addShoppingProfile,
  deleteShoppingProfile,
  updateShoppingProfile
} from "../services/dataService";
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

export default function ShoppingPage() {
  const { user } = useAuth();
  const { data } = useUserCollections(user?.uid);

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
