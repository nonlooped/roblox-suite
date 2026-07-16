# Roadmap

Roblox Suite is prioritizing verification depth over catalog growth.

## Now — correctness and enforcement

- [x] Correct transfer economics and deprecated DataStore guidance.
- [x] Redesign the four high-risk helper examples around explicit failure states and safe coordination.
- [x] Add risk tiers, script maturity, strict content validation, Luau checks, and site build smoke tests.
- [x] Make `catalog.json` the source for the registry, site, groups, and hub specialist list.
- [ ] Run the high-risk fixtures in an automated Roblox test environment.
- [ ] Require a second reviewer for critical changes in branch protection.

## Next — evaluations and change monitoring

- [x] Add a versioned evaluation task/check schema.
- [x] Publish the first reproducible baseline-versus-suite run (Codex / gpt-5.6-sol, 2026-07-16).
- [ ] Add a scheduled official-doc/API change monitor that opens review issues without rewriting content.
- [ ] Publish per-skill evaluation and integration-test evidence on the website.

## Later — feedback and product learning

- [x] Add a direct inaccuracy-report flow and public trust policies.
- [ ] Enable public issue creation in repository settings.
- [ ] Choose and configure privacy-friendly aggregate analytics for install copies and outbound links.
- [ ] Add troubleshooting, update, uninstall, and supported-agent matrices from measured behavior.

Catalog expansion remains paused until critical skills have executable platform integration coverage and a published evaluation baseline.
