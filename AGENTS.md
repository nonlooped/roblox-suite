# Roblox Suite

Roblox Suite ships agent guidance and Luau examples for Roblox development. Start with `roblox/SKILL.md` to route a task to a specialist. The root `roblox*/` directories are the published skills. `.agents/skills/` holds local development skills shared with Claude through `.claude/skills`.

## Working here

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for skill structure, Luau conventions, and validation. Check changed API and policy claims against official sources. Update `last_reviewed` only after verifying the affected guidance. Consult [REVIEW_POLICY.md](REVIEW_POLICY.md) for freshness limits and critical changes.
- Edit `catalog.json` and reference frontmatter at the source. Regenerate `skills.sh.json`, the hub's specialist list, and reference indexes with `node scripts/generate-catalog-artifacts.mjs` when their inputs change. Validate with `node scripts/generate-catalog-artifacts.mjs --check` and `node scripts/check-hub-refs.mjs`.
- The Astro catalog site lives in `site/` and imports `catalog.json`. CI uses Node 24. Run `npm ci` and `npm test` from `site/` for site or published content changes. The test command validates content, checks types, builds the site, and checks the generated routes.
- For Luau changes, use the tool versions pinned in `rokit.toml` and follow the checks in [validate.yml](.github/workflows/validate.yml). Follow [tests/README.md](tests/README.md) for Studio fixtures, and report any relevant Studio checks you could not run.

## Version bumps and GitHub releases

Bump the version for changes to published skills or source, including `roblox*/`, `catalog.json`, `types/`, `schemas/`, `tests/`, and `site/` source. CI workflows and repo-level docs need a bump only when they change published guidance. Local agent tooling stays outside the release.

For each bump, add a `## X.Y.Z — YYYY-MM-DD` section at the top of `CHANGELOG.md`. Set the version in `site/package.json` and in both version fields in `site/package-lock.json` (the root and `packages[""]`).

When releasing, commit the bump with the changes it releases and push to `origin/main`. Create the GitHub release for that commit as `vX.Y.Z`, using that version's changelog section without its heading. Verify the release with `gh release view vX.Y.Z`.

```sh
gh release create vX.Y.Z --target <bump-commit-sha> --title vX.Y.Z --notes-file <notes-file>
```
