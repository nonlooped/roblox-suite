# Design

Visual system for the Roblox Suite marketing site. Strategy and audience live in [PRODUCT.md](./PRODUCT.md); this file records how it looks.

The form language is **injection-moulded plastic**: flat saturated fills, solid 2px ink edges, and hard offset shadows. There are no glows, no glass, no gradients on text, and no ambient blur anywhere in the system.

## Theme

Drenched. The cobalt is the surface, not an accent on a neutral ground. Sections alternate between three grounds so the scroll has rhythm rather than one repeated template:

| Ground | Used for |
| --- | --- |
| `brand` cobalt | Hero, correction panel, catalog index, page headers |
| `ink` near-black | Ticker band, footer, code panels |
| `paper` off-white | Long-form reading: how-it-works, skill body, evidence table |
| `toy-yellow` | The closing CTA only, as the page's brightest surface |

## Color

All values OKLCH. Neutrals are tinted toward the brand hue (258), never toward warm.

| Token | Value | Role |
| --- | --- | --- |
| Primary | `oklch(0.45 0.235 258)` | `--brand`, the drench |
| Brand deep | `oklch(0.33 0.19 258)` | Recessed brand surfaces |
| Brand lift | `oklch(0.56 0.22 258)` | Raised brand surfaces, brick blue |
| Ink | `oklch(0.17 0.035 258)` | Near-black ground and every border |
| Ink soft | `oklch(0.24 0.04 258)` | Dividers inside ink panels |
| Paper | `oklch(0.965 0.012 258)` | Off-white ground and light text |
| Accent | `oklch(0.87 0.185 92)` | `--toy-yellow`, second voice, primary CTA |
| Deprecated | `oklch(0.63 0.235 27)` | `--toy-red`, dead APIs |
| Current | `oklch(0.75 0.19 148)` | `--toy-green`, working APIs |

Muted text is a `color-mix` tint of its own ground, never flat gray on a colored surface. Every pair is verified at WCAG AA: the weakest is muted-on-cobalt at 4.72:1 and ink-on-red at 4.88:1. Paper on `toy-red` measures 3.54:1 and is **not** used for small text.

Deprecated and current are never signalled by hue alone; a `-` / `+` gutter and a text label carry the same distinction.

## Typography

| Role | Face | Notes |
| --- | --- | --- |
| Wordmark | Unbounded Variable 700 | Wide geometric, reads extruded |
| Display | Unbounded Variable 700 | All h1–h3 |
| Body | Hanken Grotesk Variable 400 | Humanist, high legibility |
| Code | JetBrains Mono Variable | Literal code only, never decoration |

Paired on a contrast axis (geometric display against humanist body) rather than two near-identical sans faces. Both are self-hosted via `@fontsource-variable`; nothing loads from a CDN.

Modular scale, ≥1.25 between steps. Display is capped at `4rem` rather than the 6rem ceiling because Unbounded is wide and ran to five lines at larger sizes. Tracking bottoms out at `-0.03em`. Light-on-dark body runs at 1.7 line-height to offset optical lightening.

```
display  clamp(2.25rem, 4.8vw, 4rem)   lh 0.98
title    clamp(1.875rem, 4.2vw, 3.25rem)
heading  clamp(1.375rem, 2.4vw, 1.875rem)
lead     1.375rem
base     1.0625rem
small    0.9375rem
```

Running prose is capped at 68ch via the `measure` utility.

## Components

**Panel** — `panel` / `panel-sm`. 2px ink border, 12px radius (6px small), hard offset shadow `6px 6px 0`. The one container primitive; there are no nested panels. Variants: ink, paper, brand, yellow-shadow.

**Pressable** — `pressable`. Hover lifts 2px and deepens the shadow; active travels 6px into it, like a key bottoming out. Transform and box-shadow only, so nothing reflows. Frozen under reduced motion.

**Buttons** — Primary is yellow fill with ink text (the GitHub star). Secondary is ink fill with paper text. Both are panels with `pressable`.

**Brick scene** — `BrickScene.tsx`. Hand-written 3D canvas renderer: perspective projection, painter's-algorithm depth sort, flat-shaded faces with 2px ink strokes, projected elliptical studs. Bricks free-fall into a tower on a 7.5s loop. Ambient shading floor is high (0.78) so faces read as coloured plastic rather than grey against the cobalt. Renders one settled frame under reduced motion and pauses off-screen via IntersectionObserver.

**Correction panel** — `CorrectionPanel.tsx`. The product's argument staged as a real diff. First paint is never gated behind hydration; only transitions between corrections animate.

**Skill index** — `SkillIndex.astro`. A grouped index of full-width rows with rules between them, deliberately not a grid of sixteen equal cards. Rows fill yellow on hover and focus.

**Ticker** — `DeprecatedTicker.tsx`. Two counter-scrolling marquees of dead APIs, pausing on hover.

## Motion

Exponential ease-out (`--ease-out-expo`, `--ease-out-quart`). No bounce, no elastic, and no animation of layout properties. Scroll reveals use `animation-timeline: view()` and layer on top of already-visible content, so nothing ships blank when scripting or hydration does not run. Every animation has a reduced-motion path; the brick scene freezes rather than merely slowing.

## Layout

Semantic z-scale: `--z-scene: 1`, `--z-content: 2`, `--z-sticky: 20`, `--z-modal: 40`, `--z-toast: 60`. No arbitrary values.

Grid children that contain nowrap content carry `min-w-0`, since `min-width: auto` otherwise forces the column wider than the viewport and the section clips it.

## Deliberately excluded

Glassmorphism, gradient text, glow shadows on dark, violet/cyan palettes, tracked uppercase eyebrows above section headings, numbered section markers, identical card grids, hero-metric stat rows, Inter, and any component-library decoration. Each is a recognizable generated-UI tell; see the anti-references in PRODUCT.md.
