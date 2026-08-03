import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { RAIDS } from "../data/raids";
import { useUserCollections } from "../hooks/useUserCollections";
import { addLootItem, deleteLootItem, updateLootItem } from "../services/dataService";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { FormRow, Input, Select } from "../components/ui/Field";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const PRIORITY_TONE = { high: "bad", medium: "warn", low: "neutral" };

export default function LootPage() {
  const { user } = useAuth();
  const { data } = useUserCollections(user?.uid);
  const accountNameById = useMemo(
    () => new Map(data.accounts.map((account) => [account.id, account.battleNetId])),
    [data.accounts]
  );
  const visibleCharacters = data.characters.filter((character) => character.showOnDashboard !== false);

  const [form, setForm] = useState({
    characterId: "",
    itemName: "",
    raidName: RAIDS[0].name,
    priority: "high",
    iconUrl: ""
  });

  const selectedCharacter = visibleCharacters.find((character) => character.id === form.characterId) || null;

  useEffect(() => {
    if (!visibleCharacters.length) return;

    setForm((prev) => {
      if (prev.characterId && visibleCharacters.some((character) => character.id === prev.characterId)) {
        return prev;
      }
      return { ...prev, characterId: visibleCharacters[0].id };
    });
  }, [visibleCharacters]);

  if (!user) {
    return (
      <div>
        <PageHeader title="Loot Wishlist" />
        <EmptyState title="Sign in required" description="Sign in to edit loot wishlists." />
      </div>
    );
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.characterId || !form.itemName.trim()) return;

    await addLootItem(user.uid, {
      characterId: form.characterId,
      itemName: form.itemName.trim(),
      raidName: form.raidName,
      priority: form.priority,
      iconUrl: form.iconUrl.trim(),
      obtained: false
    });

    setForm((prev) => ({ ...prev, itemName: "", iconUrl: "" }));
  };

  const formatCharacterLabel = (character) => {
    const accountName = character.accountId
      ? accountNameById.get(character.accountId) || "Unknown account"
      : "Unassigned";
    return `${character.name} · ${character.realm || "Unknown realm"} · ${accountName}`;
  };

  const wishlist = selectedCharacter
    ? data.lootItems.filter((item) => item.characterId === selectedCharacter.id)
    : [];

  return (
    <div>
      <PageHeader title="Loot Wishlist" subtitle="Track and prioritize gear needs per character." />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader title="Add Loot Need" />
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormRow label="Character">
                <Select
                  value={form.characterId}
                  onChange={(event) => setForm((prev) => ({ ...prev, characterId: event.target.value }))}
                >
                  <option value="">Select character</option>
                  {visibleCharacters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {formatCharacterLabel(character)}
                    </option>
                  ))}
                </Select>
              </FormRow>

              <FormRow label="Item name">
                <Input
                  value={form.itemName}
                  onChange={(event) => setForm((prev) => ({ ...prev, itemName: event.target.value }))}
                  placeholder="e.g. Deathbringer"
                />
              </FormRow>

              <FormRow label="Raid">
                <Select
                  value={form.raidName}
                  onChange={(event) => setForm((prev) => ({ ...prev, raidName: event.target.value }))}
                >
                  {RAIDS.map((raid) => (
                    <option key={raid.name} value={raid.name}>
                      {raid.name}
                    </option>
                  ))}
                </Select>
              </FormRow>

              <FormRow label="Priority">
                <Select
                  value={form.priority}
                  onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </FormRow>

              <FormRow label="Icon URL" hint="Optional">
                <Input
                  value={form.iconUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, iconUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </FormRow>

              <Button type="submit" variant="primary" className="w-full">
                Add Loot Item
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Wishlist"
            subtitle={
              selectedCharacter
                ? `Showing wishlist items for ${selectedCharacter.name}.`
                : "Pick a character to see their wishlist items."
            }
          />
          <CardBody>
            {!selectedCharacter ? (
              <EmptyState title="No character selected" description="Choose a character to view their wishlist." />
            ) : !wishlist.length ? (
              <EmptyState title="Wishlist is empty" description="Add items using the form on the left." />
            ) : (
              <ul className="divide-y divide-border">
                {wishlist.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{item.itemName}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge tone={PRIORITY_TONE[item.priority] || "neutral"}>{item.priority}</Badge>
                        <span className="text-xs text-ink-faint">{item.raidName}</span>
                        {item.obtained ? <Badge tone="good">Obtained</Badge> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button size="sm" onClick={() => updateLootItem(item.id, { obtained: !item.obtained })}>
                        {item.obtained ? "Mark Needed" : "Mark Obtained"}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => deleteLootItem(item.id)}>
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
