# 🎮 Roblox Suite

### Stop shipping outdated Luau. Start with source-grounded guidance.

An opinionated set of source-grounded skills for AI agents writing Roblox Luau. Each skill tells your agent which Roblox APIs are current, which are deprecated, and where the official docs say so — accountable to the [Roblox Engine API Reference](https://create.roblox.com/docs/reference/engine), not to stale memory.

[![installs](https://shieldcn.dev/skills/installs/nonlooped/roblox-suite/roblox.svg?variant=branded)](https://www.skills.sh/nonlooped/roblox-suite/roblox)
[![Luau](https://shieldcn.dev/badge/Luau-Official-00A2FF.svg?logo=luau&variant=branded)](https://create.roblox.com/docs/luau)
[![Docs](https://shieldcn.dev/badge/Docs-Engine_Reference-10B981.svg?logo=ri:GoBook&variant=branded)](https://create.roblox.com/docs/reference/engine)
[![License](https://shieldcn.dev/badge/License-MIT-6366F1.svg?logo=ri:GoLaw&variant=branded)](LICENSE)

🌐 **[nonlooped.github.io/roblox-suite](https://nonlooped.github.io/roblox-suite/)** — the full catalog, what each skill covers, what your agent stops doing, and the official sources used to review each skill. **Start there.**

---

## Install

```sh
npx skills add nonlooped/roblox-suite
```

That drops every skill in the suite into your agent. Start with [`roblox/SKILL.md`](roblox/SKILL.md) — it's the hub that routes you to the right specialist. For a single skill, add `--skill <name>`:

```sh
npx skills add nonlooped/roblox-suite --skill roblox-datastores
```

## Why

Roblox deprecates APIs and changes policy on a rolling basis. Agents trained on old content confidently emit deprecated APIs such as `Humanoid:LoadAnimation`, `BodyMover`s, and legacy `Teleport` variants, as well as risky patterns such as bare `SetAsync` for contended data. Roblox Suite routes agents toward current documentation and lists the official sources used to review each skill.

For the catalog and visible proof, see the [site](https://nonlooped.github.io/roblox-suite/), its [verification evidence](https://nonlooped.github.io/roblox-suite/evidence/) page, and the [first paired evaluation report](evals/reports/2026-07-16-codex-gpt-5.6-sol.md). Script files are maturity-labeled examples, not a versioned production library.

## Manage the installation

```sh
npx skills list
npx skills update
npx skills remove roblox-datastores   # one skill
npx skills remove --all               # all installed skills, with confirmation rules from the CLI
```

The Skills CLI supports agent-specific installation with `--agent` and global installation with `--global`; consult the [current CLI options](https://vercel-labs-skills.mintlify.app/api/cli-options) rather than relying on a hardcoded client list.

If an agent does not discover the suite, run `npx skills list`, confirm the intended project/global scope and agent target, then restart the agent so it reloads skill files. Re-run `npx skills update` before reporting stale guidance.

## Skill structure

```
skill-name/
├── SKILL.md        ← overview, decision trees, quick patterns
├── references/     ← deep technical docs for specific problems
└── scripts/        ← maturity-labeled examples to adapt and test
```

## License & Contributing

MIT — see [LICENSE](LICENSE). Found a stale or unsafe claim? [Report an inaccuracy](https://github.com/nonlooped/roblox-suite/issues/new?template=inaccuracy.yml). Pull requests are welcome; read [CONTRIBUTING.md](CONTRIBUTING.md) and [REVIEW_POLICY.md](REVIEW_POLICY.md) first.