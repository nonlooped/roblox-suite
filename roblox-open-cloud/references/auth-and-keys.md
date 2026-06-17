---
last_reviewed: 2026-06-17
---

# Open Cloud Authentication and Keys

**Official source:** https://create.roblox.com/docs/en-us/cloud/auth/api-keys

## Three auth models

| Model | Use | Stability |
| --- | --- | --- |
| **API key** (`x-api-key` header) | Most automation, server-to-server, CI/CD | Strong; recommended default |
| **OAuth 2.0** | Apps acting on behalf of other Roblox users (third-party tools with login) | Strong; regular updates |
| **Legacy cookie** | Internal one-off tooling only | Minimal; can break without notice — avoid for production |

## Creating an API key

1. Creator Dashboard → [API Keys](https://create.roblox.com/dashboard/credentials?activeTab=ApiKeysTab) → Create API Key.
2. Name it by purpose (e.g. `PLACE_PUBLISHING_KEY`).
3. **Access Permissions** → pick an API system. Add multiple if needed.
4. If supported, restrict to a specific experience (or disable "Restrict by Experience" for all your experiences — broader blast radius).
5. **Select Operations** → minimum permissions. Each operation documents its required scope (e.g. `FlushMemoryStore` needs `universe.memory-store:flush`). See the [scopes reference](https://create.roblox.com/docs/en-us/cloud/reference/scopes).
6. **Security** → optional IP allowlist in CIDR notation (e.g. `192.168.0.0/24`). Do **not** use IP restrictions for keys called from Roblox game servers (their IPs aren't predictable).
7. Optional expiration date.
8. Save & Generate. **Copy the key now** — you won't see it again.
9. Verify on the [API Extensions](https://create.roblox.com/dashboard/credentials) page.

The key string is a password. Never share it, never commit it, never paste it in a public channel.

## Scopes and resource identifiers

Each scope can carry resource identifiers:
- `userId` / `groupId` — for creator-targeted scopes.
- `universeId` — for experience-targeted scopes.
- `universeDatastore` — `{universeId, datastoreName}` for data-store-object scopes.
- `*` — all resources of that type (broad; avoid where possible).

Example introspect response (see below):

```json
{
  "name": "test key",
  "authorizedUserId": 234,
  "scopes": [
    { "name": "universe-datastores.objects", "operations": ["create"],
      "universeDatastores": [{ "universeId": "123", "datastoreName": "playerData" }] },
    { "name": "asset", "operations": ["write"], "groupIds": ["*"], "userIds": ["*"] }
  ],
  "enabled": true,
  "expired": false,
  "expirationTimeUtc": "2026-01-01T12:00:00.000Z"
}
```

## Group-owned resources: the dedicated account pattern

An API key grants access to **all** resources the owning user can reach — including personal experiences outside the group. If you use your personal key for group automation and it leaks, everything you can touch is exposed.

Official recommendation:
1. Create a new, dedicated Roblox account purely for automation.
2. Invite it to the group.
3. Assign the minimum role needed (e.g. "Create and edit group experiences").
4. Log in as that account and create the API key there.
5. Use that key for group automation.

This isolates blast radius to just the group.

## Key status and the 60-day auto-expiry

| Status | Why | Fix |
| --- | --- | --- |
| Active | OK | — |
| Disabled | You toggled Enable Key off | Toggle on |
| Expired | Expiration passed | Remove/set new expiration |
| **Auto-Expired** | **Unused or unmodified for 60 days** (even without a set expiration) | Disable→enable, or update any property |
| Revoked | Group key: generating account lost access | Regenerate |
| Moderated | Roblox changed the secret for security | Regenerate |
| User Moderated | Generating account under moderation | Resolve moderation |

The 60-day auto-expiry is the #1 cause of "my automation stopped working and I didn't change anything." Either use your keys regularly or build a rotation reminder.

## Introspect endpoint

`POST https://apis.roblox.com/api-keys/v1/introspect` — verify a key from the caller's IP and check moderation status. Use this when debugging unexpected 401/403s.

```bash
curl --location --request POST 'https://apis.roblox.com/api-keys/v1/introspect' \
--header 'Content-Type: application/json' \
--data '{"apiKey": "your-api-key"}'
```

## Best practices summary (official)

- Separate keys per application.
- Minimum permissions; restrict by experience where possible.
- IP restrictions for non-Roblox-server callers.
- Expiration dates for short-term keys.
- Dedicated alternate accounts for group resource management.
- Store keys in a secrets manager; in Roblox places use a [Secrets Store](https://create.roblox.com/docs/en-us/cloud-services/secrets).
- Never share via public channels.
- Use the introspect endpoint to diagnose.
- Disable/delete unused keys — don't rely on auto-expiry as your only cleanup.

## Sources

- https://create.roblox.com/docs/en-us/cloud/auth/api-keys
- https://create.roblox.com/docs/en-us/cloud/reference/scopes
- https://create.roblox.com/docs/en-us/cloud-services/secrets