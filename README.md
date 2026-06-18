# 🎮 Roblox Suite

### Stop shipping outdated Luau. Start shipping production-grade code.

An opinionated set of fifteen battle-tested skills for AI agents writing Roblox Luau. Each skill tells your agent which Roblox APIs are current, which are deprecated, and where the official docs say so — accountable to the [Roblox Engine API Reference](https://create.roblox.com/docs/reference/engine), not to stale memory.

[![installs](https://shieldcn.dev/skills/installs/nonlooped/roblox-suite/roblox.svg?variant=branded)](https://www.skills.sh/nonlooped/roblox-suite/roblox)
[![Luau](https://shieldcn.dev/badge/Luau-Official-00A2FF.svg?logo=luau&variant=branded)](https://create.roblox.com/docs/luau)
[![Docs](https://shieldcn.dev/badge/Docs-Engine_Reference-10B981.svg?logo=ri:GoBook&variant=branded)](https://create.roblox.com/docs/reference/engine)
[![License](https://shieldcn.dev/badge/License-MIT-6366F1.svg?logo=ri:GoLaw&variant=branded)](LICENSE)

🌐 **[nonlooped.github.io/roblox-suite](https://nonlooped.github.io/roblox-suite/)** — the full catalog, what each skill covers, what your agent stops doing, and the official sources behind every claim. **Start there.**

---

## Install

```sh
npx skills add nonlooped/roblox
```

That drops all fifteen skills into your agent. Start with [`roblox/SKILL.md`](roblox/SKILL.md) — it's the hub that routes you to the right specialist. For a single skill, add `--skill <name>`:

```sh
npx skills add nonlooped/roblox --skill roblox-datastores
```

## Why

Roblox deprecates APIs and changes policy on a rolling basis. Agents trained on old content confidently emit code that was deprecated years ago — `Humanoid:LoadAnimation`, bare `SetAsync`, `BodyMover`s, legacy `Teleport` variants. Roblox Suite keeps the agent current, and every recommendation links back to the official doc it came from.

For the full pitch — what's inside, what your agent stops doing, and how it stays accurate — see the [site](https://nonlooped.github.io/roblox-suite/).

## Skill structure

```
skill-name/
├── SKILL.md        ← overview, decision trees, quick patterns
├── references/     ← deep technical docs for specific problems
└── scripts/        ← reusable, commented Luau you can copy or adapt
```

## License & Contributing

MIT — see [LICENSE](LICENSE). Pull requests that keep the suite accurate and current are welcome; read [CONTRIBUTING.md](CONTRIBUTING.md) first.