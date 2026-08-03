# Identity Contract: DataStore + Bagnon + Nova

## Purpose
Define deterministic rules that map every parsed record to exactly one canonical character.

## Canonical Key
- accountLabel
- realm
- characterName

Composite key format:
- `normalizedAccount|normalizedRealm|normalizedCharacterName`

## Shared Implementation

All parsers that need to resolve a `Default.<Realm>.<Name>` style key use a single implementation in `src/utils/identity.js` (`parseCharacterKey`, `buildCanonicalKey`), instead of each parser reimplementing its own regex. This matters: an earlier version of this codebase had `dataStoreContainersParser.js` split on the *last* `.` while the other DataStore parsers split on the *first* `.`, which could disagree for edge-case names and silently break the cross-source merge key. There is now exactly one implementation to keep in sync with the rules below.

## Normalization Rules
- trim whitespace
- lowercase for matching keys
- keep display values untouched for UI
- keep normalized variants for lookups

## Mapping Inputs
- DataStore.lua:
  - `DataStore_CharacterIDs.List` / `.Set`
  - `DataStore_CharacterGUIDs`
  - `DataStore_ConnectedRealms`
- DataStore_Characters.lua / Inventory / Containers:
  - characterIndex and optional name/realm values
- Bagnon files:
  - explicit character name and realm, plus an account hint when available
- Nova files:
  - explicit character name and realm

## Deterministic Resolution Order
1. If a record has `characterIndex` and `accountLabel`: resolve with that account's DataStore.lua map.
2. If a record has explicit character name and realm: use those fields directly.
3. If an index exists but the account map is missing: hard fail for that account import.
4. If name/realm is still unresolved: hard fail the record and report diagnostics.

## Account Scoping Rule
- `characterIndex` is only meaningful within a single account snapshot — never resolve index values with another account's map.
- **Bagnon imports must carry an `accountHintName`** on every parsed item and character so that two different accounts with a same-name/same-realm character are never merged into one. This was previously a bug: the Bagnon parser accepted an account hint but never persisted it on parsed items, so its owner/dedupe key was just `name|realm`, silently pooling bag/bank contents across accounts. It now stores `accountHintName` on every item (matching the DataStore parsers' field) and includes it in the dedupe key.

## Connected Realm Rule
- preserve the original realm in the canonical key.
- optional realm-grouping for UI can use `DataStore_ConnectedRealms`.
- grouping must never replace canonical identity.

## Duplicate Name Handling
- same name across realms are separate characters.
- same name/realm across accounts are separate characters (see Account Scoping Rule above — this is enforced for Bagnon imports too, not just DataStore).

## GUID Handling
- when available, persist the character GUID.
- GUID is an invariant attribute, not the sole key.

## Merge Rules Across Sources
- Containers defines bag/bank ownership rows.
- Inventory defines equipped gear rows.
- Characters defines profile snapshots.
- Nova defines raid/buff operational state.
- Bagnon defines an alternate bag/bank source, resolved through the same account-scoped identity rules as Containers.
- all merges happen after canonical identity resolution.

## Validation Requirements
Hard fail conditions:
- indexed records with missing DataStore.lua map for that account
- unresolved character identity after deterministic mapping

Warning conditions:
- character in Nova but absent from a DataStore/Bagnon snapshot
- character has a profile but no container rows

## Audit Output Requirements
Each sync should report:
- total indexed records by source
- unresolved records by source and account
- per-account owner count
- per-account snapshot character count
- list of Nova-only characters
