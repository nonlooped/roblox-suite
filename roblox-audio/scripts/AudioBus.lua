--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

--[[
    AudioBus.lua
    A small music/SFX bus helper using the modern audio graph.

    - Creates separate AudioFader instances for Music and SFX buses.
    - Wires AudioPlayers (you provide) through the appropriate bus to a shared
      AudioDeviceOutput.
    - Supports ducking: temporarily lower music volume while SFX play, then
      restore.

    Usage:
        local AudioBus = require(path.to.AudioBus)
        local bus = AudioBus.new()

        local musicPlayer = Instance.new("AudioPlayer")
        musicPlayer.AssetId = "rbxassetid://MUSIC_ID"
        musicPlayer.Looping = true
        bus:attachMusic(musicPlayer)
        musicPlayer:Play()

        local sfxPlayer = Instance.new("AudioPlayer")
        sfxPlayer.AssetId = "rbxassetid://SFX_ID"
        bus:attachSfx(sfxPlayer)
        bus:playSfxWithDuck(sfxPlayer, 0.3, 1.5) -- duck music to 0.3 for 1.5s
]]

local TweenService = game:GetService("TweenService")
local SoundService = game:GetService("SoundService")

local AudioBus = {}
AudioBus.__index = AudioBus

export type AudioBus = typeof(setmetatable(
    {} :: {
        musicFader: AudioFader,
        sfxFader: AudioFader,
        output: AudioDeviceOutput,
        musicVolume: number,
    },
    AudioBus
))

local function makeFader(parent: Instance, name: string, volume: number): AudioFader
    local fader = Instance.new("AudioFader")
    fader.Name = name
    fader.Volume = volume
    fader.Parent = parent
    return fader
end

local function wire(source: Instance, target: Instance, parent: Instance): Wire
    local w = Instance.new("Wire")
    w.SourceInstance = source
    w.TargetInstance = target
    w.Parent = parent
    return w
end

function AudioBus.new(): AudioBus
    local output = Instance.new("AudioDeviceOutput")
    output.Name = "BusOutput"
    output.Parent = SoundService

    local musicFader = makeFader(SoundService, "MusicFader", 1)
    local sfxFader = makeFader(SoundService, "SfxFader", 1)

    -- Bus → output
    wire(musicFader, output, SoundService)
    wire(sfxFader, output, SoundService)

    return setmetatable({
        output = output,
        musicFader = musicFader,
        sfxFader = sfxFader,
        musicVolume = 1,
    }, AudioBus) :: AudioBus
end

function AudioBus:attachMusic(player: AudioPlayer): ()
    -- Ensure the player has a parent so it can be wired
    if not player.Parent then
        player.Parent = SoundService
    end
    wire(player, self.musicFader, SoundService)
end

function AudioBus:attachSfx(player: AudioPlayer): ()
    if not player.Parent then
        player.Parent = SoundService
    end
    wire(player, self.sfxFader, SoundService)
end

function AudioBus:setMusicVolume(volume: number, fadeTime: number?): ()
    fadeTime = fadeTime or 0.2
    self.musicVolume = volume
    local tween = TweenService:Create(self.musicFader, TweenInfo.new(fadeTime), { Volume = volume })
    tween:Play()
end

function AudioBus:playSfxWithDuck(player: AudioPlayer, duckTo: number?, duckDuration: number?): ()
    duckTo = duckTo or 0.3
    duckDuration = duckDuration or 1.5
    local original = self.musicVolume
    self:setMusicVolume(duckTo, 0.1)
    player:Play()
    task.delay(duckDuration, function()
        self:setMusicVolume(original, 0.5)
    end)
end

function AudioBus:destroy(): ()
    for _, obj in ipairs({ self.musicFader, self.sfxFader, self.output }) do
        if obj and obj.Parent then
            obj:Destroy()
        end
    end
end

return AudioBus
