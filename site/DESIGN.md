# Design

The site uses molded-brick shapes: saturated fills, solid ink borders, and hard offset shadows. [PRODUCT.md](PRODUCT.md) defines the audience and copy. [global.css](src/styles/global.css) owns the color, type, spacing, and motion values.

## Surfaces and color

**A section background is cobalt or yellow. Nothing else.** Cobalt carries the page; yellow closes it, one yellow section at most and always the last one. Paper never drenches a section — it is a panel fill, and a page-wide field of it reads as a different site.

| Surface | Use |
| --- | --- |
| `brand` cobalt | Every content section, and the header |
| `toy-yellow` | The closing section, pressed keys, and primary actions |
| `ink` near-black | Footer, code panels, and panels that want weight |
| `paper` off-white | Panels and controls only: skill tiles, unpressed keys, the search field, the sources disclosure |

Tint muted text toward its surface color. Pair status colors with labels rather than leaving them to carry meaning alone. Paper on `toy-red` is unsuitable for small text; use ink. On cobalt, a link is `toy-yellow` (5.16:1); on paper or yellow it is `brand` (6.93:1 and 5.16:1). `brand` on cobalt and `toy-red` on cobalt both fail — never pair them.

Keep flat fills and hard shadows. Avoid glass effects, text gradients, glow shadows, and ambient blur.

## Typography

Use Unbounded for the wordmark and headings, Hanken Grotesk for body text, and JetBrains Mono for code. Fonts are self-hosted through `@fontsource-variable`.

Unbounded is wide, so check headline wrapping at phone widths after copy changes. Use the `measure` utility for running prose. Keep commands and URLs readable in full by wrapping them.

## Components

- `panel` and `panel-sm` provide borders, rounded corners, and hard shadows. Avoid nested panels.
- `pressable` lifts on hover and moves into its shadow when pressed. Animate transforms and shadows without reflow.
- A selected key — a tab, a filter chip — travels the full shadow offset and stays bottomed out in `toy-yellow`. A partial press reads as misalignment.
- Primary buttons use yellow with ink text; secondary buttons use ink with paper text.
- `BrickScene.tsx` draws the brick tower on canvas, leans it toward the pointer, pauses off-screen, and renders a still frame that ignores the pointer under reduced motion.
- `CopyCommand.tsx` is the only install-command control. Use it everywhere a command appears, so the copy affordance never moves.
- `JobPicker.astro` opens the catalog by goal rather than by subsystem, using the `does` label from `catalog.ts`.
- `SkillFinder.tsx` searches and filters the catalog. Groups stay as sections, because the grouping is what says how the skills relate; filtering hides empty groups rather than flattening them.

## Motion and layout

Use the easing tokens in `global.css`. Animate properties that do not trigger layout, and provide a reduced-motion path. Content must remain visible when scripts or hydration fail — the catalog renders on the server, so it still works as a static list without JavaScript.

Give grid children containing commands or URLs `min-w-0`. Without it, their minimum content width can force the page wider than the viewport. Check install commands and skill titles on narrow screens after edits.

Code blocks are the one place a horizontal scroll is correct: wrapping a Luau line changes what it looks like it does. Everything else wraps.
