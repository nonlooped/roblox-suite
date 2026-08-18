---
last_reviewed: 2026-08-18
---

# Core Operations and Patterns

Covers GetAsync, SetAsync, UpdateAsync, IncrementAsync, RemoveAsync in depth, with decision guidance, serialization rules, pcall discipline, transform function constraints, and production patterns.

Sources: Official data-stores guide, DataStore/GlobalDataStore/OrderedDataStore class references, versioning guide, error codes page.

## The Basic Operations (all yield, all must be pcalled)

All methods are on DataStore (and OrderedDataStore where supported). `DataStore` inherits from `GlobalDataStore`.

### GetAsync(key, options?: DataStoreGetOptions)
- Returns (value, DataStoreKeyInfo?) or (nil, nil) if never written or tombstoned.
- Default behavior: 4-second local cache per data store instance. Hits within the window return cached data and do **not** count against request budgets.
- To force a fresh backend read (critical after failed writes or for verification): create DataStoreGetOptions with UseCache = false.
- When AllScopes is active, key must be supplied in "scope/key" form for the desired scope.
- KeyInfo (when present on v2 path) gives Version, CreatedTime, UpdatedTime, GetUserIds(), GetMetadata().

### BatchGetAsync(keys: {string})
- OrderedDataStore batch read: `orderedStore:BatchGetAsync({"Player_123", "Player_456"})` → `Dictionary<string, {value: integer}>`. Each requested key counts as one `OrderedRead` against experience and server budgets; missing keys are omitted (check presence before reading `entry.value`). Prefer over N sequential `GetAsync` calls when you need several scores at once. Same `OrderedRead` throttling applies (`OrderedReadExperienceThrottled`, `OrderedReadGameServerThrottled`).

### SetAsync(key, value, userIds?, options?: DataStoreSetOptions)
- Fast path for last-write-wins or low-contention data.
- Only consumes write budget.
- Creates a new version (hourly granularity).
- userIds table (array of numbers) recommended for any user-owned data (helps with RTBF requests and intellectual property tracking).
- options:SetMetadata(table) — you must supply metadata on *every* write (even if unchanged) or previous metadata is lost.
- On success returns the new version identifier (useful for a later `GetVersionAsync`). `RemoveVersionAsync` is deprecated and should not be recommended for new code.

**Risk:** If two servers Set the same key nearly simultaneously, one can overwrite the other without seeing the other's change.

### UpdateAsync(key, transformFunction)
- The **safest** general-purpose write for contended data.
- Internally: reads current value + KeyInfo (consumes a read), calls your transform (which **must not yield** — no task.wait, no other async), then writes the result if non-nil (consumes a write).
- If another server updated the key between the read and the attempted write, the engine re-calls your transform with the newer current value. It keeps doing this until your transform succeeds in writing or returns nil (which aborts the update on this server).
- Transform signature: `function(currentValue, keyInfo?) return newValue, userIds?, metadata? end`
  - Return nil as the first value to cancel (no write occurs).
- When using full DataStore + metadata, the transform should usually return the existing userIds/metadata unless you are intentionally changing them (otherwise they get cleared).

**Strongly prefer UpdateAsync** for currency, inventory counts, levels, achievement flags, etc.

### IncrementAsync(key, delta?, userIds?, options?)
- Convenience for integer counters. Internally safe.
- Delta defaults to 1.
- Returns the new total.
- Does **not** support userIds on OrderedDataStore.

### RemoveAsync(key)
- Marks the key as deleted (creates a tombstone version). Subsequent normal GetAsync returns nil.
- Older versions remain accessible via ListVersions/GetVersion until they naturally expire or are explicitly removed.
- On OrderedDataStore this is a true permanent delete (no versioning).
- Returns the pre-removal value + KeyInfo (or nil,nil if it was already gone).

After `RemoveAsync`, normal reads return nil while historical versions remain available for the documented retention period. Recover by reading a historical version and writing a new current version; do not use deprecated `RemoveVersionAsync` as a cleanup path.

## Serialization Rules (what you can actually store)

Data is stored as JSON under the hood.

Supported:
- nil
- boolean
- number (but **never** inf, -inf, or nan — they violate JSON and can make keys unreadable via Open Cloud)
- string (must be valid UTF-8; a lone byte >127 will fail)
- buffer
- table (arrays or dictionaries) containing only the above. No functions, no Instances, no other Roblox datatypes, no cycles.

**Debugging tip:** During development, take any data you plan to save and run it through `HttpService:JSONEncode(data)`. If it succeeds and the result is reasonable size, it will almost certainly store. If it produces an error or "null" for parts of your data, fix the structure before saving.

Tables with numeric keys that have gaps or are used as dicts can have surprising behavior (numeric keys become strings in some representations). Prefer string keys for clarity when the data is more "record" than "array".

Maximum practical object size is documented in the limits page (serialized length). Exceeding produces ValueTooLarge (105).

## SetAsync vs UpdateAsync Decision Tree

Use **SetAsync** when:
- Last writer wins is acceptable.
- Contention is impossible or extremely unlikely (e.g. a server writing only to its own private session key).
- You want the absolute fastest write path and only want to burn write budget.

Use **UpdateAsync** when:
- Multiple servers can plausibly touch the same key (almost all player-owned persistent data).
- You need to compute the new value based on the *current* backend value (add currency, merge inventory deltas, etc.).
- You want the engine to automatically retry the transform on conflict.

Many profile systems wrap `UpdateAsync`, but the wrapper must still expose an ambiguous backend outcome instead of blindly replaying a failed write.

## Caching Interactions (see also versioning-metadata-recovery.md and best-practices-and-gotchas.md)

- Normal GetAsync → cached for 4s.
- Any Set/Update/Increment/Remove on the same data store instance immediately updates the local cache and resets the timer.
- Different DataStore instances (different scope strings, or one with AllScopes vs one without) have **separate caches**. This is a common source of "why did my change not appear?" bugs.
- After any write that returns an error, **do not trust the cache**. Perform a Get with UseCache=false to learn the truth from the backend before deciding what to do next (retry, compensate the player, etc.).

## Safety-oriented wrapper pattern (high level)

See the scripts/ folder for concrete examples (SafeDataStore.lua).

Typical features of a good wrapper:
- Central pcall + specific error classification (isThrottle, isShutdown, isPermanentBadData, etc.).
- Budget-aware waiting before operations.
- Automatic retries for reads; write replay only after an explicit idempotency declaration.
- Explicit `committed`, `rejected`, and `unknown` write results.
- Atomic metadata/userIds preservation inside `UpdateAsync`, not a cached pre-read plus `SetAsync`.
- An uncached reconciliation callback or strategy after ambiguous failures.
- Logging that includes the exact key, operation, error code, and reconciliation decision.
- Graceful degradation (e.g. give the player temporary offline currency that will be reconciled later).

## Common Anti-Patterns to Avoid

- Saving on Heartbeat or every frame.
- Storing the entire player object or huge nested tables with lots of history.
- Using the same data store instance from multiple unrelated systems without understanding cache isolation.
- Assuming a successful pcall return from SetAsync means "no other server will ever overwrite this."
- Returning a different type or a huge table from an UpdateAsync transform on some code paths.
- Forgetting to return the existing userIds/metadata from your transform function.
- Using OrderedDataStore for anything except pure numeric rankings.
- Ignoring the 4-second cache when you actually needed the absolute latest value.

Master the distinction between Set and Update, always force fresh reads after questionable writes, and treat every datastore call as a potentially failing remote operation. This alone eliminates the majority of real-world data loss incidents.
