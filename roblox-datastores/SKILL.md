---
name: roblox-datastores
description: "Safety-oriented Roblox DataStore guidance for reducing data loss, throttling, races, and quota exhaustion. Covers DataStore vs OrderedDataStore, UpdateAsync for atomic writes, versioning and metadata for recovery, budgets and rate limits, player profile and session-locking patterns, leaderboards, RTBF, and integration with Open Cloud. Use for any persistent player data, stats, inventory, settings, or cross-server state."
last_reviewed: 2026-07-20
---

# roblox-datastores

This skill delivers the authoritative, detailed knowledge required to implement robust, scalable, and safe persistent storage in Roblox experiences using Luau. LLMs often have outdated or incomplete information about the distinctions between datastore variants, the full power of versioning/metadata, configurable rate limits, precise caching behavior, and the exhaustive set of error conditions and quotas.

**Primary official sources (consult these for the absolute latest):**
- https://create.roblox.com/docs/cloud-services/data-stores
- https://create.roblox.com/docs/cloud-services/data-stores-vs-memory-stores
- https://create.roblox.com/docs/cloud-services/data-stores/versioning-listing-and-caching
- https://create.roblox.com/docs/cloud-services/data-stores/error-codes-and-limits
- https://create.roblox.com/docs/cloud-services/data-stores/best-practices
- https://create.roblox.com/docs/cloud-services/data-stores/data-stores-manager
- https://create.roblox.com/docs/cloud-services/data-stores/observability
- Engine classes: DataStoreService, GlobalDataStore, DataStore, OrderedDataStore, DataStoreOptions, DataStoreKeyInfo, DataStoreSetOptions, etc. (full reference at https://create.roblox.com/docs/reference/engine)

**Progressive disclosure in this skill:**
- Start here in SKILL.md for high-level decision making, recommended workflows, and checklists.
- Read specific files in `references/` for exhaustive technical details, tables, code samples, and edge cases when you need to implement or debug a particular aspect.
- Treat `scripts/` as maturity-labeled examples; adapt and test them in a dedicated experience.

## When to use this skill

Activate for:
- Implementing player data saving (progress, inventory, currency, settings, cosmetics).
- Creating or querying leaderboards (persistent sorted numeric data).
- Any cross-server or cross-place persistent state.
- Bulk operations, data migration, or cleaning up old data.
- Handling "right to be forgotten" (RTBF) / GDPR-style requests.
- Debugging data loss, throttling errors, quota issues, or inconsistent reads.
- Choosing between DataStores and MemoryStores (or combining them).
- Setting up monitoring via Data Stores Manager or the observability dashboard.
- Advanced patterns such as profile services, session locking, or safe concurrent updates.

**Do not use (or only lightly reference) for** purely ephemeral high-frequency data — see MemoryStoreService guidance in references and the vs-memory-stores doc.

Cross-reference:
- [roblox-networking/SKILL.md](../roblox-networking/SKILL.md) for server-authoritative validation before any write.
- [roblox-core/SKILL.md](../roblox-core/SKILL.md) for service acquisition patterns, pcall discipline, and Luau serialization rules.
- [roblox-gamepasses/SKILL.md](../roblox-gamepasses/SKILL.md) when purchases affect persistent state (re-verify ownership on load).
- [roblox/SKILL.md](../roblox/SKILL.md) for the overall hub and Engine API link.

## Core decision tree (read references/types-of-datastores.md for full details)

1. Is the data temporary/ephemeral, high-churn, or only needed while servers are active (queues, lobbies, rate counters, short caches)?  
   → Use **MemoryStoreService** (queues, sorted maps, etc.). DataStores are overkill and more expensive/slower. See references and official comparison.

2. Do you need sorted numeric queries for leaderboards or rankings?  
   → Use **OrderedDataStore** (via GetOrderedDataStore). Values **must** be integers. No versioning/metadata. Special GetSortedAsync + DataStorePages iteration. Limits differ (see references/limits...).

3. Do you need versioning for recovery/audit, user-defined metadata, key listing, or the richer DataStore API (`ListKeysAsync`, `ListVersionsAsync`, `GetVersionAsync`, `GetVersionAtTimeAsync`)?
   → Use the full **DataStore** created via `GetDataStore` with `DataStoreOptions` (this returns the modern DataStore class). Preferred for serious player data.

4. Simple key-value persistent storage without the above needs?  
   → Use `DataStoreService:GetDataStore()` (returns a standard DataStore) or `DataStoreService:GetGlobalDataStore()` (legacy global store, scope `"u"`). For new work, prefer a named `GetDataStore` store.

**Scopes vs prefixes (modern recommendation):** For new work, prefer key prefixes (e.g. "profiles/User_1234") + ListKeysAsync filtering over legacy scopes. Scopes prepend to keys automatically. Use DataStoreOptions.AllScopes=true + empty scope string for cross-scope listing (see references).

**Studio access:** If Studio needs backend APIs, use a dedicated test experience. Do not enable Studio sessions to read or write production data.

## Recommended safety workflows

### Player data profile pattern (most common)

See references/best-practices-and-gotchas.md for full examples and variations (including session locking and profile patterns).

High-level server flow (in a ModuleScript required by ServerScriptService scripts):

1. On PlayerAdded:
   - Load with pcall + GetAsync (consider UseCache=false for critical fresh read after potential previous server issues).
   - Merge with defaults.
   - Store in a server-side table or profile object (e.g. `playerData[player.UserId] = data`).
   - Apply any gamepass perks (cross-ref monetization skill) or other state.
   - Optionally fire a Remote to client for initial UI sync (never trust client data).

2. During play:
   - Mutate the in-memory profile.
   - Periodically auto-save (every 30-60s) using UpdateAsync or SetAsync with proper transform.
   - On important events (purchase, level up, trade), save immediately with UpdateAsync for safety.

3. On PlayerRemoving / BindToClose / character death:
   - Final save with pcall.
   - Clean up in-memory data.
   - For BindToClose, yield up to ~30 seconds to finish final saves (Roblox gives a bounded grace period).

4. On errors during write:
   - Use the verification pattern: after a failed write, immediately GetAsync with UseCache=false to see actual backend state before deciding retry/refund/rollback.

Use **UpdateAsync** with a pure (non-yielding) transform function for any value that can be concurrently modified by multiple servers. It reads-then-writes atomically from the perspective of the last writer.

**Serialization rules (critical):** Only nil, booleans, numbers (no inf/-inf/nan), strings (valid UTF-8), buffer, and tables of the above. No functions, no metatables on saved tables, no cycles. Use HttpService:JSONEncode on suspect data during development to preview what will actually be stored. See references/core-operations... .

### Leaderboards with OrderedDataStore

Populate on relevant value changes or on save (use SetAsync or Increment).  
Query with GetSortedAsync(ascending, pageSize, min?, max?) → DataStorePages. Iterate pages with GetCurrentPage() + AdvanceToNextPageAsync().  
Remember: only numbers; keys are strings; page iteration has its own limits; no versioning.

Display in a ScrollingFrame or via UI on demand. Cache top-N in a standard DataStore if you want fast global access without repeated queries.

See references for full page iteration example and limits differences.

### Versioning and recovery (powerful safety net)

Every Set/Update/Increment on a standard DataStore (not Ordered) creates hourly-versioned backups: the first write to a key in a given UTC hour creates a new version snapshot, and subsequent writes in the same hour overwrite that hourly version. Versioned backups expire ~30 days after being superseded; the current version never expires.

- ListVersionsAsync(key, sort, minDate?, maxDate?, pageSize?)
- GetVersionAsync(key, version)
- `RemoveVersionAsync` is **deprecated**. Do not present it as a current cleanup API; retain versions for recovery and use `ListVersionsAsync`, `GetVersionAsync`, or `GetVersionAtTimeAsync` to inspect them.
- GetVersionAtTimeAsync(key, timestampMillis) — find the version current at a specific past time.
- To revert: read the desired version, then SetAsync the value + metadata back (this creates a new current version).

Also use the daily Snapshot Data Stores Open Cloud API before risky publishes.

The Data Stores Manager in Creator Hub lets you browse keys, view metadata/version history, compare versions, and revert (with proper permissions).

See [references/versioning-metadata-recovery.md](references/versioning-metadata-recovery.md) for complete code samples including the "revert to time of incident" pattern.

### Caching control

By default: GetAsync results are cached locally for 4 seconds. Subsequent Gets within the window return cache and do **not** count against limits. Writes update the cache immediately.

For verification after writes (especially after errors), or when you suspect staleness due to other servers:
```lua
local opts = Instance.new("DataStoreGetOptions")
opts.UseCache = false
local value, info = store:GetAsync(key, opts)
```
This always hits the backend and counts against quotas. Use sparingly but correctly.

See references/versioning-metadata-recovery.md (for listing, caching, serialization) and references/best-practices-and-gotchas.md .

### Limits, quotas, throttling, and budgets (you *must* respect these)

There are **experience-level** limits (scale with concurrent users across the whole experience) and **per-server** limits (configurable via DataStoreService:SetRateLimitForRequestType). Experience-level pools are **shared between game servers and Open Cloud v2** Data Store traffic — bulk external jobs can throttle live players (and vice versa).

UpdateAsync counts against *both* read and write budgets.

Use DataStoreService:GetRequestBudgetForRequestType(Enum.DataStoreRequestType.XXX) to check before heavy operations and wait in a loop if necessary.

Queues exist (size 30); when full, you get throttle errors (301-306 range or the newer *Throttled errors).

Full tables of every error code (101 KeyNameEmpty ... through all the *ExperienceThrottled and *GameServerThrottled variants), experience formulas (base 300 + concurrentUsers × N), and server-side errors are in references/limits-quotas-throttling-error-codes.md .

Observability dashboard (Creator Hub → Monitoring → Data Stores) shows real-time request counts by API/status, quota usage percentages, storage bytes vs limit.

Data Stores Manager shows total size vs storage limit (`500 MB + 1 MB × lifetime users`, measured as compressed latest-version size), per-DS key counts, etc. Do not pre-compress values before writing.

**Pro tip:** Call SetRateLimitForRequestType early in server init (once per type) to raise limits for migration scripts or busy servers. Base + (perPlayer * numPlayers). Constraints per type are documented.

### Error handling discipline (non-negotiable)

**Every** datastore call must be inside pcall.

On failure:
- Log the specific error code/message.
- Retry reads with bounded exponential backoff and jitter.
- Treat an invoked write that returns an error as **unknown**, not rejected: reconcile with a fresh `GetAsync` using `UseCache = false`.
- Replay a write only when the caller has proved the entire operation idempotent. Never automatically replay `IncrementAsync`.
- Return explicit `committed`, `rejected`, or `unknown` status so purchase/recovery code cannot mistake ambiguity for failure.

Never assume a failed Set/Update/Increment means "no change occurred." `UpdateAsync` transforms can run multiple times and must not yield or produce external side effects.

RemoveAsync creates a "tombstone" (Get returns nil) but older versions remain queryable for 30 days (unless explicitly removed).

### Management and monitoring

- Use Data Stores Manager (Creator Hub) for inspection, key search by prefix, version compare/revert, and scheduled deletion (with cooldown). The Manager's **Revert** button can revert an individual key to a previous version. The **Restore** button is for data stores that are marked for deletion, not for reverting a key's value. Restoring a deleted key during its cooldown requires calling `UpdateAsync` from the Engine API or `UpdateDataStoreEntry` from Open Cloud.
- Observability dashboard for trends and quota forecasting.
- For bulk delete/migrate: Open Cloud Data Stores APIs or the official Batch Processor CLI/tool.
- Set up notifications for approaching/exceeding storage limits.
- Review usage regularly.

See references/versioning-metadata-recovery.md (covers listing/caching) and the manager/observability pages (linked in best-practices-and-gotchas.md).

## Checklists

**Before any critical write:**
- [ ] Wrapped in pcall with explicit committed/rejected/unknown handling
- [ ] Using UpdateAsync where races are possible, with a pure transform
- [ ] Providing userIds array for RTBF/GDPR tracking where appropriate
- [ ] Metadata supplied on every write (even if unchanged) when using full DataStore
- [ ] Value is serializable (test with JSONEncode during dev)
- [ ] Key naming consistent with prefixes for easy listing

**On player join/load:**
- [ ] Fresh load or cache-aware as appropriate
- [ ] Merge defaults safely
- [ ] Re-verify ownership on PlayerAdded (gamepasses, etc.) and re-apply any non-owned one-time consumable grants
- [ ] Client sync only of non-sensitive derived state

**Before publishing risky data-logic changes:**
- [ ] Take a daily snapshot via Open Cloud if available
- [ ] Test thoroughly on a copy experience

**Ongoing:**
- [ ] Monitor dashboard and manager
- [ ] Clean test/temporary data
- [ ] Use MemoryStores for anything that doesn't need to survive server death
- [ ] Prefer fewer data stores + larger cohesive objects + key prefixes

## Common catastrophic mistakes this skill prevents

- Calling from client/LocalScript (immediate error + security hole).
- Storing functions, metatables, or non-serializable data.
- Using SetAsync for contended values (race condition → lost updates or duplication).
- Ignoring throttle errors and hammering (leads to dropped requests and player frustration).
- Hardcoding studio API access on live places.
- Creating hundreds of tiny data stores instead of organizing by key/prefix.
- Relying on cached Gets for post-write verification.
- Forgetting that OrderedDataStore has no versioning and only integers.
- Not handling the case where RemoveAsync has already been called (nil + tombstone).
- Exceeding storage quota without monitoring (leads to surprise costs and potential write failures).

## Scripts folder usage

The `scripts/` directory contains maturity-labeled examples:
- `SafeDataStore.lua` — reviewed example with automatic read retries, explicit write states, opt-in idempotent replay, and uncached reconciliation.
- `BudgetMonitor.lua` — experimental budget-inspection example.

Adapt and validate them in a dedicated test experience; this directory is not a versioned production library.

## How to proceed in practice

1. Read the relevant references/ file(s) for the exact feature you are implementing.
2. Implement using the patterns and code samples here + in references.
3. Test budget behavior under load (use multiple test servers or the rate-limit setter for simulation).
4. Add observability and alerts early.
5. Profile storage growth with the Manager/Dashboard.

Combine this guidance with static analysis, focused tests, Studio integration, observability, and current official sources before trusting a persistence system.

For the authoritative class/property reference for any specific method, always cross-check https://create.roblox.com/docs/reference/engine (search for DataStoreService, GlobalDataStore, etc.).

<!-- catalog:references:start -->
## Reference index

- [best-practices-and-gotchas.md](references/best-practices-and-gotchas.md)
- [core-operations-and-patterns.md](references/core-operations-and-patterns.md)
- [limits-quotas-throttling-error-codes.md](references/limits-quotas-throttling-error-codes.md)
- [types-of-datastores.md](references/types-of-datastores.md)
- [versioning-metadata-recovery.md](references/versioning-metadata-recovery.md)
<!-- catalog:references:end -->
