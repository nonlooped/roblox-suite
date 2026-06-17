---
last_reviewed: 2026-06-17
---

# Audio Graph vs Legacy Sound

**Official sources:**
- https://create.roblox.com/docs/en-us/audio/objects (graph)
- https://create.roblox.com/docs/en-us/reference/engine/classes/Sound (legacy)
- https://create.roblox.com/docs/en-us/reference/engine/classes/SoundService

The official docs now state that `Sound`, `SoundGroup`, and `SoundEffect` are **discouraged in favor of the more robust functionality of audio objects**. New work should use the graph; legacy `Sound` code that works can stay.

## Capability comparison

| Capability | Legacy `Sound` | Audio graph |
| --- | --- | --- |
| 2D (global) audio | `Sound` not parented to a part | `AudioPlayer` → `Wire` → `AudioDeviceOutput` |
| 3D positional audio | `Sound` parented to `BasePart`/`Attachment` | `AudioPlayer` → `Wire` → `AudioEmitter` (parented to part) |
| Distance attenuation | `RollOffMode`, `RollOffMaxDistance`, `RollOffMinDistance`, `EmitterSize` | `AudioEmitter.DistanceAttenuation` (NumberSequence curve) |
| Doppler | Automatic (affected by `SoundService.DopplerScale`, `DistanceFactor`) | Automatic for `AudioEmitter`/`AudioListener` (affected by `SoundService.AcousticSimulationEnabled`) |
| Group volume / mixing | `SoundGroup` | `AudioFader` (one fader controls many streams) |
| Per-source effects | `SoundEffect` subclasses on `SoundGroup` | `AudioEqualizer` etc. in the signal path |
| Global reverb | `SoundService.AmbientReverb` (preset enum) | `AudioReverb` instance; or `SoundService.AcousticSimulationEnabled` for automatic |
| Text-to-speech | Not available | `AudioTextToSpeech` |
| Speech-to-text | Not available | `AudioSpeechToText` |
| Microphone capture | Not directly | `AudioDeviceInput` |
| Acoustic occlusion/diffraction | Not available | `AudioEmitter`/`AudioListener` `AcousticSimulationEnabled` |
| Routing multiple sources through one effect | Hard (per-group effects only) | Native (many wires → one effect → one output) |
| Tweenable parameter | `Sound.Volume` (number) | `AudioParam` (e.g. `AudioPlayer.TimeVolume`) plus plain number props |

## When to keep using `Sound`

- Simple 2D SFX or music with no routing, no effects, no TTS/STT.
- Existing working code — don't rewrite just to migrate.
- Quick prototypes and one-shot UI clicks.
- When you need `SoundService.AmbientReverb`'s preset behavior (it doesn't apply to the graph).

## When to use the graph

- 3D audio with custom attenuation curves.
- Multiple sources through a shared effect (all gunfire → one compressor).
- Text-to-speech or speech-to-text.
- Acoustic simulation (occlusion through walls, diffraction around corners).
- Any new, non-trivial audio system where routing and mixing matter.
- Voice-driven features (capture via `AudioDeviceInput`, STT via `AudioSpeechToText`).

## Migration notes

The graph and legacy systems can coexist in one experience. `SoundService` properties split: `AmbientReverb`, `DopplerScale`, `DistanceFactor`, `RespectFilteringEnabled` affect **only legacy `Sound`**; `AcousticSimulationEnabled` affects **only the graph**. `ListenerLocation` and `DefaultListenerLocation` affect the graph's `AudioListener`.

There is no automatic migration. To migrate:
1. Replace each `Sound` parented to a part with `AudioPlayer` + `Wire` + `AudioEmitter` on the same part.
2. Replace `SoundGroup` volume control with an `AudioFader` that all relevant players wire through.
3. Replace `EqualizerSoundEffect` etc. with the corresponding `Audio*` effect in the signal path.
4. For global reverb, either add an `AudioReverb` to the bus or enable `SoundService.AcousticSimulationEnabled`.
5. Re-tune attenuation: `RollOffMode`/`RollOffMaxDistance` don't map 1:1 to `DistanceAttenuation` (a curve) — redesign the curve by ear.

## Legacy `Sound` quick reference (still useful)

| Property | Purpose |
| --- | --- |
| `SoundId` | `rbxassetid://...` |
| `Volume` | 0–4 (amplitude; >1 can clip) |
| `Looped` | boolean |
| `PlaybackSpeed` | 1 = normal; pitch and speed together |
| `EmitterSize` | Larger = louder at distance before rolloff begins |
| `RollOffMode` | Inverse, InverseTangent, Linear, LinearSquare, Cubic, CubicTangent |
| `RollOffMinDistance` / `RollOffMaxDistance` | Rolloff range |
| `IsPlaying`, `IsPaused`, `TimePosition` | Runtime state |
| `:Play()`, `:Pause()`, `:Stop()`, `:Resume()` | Control |
| `Loaded` event, `IsLoaded` | Asset readiness |
| `DidLoop` event | Loop counter (for finite loops) |

`SoundGroup.Volume` scales all member `Sound`s; `SoundGroup` can hold `SoundEffect` children.

## Sources

- https://create.roblox.com/docs/en-us/audio/objects
- https://create.roblox.com/docs/en-us/reference/engine/classes/Sound
- https://create.roblox.com/docs/en-us/reference/engine/classes/SoundGroup
- https://create.roblox.com/docs/en-us/reference/engine/classes/SoundService