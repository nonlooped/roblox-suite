# Agent rules

## Version bumps and GitHub releases

Any change to the source or skills needs a version bump. Source and skills cover `roblox*/` skills, references, and scripts; `catalog.json`, `types/`, `schemas/`, `tests/`, and `site/` source. CI workflows and repo-level docs such as README and CONTRIBUTING do not need a bump unless they change published guidance.

For each bump:

1. Add a `## X.Y.Z — YYYY-MM-DD` section at the top of `CHANGELOG.md`.
2. Set `"version"` to `X.Y.Z` in `site/package.json` and in both root `"version"` fields of `site/package-lock.json`.
3. Commit the bump with the changes it releases and push it to `origin/main`.
4. Publish a GitHub release for the bump commit, with the tag `vX.Y.Z` and the same name. Use the version's CHANGELOG section as the release notes, without the `## X.Y.Z` heading:

   ```sh
   gh release create vX.Y.Z --target <bump-commit-sha> --title vX.Y.Z --notes-file <notes-file>
   ```

A version bump is not finished until `gh release view vX.Y.Z` shows the release. Do not release a version without its CHANGELOG section, and do not leave a CHANGELOG section without its release.
