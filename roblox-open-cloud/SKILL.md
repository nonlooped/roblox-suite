---
name: roblox-open-cloud
description: "Roblox Open Cloud REST API for accessing data stores, assets, universes, places, users, groups, subscriptions, and Luau execution from outside the engine or via HttpService. Covers authentication (API keys, OAuth 2.0, avoiding legacy cookie auth), scopes and least-privilege, IP allowlists, key rotation and the 60-day auto-expiry rule, Secrets stores, the HttpService-callable subset and its rate limits, webhooks, and in-engine vs Open Cloud decision tree. Use for external automation, CI/CD, bulk data, scheduled snapshots, and cross-experience tooling."
last_reviewed: 2026-07-20
---

# roblox-open-cloud

**Official sources (always check these for the latest):**
- https://create.roblox.com/docs/en-us/cloud (API reference index)
- https://create.roblox.com/docs/en-us/cloud/auth/api-keys (API key management)
- https://create.roblox.com/docs/cloud/auth/oauth2-overview (OAuth 2.0)
- https://create.roblox.com/docs/en-us/cloud-services/http-service (in-experience calls)
- https://create.roblox.com/docs/en-us/cloud/reference/rate-limits
- https://create.roblox.com/docs/en-us/cloud/webhooks/webhook-notifications

Open Cloud is the REST API surface for Roblox resources. It lets you build command-line tools, web apps, CI/CD pipelines, scheduled jobs, and external automation that read and write the same resources your live game servers use — without spinning up a game server.

Cross-reference:
- [roblox-datastores/SKILL.md](../roblox-datastores/SKILL.md) — in-engine DataStore API; Open Cloud Data Stores is the external counterpart.
- [roblox-gamepasses/SKILL.md](../roblox-gamepasses/SKILL.md) — game passes, developer products, and subscriptions also have Open Cloud management endpoints.
- [roblox-networking/SKILL.md](../roblox-networking/SKILL.md) — for in-experience HTTP via `HttpService` and the security model around outbound requests.
- [roblox-core/SKILL.md](../roblox-core/SKILL.md) — services, `HttpService`, script contexts.

## When to use this skill

Activate when:
- Building external automation that reads/writes Roblox resources (data stores, places, assets, groups, users).
- Implementing CI/CD for place publishing or asset upload.
- Doing bulk data operations (migration, cleanup, RTBF deletion, snapshot/restore) at a scale that's painful from in-engine scripts.
- Receiving webhook notifications (subscription purchased/refunded/renewed, etc.).
- Calling Open Cloud endpoints from inside a live game server via `HttpService` (e.g. updating a group membership from in-experience).
- Managing API keys, OAuth 2.0 clients, or secrets for Roblox automation.

Do **not** use Open Cloud for what the in-engine API already does well inside a running server (normal DataStore reads/writes, Marketplace prompts, etc.). Use it for the things the engine *can't* do: external triggers, bulk ops, cross-experience tooling, scheduled jobs, and webhooks.

## Authentication

Three auth models, in order of preference:

### 1. API keys (recommended for most automation)

All Open Cloud APIs accept an `x-api-key` header containing an API key string. Create keys on the [Creator Dashboard → API Keys](https://create.roblox.com/dashboard/credentials?activeTab=ApiKeysTab) page.

- A key's access is determined by the **permissions of the user who owns it** — it can reach any resource that user can, including their personal experiences and any group-owned experiences where they have the right role.
- Some scopes can be restricted to specific experiences; not all.
- **Best practices** (from the official docs):
  - Create **separate keys per application** to isolate blast radius.
  - Select the **minimum permissions** needed; restrict scope to specific experiences where possible.
  - Use **IP restrictions** (CIDR notation) — but **not** when calling from Roblox game servers (Roblox server IPs aren't known/predictable).
  - Set **expiration dates** for short-term keys; avoid them for long-term use without a rotation process.
  - **Never** store keys in source control, scripts, or public channels. Use a secrets manager; in Roblox places use a [Secrets Store](https://create.roblox.com/docs/en-us/cloud-services/secrets).
  - For **group-owned resources**, create a dedicated alternate account with only the target group access and generate the key there — don't use your personal account's key for group automation.

### 2. OAuth 2.0 (for apps acting on behalf of other users)

Use OAuth 2.0 when your app needs to act on behalf of a Roblox user who isn't you (e.g. a third-party tool a creator logs into). See https://create.roblox.com/docs/cloud/auth/oauth2-overview. Has stronger stability guarantees and regular updates.

### 3. Legacy cookie auth (avoid)

Legacy APIs use cookie-based auth, can break without notice, and have minimal stability guarantees. **Not recommended for production.** Only use for one-off internal tooling where breakage is acceptable.

## API key lifecycle

API keys have these statuses (from the official docs):

| Status | Reason | Resolution |
| --- | --- | --- |
| Active | No issues. | N/A |
| Disabled | You toggled **Enable Key** off. | Toggle it back on. |
| Expired | Expiration date passed. | Remove or set a new expiration. |
| Auto-Expired | **Unused or unmodified for 60 days** (even without a set expiration). | Disable then re-enable, or update any property. |
| Revoked | Group key: the generating account lost group access. | Regenerate the key. |
| Moderated | A Roblox admin changed the key secret for security. | Regenerate. |
| User Moderated | The generating account is under moderation. | Resolve the moderation. |

The 60-day auto-expiry is the most common surprise: keys you set up and forget will silently stop working. Either use them regularly or build a rotation/reminder process.

### Introspect endpoint

`POST https://apis.roblox.com/api-keys/v1/introspect` verifies whether a key is usable from the caller's IP and whether the key/user is moderated. Useful for debugging "why is my key failing":

```bash
curl --location --request POST 'https://apis.roblox.com/api-keys/v1/introspect' \
--header 'Content-Type: application/json' \
--data '{"apiKey": "your-api-key"}'
```

Returns the key name, authorized user, scopes (with `userId`/`groupId`/`universeId`/`universeDatastore` resource identifiers — `*` means all resources of that type), `enabled`, `expired`, and `expirationTimeUtc`.

## The endpoint map

Base URL: `https://apis.roblox.com/cloud/v2/...` (plus a few `apis.roblox.com/<feature>/v1/...` legacy paths for assets). All v2 endpoints accept `x-api-key`.

### Data & memory stores (the most-used surface)

**Data stores** (`/cloud/v2/universes/{universe_id}/data-stores/...`):
- `ListDataStores`, `SnapshotDataStores` (daily snapshot trigger).
- `ListDataStoreEntries`, `CreateDataStoreEntry`, `GetDataStoreEntry`, `UpdateDataStoreEntry`, `IncrementDataStoreEntry`, `DeleteDataStoreEntry`.
- `ListDataStoreEntryRevisions` (version history per entry).
- Scoped variants under `/data-stores/{data_store_id}/scopes/{scope}/entries/...`.
- **Rate limits (v2):** share the experience Data Store request budgets with in-engine APIs (read/write/list/remove scale with concurrent users). See [error codes & limits](https://create.roblox.com/docs/cloud-services/data-stores/error-codes-and-limits#access-limits) and rate-limit external callers (fixed spacing or leaky bucket). Do not assume Open Cloud has a separate unlimited pool.
- **Legacy v1** (`/datastores/v1/`, `/ordered-data-stores/v1/`): after July 29, 2026 the fixed non-scaling tables on the [throttling guide](https://create.roblox.com/docs/cloud/guides/data-stores/throttling) apply only to those legacy paths.

**Memory stores** (`/cloud/v2/universes/{universe_id}/memory-stores/...`):
- Sorted maps: `ListMemoryStoreSortedMapItems`, `CreateMemoryStoreSortedMapItem`, `GetMemoryStoreSortedMapItem`, `UpdateMemoryStoreSortedMapItem`, `DeleteMemoryStoreSortedMapItem`.
- Queues: `CreateMemoryStoreQueueItem`, `ReadMemoryStoreQueueItems`, `DiscardMemoryStoreQueueItems`.
- `FlushMemoryStore` (requires `universe.memory-store:flush`).

**Ordered data stores** (`/cloud/v2/universes/{universe_id}/ordered-data-stores/...`):
- `ListOrderedDataStoreEntries`, `CreateOrderedDataStoreEntry`, `GetOrderedDataStoreEntry`, `UpdateOrderedDataStoreEntry`, `IncrementOrderedDataStoreEntry`, `DeleteOrderedDataStoreEntry`.
- Same shared experience budget model as standard Data Stores v2 (see error-codes page).

### Universes & places

- `GetUniverse`, `UpdateUniverse`.
- `PublishUniverseMessage` (publish a message to all servers of a universe — external counterpart to `MessagingService`).
- `RestartUniverseServers` (restart all live servers of a universe).
- `GetPlace`, `UpdatePlace` (publish a place version — the CI/CD primitive).
- `GetInstance`, `UpdateInstance`.

### Assets

- `GetAsset`, `ListAssetVersions`, `GetAssetVersion` (v1 path: `apis.roblox.com/assets/v1/assets/{assetId}`).
- Asset upload (images, audio, models) via the assets API — useful for batch-importing content.

### Users & inventories

- `GetUser`, `GenerateUserThumbnail`.
- `ListInventoryItems`.

### Groups

- `GetGroup`, `ListGroupMemberships`, `UpdateGroupMembership`, `ListGroupRoles`, `GetGroupRole`, `ListGroupJoinRequests`, `AcceptGroupJoinRequest`, `DeclineGroupJoinRequest`, `GetGroupShout`.

### Monetization (cross-ref roblox-gamepasses)

- Game passes: `CreateGamePass`, `UpdateGamePass`, `GetGamePassConfig`, `ListGamePassConfigsByUniverse`.
- Developer products: `CreateDeveloperProduct`, `UpdateDeveloperProduct`, `GetDeveloperProductConfig`, `ListDeveloperProductConfigsByUniverse`.
- Subscriptions: managed via subscription endpoints; webhook events for `cancelled`/`purchased`/`refunded`/`renewed`.

### Moderation & bans

- `ListUserRestrictions`, `GetUserRestriction`, `UpdateUserRestriction` (place- and universe-scoped), `ListUserRestrictionLogs`.

### Luau execution

- `CreateLuauExecutionSessionTask` (run Luau against a universe/place from outside the engine — powerful for automation, treat as privileged).

### Notifications & configs

- `CreateUserNotification` (send a notification to a user from outside the experience).
- Configs (CreatorConfigs): `GetConfigRepositoryValues`, draft/publish/revision flow for live configuration.

### Creator Store

- `CreateCreatorStoreProduct`, `GetCreatorStoreProduct`, `UpdateCreatorStoreProduct`, `CreatorStoreAssetsSearch`.

See https://create.roblox.com/docs/en-us/cloud for the full, current list (new endpoints are added regularly).

## Calling Open Cloud from in-experience (`HttpService`)

A subset of Open Cloud endpoints is callable from inside a live game server via `HttpService`. This is how you do things like update group memberships or kick users from external triggers without leaving the experience.

**Requirements:**
- Enable **Allow HTTP Requests** in Experience Settings.
- The API key must be stored as a `Secret` via the [Secrets Store](https://create.roblox.com/docs/en-us/cloud-services/secrets) — retrieve it with `HttpService:GetSecret("APIKey")`. Never hardcode the key in a script.
- Only the `x-api-key` and `content-type` headers are allowed.
- The `x-api-key` value must be a `Secret` datatype, not a string.
- The `..` string is **not allowed** in URL path parameters (so data stores/entries containing `..` are inaccessible from `HttpService`).
- Only HTTPS; no ports below 1024 except 80/443; port 1194 blocked.

**Rate limits (per game server):**
- **2500 Open Cloud requests per minute** per server. Exceeding stalls request methods for ~30 seconds and `pcall` may fail with "Number of Open Cloud requests exceeded limit."
- Open Cloud requests **do not** count against the separate 500-req/min general HTTP limit.
- Each endpoint also has a per-key-owner limit enforced regardless of where calls originate.

Example — updating a group membership from in-experience:

```lua
--!strict
local HttpService = game:GetService("HttpService")

local function updateGroupMembership(groupId: string, membershipId: string, roleId: string)
    local response
    local ok, err = pcall(function()
        response = HttpService:RequestAsync({
            Url = `https://apis.roblox.com/cloud/v2/groups/{groupId}/memberships/{membershipId}`,
            Method = "PATCH",
            Headers = {
                ["Content-Type"] = "application/json",
                ["x-api-key"] = HttpService:GetSecret("APIKey"), -- Secret, not string
            },
            Body = HttpService:JSONEncode({ role = `groups/{groupId}/roles/{roleId}` }),
        })
    end)
    if not ok then
        warn("HTTP request failed:", err)
        return false
    end
    if response.Success then
        print("Updated:", response.StatusCode, response.StatusMessage)
        return true
    end
    warn("Error:", response.StatusCode, response.StatusMessage)
    return false
end
```

**Best practices:** pcall everything; retry safe reads by default, but retry mutations only with endpoint-specific idempotency semantics. On 429, honor `retry-after`, then `x-ratelimit-reset`, before bounded exponential backoff. Always retain the last response/error and do not sleep after the final attempt. Aggregate into bulk endpoints where possible; rely on HTTP/2 (automatic, but send lowercase header names). The Observability Dashboard (Creator Hub → Monitoring) shows request count and response time for your `HttpService` calls.

## Webhooks

Open Cloud emits webhooks for certain events, including **subscription** events (`cancelled`, `purchased`, `refunded`, `renewed`). Set up a webhook endpoint in your app, register it via the Cloud API, and Roblox will POST event payloads to it. This is the real-time path for subscription analytics without polling `GetUserSubscriptionPaymentHistoryAsync`. See https://create.roblox.com/docs/en-us/cloud/webhooks/webhook-notifications.

## Decision tree: in-engine vs Open Cloud

| Need | Use |
| --- | --- |
| Normal player data read/write during a live server | In-engine `DataStoreService` |
| External bulk migration, cleanup, RTBF deletion | Open Cloud Data Stores |
| Scheduled daily snapshot before a risky publish | Open Cloud `SnapshotDataStores` |
| Restart all servers after a config change | Open Cloud `RestartUniverseServers` |
| Publish a place from CI | Open Cloud `UpdatePlace` |
| Upload many assets programmatically | Open Cloud Assets |
| Update a group role from in-experience | `HttpService` + Open Cloud `UpdateGroupMembership` |
| Send a notification to a user outside the experience | Open Cloud `CreateUserNotification` |
| Real-time subscription event analytics | Open Cloud webhooks |
| Normal monetization prompts/grants in-experience | In-engine `MarketplaceService` |
| Manage game pass/dev product config externally | Open Cloud game passes / developer products |

## Security checklist

- [ ] Keys stored in a secrets manager or Secrets Store, never in source/scripts.
- [ ] Minimum-permission scopes; experience-restricted where possible.
- [ ] IP restrictions for non-Roblox-server callers.
- [ ] Expiration dates on short-term keys; rotation process for long-term.
- [ ] Dedicated automation account for group resources (not your personal account).
- [ ] No `..` in data store keys you need to reach from `HttpService`.
- [ ] pcall every call; retry reads safely and require explicit idempotency before mutation retries.
- [ ] `x-api-key` passed as `Secret` from `HttpService`, not string.
- [ ] Audit key usage via the introspect endpoint and the Observability Dashboard.
- [ ] Disable/delete unused keys (they auto-expire after 60 days anyway, but don't rely on that as your only cleanup).
- [ ] Treat `CreateLuauExecutionSessionTask` as privileged — it runs Luau against your universe.

## Common mistakes this skill prevents

- Using legacy cookie-auth APIs for production (they break without notice).
- Storing API keys in scripts or source control.
- Using a personal account's key for group automation (compromises all your resources if the key leaks).
- Hitting the 2500-req/min `HttpService` Open Cloud limit by not batching.
- Running bulk Open Cloud v2 Data Store jobs without a client-side rate limiter (shared experience budget → live servers throttle).
- Expecting `..` in data store keys to work from `HttpService` (it doesn't).
- Forgetting the 60-day auto-expiry and having automation silently break.
- Using Open Cloud for things the in-engine API already does (unnecessary external dependency and latency).

## How to proceed

1. Identify whether the task is in-engine or external. If external, Open Cloud.
2. Create an API key with the minimum scopes for the task. If group-owned, use a dedicated account.
3. Store the key in a Secrets Store if calling from `HttpService`; otherwise in your secrets manager.
4. Test with the introspect endpoint and a single GET.
5. Build the workflow with pcall, header-aware rate limiting, and method/endpoint-aware retries. For bulk, prefer batch endpoints.
6. Set up webhooks for events you want in real time (subscriptions).
7. Monitor via the Observability Dashboard; rotate/replace keys before they auto-expire.

## Sources

- https://create.roblox.com/docs/en-us/cloud
- https://create.roblox.com/docs/en-us/cloud/auth/api-keys
- https://create.roblox.com/docs/cloud/auth/oauth2-overview
- https://create.roblox.com/docs/en-us/cloud-services/http-service
- https://create.roblox.com/docs/en-us/cloud/reference/rate-limits
- https://create.roblox.com/docs/cloud-services/data-stores/error-codes-and-limits (Open Cloud v2 Data Store shared budgets)
- https://create.roblox.com/docs/cloud/guides/data-stores/throttling (legacy v1 Data Store limits)
- https://create.roblox.com/docs/en-us/cloud/webhooks/webhook-notifications
- https://create.roblox.com/docs/en-us/cloud-services/secrets

<!-- catalog:references:start -->
## Reference index

- [auth-and-keys.md](references/auth-and-keys.md)
- [calling-from-in-experience.md](references/calling-from-in-experience.md)
<!-- catalog:references:end -->
