# Firebase Schema Setup

## Collections

### `accounts`

- `userId` (string)
- `battleNetId` (string)
- `createdAt` (ISO string)

### `characters`

- `userId` (string)
- `accountId` (string)
- `name` (string)
- `class` (string)
- `faction` (string)
- `realm` (string)
- `level` (number, optional)
- `restedXp` (number, optional)
- `avatarUrl` (string, optional)
- `showOnDashboard` (boolean)
- `activeRaidTag` (string, optional)
- `buffs` / `storedBuffs` (string array, optional — synced from Nova world-buff state)
- `buffCounts` (object, optional — `{ ony, nef, rend, zan, dmf }`)
- `createdAt` (ISO string)

### `inventorySnapshots/{uid}`

One document per user (doc ID = `uid`):

- `userId` (string)
- `items` (array — see `inventoryItems` shape below, embedded rather than as separate documents)
- `meta` (object — sync metadata, e.g. source file names/timestamps)
- `updatedAt` (ISO string)

### `inventoryItems` shape (embedded in `inventorySnapshots.items`)

- `characterName` (string)
- `realm` (string)
- `accountHintName` (string, optional — disambiguates same-name/realm characters across accounts)
- `itemId` (number)
- `itemName` (string)
- `count` (number)
- `locationGroup` (`"bags"` | `"bank"`)
- `bagKey` (string)
- `slotIndex` (number)
- `sourceFileName` (string)

### `raidStatuses`

- `userId` (string)
- `characterId` (string)
- `raidName` (string)
- `completed` (boolean)
- `lastRunDate` (ISO string or null)
- `resetDate` (ISO string or null)
- `updatedAt` (ISO string)

### `lootItems`

- `userId` (string)
- `characterId` (string)
- `itemName` (string)
- `raidName` (string)
- `priority` (`"high"` | `"medium"` | `"low"`)
- `iconUrl` (string, optional)
- `obtained` (boolean)
- `createdAt` (ISO string)

### `shoppingProfiles`

- `userId` (string)
- other fields depend on the shopping-list feature configuration — see `src/utils/shoppingList.js` and `src/pages/Shopping.jsx`.

### `buffProfiles`

- `userId` (string)
- other fields depend on the buff-readiness configuration — see `src/utils/buffCatalog.js` and `src/pages/BuffProfiles.jsx`.

## Firestore Index Suggestions

Create composite indexes as needed when expanding queries. Currently the app filters mostly by `userId` and performs per-character grouping in the frontend.

## Auth

Enable the Google provider in Firebase Authentication.

## Rules

Apply [`firestore.rules`](../firestore.rules). Every collection's `update` rule requires `request.resource.data.userId == resource.data.userId`, so `userId` can never be reassigned after a document is created.
