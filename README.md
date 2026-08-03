# Raid Tracker

**Live: [bleedingrobot.github.io/wow-raid-tracker](https://bleedingrobot.github.io/wow-raid-tracker/)**

A WoW Classic companion app to track characters, raid lockouts, loot wishlists, inventory, shopping lists, buff readiness, and rested XP across accounts.

This is a from-scratch rebuild of an earlier version of the app, with a lighter/more modern UI and a handful of correctness fixes (see [docs/architecture.md](docs/architecture.md) for details on what changed).

## Stack

- Frontend: React 19 + Vite + Tailwind CSS v4
- Auth: Firebase Authentication (Google)
- Database: Firestore
- Hosting: GitHub Pages (static)
- Icons: lucide-react, plus the public WoW icon CDN (WowHead/Zamimg)

## Features

- Google sign-in with per-user data isolation (Firestore rules scope every document by `userId`)
- Battle.net account and character management
- Raid lockout tracking with weekly reset countdowns
- Loot wishlist with priority and obtained status
- Dashboard urgency scoring sorted across all visible characters
- Inventory tracking synced from DataStore/Bagnon/Nova addon exports
- Shopping list of consumables/reagents needed per character
- Buff readiness profiles per character
- Rested XP tracking
- Integrated WoWSims Classic Warrior/Rogue/Mage DPS sims
- Admin console (single owner account) for cross-user data inspection/cleanup

## Pages

- `/` dashboard
- `/characters` character and account management
- `/raids` raid lockout tracker
- `/loot` loot wishlist editor
- `/inventory` synced bag/bank inventory
- `/shopping` consumable/reagent shopping list
- `/buff-profiles` per-character buff readiness
- `/rested` rested XP tracker
- `/sim/warrior`, `/sim/rogue`, `/sim/mage` integrated WoWSims
- `/admin` owner-only cross-user console
- `/settings` auth, Firebase status, and addon sync setup

## Local Setup

```bash
npm install
```

Create `.env.local` from `.env.example` and add your Firebase web app config, then:

```bash
npm run dev
```

## Firebase Setup

1. Create a Firebase project.
2. Enable Authentication → Google provider.
3. Create a Firestore database.
4. Apply [firestore.rules](firestore.rules) from this repo (Firebase Console → Firestore → Rules, or `firebase deploy --only firestore:rules` with the Firebase CLI).
5. Add your web app config to `.env.local`.
6. In `src/context/AuthContext.jsx`, `ADMIN_EMAIL` and the matching check in `firestore.rules` (`isAdmin()`) grant one account full cross-user access for the `/admin` page — update both to your own email, or remove the admin path entirely if you don't need it.

Full data model in [docs/firebase-schema.md](docs/firebase-schema.md).

## GitHub Pages Deployment

The `homepage` field in `package.json` points at this repo's Pages URL:

```json
"homepage": "https://bleedingrobot.github.io/wow-raid-tracker/"
```

Build and publish:

```bash
npm run deploy
```

This publishes `dist` to the `gh-pages` branch. Enable GitHub Pages for that branch under repo Settings → Pages.

## Architecture Notes

See [docs/architecture.md](docs/architecture.md) for app flow, the urgency algorithm, and the identity-resolution rules addon imports rely on ([docs/identity-contract.md](docs/identity-contract.md)).
