---
name: roblox-audio
description: Roblox audio — the modern modular audio graph (AudioPlayer, AudioEmitter, AudioListener, Wire, AudioTextToSpeech) and the legacy Sound/SoundGroup system. Covers 2D vs 3D audio, spatial attenuation, effects (Equalizer, Compressor, Reverb, Echo, Distortion), TTS/STT, acoustic simulation, asset permissions and the 2022 privacy changes, concurrent-voice limits, preloading, and looping. Use for any sound, music, voice, or audio-driven feedback.
---

# roblox-audio

**Official sources (always check these for the latest):**
- https://create.roblox.com/docs/en-us/audio/objects (audio graph overview)
- https://create.roblox.com/docs/en-us/audio/effects (audio effects)
- https://create.roblox.com/docs/en-us/reference/engine/classes/Sound (legacy `Sound`)
- https://create.roblox.com/docs/en-us/reference/engine/classes/SoundService
- Engine classes: `AudioPlayer`, `AudioEmitter`, `AudioListener`, `AudioDeviceOutput`, `AudioDeviceInput`, `AudioTextToSpeech`, `AudioSpeechToText`, `Wire`, `AudioEqualizer`, `AudioCompressor`, `AudioReverb`, `AudioChorus`, `AudioDistortion`, `AudioEcho`, `AudioFlanger`, `AudioPitchShifter`, `AudioTremolo`, `AudioFader`, `AudioAnalyzer`
- Full reference: https://create.roblox.com/docs/en-us/reference/engine

This skill covers both the modern **modular audio graph** (the recommended system) and the legacy `Sound`/`SoundGroup`/`SoundEffect` system. The official docs now state that `Sound`, `SoundGroup`, and `SoundEffect` are **discouraged in favor of the more robust functionality of audio objects**. New work should use the graph; legacy code can keep using `Sound` where the graph offers no advantage.

Cross-reference:
- [roblox-core/SKILL.md](../roblox-core/SKILL.md) for services and script locations.
- [roblox-animation/SKILL.md](../roblox-animation/SKILL.md) for driving audio from animation markers (footsteps, impact sounds).
- [roblox-user-interfaces/SKILL.md](../roblox-user-interfaces/SKILL.md) for UI-triggered sound feedback.
- [roblox-networking/SKILL.md](../roblox-networking/SKILL.md) for client-authoritative cosmetic audio vs server-authoritative gameplay audio.

## When to use this skill

Activate when:
- Playing music, SFX, ambient audio, UI feedback, or voice in an experience.
- Setting up 3D positional audio (footsteps, gunshots, environmental ambience).
- Building an audio bus / routing / mixing architecture (music ducking, group volume).
- Applying effects (muffling underwater, reverb in a cave, compression for consistent VO volume).
- Implementing text-to-speech (accessibility, NPC dialogue) or speech-to-text (voice commands).
- Migrating legacy `Sound` code to the new audio graph.
- Diagnosing audio that doesn't play, cuts out, or sounds wrong on mobile.
- Understanding audio asset permissions and the Creator Store audio library.

## The two systems

### Modern audio graph (recommended for new work)

Modular instances that mirror real-world audio devices. Each object **produces**, **consumes**, **modifies**, or **carries** an audio stream. You wire them together with `Wire` instances (`SourceInstance` → `TargetInstance`).

| Object | Role | Real-world analog |
| --- | --- | --- |
| `AudioPlayer` | Produces a stream from an audio asset ID | A audio file player |
| `AudioEmitter` | Emits a stream into the 3D environment (parent position = emission point) | A speaker in the world |
| `AudioListener` | Picks up streams from the environment (parent = camera or character) | A microphone in the world |
| `AudioDeviceOutput` | Plays a stream to the player's physical speaker/headphones | The player's hardware output |
| `AudioDeviceInput` | Captures audio from the player's physical microphone | The player's hardware mic |
| `AudioTextToSpeech` | Converts text to audio with an artificial voice | A TTS engine |
| `AudioSpeechToText` | Converts spoken audio to text | A transcription engine |
| `Wire` | Carries a stream from `SourceInstance` to `TargetInstance` | An audio cable |

Effects (all "modify" category): `AudioEqualizer`, `AudioCompressor`, `AudioReverb`, `AudioChorus`, `AudioDistortion`, `AudioEcho`, `AudioFlanger`, `AudioPitchShifter`, `AudioTremolo`, `AudioFader`, `AudioAnalyzer`. See [references/audio-effects.md](references/audio-effects.md).

### Legacy `Sound` system (still works, discouraged)

`Sound` parented to a `BasePart` or `Attachment` emits from that position with built-in Doppler and distance rolloff (`RollOffMode`, `RollOffMaxDistance`, `RollOffMinDistance`, `EmitterSize`). A "global" `Sound` (not parented to a part/attachment) plays at constant volume everywhere. `SoundGroup` controls group volume and effects; `SoundEffect` subclasses (`EqualizerSoundEffect`, `ReverbSoundEffect`, etc.) apply per-group effects. `SoundService` exposes global properties (`AmbientReverb`, `DistanceFactor`, `DopplerScale`, `RespectFilteringEnabled`) that affect `Sound` playback.

`SoundService.AmbientReverb` and the Doppler/distance properties affect **only legacy `Sound`**, not the audio graph. The graph has its own effect objects and per-emitter `DistanceAttenuation` curves.

## Decision tree: which system?

- **New experience, greenfield audio** → audio graph. It's the path Roblox is investing in (TTS, STT, acoustic simulation, robust routing).
- **Simple 2D SFX or music with no routing/effects** → `Sound` is acceptable and simpler. Don't rewrite working legacy code just to migrate.
- **3D positional audio with custom attenuation curves** → audio graph (`AudioEmitter.DistanceAttenuation`).
- **Multiple sources through one effect (e.g. all gunfire through one compressor)** → audio graph (one effect, many players wired in).
- **Text-to-speech or speech-to-text** → audio graph (only the graph has `AudioTextToSpeech` / `AudioSpeechToText`).
- **Voice chat / spatial voice** → `VoiceChatService` (separate from in-experience audio; uses `AudioDeviceInput` under the hood when `UseAudioApi` is enabled).
- **Acoustic simulation (occlusion, diffraction, reverb)** → audio graph with `SoundService.AcousticSimulationEnabled = true` and per-instance `AcousticSimulationEnabled` on emitters/listeners.
- **Quick prototype / one-shot UI click sound** → `Sound` is fine.

See [references/audio-graph-vs-sound.md](references/audio-graph-vs-sound.md) for a side-by-side property map and migration notes.

## 2D audio (non-directional)

Same volume everywhere. Requires: `AudioPlayer` → `Wire` → `AudioDeviceOutput`, all parented under `SoundService`.

```lua
--!strict
local SoundService = game:GetService("SoundService")

local player = Instance.new("AudioPlayer")
player.AssetId = "rbxassetid://YOUR_AUDIO_ID"
player.Looping = true
player.Volume = 1
player.Parent = SoundService

local output = Instance.new("AudioDeviceOutput")
output.Parent = SoundService

local wire = Instance.new("Wire")
wire.SourceInstance = player
wire.TargetInstance = output
wire.Parent = SoundService

player:Play()
```

## 3D audio (positional)

Volume changes with the listener's distance to the emitter. Requires six objects: `AudioPlayer` → `Wire` → `AudioEmitter` (parented to the 3D part), and `AudioListener` → `Wire` → `AudioDeviceOutput` (under `SoundService`). Set `SoundService.ListenerLocation` to `Character` or `Camera` (the engine auto-creates the `AudioDeviceOutput` under `SoundService` at runtime when you do).

```lua
--!strict
local SoundService = game:GetService("SoundService")
SoundService.ListenerLocation = Enum.ListenerLocation.Camera -- or Character

-- On the 3D part that should emit audio:
local part = workspace:WaitForChild("NoisyPart")
local player = Instance.new("AudioPlayer")
player.AssetId = "rbxassetid://YOUR_AUDIO_ID"
player.Looping = true
player.Parent = part

local emitter = Instance.new("AudioEmitter")
-- DistanceAttenuation is a NumberSequence: x = distance (studs), y = volume (0..1)
emitter.DistanceAttenuation = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 1),    -- full volume at 0 studs
    NumberSequenceKeypoint.new(50, 0.5), -- half volume at 50 studs
    NumberSequenceKeypoint.new(70, 0),   -- silent at 70 studs
})
emitter.Parent = part

local wire = Instance.new("Wire")
wire.SourceInstance = player
wire.TargetInstance = emitter
wire.Parent = part

player:Play()
```

The emitter's **parent position** determines where audio emits from. `AudioEmitter` ignores its own orientation; rotate the parent part/attachment to steer emission.

## Listener location

`SoundService.ListenerLocation` (a `ListenerLocation` enum) controls where the `AudioListener` is auto-created:
- **Default** — camera in experiences with voice chat.
- **None** — no auto-listener; create one via script.
- **Character** — parented to the local player's character (`Humanoid.RootPart`).
- **Camera** — parented to `workspace.CurrentCamera`.

When set to `Character` or `Camera`, the engine auto-creates an `AudioDeviceOutput` under `SoundService` at runtime. The `AudioListener` picks up audio from `AudioEmitter`s based on distance and the emitter's `DistanceAttenuation` curve.

## Triggering audio from scripts

```lua
local audio = script.Parent :: AudioPlayer
someEvent:Connect(function()
    audio:Play()
end)
```

`AudioPlayer:Play()`, `:Pause()`, `:Stop()`, `:SeekTime(...)`. `AudioPlayer.TimeVolume` is tweenable — see [references/audio-effects.md](references/audio-effects.md) for tweening volume and effect parameters.

## Preloading audio

Preload prominent audio assets before they're needed (loading screen, round start) to avoid first-play hitches on lower-end devices:

```lua
--!strict
local ContentProvider = game:GetService("ContentProvider")
local audioPlayer = workspace:WaitForChild("MusicPlayer") :: AudioPlayer
ContentProvider:PreloadAsync({ audioPlayer })
```

For the legacy `Sound` system, preload the `Sound` instance the same way.

## Performance limits

- **Concurrent voices** (simultaneously playing audio streams) are capped; the cap varies by device. Mobile is significantly lower than desktop.
- **Effects cost CPU** per active stream routed through them. Reverb and acoustic simulation are the heaviest.
- **Acoustic simulation** (`SoundService.AcousticSimulationEnabled`) adds per-emitter occlusion/diffraction/reverb cost; disable on low-end clients or when not needed.
- **Mobile throttling:** the engine may drop or degrade audio effects on low-memory clients (e.g. flipbooks were dropped on older phones; the same applies to some audio effects). Test at low quality levels.
- **`AudioAnalyzer`** is for inspection only; don't chain it into audible paths unnecessarily.

Profile audio with the MicroProfiler (audio appears under worker threads) and the Developer Console Memory tab.

## Script context (client vs server)

- **Playback** of `AudioPlayer`, `Sound`, and effects is **client-side** — each client plays its own audio. The server does not mix audio for clients.
- **Replication:** `AudioPlayer` state (playing/paused/stopped) replicates from server to clients if the instance is in a replicated location, but per-client volume/effects are local. For one-shot SFX, prefer **client-authoritative emission**: server signals "this event happened" via RemoteEvent, each affected client plays the sound locally. This avoids replicating per-burst timing and respects each client's quality settings (same pattern as VFX — see roblox-vfx skill).
- **Music/ambience** that should be synchronized across all clients can be server-driven (the `AudioPlayer` lives in `ReplicatedStorage` or `SoundService` and the server calls `:Play()`), but be aware each client still renders locally and may drift.
- **`AudioDeviceInput`** (microphone) is client-only — it captures the local player's mic. Pair with `VoiceChatService` for spatial voice.
- **Never trust client audio state for gameplay.** A client claiming "I played the reload sound" tells you nothing authoritative; validate gameplay effects on the server (see roblox-networking).

## Audio asset permissions

- Audio assets uploaded before the **2022 audio privacy changes** may be private or have restricted use. Assets you upload to your own experience are usable by that experience.
- The **Creator Store** has a library of free-to-use audio assets — these are safe to reference by asset ID in any experience.
- Audio uploaded by other creators may be unusable in your experience unless they've marked it for public use. If you reference a third-party audio asset ID and it doesn't play, permissions are the usual cause.
- For new audio, upload through the Creator Dashboard's asset manager or the Open Cloud Assets API (see roblox-open-cloud skill for programmatic upload).

## Text-to-speech (TTS)

`AudioTextToSpeech` converts text (≤300 chars per request) to audio with an artificial voice (`VoiceId` 1–11, plus locale-specific voices like 101/Spanish, 201/German, etc.). Wire it like an `AudioPlayer`: for 2D, `AudioTextToSpeech` → `Wire` → `AudioDeviceOutput`; for 3D, `AudioTextToSpeech` → `Wire` → `AudioEmitter` (plus the listener→output wire). Set `Text`, `VoiceId`, `Volume` on the `AudioTextToSpeech`. All text must comply with Roblox Community Standards and Terms of Use.

Use cases: accessibility (reading UI text aloud), NPC voiceover without recorded audio, dynamic announcements.

## Speech-to-text (STT)

`AudioSpeechToText` converts speech captured by `AudioDeviceInput` into text. Requires `VoiceChatService.UseAudioApi = Enabled`. Wire: `AudioDeviceInput` → `Wire` → `AudioSpeechToText`. Set `audioDeviceInput.Player = Players.LocalPlayer` at runtime to target the local player's mic. Roblox auto-detects the spoken language (17 supported: Arabic, Chinese Simplified/Traditional, English, French, German, Indonesian, Italian, Japanese, Korean, Polish, Portuguese, Spanish, Russian, Turkish, Thai, Vietnamese).

To use STT without broadcasting voice to other players, disable `VoiceChatService.EnableDefaultVoice`. All audio for `AudioSpeechToText` must comply with Community Standards and Terms of Use.

## Best practices

- **Preload** prominent audio (music, common SFX) during loading. One-shot UI sounds can lazy-load.
- **Loop** ambient/music with `Looping = true` (graph) or `Looped = true` (legacy). For finite loops N times, use the `DidLoop` event (legacy `Sound`) or count plays on the graph.
- **Fade in/out** by tweening `AudioPlayer.Volume` (graph) or `Sound.Volume` (legacy). `AudioFader` is the graph-native way to control multiple streams' volume at once.
- **Music vs SFX:** route music and SFX through separate `AudioFader` or `SoundGroup` so you can mute music independently and apply ducking (SFX ducks music via `AudioCompressor` sidechain).
- **3D vs 2D:** if the sound has a world position, use 3D (`AudioEmitter`); if it's UI/global, use 2D (`AudioDeviceOutput` direct).
- **Accessibility:** offer TTS for important text, provide subtitle/caption options for VO, and never make audio the only cue for gameplay-critical info.
- **Mobile:** test at low quality. The engine may drop effects; design so the experience still works without them.
- **Concurrency:** pool `AudioPlayer`/`Sound` instances for frequent one-shots rather than creating/destroying per shot.

## Common mistakes this skill prevents

- Using `Sound`/`SoundGroup`/`SoundEffect` for new work when the graph is the recommended path.
- Parenting an `AudioEmitter` to `SoundService` (it must be parented to a 3D part/attachment for 3D audio).
- Forgetting the `Wire` (audio won't flow from player to output/emitter).
- Expecting `SoundService.AmbientReverb` to affect the audio graph (it only affects legacy `Sound`).
- Setting `DistanceAttenuation` as a single number instead of a `NumberSequence` (it's a curve, not a scalar).
- Trusting client audio state for gameplay (reload sounds, hit sounds) instead of server validation.
- Not preloading, causing first-play hitches on mobile.
- Hardcoding asset IDs for third-party audio that may be permission-restricted.

## Scripts

- `scripts/AudioBus.lua` — a small music/SFX bus helper using `AudioFader` to control group volume and duck music when SFX play. Adapt for your mix.

## How to proceed

1. Pick the system: graph for new/complex work, `Sound` for simple/legacy.
2. Lay out your buses (music, SFX, VO) and route through `AudioFader` or `SoundGroup`.
3. Place 3D emitters on the parts that should make sound; set `DistanceAttenuation` per emitter.
4. Add effects where they add value (reverb in caves, muffling underwater, ducking).
5. Preload, then trigger from events (animation markers, UI, gameplay).
6. Profile concurrent voices and effect cost on the lowest target device.
7. Verify asset permissions for any third-party audio.