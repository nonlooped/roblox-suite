# developer-product-idempotency

This flow grants currency and records `PurchaseId` in one profile mutation. It supports offline grants and returns `PurchaseGranted` only after the receipt marker is known to exist.

```luau
-- ServerScriptService/ProcessReceipts.server.lua
local DataStoreService = game:GetService("DataStoreService")
local MarketplaceService = game:GetService("MarketplaceService")

local profiles = DataStoreService:GetDataStore("Profiles_v1")

local PRODUCT_GRANTS: {[number]: number} = {
	[1234567890] = 100,
	[1234567891] = 500,
}

local function containsReceipt(profile: any, purchaseId: string): boolean
	return typeof(profile) == "table"
		and typeof(profile.processedReceipts) == "table"
		and profile.processedReceipts[purchaseId] ~= nil
end

local function persistReceipt(
	userId: number,
	productId: number,
	purchaseId: string,
	coinGrant: number
): boolean
	local key = "user:" .. userId

	local ok = pcall(function()
		return profiles:UpdateAsync(key, function(old, keyInfo)
			local profile = if typeof(old) == "table" then table.clone(old) else {}
			local receipts =
				if typeof(profile.processedReceipts) == "table"
					then table.clone(profile.processedReceipts)
					else {}

			if receipts[purchaseId] ~= nil then
				return profile,
					keyInfo and keyInfo:GetUserIds() or {userId},
					keyInfo and keyInfo:GetMetadata() or {}
			end

			local coins = profile.coins
			if typeof(coins) ~= "number"
				or coins ~= math.floor(coins)
				or coins < 0
			then
				coins = 0
			end

			profile.coins = coins + coinGrant
			receipts[purchaseId] = {
				productId = productId,
				coins = coinGrant,
				grantedAt = os.time(),
			}
			profile.processedReceipts = receipts

			return profile,
				keyInfo and keyInfo:GetUserIds() or {userId},
				keyInfo and keyInfo:GetMetadata() or {}
		end)
	end)

	if ok then
		return true
	end

	-- The write may have committed even though the request reported an error.
	local options = Instance.new("DataStoreGetOptions")
	options.UseCache = false

	local readOK, current = pcall(function()
		return profiles:GetAsync(key, options)
	end)

	return readOK and containsReceipt(current, purchaseId)
end

MarketplaceService.ProcessReceipt = function(receiptInfo)
	local userId = receiptInfo.PlayerId
	local productId = receiptInfo.ProductId
	local purchaseId = receiptInfo.PurchaseId

	if typeof(userId) ~= "number"
		or typeof(productId) ~= "number"
		or typeof(purchaseId) ~= "string"
		or purchaseId == ""
	then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local coinGrant = PRODUCT_GRANTS[productId]
	if coinGrant == nil then
		-- Fail closed. This permits a later deployment to restore the missing
		-- product configuration instead of permanently acknowledging no grant.
		warn("No grant configured for developer product", productId)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	if persistReceipt(userId, productId, purchaseId, coinGrant) then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end

	return Enum.ProductPurchaseDecision.NotProcessedYet
end
```

Every server and profile-saving system must use the same profile key and concurrency-safe mutation strategy; a separate `SetAsync` save could overwrite the receipt marker. Do not grant from `PromptProductPurchaseFinished`, and do not acknowledge a receipt merely because the player’s in-memory currency changed. Roblox specifies `ProcessReceipt` as the authoritative grant flow and retries receipts returned as `NotProcessedYet`. [Developer-product documentation](https://create.roblox.com/docs/production/monetization/developer-products)

Receipt markers should not be casually deleted. If storage growth requires archival, the archive must itself remain an authoritative deduplication source before markers are removed.
