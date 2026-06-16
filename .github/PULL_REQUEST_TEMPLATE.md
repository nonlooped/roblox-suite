# Pull Request Checklist

Thank you for helping keep Roblox Suite accurate and current!

Please fill out this template and ensure the following before requesting review:

- [ ] All claims and code patterns verified against the latest [Roblox Engine API Reference](https://create.roblox.com/docs/reference/engine) and official guides.
- [ ] No new typos, broken internal relative links, or broken links to official docs.
- [ ] Any new or modified `.lua` scripts are syntactically valid Luau (tested via Roblox Studio or `luau-lsp` / `luau`).
- [ ] Cross-skill references and paths in SKILL.md / references are correct and use the expected `../skill-name/...` form.
- [ ] Root `README.md` and/or `skills.sh.json` updated if new skills were added or groupings changed.
- [ ] Scripts follow the project's conventions: server authority first, pcall + error handling, budget awareness where relevant, clear usage comments in the header, and `require` examples.

## Description of changes

<!-- Summarize what this PR does. Link any related issues. -->

## Testing performed

<!-- How did you validate the changes? (Studio playtest, luau check, manual review of links, etc.) -->

## Related skills / files

<!-- e.g. roblox-data-persistence, references/limits-quotas-....md -->

---

By submitting this PR you agree that your contributions are licensed under the MIT License.