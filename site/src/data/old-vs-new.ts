import type { OldVsNewRow } from "./types";
import { groups } from "./groups";

// The "What You Stop Doing" evidence - accurate per-skill pairs surfaced
// on each skill detail page. All wording tracks the repo's own SKILL.md
// and reference call-outs.
export const oldVsNew: OldVsNewRow[] = [
  {
    slug: "roblox-animation",
    old: "Humanoid:LoadAnimation",
    new: "Animator:LoadAnimation",
    note: "with proper track lifecycle and marker-driven gameplay",
  },
  {
    slug: "roblox-networking",
    old: "Client-side economy and stat writes",
    new: "Server-authoritative validation on every purchase and save",
  },
  {
    slug: "roblox-datastores",
    old: "Blindly retrying an ambiguous DataStore write",
    new: "Explicit committed / rejected / unknown results plus uncached reconciliation",
    note: "UpdateAsync transforms must be pure; replay writes only when the operation is declared idempotent",
  },
  {
    slug: "roblox-datastores",
    old: "RemoveVersionAsync (deprecated)",
    new: "List/Get historical versions and restore by writing a new current version",
    note: "preserve version history for recovery",
  },
  {
    slug: "roblox-user-interfaces",
    old: "Pixel-offset UI that breaks on mobile",
    new: "Scale + offset responsive layouts tested across target screen sizes",
  },
  {
    slug: "roblox-vfx",
    old: "Particle emitters tanking FPS on low-end devices",
    new: "LOD-aware emitter patterns that degrade gracefully",
  },
  {
    slug: "roblox-gamepasses",
    old: "Monetization flows that violate current Roblox policy",
    new: "Source-checked, server-authoritative purchase and receipt handling",
  },
  {
    slug: "roblox-audio",
    old: "Legacy Sound / SoundGroup for new audio work",
    new: "Modern audio graph: AudioPlayer + AudioEmitter + Wire + effects",
    note: "official docs now discourage Sound for new work",
  },
  {
    slug: "roblox-teleport",
    old: "Deprecated Teleport / TeleportPartyAsync variants",
    new: "Unified TeleportAsync with TeleportOptions and TeleportAsyncResult",
  },
  {
    slug: "roblox-gamepasses",
    old: "Premium Payouts integration",
    new: "Creator Rewards",
    note: "Engagement-Based Payouts were discontinued July 24, 2025",
    current: true,
  },
  {
    slug: "roblox-open-cloud",
    old: "Hardcoded Open Cloud keys in scripts",
    new: "Secrets Store + HttpService:GetSecret with least-privilege API keys",
    note: "60-day key auto-expiry; rotate on a schedule",
  },
  {
    slug: "roblox-rojo",
    old: "Editing only in Studio with no Git-friendly source tree",
    new: "Rojo filesystem project + live sync (`rojo serve`) or `rojo build`",
    note: "two-way sync is experimental - treat disk as source of truth",
  },
  // per-skill detail pairs
  {
    slug: "roblox-core",
    old: "wait() / spawn() / delay()",
    new: "task.wait / task.spawn / task.defer",
    note: "the legacy globals are deprecated",
  },
  {
    slug: "roblox-physics",
    old: "Deprecated BodyMovers (BodyPosition, BodyVelocity, BodyGyro…)",
    new: "Modern mover constraints (AlignPosition, LinearVelocity, AlignOrientation…)",
    note: "BodyPosition → AlignPosition, BodyVelocity → LinearVelocity, BodyGyro → AlignOrientation",
  },
  {
    slug: "roblox-gamepasses",
    old: "Cross-experience pass and product sales",
    new: "Disabled as of May 30, 2026",
    note: "current Roblox policy: design monetization within a single experience",
    current: true,
  },
];

// One old→new pair per domain, for the catalog index's "What your agent
// stops doing" section. Derived from oldVsNew + groups so there is a single
// source of truth - editing a pair in oldVsNew propagates everywhere and
// drift is impossible. Picks the first pair found for each domain's skills
// (the sharpest deprecated→current proof that domain owns).
export function onePairPerDomain(): OldVsNewRow[] {
  return groups
    .map((g) => {
      const pair = oldVsNew.find((row) => g.skills.includes(row.slug));
      return pair ?? null;
    })
    .filter((row): row is OldVsNewRow => row !== null);
}
