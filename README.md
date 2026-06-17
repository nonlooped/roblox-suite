
# 🎮 Roblox Suite

### Stop shipping outdated Luau. Start shipping production-grade code.

*An opinionated skill set for AI agents and developers who want accurate, current Roblox guidance.*

[![installs](https://shieldcn.dev/skills/installs/nonlooped/roblox-suite/roblox.svg?variant=branded)](https://www.skills.sh/nonlooped/roblox-suite/roblox)
[![Luau](https://shieldcn.dev/badge/Luau-Official-00A2FF.svg?logo=luau&variant=branded)](https://create.roblox.com/docs/luau)
[![Docs](https://shieldcn.dev/badge/Docs-Engine_Reference-10B981.svg?logo=ri:GoBook&variant=branded)](https://create.roblox.com/docs/reference/engine)
[![License](https://shieldcn.dev/badge/License-MIT-6366F1.svg?logo=ri:GoLaw&variant=branded)](LICENSE)



---

## The Problem

Roblox moves fast. Most guides don't.

Search for help today and you'll find advice that still recommends `Humanoid:LoadAnimation`, ignores `RunContext`, pretends `ViewportFrame` renders particles, or gives DataStore patterns that silently lose player data under load. Old devforum posts rank highly. Outdated wikis get copy-pasted.

LLMs are worse, they are trained on the same stale content, they confidently generate code that was deprecated years ago.

**Roblox Suite is the fix.**

---

## What's Inside

Fifteen deep, battle-tested skills. Each has a decision-tree overview, focused technical references, and copy-ready Luau scripts.


| Skill                                                                                                        | What it covers                                                                      |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 🗺️ **[roblox](roblox/SKILL.md)** *(hub)*                                                        | Architecture principles, cross-skill workflows, quick-reference patterns            |
| ⚙️ **[roblox-core](roblox-core/SKILL.md)**                         | Services, Luau types, serialization, script locations, `RunContext`, the data model |
| 💾 **[roblox-datastores](roblox-datastores/SKILL.md)**                                           | DataStores, versioning, metadata, quotas, throttling, safe save/load patterns       |
| 🔒 **[roblox-networking](roblox-networking/SKILL.md)** | Remotes, server authority, network ownership, exploit defenses, capabilities        |
| 🖼️ **[roblox-user-interfaces](roblox-user-interfaces/SKILL.md)**                                            | GUI containers, responsive layouts, interaction, particles-in-UI techniques         |
| 🎬 **[roblox-animation](roblox-animation/SKILL.md)**                               | `Animator`, tracks, IK, `TweenService`, UI tweens, animation markers                |
| ✨ **[roblox-vfx](roblox-vfx/SKILL.md)**                    | `ParticleEmitter`, shapes, flipbooks, beams, trails, highlights, performance        |
| 🔊 **[roblox-audio](roblox-audio/SKILL.md)**                                | Modern audio graph (`AudioPlayer`/`AudioEmitter`/`Wire`/TTS/STT), legacy `Sound`, 3D audio, effects, performance |
| 💰 **[roblox-gamepasses](roblox-gamepasses/SKILL.md)**                             | Game passes, dev products, subscriptions, purchase flow, policy, Robux transfers, analytics |
| 🌐 **[roblox-open-cloud](roblox-open-cloud/SKILL.md)**                             | Open Cloud REST APIs: API keys/OAuth2, data/memory stores, assets, universes, webhooks, in-experience calling |
| 🚪 **[roblox-teleport](roblox-teleport/SKILL.md)**                             | `TeleportAsync`, `TeleportOptions`, reserved servers, multi-place, matchmaking, DataStore handoff |
| 🤖 **[roblox-mcp](roblox-mcp/SKILL.md)**                                          | Connect AI agents to Roblox Studio via MCP: setup, tools, Script Sync, playtesting  |
| ⚙️ **[roblox-physics](roblox-physics/SKILL.md)**                                | Rigid bodies, assemblies, mechanical/mover constraints, network ownership, vehicles |
| 🧭 **[roblox-npcs](roblox-npcs/SKILL.md)**                                      | PathfindingService, modifiers/links, waypoint following, patrol/chase AI patterns   |
| 🐛 **[roblox-testing](roblox-testing/SKILL.md)**                                    | Developer Console, MicroProfiler, Scene Analysis, tests, logging, common bug fixes  |


Every skill follows the same structure so you always know where to look:

```
skill-name/
├── SKILL.md        ← overview, decision trees, quick patterns
├── references/     ← deep technical docs for specific problems
└── scripts/        ← reusable, commented Luau you can copy or adapt
```

---

## Why Trust It

> Every claim links back to the [Roblox Engine API Reference](https://create.roblox.com/docs/reference/engine) or an official guide.

- **Production-first** — patterns built to survive real players: server authority, rate limits, caching, input validation, secure monetization.
- **Actually current** — covers modern APIs: `Animator`, `IKControl`, DataStore v2 listing/versioning, `PreSimulation`/`PreRender`, `GetProductInfoAsync`, subscriptions API, Robux transfers, script capabilities, the modular audio graph (`AudioPlayer`/`AudioEmitter`/`Wire`/TTS/STT), `TeleportAsync`, Open Cloud REST APIs with API keys/OAuth2, and the Creator Rewards program that replaced Premium Payouts.
- **Progressive depth** — start at the hub, drop into a specific skill, then into a specific reference. You only read what you need.
- **AI-ready** — structured for agents. Decision trees point you to the right file. Scripts are commented for adaptation, not just blind copy-paste.

---

## What You Stop Doing


| ❌ The old way                                         | ✅ With Roblox Suite                                              |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `Humanoid:LoadAnimation`                              | `Animator:LoadAnimation` with proper track lifecycle             |
| Client-side economy and stat writes                   | Server-authoritative validation on every purchase and save       |
| Race conditions from bare `SetAsync`                  | Queue-based save patterns with retry and exponential backoff     |
| Pixel-offset UI that breaks on mobile                 | Scale + offset responsive layouts that survive every screen size |
| Particle emitters tanking FPS on low-end devices      | LOD-aware emitter patterns that degrade gracefully               |
| Monetization flows that violate current Roblox policy | ToS-compliant purchase handling with proper receipts             |
| Legacy `Sound`/`SoundGroup` for new audio work                 | Modern audio graph (`AudioPlayer` + `AudioEmitter` + `Wire` + effects) |
| Deprecated `Teleport`/`TeleportPartyAsync` variants            | Unified `TeleportAsync` with `TeleportOptions` and `TeleportAsyncResult` |
| Premium Payouts integration (program discontinued July 2025)   | Awareness that Creator Rewards replaced Engagement-Based Payouts |
| Hardcoded Open Cloud keys in scripts                          | Secrets Store + `HttpService:GetSecret` with least-privilege API keys |


---

## Quick Start

1. Add the suite with `npx skills add nonlooped/roblox` (or `npx skills add https://github.com/nonlooped/roblox`).
2. To install a single skill instead, add `--skill <name>` — for example: `npx skills add nonlooped/roblox --skill roblox-datastores`.
3. Open **[roblox/SKILL.md](roblox/SKILL.md)** to orient yourself.
4. Pick the skill that matches what you're building from the table above.
5. Follow its `→ read references/...` pointers for depth on specific problems.
6. Grab code from `scripts/` and adapt it to your experience.

---

## Official References

The primary sources this suite is built on, and stays accountable to:

- 📖 [Roblox Engine API Reference](https://create.roblox.com/docs/reference/engine)
- 🤖 [Documentation index for agents](https://create.roblox.com/docs/llms.txt)
- 🔧 [Engine API index for agents](https://create.roblox.com/docs/reference/engine/llms.txt)

---

## License & Contributing

MIT

See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions. Pull requests that keep the suite accurate and current are welcome.