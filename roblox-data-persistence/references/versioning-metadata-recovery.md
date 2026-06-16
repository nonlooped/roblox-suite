# Versioning, Metadata, and Recovery

Detailed coverage of the versioning system, DataStoreKeyInfo, user-defined metadata, recovery workflows, snapshots, and the Data Stores Manager.

Drawn from https://create.roblox.com/docs/cloud-services/data-stores/versioning-listing-and-caching and class references for DataStore / GlobalDataStore.

## How Versioning Works

Writes via SetAsync, UpdateAsync, and IncrementAsync on standard (non-Ordered) data stores automatically create versioned backups.

- The first write to a key in a given UTC hour creates a new version snapshot.
- Subsequent writes to the same key in the same UTC hour overwrite the data for that hourly version.
- Versioned backups expire approximately 30 days after they are superseded by a newer write.
- The *current* (latest) version of a key never expires.

OrderedDataStores have **no versioning** at all. RemoveAsync on an OrderedDataStore is a true permanent delete.

## KeyInfo Object (returned by many reads)

When using the full DataStore path you often receive a second return value:

- Version (string identifier)
- CreatedTime, UpdatedTime (Unix ms since epoch)
- GetUserIds() → array of numbers you associated on write
- GetMetadata() → table you associated via SetOptions

On UpdateAsync the transform receives the current KeyInfo as the second argument so you can read (and choose to preserve or modify) userIds and metadata.

**Rule:** When calling SetAsync/UpdateAsync/IncrementAsync with metadata, you must always pass a (possibly unchanged) metadata table. Omitting it or passing nil will clear prior metadata.

## Core Versioning APIs (on the standard DataStore path)

- `ListVersionsAsync(key, sortDirection?, minDateMillis?, maxDateMillis?, pageSize?)` → DataStoreVersionPages
  - SortDirection.Ascending or Descending (default Ascending in some contexts).
  - Filter by time range.
  - Returns pages of DataStoreObjectVersionInfo (Version, CreatedTime, IsDeleted, etc.).

- `GetVersionAsync(key, versionString)` → (value, KeyInfo) for that exact historical version.

- `GetVersionAtTimeAsync(key, timestampMillis)` → the version that was current at (or the closest before) the given time. Extremely useful for "the player says the bug happened around 3:42 UTC on the 12th".

- `RemoveVersionAsync(key, versionString)` → permanently deletes that specific historical version. It does *not* affect the current value or other versions, and it does *not* create a tombstone.

Normal `RemoveAsync(key)` creates a new tombstone *current* version (GetAsync returns nil) while leaving all previous versions intact for recovery.

## Listing Keys and Data Stores

Both `DataStoreService:ListDataStoresAsync(prefix?, pageSize?, cursor?)` and `DataStore:ListKeysAsync(prefix?, pageSize?, cursor?, excludeDeleted?)` return `DataStoreListingPages`. Iterate with `GetCurrentPage()` and `AdvanceToNextPageAsync()` until `IsFinished` is true.

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

Use the same pattern for `DataStoreService:ListDataStoresAsync`. List operations consume `StandardList` budget.

## Practical Recovery Workflow (example from official docs)

```lua
local maxDate = DateTime.fromUniversalTime(2020, 10, 9, 1, 42)  -- time of the incident

local listSuccess, pages = pcall(function()
    return store:ListVersionsAsync(DATA_STORE_KEY, Enum.SortDirection.Descending, nil, maxDate.UnixTimestampMillis)
end)

if listSuccess then
    local items = pages:GetCurrentPage()
    if #items > 0 then
        local closest = items[1]
        local success, value, info = pcall(function()
            return store:GetVersionAsync(DATA_STORE_KEY, closest.Version)
        end)
        if success then
            local setOptions = Instance.new("DataStoreSetOptions")
            setOptions:SetMetadata(info:GetMetadata() or {})
            local restored, restoreErr = pcall(function()
                return store:SetAsync(DATA_STORE_KEY, value, info:GetUserIds() or {}, setOptions)
            end)
            if not restored then
                warn("Restore SetAsync failed:", restoreErr)
            end
            -- The restore itself creates a new current version with the old data.
        end
    end
end
```

You can also do this interactively through the Data Stores Manager in Creator Hub (select key → select old version → Compare or Revert). Note that the Manager's **Revert** button reverts a key to a previous version by creating a new current version with the old data; this is equivalent to the `SetAsync` restore pattern above. The **Restore** button is for data stores marked for deletion, not for reverting key values.

## Metadata Use Cases

- Tagging data for analytics or cleanup ("EventSummer2026", "BetaTester").
- Storing extra context that travels with the key (source of the data, schema version).
- Assisting automated RTBF / right-to-be-forgotten processing (combined with the userIds array).

Metadata is returned on Get, GetVersion, etc., and must be round-tripped on writes if you want to keep it.

## Snapshots (Open Cloud)

Before any risky publish that changes data storage logic, take a manual snapshot of all data stores via the Snapshot Data Stores Open Cloud API (daily automated snapshots may also be available).

A snapshot taken at 3:29 UTC protects all data written before that time even if your 3:30 publish immediately corrupts data for keys written in the following minutes.

## Data Stores Manager Capabilities (human + permissioned ops)

- Browse all data stores (filter by prefix).
- Drill into a data store → list keys (prefix filter).
- Inspect a key: current value, metadata, full version history, last update time, status (deleted or not).
- Compare any two versions side-by-side.
- Revert a key to a previous version (requires Edit Data Stores permission).
- Mark data store or individual key for deletion (cooldown period; a deleted key can be restored during the cooldown by calling `UpdateAsync` from the Engine API or `UpdateDataStoreEntry` from Open Cloud).

Permissions (group experiences): View Data Stores, Edit Data Stores, Delete Data Stores, plus the broad "Edit all group experiences".

## Best Practices Around Versioning & Recovery

- Design keys so that a single key = a coherent self-contained object (player profile, not "gold for player X + separately inventory for player X"). This makes version restores consistent.
- Use versioning instead of creating new keys for every historical save (saves storage quota and key count).
- Before major refactors of your save/load code, take a snapshot.
- Train your team on the Manager for quick human triage of player reports ("I lost my items at 14:20").
- Document the schema version inside metadata so that on restore you know whether the old data is still compatible with current code.
- For very large experiences, combine versioning with the Batch Processor / Open Cloud for bulk recovery or inspection when the Manager becomes impractical (experiences with >100 data stores may hide some aggregate numbers).

Versioning is one of the strongest safety nets Roblox gives you for free. Use the List/Get/RemoveVersion and GetVersionAtTime APIs, the Manager UI, and snapshots proactively rather than only after a disaster.
