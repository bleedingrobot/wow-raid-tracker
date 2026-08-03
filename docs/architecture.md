# Architecture Overview

## Frontend

- React + Vite SPA with `HashRouter` for GitHub Pages compatibility.
- Route-level pages under `src/pages/`: Dashboard, Characters, Raids, Loot, Inventory, Shopping, BuffProfiles, RestedXp, Admin, Settings, and the three sim pages.
- Shared state:
  - `AuthContext` for the Firebase auth session.
  - `useUserCollections` hook for real-time Firestore subscriptions (accounts, characters, raidStatuses, lootItems, shoppingProfiles, buffProfiles).
  - `useLuaSync` hook (used by Dashboard and Settings) for the addon-export sync workflow — see below.
- UI kit in `src/components/ui/` (Button, Card, Field, Badge, PageHeader, EmptyState, Modal, Spinner) plus Tailwind v4 design tokens defined in `src/index.css`.

## Data Flow

1. User signs in with Google on Settings.
2. App subscribes to user-scoped Firestore collections.
3. Dashboard computes urgency in memory and renders sorted character cards.
4. Addon export text (Nova/DataStore/Bagnon SavedVariables) is parsed client-side and written back to Firestore via `src/services/dataService.js`.

## Urgency Algorithm

For each character:

- Count wishlist items not marked obtained, weighted by priority.
- Add a lockout penalty for raids completed but not yet reset.

```text
urgencyScore =
  (highPriorityLoot * 5) +
  (mediumPriorityLoot * 3) +
  (lowPriorityLoot * 1) +
  (raidsLockedOutPenalty)
```

Lockout weight is configurable in `src/utils/urgency.js`, which now imports the single `isRaidLocked` implementation from `src/utils/raidReset.js` rather than duplicating it.

## Weekly Reset Logic

`src/utils/raidReset.js` computes the next weekly reset as Tuesday 15:00 UTC. When a raid is marked complete, the app stores `lastRunDate`, `resetDate`, and `completed`; once `resetDate` passes, the raid is available again.

## Character Identity Resolution

Addon exports (DataStore, Bagnon, Nova) are merged into one canonical character per the rules in [identity-contract.md](identity-contract.md). All three DataStore parsers and `dataStoreProfileHelpers.js` share one canonical-key implementation in `src/utils/identity.js` (`parseCharacterKey`, `buildCanonicalKey`) instead of each parsing `Default.<Realm>.<Name>` independently. The Bagnon parser also carries an `accountHintName` on every parsed item/character so same-name/same-realm characters on different accounts aren't merged together.

## Addon Sync Workflow

`src/hooks/useLuaSync.js` is the single implementation of the "paste or connect addon SavedVariables, parse, and sync to Firestore" workflow used by both the Dashboard and Settings pages (previously this logic was duplicated ~250 lines each and had drifted between the two pages). It owns:

- Parsing pasted/connected Nova and Bagnon/DataStore Lua text via the parsers in `src/utils/`.
- Creating/updating characters, raid statuses, and buff state in Firestore.
- Managing File System Access API "connected file" handles (`src/utils/addonFileConnections.js`, a single parameterized implementation shared by the Nova and Bagnon connection helpers).
- Auto-sync on a configurable interval, using a ref for the latest sync callback so the interval timer isn't reset by unrelated Firestore snapshot updates.

## Security Model

- Every document includes `userId`.
- Firestore rules enforce read/write only when `request.auth.uid == resource.data.userId` (or the request data's `userId` on create), and additionally pin `userId` as immutable on update so a signed-in user can never reassign one of their own documents to another uid.
- A single admin email (`giantjamez@gmail.com` by default — see `src/context/AuthContext.jsx` and `firestore.rules`) has cross-user read/write access for the `/admin` console. No custom backend is required otherwise.
