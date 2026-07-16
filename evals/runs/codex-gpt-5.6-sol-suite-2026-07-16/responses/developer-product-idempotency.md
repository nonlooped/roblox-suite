# developer-product-idempotency

The receipt marker and coin balance are updated in the same profile key. Therefore, concurrent or repeated delivery of a `PurchaseId` cannot apply the grant twice.

```lua
--!strict
-- ServerScriptService/ProcessReceipts.server.lua
-- This must be the only script assigning MarketplaceService.ProcessReceipt.

local DataStoreService = game:GetService("DataStoreService")
local MarketplaceService = game:GetService("MarketplaceService")

local profiles = DataStoreService:GetDataStore("PlayerProfiles_v4")

local PRODUCTS: { [number]: number } = {
    [1234567890] = 500,  -- ProductId -> coins
    [1234567891] = 1200,
}

local function copyDictionary(value: any): { [any]: any }
    local result = {}
    if type(value) == "table" then
        for key, child in value do
            result[key] = child
        end
    end
    return result
end

local function includeUserId(existing: { number }, userId: number): { number }
    for _, value in existing do
        if value == userId then
            return existing
        end
    end

    local result = table.clone(existing)
    table.insert(result, userId)
    return result
end

local function readFresh(key: string): (boolean, any)
    local options = Instance.new("DataStoreGetOptions")
    options.UseCache = false

    return pcall(function()
        return profiles:GetAsync(key, options)
    end)
end

local function receiptExists(profile: any, purchaseId: string): boolean
    return type(profile) == "table"
        and type(profile.ProcessedReceipts) == "table"
        and profile.ProcessedReceipts[purchaseId] == true
end

MarketplaceService.ProcessReceipt = function(receiptInfo)
    local productId = receiptInfo.ProductId
    local playerId = receiptInfo.PlayerId
    local purchaseId = receiptInfo.PurchaseId

    if type(productId) ~= "number"
        or type(playerId) ~= "number"
        or type(purchaseId) ~= "string"
    then
        warn("Malformed developer-product receipt")
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end

    local coinGrant = PRODUCTS[productId]
    if coinGrant == nil then
        -- Do not acknowledge an unknown product and silently discard its purchase.
        warn(`Unconfigured developer product {productId}, receipt {purchaseId}`)
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end

    local key = `profile:{playerId}`

    local writeOk, valueOrError = pcall(function()
        return profiles:UpdateAsync(key, function(current: any, info: DataStoreKeyInfo?)
            local profile = copyDictionary(current)
            local coins = profile.Coins or 0

            if type(coins) ~= "number" or coins % 1 ~= 0 or coins < 0 then
                error("Stored Coins value is invalid")
            end

            local receipts = copyDictionary(profile.ProcessedReceipts)
            if receipts[purchaseId] ~= true then
                profile.Coins = coins + coinGrant
                receipts[purchaseId] = true
                profile.ProcessedReceipts = receipts
            end

            local userIds = if info
                then includeUserId(info:GetUserIds(), playerId)
                else { playerId }
            local metadata = if info then info:GetMetadata() else {}

            return profile, userIds, metadata
        end)
    end)

    if writeOk then
        return Enum.ProductPurchaseDecision.PurchaseGranted
    end

    -- UpdateAsync may have committed even though the caller received an error.
    local readOk, freshOrError = readFresh(key)
    if readOk and receiptExists(freshOrError, purchaseId) then
        return Enum.ProductPurchaseDecision.PurchaseGranted
    end

    warn(
        `Receipt unresolved: purchase={purchaseId}, product={productId}, `
            .. `writeError={tostring(valueOrError)}, `
            .. `readResult={tostring(freshOrError)}`
    )

    -- Roblox can deliver the same receipt again. The stable PurchaseId makes
    -- that redelivery safe.
    return Enum.ProductPurchaseDecision.NotProcessedYet
end
```

Nothing outside the `UpdateAsync` callback should increment the balance. After commitment, an online session can replace its cached balance with the returned persisted balance, but it must not independently add the product amount.

Returning `NotProcessedYet` is required whenever persistence remains uncertain. Returning `PurchaseGranted` without a durable receipt marker can permanently lose the grant. The processed-receipt ledger must not be pruned unless an equally durable archive prevents an old receipt from becoming grantable again.
