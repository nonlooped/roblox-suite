# current-animation-loading

Load through the character’s `Animator`, not the legacy `Humanoid:LoadAnimation()` proxy. For a player-owned character, a `LocalScript` provides responsive playback and normally replicates tracks loaded through the existing server-created `Animator`.

```lua
-- StarterCharacterScripts/Attack.client.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local character = script.Parent
local humanoid = character:WaitForChild("Humanoid")
local animator = humanoid:WaitForChild("Animator")
local attackRemote = ReplicatedStorage:WaitForChild("AttackMarker")

local animation = Instance.new("Animation")
animation.AnimationId = "rbxassetid://1234567890"

local track = animator:LoadAnimation(animation)
track.Priority = Enum.AnimationPriority.Action
track.Looped = false

local markerConnection = track:GetMarkerReachedSignal("Hit"):Connect(
	function(parameter: string)
		-- Use the marker for presentation immediately.
		local weapon = character:FindFirstChild("Weapon")
		local swingSound = weapon and weapon:FindFirstChild("SwingSound")
		if swingSound then
			swingSound:Play()
		end

		-- Ask the server to perform authoritative gameplay.
		attackRemote:FireServer(parameter)
	end
)

track.Stopped:Once(function()
	markerConnection:Disconnect()
	animation:Destroy()
end)

track:Play(0.1)
```

Create a marker named `Hit` at the impact frame in the Animation Editor. Its optional parameter string is passed to the callback. [`Animator:LoadAnimation()`](https://create.roblox.com/docs/reference/engine/classes/Animator) is the current loading API, and [`GetMarkerReachedSignal()`](https://create.roblox.com/docs/animation/events) is the marker API.

Damage, inventory changes, and other authoritative gameplay should not be trusted merely because a client reported a marker. Validate the player’s equipped state, attack cooldown, target distance, line of sight, and current server-side action state:

```lua
-- ServerScriptService/Attack.server.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local attackRemote = Instance.new("RemoteEvent")
attackRemote.Name = "AttackMarker"
attackRemote.Parent = ReplicatedStorage

local lastAttack = {}

attackRemote.OnServerEvent:Connect(function(player, markerParameter)
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart")
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")

	if not root or not humanoid or humanoid.Health <= 0 then
		return
	end

	local now = os.clock()
	if now - (lastAttack[player] or 0) < 0.6 then
		return
	end
	lastAttack[player] = now

	-- Perform a server raycast or hitbox query here. Treat markerParameter
	-- only as a hint; never accept a client-supplied target or damage value.
end)
```
