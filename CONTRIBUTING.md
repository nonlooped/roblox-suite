# Contributing

This is an agent skill set. Contributions should keep each skill self-contained and follow the existing conventions:

1. **SKILL.md first.** Each skill's `SKILL.md` is the entry point. Keep it focused on decision-making, quick patterns, and pointers to `references/`.
2. **Deep details go in `references/`.** Use granular files for tables, edge cases, and long-form explanations.
3. **Reusable code goes in `scripts/`.** Scripts should be commented, self-contained ModuleScripts, and safe to copy/adapt.
4. **Ground claims in official docs.** Link to the Roblox Engine API reference or official docs pages. Avoid outdated APIs.
5. **Cross-link related skills.** Use relative markdown links so agents can follow the chain.
6. **Run `luau` or Roblox Studio tests on scripts before submitting.**

## Pull request checklist

- [ ] Claims verified against current Roblox docs
- [ ] No new typos or broken markdown links
- [ ] Scripts are syntactically valid Luau
- [ ] Cross-references use correct skill names and paths
- [ ] Root README updated if new skills are added
