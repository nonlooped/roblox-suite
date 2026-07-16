# secure-remote-purchase

Place this Script in `ServerScriptService`. The client should normally send only `itemId`; the extra arguments demonstrate that claimed price and balance are intentionally ignored.

```luau
-- ServerScriptService/CoinPurchase.server.lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local purchaseEvent = ReplicatedStorage:WaitForChild("RequestCoinPurchase")

local shop = workspace:WaitForChild("CoinShop")
local catalog = {
	iron_sword = {
		price = 250,
		proximityPart = shop:WaitForChild("SwordCounter"),
		maxDistance = 12,
	},
	health_potion = {
		price = 40,
		proximityPart = shop:WaitForChild("PotionCounter"),
		maxDistance = 12,
	},
}

-- Five immediate requests, replenishing at one request per second.
local BURST = 5
local REFILL_PER_SECOND = 1
local buckets: {[Player]: {tokens: number, updatedAt: number}} = {}

local function consumeRateLimit(player: Player): boolean
	local now = os.clock()
	local bucket = buckets[player]

	if bucket == nil then
		bucket = {
			tokens = BURST,
			updatedAt = now,
		}
		buckets[player] = bucket
	end

	local elapsed = now - bucket.updatedAt
	bucket.updatedAt = now
	bucket.tokens = math.min(BURST, bucket.tokens + elapsed * REFILL_PER_SECOND)

	if bucket.tokens < 1 then
		return false
	end

	bucket.tokens -= 1
	return true
end

local function grantItem(player: Player, itemId: string)
	-- Replace this with the game's server-owned inventory representation.
	local inventory = player:FindFirstChild("Inventory")
	if inventory == nil then
		inventory = Instance.new("Folder")
		inventory.Name = "Inventory"
		inventory.Parent = player
	end

	local count = inventory:FindFirstChild(itemId)
	if count == nil then
		count = Instance.new("IntValue")
		count.Name = itemId
		count.Parent = inventory
	end

	count.Value += 1
end

purchaseEvent.OnServerEvent:Connect(function(
	player: Player,
	itemId: any,
	_claimedPrice: any,
	_claimedBalance: any
)
	if not consumeRateLimit(player) then
		return
	end

	if typeof(itemId) ~= "string" then
		return
	end

	local item = catalog[itemId]
	if item == nil then
		return
	end

	-- Validate the server configuration too, so a bad deployment fails closed.
	local price = item.price
	if typeof(price) ~= "number"
		or price ~= math.floor(price)
		or price <= 0
	then
		warn("Invalid server catalog price for", itemId)
		return
	end

	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	local counter = item.proximityPart

	if not root
		or not root:IsA("BasePart")
		or not humanoid
		or humanoid.Health <= 0
		or not counter:IsDescendantOf(workspace)
	then
		return
	end

	if (root.Position - counter.Position).Magnitude > item.maxDistance then
		return
	end

	-- This attribute must be loaded and changed only by server code.
	local balance = player:GetAttribute("Coins")
	if typeof(balance) ~= "number"
		or balance ~= math.floor(balance)
		or balance < price
	then
		return
	end

	-- Nothing below yields, so another event cannot interleave between deduction
	-- and the local inventory grant in this server.
	player:SetAttribute("Coins", balance - price)
	grantItem(player, itemId)
end)

Players.PlayerRemoving:Connect(function(player)
	buckets[player] = nil
end)
```

The catalog supplies the authoritative price and shop location. The server validates the identifier, catalog price, server-owned balance, character state, distance, and rate limit. Persistent inventory and balance should additionally be committed through one server-owned profile mutation; client attributes alone are not persistent.
