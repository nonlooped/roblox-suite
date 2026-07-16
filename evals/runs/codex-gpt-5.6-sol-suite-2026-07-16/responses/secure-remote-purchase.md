# secure-remote-purchase

The client sends only an item identifier. Prices, balances, inventory, shop locations, and rate limits remain server-owned.

```lua
--!strict
-- ServerScriptService/CoinPurchase.server.lua

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local requestPurchase =
    ReplicatedStorage.Remotes:WaitForChild("RequestCoinPurchase") :: RemoteEvent
local purchaseResult =
    ReplicatedStorage.Remotes:WaitForChild("CoinPurchaseResult") :: RemoteEvent

type Profile = {
    Coins: number,
    Inventory: { [string]: boolean },
}

type CatalogEntry = {
    price: number,
    shopPart: BasePart,
}

-- In production, profiles should come from a server-only profile/data module.
local profiles: { [Player]: Profile } = {}

-- This catalog must be stored in a server-only Script/ModuleScript.
local catalog: { [string]: CatalogEntry } = {
    wooden_sword = {
        price = 250,
        shopPart = workspace.Shops.Blacksmith.Counter,
    },
    health_potion = {
        price = 50,
        shopPart = workspace.Shops.Alchemist.Counter,
    },
}

local MAX_DISTANCE = 12
local BUCKET_CAPACITY = 4
local TOKENS_PER_SECOND = 2

type Bucket = {
    tokens: number,
    updatedAt: number,
}

local buckets: { [Player]: Bucket } = {}

local function consumeRateToken(player: Player): boolean
    local now = os.clock()
    local bucket = buckets[player]

    if bucket == nil then
        bucket = {
            tokens = BUCKET_CAPACITY,
            updatedAt = now,
        }
        buckets[player] = bucket
    end

    local elapsed = math.max(0, now - bucket.updatedAt)
    bucket.updatedAt = now
    bucket.tokens = math.min(
        BUCKET_CAPACITY,
        bucket.tokens + elapsed * TOKENS_PER_SECOND
    )

    if bucket.tokens < 1 then
        return false
    end

    bucket.tokens -= 1
    return true
end

local function reply(player: Player, ok: boolean, reason: string, coins: number?)
    purchaseResult:FireClient(player, {
        ok = ok,
        reason = reason,
        coins = coins,
    })
end

local function isNearShop(player: Player, shopPart: BasePart): boolean
    if not shopPart:IsDescendantOf(workspace) then
        return false
    end

    local character = player.Character
    if character == nil then
        return false
    end

    local root = character:FindFirstChild("HumanoidRootPart")
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if root == nil or not root:IsA("BasePart") then
        return false
    end
    if humanoid == nil or humanoid.Health <= 0 then
        return false
    end

    return (root.Position - shopPart.Position).Magnitude <= MAX_DISTANCE
end

requestPurchase.OnServerEvent:Connect(function(player: Player, itemId: any)
    -- Rate-limit before expensive validation so malformed requests also cost tokens.
    if not consumeRateToken(player) then
        reply(player, false, "rate_limited")
        return
    end

    if type(itemId) ~= "string" or #itemId == 0 or #itemId > 40 then
        reply(player, false, "invalid_item_id")
        return
    end

    local item = catalog[itemId]
    if item == nil then
        reply(player, false, "unknown_item")
        return
    end

    -- Defensive validation of server configuration.
    local price = item.price
    if price % 1 ~= 0 or price <= 0 then
        warn(`Invalid server price for {itemId}`)
        reply(player, false, "unavailable")
        return
    end

    local profile = profiles[player]
    if profile == nil then
        reply(player, false, "profile_not_loaded")
        return
    end

    if type(profile.Coins) ~= "number"
        or profile.Coins ~= profile.Coins
        or profile.Coins == math.huge
        or profile.Coins == -math.huge
        or profile.Coins % 1 ~= 0
        or profile.Coins < 0
    then
        warn(`Invalid authoritative balance for user {player.UserId}`)
        reply(player, false, "profile_invalid")
        return
    end

    if not isNearShop(player, item.shopPart) then
        reply(player, false, "too_far")
        return
    end

    if profile.Inventory[itemId] then
        reply(player, false, "already_owned", profile.Coins)
        return
    end

    if profile.Coins < price then
        reply(player, false, "insufficient_funds", profile.Coins)
        return
    end

    -- No yielding between the balance check and the mutation.
    profile.Coins -= price
    profile.Inventory[itemId] = true

    reply(player, true, "purchased", profile.Coins)
end)

Players.PlayerRemoving:Connect(function(player: Player)
    buckets[player] = nil
    profiles[player] = nil
end)
```

The server never accepts a client-provided price, balance, shop position, or purchase result. For a high-value economy, use a server-maintained movement history as the proximity source and persist the resulting profile through an idempotent DataStore operation.
