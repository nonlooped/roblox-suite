# Product

## Register

brand

## Platform

web

## Users

Roughly four in five visitors are hobbyist Roblox builders and vibe coders: largely self-taught, building games solo or with friends, leaning hard on AI coding agents, and arriving from YouTube, TikTok, or Discord. They judge a page in about two seconds and they do not read carefully before deciding whether something is worth their attention. The remaining fifth are working Luau developers who already know the APIs and are actively trying to make their agent stop producing broken code; they arrive skeptical and want to see that the claims hold up.

The job in both cases is the same: get an AI coding agent to stop writing Roblox code that no longer runs.

## Product Purpose

Roblox Suite is a set of skills that keeps AI coding agents on Roblox APIs that currently work, with every correction traceable to official Roblox documentation. It exists because coding agents learned Roblox from years-old tutorials and confidently emit APIs that were deprecated long ago. Success is a visitor starring the repository, and secondarily installing the suite.

## Positioning

Every correction the suite makes is backed by a Roblox documentation page, with the date it was checked.

## Conversion & proof

- Primary CTA: star the GitHub repository. Secondary CTA: copy the install command.
- The line a visitor remembers after 10 seconds: their AI is writing Roblox code that stopped working years ago, and this fixes it.
- Belief ladder: my agent writes Roblox code that silently breaks → these specific APIs really are dead → this suite knows which ones and what replaces them → the claims are checkable, not asserted → installing costs me one command.
- Proof on hand: 8 GitHub stars and 385 skills.sh installs exist but are too small to display; quoting them would undercut the credibility they are meant to build. Proof is carried instead by the citation system already in the codebase: per-skill source lists, source URLs pointing at Roblox's own documentation, and the dates each page was checked.

## Brand Personality

Chunky, molded, snappy. The voice is a builder talking to another builder: plain, specific, a little blunt, never salesy. It names the exact API that broke and the exact thing that replaces it. Confident enough to be funny about the problem without being cute about the fix. A visitor's first reaction should be "whoa, who made this?"

## Anti-references

Not a generic AI-generated SaaS landing page: no violet or cyan gradients on near-black, no glow shadows, no glassmorphism, no gradient text, no tracked uppercase eyebrow above every section, no identical card grids, no big-number stat row. Not editorial-magazine either: no display serif with small mono labels and ruled columns. Not a terminal pastiche: green-on-black monospace as decoration is costume, not voice. Roblox's own red is deliberately avoided; the connection to Roblox should be read through form and imagery, not by borrowing the logo palette.

## Design Principles

Show the broken code, don't describe it. The product's argument is a diff, so the page should stage that diff as its central image rather than explaining it in prose.

Every claim carries its receipt. Where the suite asserts an API is dead, the interface should be able to point at the Roblox page that says so, with a date.

Build the thing, don't decorate around it. Effects earn their place by being made for this page; anything recognizable from a component library is worse than nothing.

Loud enough for a two-second judgment. The primary audience decides fast, so the first fold has to commit hard rather than hedge toward tasteful.

Honest about scale. A young project should lean on verifiable evidence rather than borrowed social proof.

## Accessibility & Inclusion

WCAG 2.1 AA as the baseline: body text at 4.5:1 or better, large text at 3:1 or better. All motion respects `prefers-reduced-motion`, including the canvas scene, which freezes rather than merely slowing. Colour is never the sole carrier of meaning; deprecated and current states are distinguished by label and typographic treatment as well as hue, so the red/green distinction does not strand colour-blind readers.
