---
last_reviewed: 2026-06-17
---

# Audio Effects Reference

**Official source:** https://create.roblox.com/docs/en-us/audio/effects

Audio effects are modular `Audio*` instances that non-destructively modify a stream *in transit*. You insert them between a source (`AudioPlayer`, `AudioTextToSpeech`, etc.) and a target (`AudioDeviceOutput`, `AudioEmitter`) by wiring `Wire.SourceInstance` → effect, then effect → `Wire.TargetInstance`. Multiple effects can chain, and **order matters** (chorus→distortion sounds different from distortion→chorus).

## Effect catalog

| Effect | Purpose | Typical use |
| --- | --- | --- |
| `AudioEqualizer` | Volume control per frequency range | Muffle underwater, cut harsh highs |
| `AudioCompressor` | Reduce dynamic range (lower peaks, raise floor) | Consistent VO volume; **ducking** (sidechain music under SFX) |
| `AudioReverb` | Simulate sound bouncing off surfaces | Cave, hall, stadium ambience |
| `AudioChorus` | Overlay detuned copies for thickness | Robotic/futuristic vocals, ensemble feel |
| `AudioDistortion` | Overdriven clipping "fuzziness" | Guitar intensity, grungy character |
| `AudioEcho` | Delayed repeats with decaying volume | Canyons, hard-surface reflections |
| `AudioFlanger` | Sweeping/whooshing modulation | Sci-fi engines, otherworldly SFX |
| `AudioPitchShifter` | Raise/lower pitch without changing speed | Scale small sounds up or large sounds down |
| `AudioTremolo` | Volume variation (trembling) | Wavy dreamlike instruments, weather swells |
| `AudioFader` | Volume control for one or more streams | Music/SFX bus master, group fades |
| `AudioAnalyzer` | Inspect volume and frequency content | Visualization, debugging — not for audible path |

## Wiring an effect

2D audio with one effect (e.g. muffling all audio):

```
AudioPlayer → Wire → AudioEqualizer → Wire → AudioDeviceOutput
```

```lua
--!strict
local SoundService = game:GetService("SoundService")

local player = Instance.new("AudioPlayer")
player.AssetId = "rbxassetid://YOUR_ID"
player.Parent = SoundService

local eq = Instance.new("AudioEqualizer")
-- Muffle: cut high and low, keep mid. See AudioEqualizer property reference for exact ranges.
eq.Parent = SoundService

local output = Instance.new("AudioDeviceOutput")
output.Parent = SoundService

local w1 = Instance.new("Wire")
w1.SourceInstance = player
w1.TargetInstance = eq
w1.Parent = SoundService

local w2 = Instance.new("Wire")
w2.SourceInstance = eq
w2.TargetInstance = output
w2.Parent = SoundService

player:Play()
```

## Routing multiple sources through one effect

The graph lets many `AudioPlayer`s feed one effect — you don't need a per-player effect with identical settings. Wire each player's `Wire.TargetInstance` to the shared effect, then one wire from the effect to the output.

```
AudioPlayer A ─┐
AudioPlayer B ─┼→ Wire → AudioCompressor → Wire → AudioDeviceOutput
AudioPlayer C ─┘
```

## Chaining effects

Insert effects in series. Order is significant:

```
AudioPlayer → Wire → AudioChorus → Wire → AudioDistortion → Wire → AudioDeviceOutput
```

vs.

```
AudioPlayer → Wire → AudioDistortion → Wire → AudioChorus → Wire → AudioDeviceOutput
```

These sound different. There's no "correct" order — choose by ear and by intent (e.g. distortion before reverb so the reverb trails the distorted signal, not the other way around).

## Ducking (music under SFX) with AudioCompressor

`AudioCompressor` can duck one stream when another is active (sidechain-style). The pattern: route music through a compressor whose threshold is driven by SFX volume. When SFX play, the compressor reduces music gain, then releases. This keeps SFX audible without a hard music cut.

For a simpler approach, use `AudioFader` to tween music volume down when SFX fire and back up after — see `scripts/AudioBus.lua`.

## Tweening volume and effect parameters

Several `AudioPlayer` and effect properties (e.g. `AudioPlayer.TimeVolume`, effect wet/dry mixes) are plain `number` properties you can tween with `TweenService` for smooth fades and parameter sweeps:

```lua
--!strict
local TweenService = game:GetService("TweenService")
local audioPlayer = workspace.MusicPlayer.AudioPlayer :: AudioPlayer

-- Fade out over 2 seconds
local tween = TweenService:Create(audioPlayer.TimeVolume, TweenInfo.new(2), { Value = 0 })
tween:Play()
tween.Completed:Connect(function()
    audioPlayer:Stop()
end)
```

## Reverb: graph vs legacy

- **Graph:** `AudioReverb` instance in the signal path. Apply per-bus or per-emitter.
- **Legacy:** `SoundService.AmbientReverb` (an `Enum.ReverbType` preset) applies globally to all `Sound` instances. **It does not affect the audio graph.**
- **Acoustic simulation:** `SoundService.AcousticSimulationEnabled = true` plus per-instance `AcousticSimulationEnabled` on `AudioEmitter`/`AudioListener` enables automatic occlusion/diffraction/reverberation based on world geometry. This is the most realistic option but the most expensive — profile on low-end devices.

## Performance notes

- Effects cost CPU per active stream passing through them. Reverb and acoustic simulation are the heaviest.
- `AudioAnalyzer` is inspection-only — don't leave it in audible paths.
- On low-memory mobile clients the engine may drop effects; design so the experience is still intelligible without them.
- Don't chain more effects than you can hear; each adds CPU and potential phase artifacts.

## Sources

- https://create.roblox.com/docs/en-us/audio/effects
- https://create.roblox.com/docs/en-us/reference/engine/classes/AudioEqualizer
- https://create.roblox.com/docs/en-us/reference/engine/classes/AudioCompressor
- https://create.roblox.com/docs/en-us/reference/engine/classes/AudioReverb
- https://create.roblox.com/docs/en-us/reference/engine/classes/AudioFader
- https://create.roblox.com/docs/en-us/reference/engine/classes/SoundService (`AcousticSimulationEnabled`, `AmbientReverb`)