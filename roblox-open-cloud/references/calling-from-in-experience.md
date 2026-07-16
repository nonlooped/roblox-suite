---
last_reviewed: 2026-07-16
---

# Calling Open Cloud from In-Experience

**Official source:** https://create.roblox.com/docs/en-us/cloud-services/http-service

A subset of Open Cloud endpoints is callable from inside a live game server via `HttpService`. This lets you do things like update group memberships, manage bans, or publish universe messages from within the experience without an external server.

## Prerequisites

1. **Allow HTTP Requests** in Experience Settings (Studio → Game Settings → Security, or the dashboard).
2. **Create an API key** with the scopes for the endpoints you'll call.
3. **Save the key to a Secrets Store** and retrieve it with `HttpService:GetSecret("APIKey")`. Never hardcode a key in a script — client-visible scripts are exploitable and the key would leak.

## Constraints

- Only the `x-api-key` and `content-type` headers are allowed.
- `x-api-key` must be a `Secret` datatype (from `HttpService:GetSecret`), not a plain string.
- The `..` string is **not allowed** in URL path parameters. Data stores or entries whose key/name contains `..` are unreachable from `HttpService`.
- HTTPS only. Ports below 1024 blocked except 80 and 443; port 1194 blocked.
- HTTP/2 is used automatically when available — send header names in lowercase.

## Rate limits

- **2500 Open Cloud requests per minute** per game server. Exceeding stalls request methods for ~30 seconds; `pcall` may fail with "Number of Open Cloud requests exceeded limit."
- Open Cloud requests do **not** count against the separate 500-req/min general HTTP limit.
- Each endpoint also has a per-key-owner limit enforced regardless of caller.

## Supported endpoints (subset)

The full list is in the official doc; categories include:
- **Assets** — `GetAsset`, `ListAssetVersions`, `GetAssetVersion`.
- **Bans/blocks** — `ListUserRestrictions`, `GetUserRestriction`, `UpdateUserRestriction` (place and universe scoped), `ListUserRestrictionLogs`.
- **Configs** — CreatorConfigs draft/publish/revision flow.
- **Creator Store** — product CRUD + search.
- **Developer products** — create/update/get/list configs.
- **Game passes** — create/update/get/list configs.
- **Data & memory stores** — data stores (list/snapshot/entries CRUD/increment/revisions), memory stores (sorted maps, queues, flush), ordered data stores (CRUD/increment).
- **Groups** — get, memberships, roles, join requests, shout.
- **Inventories** — `ListInventoryItems`.
- **Luau execution** — `CreateLuauExecutionSessionTask` (privileged).
- **Notifications** — `CreateUserNotification`.
- **Places** — get/update place, get/update instance.
- **Universes** — get/update, publish message, restart servers.
- **Users** — get, generate thumbnail.

New endpoints are added to the supported list over time; check the official doc for the current set.

## Pattern

```lua
--!strict
local HttpService = game:GetService("HttpService")

local function callOpenCloud(method: string, path: string, body: any?)
    local response
    local ok, err = pcall(function()
        response = HttpService:RequestAsync({
            Url = `https://apis.roblox.com/cloud/v2/{path}`,
            Method = method,
            Headers = {
                ["Content-Type"] = "application/json",
                ["x-api-key"] = HttpService:GetSecret("APIKey"), -- Secret
            },
            Body = if body ~= nil then HttpService:JSONEncode(body) else nil,
        })
    end)
    if not ok then
        warn("Open Cloud request failed:", err)
        return false, nil
    end
    if not response.Success then
        warn(`Open Cloud error {response.StatusCode}: {response.StatusMessage}`)
        return false, response
    end
    return true, response
end
```

## Best practices (official)

- **pcall everything** and handle failures with a plan (retry, degrade, alert).
- Retry safe reads by default, but require endpoint-specific idempotency semantics before retrying mutations. A transport error or 5xx can occur after a mutation was processed.
- On HTTP 429, honor `retry-after` first and `x-ratelimit-reset` when available; use bounded exponential backoff only when the response supplies no delay.
- Return the last response/error, and never sleep after the final attempt. Only send an idempotency header when both the endpoint and the in-experience header allowlist support it.
- **Batch where possible** — aggregate per-player data into one request if a bulk endpoint exists.
- Validate and sanitize all received data.
- Monitor via the **Observability Dashboard** (Creator Hub → Monitoring) — Request Count and Response Time charts, filterable by request type, status, and endpoint.

## When *not* to use this

- For data store operations you can do with in-engine `DataStoreService` — that's faster, has budget integration, and doesn't burn the 2500/min `HttpService` Open Cloud budget.
- For monetization prompts/grants — use in-engine `MarketplaceService`.
- For anything the client can see the source of — keys in client scripts are exploitable.

Use `HttpService` + Open Cloud when the in-engine API genuinely can't do the thing (group management, external-triggered bans, universe-wide message publish from a specific server, etc.).

## Sources

- https://create.roblox.com/docs/en-us/cloud-services/http-service
- https://create.roblox.com/docs/en-us/cloud-services/secrets
- https://create.roblox.com/docs/en-us/cloud/reference/rate-limits