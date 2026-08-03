import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserCollections } from "../hooks/useUserCollections";
import {
  addBuffProfile,
  deleteBuffProfile,
  updateBuffProfile
} from "../services/dataService";
import { AVAILABLE_WORLD_BUFFS } from "../utils/buffCatalog";
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
  className: "All",
  buffs: []
};

export default function BuffProfilesPage() {
  const { user } = useAuth();
  const { data } = useUserCollections(user?.uid);

  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_PROFILE });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const profiles = data.buffProfiles;

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) || null,
    [profiles, selectedId]
  );

  useEffect(() => {
    if (selectedProfile) {
      setForm({
        name: selectedProfile.name || "",
        className: selectedProfile.className || "All",
        buffs: Array.isArray(selectedProfile.buffs) ? selectedProfile.buffs : []
      });
    }
  }, [selectedProfile]);

  if (!user) {
    return (
      <div>
        <PageHeader title="Buff Profiles" />
        <EmptyState title="Sign in required" description="Sign in to manage buff profiles." />
      </div>
    );
  }

  const onSelectProfile = (id) => {
    setSelectedId(id);
    setMessage("");
  };

  const onNewProfile = () => {
    setSelectedId(null);
    setForm({ ...EMPTY_PROFILE });
    setMessage("");
  };

  const onToggleBuff = (buffName, checked) => {
    setForm((prev) => {
      if (checked) {
        return {
          ...prev,
          buffs: [...new Set([...prev.buffs, buffName])]
        };
      }

      return {
        ...prev,
        buffs: prev.buffs.filter((buff) => buff !== buffName)
      };
    });
  };

  const onSave = async () => {
    if (!form.name.trim()) {
      setMessage("Profile name is required.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const payload = {
      name: form.name.trim(),
      className: form.className,
      buffs: [...new Set(form.buffs)].sort((a, b) => a.localeCompare(b))
    };

    try {
      if (selectedId) {
        await updateBuffProfile(selectedId, payload);
        setMessage("Profile saved.");
      } else {
        const created = await addBuffProfile(user.uid, payload);
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
      await deleteBuffProfile(selectedId);
      setSelectedId(null);
      setForm({ ...EMPTY_PROFILE });
      setMessage("Profile deleted.");
    } catch {
      setMessage("Delete failed. Try again.");
    }
  };

  const sortedProfiles = profiles
    .slice()
    .sort((a, b) => String(a.className).localeCompare(String(b.className)) || String(a.name).localeCompare(String(b.name)));

  return (
    <div>
      <PageHeader title="Buff Profiles" subtitle="Choose required world buffs by class with a simple checklist." />

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
                      <span className="shrink-0 text-xs text-ink-faint">{(profile.buffs || []).length} buff(s)</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No buff profiles yet" description="Click New Profile to create one." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={selectedId ? "Edit Buff Profile" : "New Buff Profile"}
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
                placeholder="e.g. Rogue Raid Buffs"
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
              <p className="mb-1.5 text-sm font-medium text-ink">Required Buffs</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {AVAILABLE_WORLD_BUFFS.map((buff) => (
                  <label
                    key={buff}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-ink hover:bg-surface-muted"
                  >
                    <input
                      type="checkbox"
                      checked={form.buffs.includes(buff)}
                      onChange={(event) => onToggleBuff(buff, event.target.checked)}
                      className="h-4 w-4 shrink-0 rounded border-border text-brand-500 focus:ring-brand-200"
                    />
                    <span>{buff}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
