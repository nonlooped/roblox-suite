# Roblox Suite

API guidance for AI agents writing Roblox Luau. The skills cover API selection, server authority, persistence, gameplay, presentation, and Studio workflows. Each skill links to the official documentation used to review it.

[![installs](https://shieldcn.dev/skills/installs/nonlooped/roblox-suite/roblox.svg?variant=branded)](https://www.skills.sh/nonlooped/roblox-suite/roblox)
[![Luau](https://shieldcn.dev/badge/Luau-Official-00A2FF.svg?logo=luau&variant=branded)](https://create.roblox.com/docs/luau)
[![Docs](https://shieldcn.dev/badge/Docs-Engine_Reference-10B981.svg?logo=ri:GoBook&variant=branded)](https://create.roblox.com/docs/reference/engine)
[![License](https://shieldcn.dev/badge/License-MIT-6366F1.svg?logo=ri:GoLaw&variant=branded)](LICENSE)

Browse the [skill catalog](https://roblox.nonlooped.xyz/skills/) for coverage, examples, and sources with review dates.

## Install

Run this in your project and follow the installer prompts:

```sh
npx skills add nonlooped/roblox-suite
```

Start with [`roblox/SKILL.md`](roblox/SKILL.md) for broad tasks; it routes to the relevant specialist. To install a single skill:

```sh
npx skills add nonlooped/roblox-suite --skill roblox-datastores
```

## What the skills provide

Agents can suggest deprecated APIs such as `Humanoid:LoadAnimation` or use `SetAsync` where concurrent writes could overwrite player data. Roblox Suite describes the alternatives, their constraints, and the official sources for checking them.

Each [skill page](https://roblox.nonlooped.xyz/skills/) lists its sources with the date each was checked. The [first paired evaluation](evals/reports/2026-07-16-codex-gpt-5.6-sol.md) includes the prompts, outputs, and limits of that run. Script files are examples with maturity labels; adapt and test them before production use.

## Manage the installation

```sh
npx skills list
npx skills update
npx skills remove roblox-datastores   # remove one skill
npx skills remove --all               # remove all installed skills; follow the CLI confirmation prompts
```

Use `--agent` to target an agent and `--global` for a global installation. See the [CLI options](https://vercel-labs-skills.mintlify.app/api/cli-options) for supported targets.

If your agent cannot find the skills, run `npx skills list` and check the installation scope and agent target. Restart the agent to reload its skill files. Run `npx skills update` before reporting stale guidance.

## Skill files

Each skill has a `SKILL.md` entry point, a `references/` directory for detailed guidance, and optional `scripts/` examples. Reference links say when to read each file so an agent can load the material relevant to the task.

## Contribute

Found a stale or unsafe claim? [Report an inaccuracy](https://github.com/nonlooped/roblox-suite/issues/new?template=inaccuracy.yml). For changes, read [CONTRIBUTING.md](CONTRIBUTING.md) and [REVIEW_POLICY.md](REVIEW_POLICY.md).

MIT licensed. See [LICENSE](LICENSE).
