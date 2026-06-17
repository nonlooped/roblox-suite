import type { Skill } from "./types";

// Curated from the repo: one-liners from the README skill table, covers
// from each SKILL.md, and source URLs taken verbatim from each SKILL.md's
// "Official sources" block. Nothing here is invented.
export const skills: Skill[] = [
  {
    slug: "roblox",
    title: "roblox",
    hub: true,
    oneLiner: "Architecture principles, cross-skill workflows, quick-reference patterns",
    covers: [
      "The single entry point: overarching architecture and server-authority principles.",
      "Quick-reference patterns and a decision tree that routes you to the right specialized skill.",
      "Cross-skill workflows for data, UI, animation, monetization, and networking.",
    ],
    sources: [
      { label: "Engine API Reference", url: "https://create.roblox.com/docs/reference/engine" },
      { label: "Docs index for agents (llms.txt)", url: "https://create.roblox.com/docs/llms.txt" },
      { label: "Engine API index for agents", url: "https://create.roblox.com/docs/reference/engine/llms.txt" },
    ],
  },
  {
    slug: "roblox-core",
    title: "roblox-core",
    oneLiner: "Services, Luau types, serialization, script locations, `RunContext`, the data model",
    covers: [
      "Every important service via `game:GetService`, Luau data types and serialization rules.",
      "Script locations and execution contexts, including modern `BaseScript.RunContext`.",
      "The client-server data model, and the reality that there is no runtime filesystem I/O.",
    ],
    sources: [
      { label: "Luau", url: "https://create.roblox.com/docs/en-us/luau" },
      { label: "Script locations & contexts", url: "https://create.roblox.com/docs/en-us/scripting/locations" },
      { label: "Services", url: "https://create.roblox.com/docs/en-us/scripting/services" },
      { label: "Client-server model", url: "https://create.roblox.com/docs/en-us/projects/client-server" },
      { label: "Engine API Reference", url: "https://create.roblox.com/docs/reference/engine" },
    ],
  },
  {
    slug: "roblox-networking",
    title: "roblox-networking",
    oneLiner: "Remotes, server authority, network ownership, exploit defenses, capabilities",
    covers: [
      "RemoteEvent/RemoteFunction vs Bindable equivalents, and RunService execution contexts.",
      "Server authority as the foundation — validation and rate-limiting on every request.",
      "Common exploit vectors and capability-based access control.",
    ],
    sources: [
      { label: "Client-server model", url: "https://create.roblox.com/docs/projects/client-server" },
      { label: "Security tactics", url: "https://create.roblox.com/docs/scripting/security/security-tactics" },
      { label: "Engine API Reference", url: "https://create.roblox.com/docs/reference/engine" },
    ],
  },
  {
    slug: "roblox-datastores",
    title: "roblox-datastores",
    oneLiner: "DataStores, versioning, metadata, quotas, throttling, safe save/load patterns",
    covers: [
      "DataStore vs OrderedDataStore vs MemoryStoreService decision tree.",
      "`UpdateAsync` with a pure transform for contended values; hourly versioning for recovery.",
      "Every error code, quota, and throttling strategy — patterns that avoid data loss.",
    ],
    sources: [
      { label: "Data stores", url: "https://create.roblox.com/docs/cloud-services/data-stores" },
      { label: "Versioning, listing & caching", url: "https://create.roblox.com/docs/cloud-services/data-stores/versioning-listing-and-caching" },
      { label: "Error codes & limits", url: "https://create.roblox.com/docs/cloud-services/data-stores/error-codes-and-limits" },
      { label: "Best practices", url: "https://create.roblox.com/docs/cloud-services/data-stores/best-practices" },
      { label: "Engine API Reference", url: "https://create.roblox.com/docs/reference/engine" },
    ],
  },
  {
    slug: "roblox-user-interfaces",
    title: "roblox-user-interfaces",
    oneLiner: "GUI containers, responsive layouts, interaction, particles-in-UI techniques",
    covers: [
      "Every GUI container (ScreenGui, SurfaceGui, BillboardGui) and building block.",
      "Scale + offset responsive layouts that survive every screen size.",
      "Particles-in-UI techniques — and the truth that 3D ParticleEmitters don't render in ViewportFrame.",
    ],
    sources: [
      { label: "In-experience containers", url: "https://create.roblox.com/docs/en-us/ui/in-experience-containers" },
      { label: "On-screen containers", url: "https://create.roblox.com/docs/en-us/ui/on-screen-containers" },
      { label: "Engine API Reference", url: "https://create.roblox.com/docs/reference/engine" },
    ],
  },
  {
    slug: "roblox-animation",
    title: "roblox-animation",
    oneLiner: "`Animator`, tracks, IK, `TweenService`, UI tweens, animation markers",
    covers: [
      "Animator-based loading with proper track lifecycle and marker-driven gameplay.",
      "`IKControl` for procedural posing; CurveAnimation vs KeyframeSequence.",
      "`TweenService` for UI and 3D, sequences, chaining, and typewriter effects.",
    ],
    sources: [
      { label: "Animation", url: "https://create.roblox.com/docs/animation" },
      { label: "Inverse kinematics", url: "https://create.roblox.com/docs/animation/inverse-kinematics" },
      { label: "UI animation", url: "https://create.roblox.com/docs/ui/animation" },
      { label: "Engine API Reference", url: "https://create.roblox.com/docs/reference/engine" },
    ],
  },
  {
    slug: "roblox-vfx",
    title: "roblox-vfx",
    oneLiner: "`ParticleEmitter`, shapes, flipbooks, beams, trails, highlights, performance",
    covers: [
      "ParticleEmitter properties, sequences, shapes, and flipbooks.",
      "Beam, Trail, Highlight — and one-shot vs continuous emission.",
      "Performance: LOD-aware patterns that degrade gracefully on low-end devices.",
    ],
    sources: [
      { label: "Particle emitters", url: "https://create.roblox.com/docs/en-us/effects/particle-emitters" },
      { label: "Engine API Reference", url: "https://create.roblox.com/docs/reference/engine" },
    ],
  },
  {
    slug: "roblox-audio",
    title: "roblox-audio",
    oneLiner: "Modern audio graph (`AudioPlayer`/`AudioEmitter`/`Wire`/TTS/STT), legacy `Sound`, 3D audio, effects, performance",
    covers: [
      "The modern modular audio graph: AudioPlayer, AudioEmitter, Wire, TTS, STT.",
      "Legacy Sound/SoundGroup — discouraged for new work — and when to still use it.",
      "2D vs 3D audio, effect chains, and mobile performance caps.",
    ],
    sources: [
      { label: "Audio objects", url: "https://create.roblox.com/docs/en-us/audio/objects" },
      { label: "Audio effects", url: "https://create.roblox.com/docs/en-us/audio/effects" },
      { label: "Sound (legacy) class", url: "https://create.roblox.com/docs/en-us/reference/engine/classes/Sound" },
      { label: "Engine API Reference", url: "https://create.roblox.com/docs/en-us/reference/engine" },
    ],
  },
  {
    slug: "roblox-gamepasses",
    title: "roblox-gamepasses",
    oneLiner: "Game passes, dev products, subscriptions, purchase flow, policy, Robux transfers, analytics",
    covers: [
      "Game passes, developer products (`ProcessReceipt`), and subscriptions.",
      "Server-authoritative granting with idempotency guards and `PlayerAdded` re-verification.",
      "Current policy: cross-experience sales disabled (May 30 2026); Creator Rewards replaced Premium Payouts.",
    ],
    sources: [
      { label: "Passes (monetization)", url: "https://create.roblox.com/docs/en-us/production/monetization/passes" },
      { label: "Creator Rewards", url: "https://create.roblox.com/docs/en-us/creator-rewards" },
      { label: "Robux transfers", url: "https://create.roblox.com/docs/en-us/production/monetization/robux-transfers" },
    ],
  },
  {
    slug: "roblox-open-cloud",
    title: "roblox-open-cloud",
    oneLiner: "Open Cloud REST APIs: API keys/OAuth2, data stores, assets, universes, webhooks, in-experience calling",
    covers: [
      "REST APIs for data stores, assets, universes, and more — from outside the engine or in-experience via HttpService.",
      "API keys, OAuth2, least-privilege scopes, and the 60-day key auto-expiry rule.",
      "Secrets Store + `HttpService:GetSecret` so keys never sit in scripts.",
    ],
    sources: [
      { label: "Open Cloud", url: "https://create.roblox.com/docs/en-us/cloud" },
      { label: "API keys", url: "https://create.roblox.com/docs/en-us/cloud/auth/api-keys" },
      { label: "OAuth2 overview", url: "https://create.roblox.com/docs/cloud/auth/oauth2-overview" },
      { label: "HttpService (in-experience)", url: "https://create.roblox.com/docs/en-us/cloud-services/http-service" },
      { label: "Secrets", url: "https://create.roblox.com/docs/en-us/cloud-services/secrets" },
      { label: "Rate limits", url: "https://create.roblox.com/docs/en-us/cloud/reference/rate-limits" },
    ],
  },
  {
    slug: "roblox-teleport",
    title: "roblox-teleport",
    oneLiner: "`TeleportAsync`, `TeleportOptions`, reserved servers, multi-place, matchmaking, DataStore handoff",
    covers: [
      "The unified `TeleportAsync` API that replaces the deprecated teleport methods.",
      "`TeleportOptions`, reserved servers, and `TeleportAsyncResult` error handling.",
      "Multi-place architecture, DataStore handoff, and matchmaking patterns.",
    ],
    sources: [
      { label: "Teleport", url: "https://create.roblox.com/docs/en-us/projects/teleport" },
      { label: "TeleportService", url: "https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportService" },
      { label: "TeleportOptions", url: "https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportOptions" },
      { label: "TeleportAsyncResult", url: "https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportAsyncResult" },
    ],
  },
  {
    slug: "roblox-mcp",
    title: "roblox-mcp",
    oneLiner: "Connect AI agents to Roblox Studio via MCP: setup, tools, Script Sync, playtesting",
    covers: [
      "Connect AI agents to Roblox Studio via the official MCP server.",
      "Read and write scripts, explore the data model, run Luau, and capture the viewport.",
      "Combine with Script Sync for a file-based workflow.",
    ],
    sources: [
      { label: "Studio MCP", url: "https://create.roblox.com/docs/en-us/studio/mcp" },
      { label: "Build with AI", url: "https://create.roblox.com/docs/en-us/ai/build" },
      { label: "Script Sync", url: "https://create.roblox.com/docs/en-us/scripting/sync" },
    ],
  },
  {
    slug: "roblox-physics",
    title: "roblox-physics",
    oneLiner: "Rigid bodies, assemblies, mechanical/mover constraints, network ownership, vehicles",
    covers: [
      "Assemblies, root parts, anchoring, and WeldConstraint vs RigidConstraint.",
      "Mechanical and mover constraints — and the modern replacements for deprecated BodyMovers.",
      "Network ownership for vehicles, the sleep system, and adaptive timestepping.",
    ],
    sources: [
      { label: "Physics", url: "https://create.roblox.com/docs/physics" },
      { label: "Mechanical constraints", url: "https://create.roblox.com/docs/physics/mechanical-constraints" },
      { label: "Mover constraints", url: "https://create.roblox.com/docs/physics/mover-constraints" },
      { label: "Network ownership", url: "https://create.roblox.com/docs/physics/network-ownership" },
      { label: "Engine API Reference", url: "https://create.roblox.com/docs/reference/engine" },
    ],
  },
  {
    slug: "roblox-npcs",
    title: "roblox-npcs",
    oneLiner: "PathfindingService, modifiers/links, waypoint following, patrol/chase AI patterns",
    covers: [
      "PathfindingService, agent parameters, and blocked-path handling.",
      "PathfindingModifier and PathfindingLink, with material and region costs.",
      "State machines, behavior trees, and patrol/chase patterns at scale.",
    ],
    sources: [
      { label: "Pathfinding (characters)", url: "https://create.roblox.com/docs/en-us/characters/pathfinding" },
      { label: "Streaming (workspace)", url: "https://create.roblox.com/docs/en-us/workspace/streaming" },
      { label: "Engine API Reference", url: "https://create.roblox.com/docs/reference/engine" },
    ],
  },
  {
    slug: "roblox-testing",
    title: "roblox-testing",
    oneLiner: "Developer Console, MicroProfiler, Scene Analysis, tests, logging, common bug fixes",
    covers: [
      "Developer Console, Output discipline, and pcall/assert patterns.",
      "MicroProfiler, Scene Analysis, and the Script Profiler.",
      "TestEZ unit tests, memory diagnostics, and a methodology for isolating issues.",
    ],
    sources: [
      { label: "MicroProfiler", url: "https://create.roblox.com/docs/en-us/performance-optimization/microprofiler" },
      { label: "Scene Analysis", url: "https://create.roblox.com/docs/en-us/performance-optimization/scene-analysis" },
      { label: "Developer Console", url: "https://create.roblox.com/docs/en-us/studio/developer-console" },
      { label: "Script Profiler", url: "https://create.roblox.com/docs/en-us/studio/optimization/scriptprofiler" },
    ],
  },
];

export const skillsBySlug = new Map(skills.map((s) => [s.slug, s]));

export function skillsForGroup(skillSlugs: string[]): Skill[] {
  return skillSlugs
    .map((slug) => skillsBySlug.get(slug))
    .filter((s): s is Skill => Boolean(s));
}