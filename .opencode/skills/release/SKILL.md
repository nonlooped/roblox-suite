---
name: Release
description: "Publish a Roblox Suite release end-to-end: clean the tree, polish files, choose a semver bump, split work into conventional commits, update CHANGELOG, tag, create a GitHub Release in the project format, and push. Invoke when ready to ship accumulated changes (e.g. \"release\", \"ship it\", \"publish vX.Y.Z\", \"cut a release\")."
metadata:
  opencode/slash: "true"
---

# Release

Ship accumulated work on `main` for **nonlooped/roblox-suite**. Follow every phase in order. Do not skip validation. Do not force-push. Do not amend published history.

## Hard rules

1. **Ask before irreversible steps.** Confirm the version bump and the proposed commit plan with the user before creating commits, tags, or GitHub releases. Confirm again before `git push`.
2. **Never commit secrets**, local AI caches, screenshots, or scratch files. Respect `.gitignore`.
3. **Never use `--no-verify`, `--force` on main, or `git commit --amend` on commits that may already be pushed.**
4. **One logical change per commit.** Prefer several focused conventional commits over one dump commit.
5. **Tag format is `vX.Y.Z`** (leading `v`). Changelog headings are `## X.Y.Z — YYYY-MM-DD` (no `v`).
6. **Release notes follow the existing GitHub Release format** (see Phase 6). Match prior releases via `gh release view`.
7. **Stop on any failed check.** Fix or abort; do not publish a broken tree.

## Phase 0 — Preconditions

Run from the repo root.

```sh
git status
git branch --show-current
git remote -v
git fetch origin
git log --oneline -15
git tag --sort=-v:refname | head -10
gh auth status
gh release list --limit 5
```

Abort unless all of the following hold (or the user explicitly overrides):

- Current branch is `main`
- `origin` points at `nonlooped/roblox-suite` (or the user's intended remote)
- Working tree is either clean, or dirty only with the work intended for this release
- `gh` is authenticated with permission to create releases
- Local `main` is not behind `origin/main` (if behind: pull/rebase first with user approval)
- No existing tag for the version you are about to cut

If there are unrelated WIP changes the user does not want in the release, stop and ask how to separate them.

## Phase 1 — Inventory

Build a release inventory before touching files:

1. `git status -u` and `git diff --stat` / `git diff`
2. Untracked paths — classify each as **ship**, **gitignore**, or **delete**
3. Commits already on `main` since the latest tag:

```sh
LATEST=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
# if LATEST is set:
git log "${LATEST}..HEAD" --oneline
```

4. Summarize themes for the user: site rebuild, content fixes, CI, skills, deps, etc.
5. Propose a **semver bump** and a **commit plan** (see Phases 3–4). Wait for approval.

## Phase 2 — Clean and polish

Remove junk; keep product code.

### Delete or gitignore (typical)

- Assessment / QA screenshots: `assessment-*.png`, `*-regressions.png`
- Scratch scripts: `scratch_*.mjs`, ad-hoc debug files at repo root
- Browser/agent dumps: `.playwright-mcp/`, local critique caches
- Accidental nested clones or personal skill packs that are not part of this product
- Nested build accidents (e.g. `site/site/`), orphaned fonts no longer referenced
- Unused scaffolding (e.g. `components.json` with no `src/components/ui`)

### Keep and polish

- Product paths: `roblox*/`, `site/src/`, `catalog.json`, `skills.sh.json`, `scripts/`, `schemas/`, `evals/`, docs
- Design intent docs that support the site (`site/DESIGN.md`, `site/PRODUCT.md`) when they are current
- `.opencode/skills/**` maintainer skills (intentionally tracked)

### Sync generated artifacts

If `catalog.json` or skill folders changed:

```sh
node scripts/generate-catalog-artifacts.mjs
node scripts/generate-catalog-artifacts.mjs --check
node scripts/check-hub-refs.mjs
```

Never hand-edit content between `catalog:*` markers.

### Polish pass (light, intentional)

- Drop dead imports, deleted-component leftovers, and commented-out blocks introduced during the WIP
- Ensure new site files match existing naming and structure under `site/src/`
- Do **not** drive-by refactor unrelated skills or rewrite prose for style
- Do **not** bump dependency ranges unless the release is about deps or the build requires it

### Validate before committing

Mirror CI as closely as practical:

```sh
node scripts/generate-catalog-artifacts.mjs --check
node scripts/check-hub-refs.mjs
cd site && npm ci && npm test
```

If Rokit/Luau tools are available and Luau examples changed:

```sh
# from repo root, with rokit tools on PATH
find roblox* tests -type f \( -name '*.lua' -o -name '*.luau' \) -print0 | xargs -0 stylua --check
find roblox* tests -type f -name '*.lua' -print0 | xargs -0 selene
rojo build default.project.json --output regression-fixture.rbxlx
rojo sourcemap default.project.json --output sourcemap.json
find roblox* tests -type f -name '*.lua' -print0 | xargs -0 luau-lsp analyze --platform roblox --definitions:@roblox=types/globalTypes.None.d.luau --sourcemap sourcemap.json
rm -f regression-fixture.rbxlx sourcemap.json
```

On Windows without GNU find/xargs, use the equivalent PowerShell enumeration or rely on `cd site && npm test` plus CI. Do not skip site tests when `site/` or `catalog.json` changed.

Optional local extras when docs/links changed: `typos` if installed.

**All required checks must pass before Phase 4 commits.**

## Phase 3 — Version bump (semver)

Latest published version is the newest `vX.Y.Z` tag (also reflected as the top `## X.Y.Z` in `CHANGELOG.md`).

Choose **one**:

| Bump | When |
|------|------|
| **MAJOR** `X.0.0` | Breaking changes for consumers (removed skills, incompatible catalog/schema, install path breaks) |
| **MINOR** `X.Y.0` | New capabilities backwards-compatible (new skill, major site feature, new public docs surface) |
| **PATCH** `X.Y.Z` | Fixes, CI, copy, polish, dependency bumps, no new user-facing capability |

This repo has **no root package.json version field**. Version sources of truth:

1. Git tags `vX.Y.Z`
2. `CHANGELOG.md` headings
3. GitHub Releases

Do **not** invent version fields elsewhere. `site/package.json` `"version"` is the site package private version — leave it unless you have a deliberate reason to move it in lockstep (default: leave it).

Present to the user:

```
Current: vA.B.C
Proposed: vX.Y.Z (patch|minor|major)
Rationale: …
```

Proceed only after explicit approval (or a user-supplied exact version).

## Phase 4 — Conventional commits

### Commit message format

```
type(scope): short imperative summary
```

- **Types used in this repo:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`
- **Scopes (common):** `site`, `skills`, `content`, `luau`, `ci`, `deps`, `release`, `hub`, `evals`, skill slug (`datastores`, `rojo`, …)
- Subject: imperative, lowercase summary, no trailing period, ~72 chars
- Body optional; use when the why is non-obvious
- Breaking change: `feat(scope)!: …` or a footer `BREAKING CHANGE: …`

Examples from history:

- `feat(site): surface catalog evidence and validate generated routes`
- `fix(content): correct guidance and centralize catalog`
- `fix(luau): harden examples and add regression fixtures`
- `ci: add reproducible validation and source monitoring`
- `chore(release): prepare v1.6.0`

### Split plan

Group the dirty tree into logical commits, **dependency order** (foundations before dependents):

1. Repo hygiene / gitignore (if needed)
2. Content / catalog / skill guidance fixes
3. Luau example fixes
4. Site implementation (components, styles, pages) — may be one commit if it is one redesign, or split `feat(site)` / `style(site)` / `refactor(site)` when history benefits
5. Site tooling (`package.json`, lockfile, astro config, scripts)
6. CI / workflows
7. Docs (README, CONTRIBUTING, policies) that are not the changelog
8. **Final** `chore(release): prepare vX.Y.Z` — changelog only (and nothing else if possible)

Rules:

- Do not mix unrelated themes in one commit
- Deletions of replaced site components belong with the site commit that replaces them
- Generated artifacts (`skills.sh.json`, hub specialist block) land with the catalog/content commit that caused them
- After each commit, `git status` should get cleaner; end with a clean tree except for the intentional release commit series

### Git commands

```sh
git add <paths-for-this-commit>
git commit -m "$(cat <<'EOF'
type(scope): summary

EOF
)"
```

On Windows PowerShell, use an equivalent heredoc or multiple `-m` flags; keep the subject line exact.

After all feature commits, update the changelog (Phase 5), then:

```sh
git add CHANGELOG.md
git commit -m "$(cat <<'EOF'
chore(release): prepare vX.Y.Z

EOF
)"
```

## Phase 5 — Changelog

Edit `CHANGELOG.md`. Insert a **new section at the top** (below the title), never rewrite old sections except to fix factual errors the user requested.

### Heading

```markdown
## X.Y.Z — YYYY-MM-DD
```

Use today's date in ISO form. No `v` prefix on the heading number.

### Section style

Match tone and structure already in the file:

- **Patch / narrow releases:** one category heading (often `### CI` or `### Fixed`) and short bullets
- **Larger releases:** group under human categories such as `### Corrected`, `### Safer examples`, `### Verification and community`, `### Site`, `### Skills` — prefer outcome language over dump of commit subjects
- Bullets are full sentences or clear fragments; past tense or neutral factual tone
- Call out user-visible corrections and safety changes explicitly — accuracy is the product

Also keep a mental map to commits for the GitHub release body (Phase 6 uses commit subjects; changelog uses reader-facing prose).

## Phase 6 — Tag and GitHub Release

### Annotated tag

Create the tag on the release commit (HEAD after `chore(release): prepare vX.Y.Z`):

```sh
git tag -a "vX.Y.Z" -m "vX.Y.Z"
```

### Release notes format (required)

Mirror existing releases (`gh release view v1.6.0`, `v1.5.0`, …):

```markdown
## What's Changed

### Fixes
- fix(scope): subject (abcdef1)

### Features
- feat(scope): subject (abcdef2)

### Documentation
- docs(scope): subject (abcdef3)

### CI
- ci: subject (abcdef4)

### Chores
- chore(release): prepare vX.Y.Z (abcdef5)
```

Rules for the body:

1. Title line of the GitHub release **name** is `vX.Y.Z` (same as tag)
2. Start with `## What's Changed`
3. Group commits since the previous tag by conventional **type**:
   - `fix` → `### Fixes`
   - `feat` → `### Features`
   - `refactor` → `### Refactor`
   - `style` → `### Style`
   - `perf` → `### Performance`
   - `test` → `### Tests`
   - `docs` → `### Documentation`
   - `build` → `### Build`
   - `ci` → `### CI`
   - `chore` → `### Chores`
4. Omit empty groups
5. Each bullet: full conventional subject + space + `(<short-sha>)`
6. Include the `chore(release): prepare vX.Y.Z` commit under Chores
7. Do not invent PR links unless they exist; this repo often releases straight from commits on `main`
8. Order groups roughly: Fixes, Features, Refactor, Style, Performance, Tests, Documentation, Build, CI, Chores (skip missing)

Generate the list with:

```sh
PREV=vA.B.C   # previous tag
git log "${PREV}..HEAD" --reverse --format="%h %s"
```

### Create the release

Prefer creating the release **after** push so the tag exists on the remote, or push tags then release:

```sh
git push origin main
git push origin "vX.Y.Z"

gh release create "vX.Y.Z" \
  --title "vX.Y.Z" \
  --notes-file - <<'EOF'
## What's Changed

### Fixes
- fix(ci): example (abc1234)

### Chores
- chore(release): prepare vX.Y.Z (def5678)
EOF
```

On Windows, write notes to a temp file and pass `--notes-file path`.

Mark as latest (default). Do not use `--prerelease` unless the user asked for a pre-release.

## Phase 7 — Push and verify

```sh
git status
git log --oneline -10
git push origin main
git push origin "vX.Y.Z"
gh release view "vX.Y.Z"
gh run list --limit 5
```

Post-push:

1. Confirm `Validate` workflow starts on the push
2. If `site/**` or `catalog.json` (etc.) changed, confirm `Deploy site to GitHub Pages` starts
3. Report URLs to the user:
   - Release: `https://github.com/nonlooped/roblox-suite/releases/tag/vX.Y.Z`
   - Site (after deploy): `https://nonlooped.github.io/roblox-suite/`
4. Do not claim the live site has updated until the deploy workflow finishes; mention smoke job if relevant

If CI fails after push: diagnose, fix on a follow-up commit, and either ship a patch release or a fixup release per user direction — do not delete the tag unless the user explicitly wants a yank and understands the cost.

## Phase 8 — Final report

Give the user a short summary:

- Version shipped (`vX.Y.Z`) and bump type
- Commit list (hash + subject)
- Tag + release URL
- CI/deploy status
- Anything skipped (e.g. Luau tools unavailable locally) and what CI will still cover

## Abort / recovery

| Situation | Action |
|-----------|--------|
| User rejects version | Stop before commits or reset only **unpushed** commits with explicit approval |
| Checks fail mid-way | Fix or abort; no tag/release |
| Tag created locally, push failed | Keep tag; fix remote auth; push again — do not recreate with a different SHA casually |
| Release notes wrong after publish | `gh release edit vX.Y.Z --notes-file …` |
| Wrong files committed, not pushed | `git reset` / new commits with user approval |
| Wrong files committed, already pushed | Fix-forward commit; no history rewrite |

## Quick checklist

- [ ] On `main`, fetched, not behind origin
- [ ] Tree cleaned; secrets/junk gone; `.gitignore` updated if needed
- [ ] Catalog artifacts synced and `--check` clean
- [ ] `cd site && npm test` (and Luau checks if applicable) green
- [ ] Semver bump approved by user
- [ ] Logical conventional commits created (not one ball of mud)
- [ ] `CHANGELOG.md` has `## X.Y.Z — YYYY-MM-DD` at top
- [ ] `chore(release): prepare vX.Y.Z` is the last commit
- [ ] Annotated tag `vX.Y.Z`
- [ ] `git push origin main` and `git push origin vX.Y.Z`
- [ ] `gh release create` with `## What's Changed` grouped body
- [ ] CI/deploy observed; links reported
