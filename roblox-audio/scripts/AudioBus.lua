--!strict
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

export type AudioBus = {
    musicFader: AudioFader,
    sfxFader: AudioFader,
    output: AudioDeviceOutput,
    musicVolume: number,
    attachMusic: (self: AudioBus, player: AudioPlayer) -> (),
    attachSfx: (self: AudioBus, player: AudioPlayer) -> (),
    setMusicVolume: (self: AudioBus, volume: number, fadeTime: number?) -> (),
    playSfxWithDuck: (self: AudioBus, player: AudioPlayer, duckTo: number?, duckDuration: number?) -> (),
    destroy: (self: AudioBus) -> (),
}

local AudioBus = {}
AudioBus.__index = AudioBus

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
    local self = setmetatable({}, AudioBus) :: AudioBus

    self.output = Instance.new("AudioDeviceOutput")
    self.output.Name = "BusOutput"
    self.output.Parent = SoundService

    self.musicFader = makeFader(SoundService, "MusicFader", 1)
    self.sfxFader = makeFader(SoundService, "SfxFader", 1)

    -- Bus → output
    wire(self.musicFader, self.output, SoundService)
    wire(self.sfxFader, self.output, SoundService)

    self.musicVolume = 1
    return self
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

function AudioBus:playSfxWithDuck(player: AudioPlayer, duckTo: number?, duckDuration: number?). ()
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