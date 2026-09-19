# Product

## Purpose and audience

Roblox Suite gives coding agents Roblox API guidance, examples, and links to the documentation used to review them. The site helps builders decide whether to install the skills and find the skill that matches what they are building.

Write for a teenager shipping their first game as readily as for a Luau developer checking one API. Most readers are not here to evaluate a methodology; they are here to make something work. Lead with the job, not the subsystem. Let readers reach the install command or the relevant skill without reading the whole page.

## Actions and evidence

The primary call to action is to star the GitHub repository; the secondary action is to copy an install command. The catalog supports choosing a single skill.

Where the site shows API guidance, distinguish a deprecated API, a discouraged approach, and a pattern that is unsafe only under particular conditions — and say which one it is in plain words. A source citation supports the guidance; it does not prove an agent will follow it.

Sources belong on the skill they support, next to the claim, and folded away until asked for. Do not build a separate page of citations: it reads as a proof the reader has to audit, and it was the one page nobody needed. Keep install counts and other changing figures out of static prose unless they are dated and maintained.

## Voice

Write like one builder explaining a tool to another. Name the API, the problem, and the constraint. Prefer the short word: "old way" over "deprecated pattern", "stop players from cheating" over "server-side validation". A short, playful line can fit the brick theme, but installation instructions and error messages must stay clear.

Cut sentences that explain the project's own process rather than the reader's task. Describe what the skills provide. Avoid promises that they prevent broken code, eliminate exploits, or guarantee a working experience. Keep public copy consistent with the skill files and [contribution guidance](../CONTRIBUTING.md).

## Visual direction

Use the molded-brick shapes, saturated colors, and hard shadows defined in [DESIGN.md](DESIGN.md). Prefer a control the reader can press over a paragraph describing what it would say. Code examples and source links should carry the explanation; keep decoration out of their way.

## Accessibility

Use WCAG 2.1 AA contrast targets: at least 4.5:1 for body text and 3:1 for large text. Respect `prefers-reduced-motion`; the canvas scene renders a still frame. Pair status colors with text labels and marks so readers can distinguish old from current without relying on red and green.
