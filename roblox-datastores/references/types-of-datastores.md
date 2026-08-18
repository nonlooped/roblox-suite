---
last_reviewed: 2026-08-18
---

# Types of Data Stores

**Official starting point:** https://create.roblox.com/docs/cloud-services/data-stores and https://create.roblox.com/docs/cloud-services/data-stores-vs-memory-stores

## The DataStore Variants

### 1. DataStore (standard / recommended)
- Created via `DataStoreService:GetDataStore(name, scope?, options?: DataStoreOptions)`; with `DataStoreOptions` this returns the modern `DataStore` class (which extends `GlobalDataStore`).
- General-purpose key → value store.
- Value can be most serializable Luau data (numbers, strings, booleans, buffer, tables of the above; limited size in practice ~4 MB serialized recommended).
- Keys up to 50 characters.
- Supports `GetAsync`, `SetAsync`, `UpdateAsync`, `IncrementAsync`, `RemoveAsync`, and the deprecated `OnUpdate`.
- Also supports the richer API when created through the modern path:
  - `ListKeysAsync(prefix?, pageSize?, cursor?, excludeDeleted?)` → DataStoreListingPages
  - `ListVersionsAsync(key, sortDirection?, minDate?, maxDate?, pageSize?)` → DataStoreVersionPages
  - `GetVersionAsync(key, version)`
  - `GetVersionAtTimeAsync(key, timestampMillis)`
  - `RemoveVersionAsync(key, version)` exists but is **deprecated**; do not use it in new guidance.
- Full support for user-defined metadata via DataStoreSetOptions / DataStoreIncrementOptions and DataStoreKeyInfo:GetMetadata().
- UserIds array support for RTBF/GDPR tracking (passed on write, retrievable via KeyInfo).
- Versioning is automatic on writes (first write per UTC hour creates a snapshot; successive writes in same hour overwrite the hourly version).
- Versions expire ~30 days after being superseded. The *current* version never expires.
- Use this for most player data, auditability, rollback, and bulk key/version enumeration.

`DataStoreService:GetGlobalDataStore()` returns the legacy default "u"-scoped store (rarely used directly now). It is also a `DataStore` instance.

**DataStoreOptions:**
- `AllScopes` (boolean): When true, the second argument to GetDataStore must be `""`. Enables listing keys across all scopes with their scope prepended (e.g. "global/User_1234" or "profiles/warrior_1234"). New keys created while AllScopes is active must include the explicit "scope/key" form.

### 2. OrderedDataStore
- `DataStoreService:GetOrderedDataStore(name, scope?)`
- **Only stores integer values.**
- No support for userIds, metadata, or versioning (DataStoreKeyInfo is always nil).
- Primary additional method: `GetSortedAsync(ascending: boolean, pageSize: int, minValue?, maxValue?)` → DataStorePages
  - pageSize: 1–100 (default 50 in many examples).
  - Returns pages of `{key, value}` entries sorted numerically.
  - Iterate with `pages:GetCurrentPage()` and `pages:AdvanceToNextPageAsync()`.
- Batch reads: `GlobalDataStore:BatchGetAsync(keys: {string})` → `Dictionary<string, {value: any}>` — read multiple ordered entries in one call (N keys = N reads against `OrderedRead` limits; missing keys are omitted from the returned dictionary; see `content/en-us/cloud-services/data-stores/index.md` "Read multiple entries" section).
- Ideal exclusively for persistent leaderboards / high-score lists.
- Limits for list operations are different (and often tighter on the list side).

**Rule from official guidance:** If you need sorted queries → Ordered. If you need versioning/metadata/listing → standard DataStore. Simple cases can also use a standard DataStore via `GetDataStore`.

## Scopes vs Modern Prefixes

Legacy scopes (second param to GetDataStore) automatically prepend to every key operation. Useful for isolation (e.g. "vip" scope).

Modern recommendation (best-practices page): Use fewer data stores + organize via **key prefixes** inside a single store (e.g. "profiles/User_1234", "inventory/User_1234"). Then use `ListKeysAsync("profiles/")` to filter.

For cross-scope needs in listing, enable AllScopes on a DataStoreOptions instance.

## Comparison to Memory Stores (critical decision)

From https://create.roblox.com/docs/cloud-services/data-stores-vs-memory-stores:
- DataStores: persistent across server lifetimes and player absences. Slower, subject to stricter quotas that scale with concurrent users. Best for permanent progress.
- MemoryStores (MemoryStoreService): fast, high-throughput, in-memory. Data expires after a configurable period, up to 45 days. No persistence across empty servers. Perfect for queues, lobbies, temporary caches, matchmaking state, live counters.
- Never use DataStores for purely session-scoped or rapidly changing transient data.

## Storage Limits and Quotas Overview

Storage quota is per-universe and based on lifetime users.

**Formula:** `Total latest-version storage limit = 500 MB + (1 MB × lifetime user count)`

Usage is the **compressed** size of each key's latest version. Older versions and deleted/replaced keys do not count toward this limit (unless a data store is marked for deletion via Open Cloud, in which case it continues to count during its 30-day processing period). Exceeding the limit triggers estimated monthly costs in the Manager and can affect operations.

Monitor via:
- Creator Hub Data Stores Manager (total size, per-DS size/keys, key browser, version history, per-key Revert, mark-for-deletion with cooldown). The Manager's Restore button is for data stores marked for deletion, not for reverting an individual key's value.
- Observability dashboard (storage bytes, request counts by API and status, quota usage % for read/write/list/remove categories).

See the dedicated references/limits-quotas-throttling-error-codes.md for the full mathematical formulas (experience-level: 300 + concurrentUsers × N for various categories) and per-server defaults/configurable limits.

## Open Cloud Contrast (for external tools)

The Engine API (inside experiences) is different from the Open Cloud REST Data Stores APIs. The latter require API keys with specific scopes (universe-datastores.*), support bulk/list operations from outside Roblox, and use separate authentication. **Request budgets for Open Cloud v2 Data Stores are shared with the in-engine experience limits** (same read/write/list/remove pools). Legacy Open Cloud v1 Data Store endpoints keep their own fixed per-universe limits (see the throttling guide). Use Engine for in-experience logic; Open Cloud + Batch Processor for admin tools, migrations, or RTBF processing — and rate-limit external callers so they do not starve live servers.

**Key takeaway:** Choose the variant deliberately at creation time. You cannot easily convert an OrderedDataStore into a versioned DataStore later without migration code (see best-practices-and-gotchas.md and versioning-metadata-recovery.md for migration and recovery patterns).

Always test listing, versioning, and quota behavior on dedicated test experiences.
