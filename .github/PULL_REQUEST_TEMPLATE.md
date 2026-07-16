# Pull request

## What changed

<!-- Summarize the behavior/content change and link related issues. -->

## Risk

- Skill(s):
- Catalog risk tier: critical / medium / lower
- User-visible failure mode if wrong:

## Evidence

- Official source URL(s):
- Verification date:
- Platform requirement or opinionated recommendation? Explain:

## Validation

- [ ] `cd site && npm test`
- [ ] `stylua --check` passes for changed Luau.
- [ ] `selene` and `luau-lsp analyze --platform roblox` pass for changed examples.
- [ ] Behavioral regressions were added or updated for script behavior changes.
- [ ] Studio/integration validation is described below, or the script remains explicitly experimental/reviewed.
- [ ] Catalog, source dates, maturity metadata, and generated artifacts are synchronized.
- [ ] No credentials or private data are included.
- [ ] Critical changes have a second reviewer under `REVIEW_POLICY.md`.

## Tests performed

<!-- Include commands, Studio setup, fixtures, and results. -->

## Known limitations

<!-- Be explicit. "None" is acceptable only after considering ambiguous cloud outcomes and concurrency. -->

By submitting this pull request, you agree that your contribution is licensed under the MIT License.
