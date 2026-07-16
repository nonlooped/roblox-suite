# current-animation-loading

Place an `Animation` named `AttackAnimation` in `ReplicatedStorage`, assign its published `AnimationId`, and add an animation marker named `Hit`. The following server script uses `Animator:LoadAnimation`, preloads the asset, and treats the marker as the start of a server-validated damage window.

```lua
--!strict
-- ServerScriptService/AttackController.server.luau
local ContentProvider = game:GetService("ContentProvider")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local attackAnimation = ReplicatedStorage:WaitForChild("AttackAnimation") :: Animation
local attackRequested = ReplicatedStorage:WaitForChild("AttackRequested") :: RemoteEvent

local preloadOk, preloadError = pcall(function()
	ContentProvider:PreloadAsync({ attackAnimation })
end)

if not preloadOk then
	warn("Could not preload attack animation:", preloadError)
end

local tracks: {[Player]: AnimationTrack} = {}
local lastAttack: {[Player]: number} = {}
local ATTACK_COOLDOWN = 0.7

local function applyHit(attacker: Player, character: Model)
	local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
	local attackerHumanoid = character:FindFirstChildOfClass("Humanoid")

	if not root or not attackerHumanoid or attackerHumanoid.Health <= 0 then
		return
	end

	local overlap = OverlapParams.new()
	overlap.FilterType = Enum.RaycastFilterType.Exclude
	overlap.FilterDescendantsInstances = { character }

	local alreadyDamaged: {[Humanoid]: boolean} = {}
	local hitboxCFrame = root.CFrame * CFrame.new(0, 0, -3)

	for _, part in Workspace:GetPartBoundsInBox(
		hitboxCFrame,
		Vector3.new(5, 5, 6),
		overlap
	) do
		local targetModel = part:FindFirstAncestorOfClass("Model")
		local targetHumanoid = if targetModel
			then targetModel:FindFirstChildOfClass("Humanoid")
			else nil

		if targetHumanoid
			and targetHumanoid.Health > 0
			and not alreadyDamaged[targetHumanoid]
		then
			alreadyDamaged[targetHumanoid] = true
			targetHumanoid:TakeDamage(25)
		end
	end
end

local function configureCharacter(player: Player, character: Model)
	local humanoid = character:WaitForChild("Humanoid") :: Humanoid

	-- Player-character Animators are created by the engine on the server.
	local animator = humanoid:WaitForChild("Animator") :: Animator
	local track = animator:LoadAnimation(attackAnimation)

	track.Priority = Enum.AnimationPriority.Action
	track.Looped = false
	tracks[player] = track

	local markerConnection
	markerConnection = track:GetMarkerReachedSignal("Hit"):Connect(function(_parameter: string)
		-- This callback runs on the server. Revalidate all gameplay conditions here.
		task.defer(applyHit, player, character)
	end)

	character.AncestryChanged:Connect(function(_, parent)
		if parent == nil then
			markerConnection:Disconnect()
			if tracks[player] == track then
				tracks[player] = nil
			end
		end
	end)
end

local function onPlayerAdded(player: Player)
	player.CharacterAdded:Connect(function(character)
		configureCharacter(player, character)
	end)

	if player.Character then
		task.defer(configureCharacter, player, player.Character)
	end
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(function(player)
	tracks[player] = nil
	lastAttack[player] = nil
end)

for _, player in Players:GetPlayers() do
	task.defer(onPlayerAdded, player)
end

attackRequested.OnServerEvent:Connect(function(player: Player)
	local now = os.clock()
	if now - (lastAttack[player] or -math.huge) < ATTACK_COOLDOWN then
		return
	end

	local character = player.Character
	local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
	local track = tracks[player]

	if not character or not humanoid or humanoid.Health <= 0 or not track then
		return
	end

	lastAttack[player] = now
	track:Play(0.1, 1, 1)
end)
```

The client may fire `AttackRequested` for responsive input, but damage remains server-authoritative. A client-fired marker is only a visual timing hint and must not be accepted as proof that an attack hit. Use `GetMarkerReachedSignal`; `KeyframeReached` and `Humanoid:LoadAnimation` are older APIs.
