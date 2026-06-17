---
last_reviewed: 2026-06-17
---

# Limits, Quotas, Throttling, and Error Codes

**Primary source:** https://create.roblox.com/docs/cloud-services/data-stores/error-codes-and-limits (contains the exhaustive tables this document summarizes and expands with usage advice).

## Why This Matters

Data stores are a shared cloud resource. Roblox protects the service (and your experience) with multiple layers of limits:
- Experience-level quotas (scale with total concurrent users across all servers of the universe).
- Per-game-server limits (you can raise these with `DataStoreService:SetRateLimitForRequestType` during server initialization).
- Per-key throttling in some cases.
- Hard queue sizes (when queues of 30 fill, requests are dropped with specific throttle errors).

Exceeding causes dropped requests, errors in the 301+ range (or the more modern *Throttled variants), and eventual player-visible failures (lost progress, failed purchases, broken leaderboards).

**Always** monitor with the Observability dashboard and Data Stores Manager. Use `GetRequestBudgetForRequestType` before bursts and implement waiting/retry logic.

## Experience-Level Limits (formulas)

These are shared across the entire experience.

### Standard Data Stores
- **Read** (GetAsync, GetVersionAsync, GetVersionAtTimeAsync, read portion of UpdateAsync): 250 + concurrentUsers × 40 per minute
- **Write** (SetAsync, IncrementAsync, write portion of UpdateAsync): 250 + concurrentUsers × 20 per minute
- **List** (ListDataStoresAsync, ListKeysAsync, ListVersionsAsync): 10 + concurrentUsers × 2 per minute
- **Remove**: 100 + concurrentUsers × 40 per minute

### Ordered Data Stores
- Read (Get + read of Update): 250 + concurrentUsers × 40
- Write (Set/Increment + write of Update): 250 + concurrentUsers × 20
- List (GetSortedAsync): 100 + concurrentUsers × 2
- Remove: 100 + concurrentUsers × 40

**Important:** UpdateAsync always consumes **both** a read and a write budget for the relevant category.

## Server-Level Limits (configurable)

Default (if you never call SetRateLimitForRequestType):

**Standard data stores:**
- StandardRead (GetAsync, GetVersion*, read portion of UpdateAsync): 60 + numPlayers × 40
- StandardWrite (SetAsync, IncrementAsync, write portion of UpdateAsync): 60 + numPlayers × 40
- StandardList (ListKeysAsync, ListVersionsAsync, ListDataStoresAsync): 5 + numPlayers × 2
- StandardRemove: 60 + numPlayers × 40

**Ordered data stores** (defaults differ — write/remove are much tighter):
- OrderedRead: 60 + numPlayers × 40
- OrderedWrite: **30 + numPlayers × 5**
- OrderedList (GetSortedAsync): 5 + numPlayers × 2 — **note:** `GetRequestBudgetForRequestType(Enum.DataStoreRequestType.OrderedList)` always returns `0`, so do not rely on budget inspection for this type.
- OrderedRemove: **30 + numPlayers × 5**

Note: the `RemoveVersionAsync` `DataStoreRequestType` enum entry is deprecated in the official limits table; prefer versioning recovery workflows in versioning-metadata-recovery.md over relying on that budget category.

You can (and should for migrations or high-traffic servers) call **once per request type early in server startup**:

```lua
local DSS = game:GetService("DataStoreService")
DSS:SetRateLimitForRequestType(Enum.DataStoreRequestType.StandardRead, 1000, 0)  -- example aggressive for migration
DSS:SetRateLimitForRequestType(Enum.DataStoreRequestType.StandardWrite, 2000, 0)
-- etc. See constraints per type in the class reference and error-codes page.
```

The formula the service uses after your call: rateLimit = baseLimit + (perPlayerLimit * currentNumPlayers)

**Studio Run mode note:** Requests made in Studio Run mode use a separate set of static limits that may be lower than those configured with `SetRateLimitForRequestType`. For realistic rate-limit testing, use Studio Team Create or a live test environment rather than Run mode.

There are documented upper/lower bounds per request type for the base and perPlayer arguments. Legacy request types such as `GetSortedAsync` are constrained to small defaults (base [0,5], perPlayer [0,2]); the modern v2 `Standard*` and `Ordered*` categories accept much larger values (base up to 10000, perPlayer up to 200 as of this writing). `UpdateAsync` cannot be configured with this API.

## Budget Inspection API

`DataStoreService:GetRequestBudgetForRequestType(Enum.DataStoreRequestType.StandardRead)` etc.

Returns the remaining requests the current server can still make in the current minute before hitting the configured limit.

**Important exception:** For `Enum.DataStoreRequestType.OrderedList`, the API always returns `0` even though requests still consume quota. Do not wait on this budget or use it to gate `GetSortedAsync` calls.

Common pattern in heavy loops (migration, bulk processing):
```lua
local function waitForBudget(requestType)
    while DSS:GetRequestBudgetForRequestType(requestType) <= 0 do
        task.wait(1)
    end
end
```

Then call waitForBudget before each operation in a batch.

## Listing Pagination Example

Both `DataStoreService:ListDataStoresAsync(prefix?, pageSize?, cursor?)` and `DataStore:ListKeysAsync(prefix?, pageSize?, cursor?, excludeDeleted?)` return `DataStoreListingPages`. Iterate with `GetCurrentPage()` + `AdvanceToNextPageAsync()`, and stop when `IsFinished` is true.

```lua
local function listAllKeys(store, prefix)
    local all = {}
    local success, pages = pcall(function()
        return store:ListKeysAsync(prefix, 50)
    end)
    if not success then
        warn("ListKeysAsync failed:", pages)
        return all
    end

    while true do
        for _, entry in ipairs(pages:GetCurrentPage()) do
            table.insert(all, entry.KeyName)
        end
        if pages.IsFinished then break end
        local ok = pcall(function()
            pages:AdvanceToNextPageAsync()
        end)
        if not ok then break end
    end
    return all
end
```

Use the same pattern for `DataStoreService:ListDataStoresAsync`. List calls consume `StandardList` budget.

## Queues and Hard Drops

Each category has an internal queue of size 30. Requests are processed in order. When the queue is full, new requests are **dropped** with throttle errors (the classic 301 GetAsyncThrottle, 302 SetAsyncThrottle, 304 UpdateAsyncThrottle / TransformThrottle, 305 GetSortedThrottle, etc.).

Even if a request is accepted into the queue, extreme load can still result in later throttling at the experience or key level.

## Per-Key Throughput Limits

In addition to request-count budgets, every individual key is subject to throughput limits based on the serialized bytes read/written over the last 60 seconds. Roblox rounds each request up to the next kilobyte.

- **Read:** 25 MB per minute per key
- **Write:** 4 MB per minute per key

Exceeding these manifests as `DatastoreThrottled` (data store-level) or `KeyThrottled` (key-level) errors. Large profiles, frequent full-object reads/writes, or saving big tables on Heartbeat are common causes. Mitigate by shrinking objects, caching reads, batching deltas, or using MemoryStores for hot transient data.

## Full Error Code Reference (key excerpts + handling)

From the official table (study the complete page for every variant):

**Client-side / validation errors (1xx):**
- 101 KeyNameEmpty
- 102 KeyNameLimit (50 char max)
- 103/104 ValueNotAllowed / CantStoreValue (bad type returned from transform or non-serializable)
- 105 ValueTooLarge (serialized size limit; preview with HttpService:JSONEncode)
- 106/107 various OrderedDataStore GetSorted param errors (pageSize 1-100, min/max integers, min <= max)

**Throttle / queue errors (3xx):**
- 301 GetAsyncThrottle (and equivalents for Set, Increment, Update/Transform, GetSorted, Remove)
- These mean "queue was full when we tried to accept your request."

**Shutdown / access errors (4xx):**
- 401/402 DataModel or LuaWebService inaccessible during shutdown.
- 403 StudioAccessToApisNotAllowed (you forgot to enable it on a test place, or it is enabled on live — bad).
- 404/5xx various internal / corruption signals — retry later.

**Newer experience/server throttled errors (the *Throttled family):**
Hundreds of variants such as:
- StandardReadExperienceThrottled / StandardWriteExperienceThrottled / StandardListExperienceThrottled / StandardRemoveExperienceThrottled
- Same for Ordered*
- GameServerThrottled versions (per-server)
- Also GetVersionAsyncThrottle, ListKeysAsyncThrottle, ListVersionsAsyncThrottle, RemoveVersionAsyncThrottle, etc.

When you see any *Throttled, back off. Check budget. Consider raising your server rate limits (if you control them). Reduce frequency of operations. Use MemoryStores for hot paths.

**Server-side errors (returned inside some failures):**
- DatastoreDeleted, DatastoreThrottled, InternalServerError, KeyThrottled, KeyNotFound, Invalid* various, etc.
- "No pages to advance to" when calling AdvanceToNextPageAsync on the last page.

**Metadata / attribute errors (5xx range in some listings):**
- AttributeSizeTooLarge, UserIdLimitExceeded, AttributeFormatError (userIds must be numbers; metadata must be table).

**Handling strategy (always):**
1. pcall around every call.
2. Inspect the error string or code for the specific number/name.
3. For transient (throttle, internal, shutdown): retry with exponential backoff + jitter (e.g. local delay = math.min(base * 2^(retryCount - 1), cap); task.wait(delay + math.random() * delay * 0.5)).
4. For permanent (bad key name, bad value type, studio not enabled): log loudly and fail gracefully (don't spam retries).
5. After any write error, immediately attempt a fresh Get (UseCache=false) to learn the actual backend state.
6. For leaderboards or sorted pages, be prepared for "IsFinished" and handle the final page gracefully.

See the full error-codes page for the gigantic tables and the exact messages.

## Storage Quota (separate from request quotas)

Calculated from lifetime unique users of the experience. Visible in Data Stores Manager as "Total Size" vs "Storage Limit".

**Formula:** `Total latest-version storage limit = 100 MB + (1 MB × lifetime user count)`

A lifetime user is any user who has joined the experience at least once. Only the latest version of each key counts toward this limit; deleted/replaced keys (even if still accessible through version APIs) do not count. Data stores marked for deletion via Open Cloud continue to count during their 30-day processing period.

Exceeding → estimated monthly overage costs shown. Can lead to operational pain.

Mitigation (best-practices):
- Fewer data stores.
- Larger cohesive objects per key instead of many small keys.
- Delete test/temporary/seasonal data promptly (Manager "Mark for Deletion" or Batch Processor / Open Cloud).
- Use MemoryStores for anything that can expire.
- Monitor the Storage Usage Bytes chart in the observability dashboard.
- Use versioning instead of creating new keys for every historical snapshot.
- Store player data under per-user keys rather than per-data-store.

## Observability Dashboard Charts (use these)

- Storage Usage Bytes (current vs limit)
- Request Count by API (per-minute breakdowns of SetAsync, GetSortedAsync, etc.)
- Request Count by Status (200 OK + all the error families)
- Request by API × Status
- Read / Write / List / Remove Request Type Quota Usage (% against future limits)
- Filterable by Standard vs Ordered

Recent 3 minutes may be incomplete. Supports custom time ranges (up to 30 days).

## Practical Advice

- Call SetRateLimitForRequestType **once per type during server initialization**, never in hot paths.
- For migration scripts that touch thousands of keys, dramatically raise the relevant read/write/list/remove limits, wait for budgets, and process page-by-page with careful error handling.
- Leaderboard GetSortedAsync page iteration consumes list budget at the page-size rate.
- Use the Data Stores Manager for human inspection and one-off reverts/deletes.
- Set up notifications for quota approach/exceed.
- Regularly review the dashboard for anomalies (sudden spikes often indicate a bug such as saving on every Heartbeat or per-frame).

Mastering these limits and the error surface is what separates toy saving code from production-grade systems that survive thousands of concurrent players and years of operation without data incidents.
