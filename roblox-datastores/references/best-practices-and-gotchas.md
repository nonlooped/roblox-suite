---
last_reviewed: 2026-07-20
---

# Best Practices and Common Gotchas

> The September 2026 request-scheduling, serialization, and session-locking corrections below are experimental guidance pending a second human review. They follow the linked official sources; the suite does not provide a tested session-lock implementation.

Synthesized from the official "Best practices for data stores" page + all the error codes, limits, versioning, caching, and class reference material.

## Official general best practices

- **Create fewer data stores.** Data stores behave like database tables. Fewer stores + related data grouped together lets you configure and operate them more efficiently.
- **Use a single object for related data.** Fetch/save a player's entire relevant state in one key when possible (respects the ~4 MB serialized limit, keeps versions consistent, reduces round-trips).
- **Use key prefixes to organize.** "profiles/User_1234", "inventory/User_1234", etc. Then ListKeysAsync("profiles/") gives you clean filtered results. Preferred over (or in addition to) legacy scopes for new work.

## Optimization & Quota Hygiene

- Monitor constantly: Data Stores Dashboard (Creator Hub Monitoring) for request volume, status codes, and quota % usage. Data Stores Manager for actual stored size vs lifetime-user-based limit (`500 MB + 1 MB × lifetime users`, compressed latest-version size).
- Set up notifications for approaching or breaching storage limits.
- Store normal serializable tables; do **not** pre-compress values — Roblox compresses on write and measures quota on compressed size.
- Rate-limit Open Cloud v2 Data Store clients separately; they share the experience request budget with live servers.
- Delete aggressively after testing or events: use Manager "Mark for Deletion" (cooldown; keys can be restored via `UpdateAsync` from the Engine API or `UpdateDataStoreEntry` from Open Cloud during the cooldown), Batch Processor CLI, or Open Cloud bulk delete.
- Prefer versioning + restore over "save a new key for every version".
- Use MemoryStores for anything that does not truly need to survive server restarts or long player absences.
- Clean up seasonal/temporary feature data promptly.
- Store player data under per-user *keys* rather than creating per-player data stores.
- Review usage trends regularly; sudden spikes usually indicate a code bug (e.g. saving inside a loop or on every input).

## Request scheduling

- Randomize each player or server's initial autosave offset; use bounded interval jitter for polling that does not need an exact cadence.
- Retry transient failures with capped exponential backoff and jitter, preserving operation order per key. An old retry must not overwrite a newer save. An ambiguous write needs reconciliation or idempotency before replay.
- Use stable identifiers in keys and deterministic shards only when throughput requires them. Keep values that must change atomically in one key.

Source: https://create.roblox.com/docs/cloud-services/data-stores/best-practices.

## Caching Gotchas

- Cache is per DataStore *instance* (different scope or AllScopes setting = different cache).
- A write on one instance does not invalidate the cache on another instance pointing at the "same" logical store.
- After any write error, always verify with GetAsync(..., {UseCache = false}).
- Normal Gets inside the 4-second window are "free" (don't count against budgets) but can be stale.

## Serialization & Data Shape Gotchas

- Prefer finite numbers. Existing inf/-inf/nan values are represented as tagged JSON objects by Open Cloud, not ordinary JSON numbers; see [serialization rules](core-operations-and-patterns.md).
- UTF-8 strings only. Lone high bytes are fatal.
- Test suspect data with HttpService:JSONEncode before trusting a save path.
- Large objects or very deep tables increase latency and risk ValueTooLarge.
- When returning from UpdateAsync transform, be consistent about type and always return the userIds/metadata you want to keep.

## Concurrency & Multi-Server Reality

- Multiple servers can (and will) be reading/writing the same keys for the same player (rejoins, multiple places, etc.).
- SetAsync is not safe for contended values.
- UpdateAsync + pure transform is the tool designed exactly for this.
- OnUpdate is deprecated — use MessagingService for cross-server pub/sub when you need near-real-time notifications.

## Studio, Testing, and Lifecycle Gotchas

- Studio API access must be explicitly enabled per place (Security settings). Never do this on a live/production place.
- Data in Studio with API access enabled writes to the exact same backend as the live game. Use separate test experiences/universes.
- Studio Run mode uses its own static limits, which may be lower than `SetRateLimitForRequestType` settings. Test rate-limit-sensitive logic in Team Create or a live test environment.
- BindToClose gives you up to ~30 seconds to finish final saves — use it, but don't assume unlimited time.
- CharacterRemoving vs PlayerRemoving timing varies; have a robust final-save strategy.

## Error & Throttle Handling Gotchas

- A "failed" write does not prove the backend did not apply the change. Always verify with a fresh read when the outcome matters.
- Throttle errors (301-306 family and the *Throttled family) mean you are either at experience quota or the per-server queue filled. Back off; do not tight-loop retry.
- Shutdown errors (4xx during experience close) are normal — your final saves in BindToClose may see them.
- "Key not found" after RemoveAsync is expected (tombstone).
- OrderedDataStore has its own error surface (page size, min/max integers, etc.).

## Session Locking

For profiles that must not be edited by two servers simultaneously, coordinate ownership in the profile key's metadata and check it in the same `UpdateAsync` transform as the data write. A lock in a separate key does not make the profile write atomic with the ownership check.

- Acquire a unique lock token only when the existing lock is absent or expired.
- Every save and lease renewal must verify that the token is still this session's token. A session that loses ownership must stop saving; an absent lock later does not restore its ownership.
- Choose the lease and renewal interval together so throttling and normal save delays do not cause routine expiry. Keep periodic saves shorter than the lease.
- Save and release through the same key's ownership-checked update. Reconcile ambiguous failures before assuming the final save or release succeeded.
- Keep transforms free of side effects and preserve user IDs and metadata. Serializing requests per key is still necessary.

Study the official [player data and purchasing sample](https://create.roblox.com/docs/cloud-services/data-stores/player-data-purchasing#session-locking) before implementing this protocol. The suite's `SafeDataStore` helper is not a session-locking system; adapt and integration-test ownership transfer and crash recovery separately.

## Security & Privacy

- Never store secrets, auth tokens, or PII that you don't need.
- Always associate userIds on writes for data you may later need to delete under RTBF requests.
- Use the documented key template patterns + manual verification against live data (via Manager or ListKeys) before relying on automated deletion.
- Server-only access is mandatory. Any client-visible datastore key or value is a potential exploit vector.

## When to Break the "Fewer Stores" Rule

Only when you have a genuine need for completely different rate-limit or permission characteristics, or when you are deliberately isolating experimental vs production data. In almost all cases one well-organized store (or a small number) per major domain (player data, economy, world state, leaderboards) is superior.

## Summary Checklist (print this in your team docs)

- [ ] Using the right variant (Ordered only for numeric sorted queries, standard DataStore when you need versions/metadata).
- [ ] UpdateAsync for any contended player-owned value.
- [ ] pcall + specific error handling + fresh verification read after failures.
- [ ] Budget waiting + sensible server rate limits set at init.
- [ ] Consistent key prefixing + metadata/userIds.
- [ ] Regular dashboard + Manager reviews.
- [ ] Test data cleaned; snapshots before risky changes.
- [ ] MemoryStores used for transient high-churn data.
- [ ] No client access, no secrets in DS, RTBF-ready userIds.

Following these turns "it usually saves" code into systems that survive real production load for years.
