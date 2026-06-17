import type { OldVsNewRow } from "./types";

// The "What You Stop Doing" evidence. Featured rows are the README's
// curated 10-row table (the landing comparison); the rest are accurate
// per-skill pairs surfaced on the detail pages. All wording tracks the
// repo's own SKILL.md / reference call-outs.
export const oldVsNew: OldVsNewRow[] = [
  {
    slug: "roblox-animation",
    old: "Humanoid:LoadAnimation",
    new: "Animator:LoadAnimation",
    note: "with proper track lifecycle and marker-driven gameplay",
    featured: true,
  },
  {
    slug: "roblox-networking",
    old: "Client-side economy and stat writes",
    new: "Server-authoritative validation on every purchase and save",
    featured: true,
  },
  {
    slug: "roblox-datastores",
    old: "Race conditions from bare SetAsync",
    new: "Queue-based save patterns with retry and exponential backoff",
    note: "UpdateAsync with a pure transform reads-then-writes atomically",
    featured: true,
  },
  {
    slug: "roblox-user-interfaces",
    old: "Pixel-offset UI that breaks on mobile",
    new: "Scale + offset responsive layouts that survive every screen size",
    featured: true,
  },
  {
    slug: "roblox-vfx",
    old: "Particle emitters tanking FPS on low-end devices",
    new: "LOD-aware emitter patterns that degrade gracefully",
    featured: true,
  },
  {
    slug: "roblox-gamepasses",
    old: "Monetization flows that violate current Roblox policy",
    new: "ToS-compliant purchase handling with proper receipts",
    featured: true,
  },
  {
    slug: "roblox-audio",
    old: "Legacy Sound / SoundGroup for new audio work",
    new: "Modern audio graph: AudioPlayer + AudioEmitter + Wire + effects",
    note: "official docs now discourage Sound for new work",
    featured: true,
  },
  {
    slug: "roblox-teleport",
    old: "Deprecated Teleport / TeleportPartyAsync variants",
    new: "Unified TeleportAsync with TeleportOptions and TeleportAsyncResult",
    featured: true,
  },
  {
    slug: "roblox-gamepasses",
    old: "Premium Payouts integration",
    new: "Creator Rewards",
    note: "Engagement-Based Payouts were discontinued July 24, 2025",
    current: true,
    featured: true,
  },
  {
    slug: "roblox-open-cloud",
    old: "Hardcoded Open Cloud keys in scripts",
    new: "Secrets Store + HttpService:GetSecret with least-privilege API keys",
    note: "60-day key auto-expiry; rotate on a schedule",
    featured: true,
  },
  // — per-skill detail pairs (not on the landing table) —
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
    note: "current Roblox policy — design monetization within a single experience",
    current: true,
  },
];

export const featuredOldVsNew = oldVsNew.filter((r) => r.featured);