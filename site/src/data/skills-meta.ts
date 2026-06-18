import type { Skill } from "./types";
import { getFrontmatterForSlugs } from "./skill-frontmatter";

// Curated from the repo: one-liners from the README skill table, covers
// from each SKILL.md, and source URLs taken verbatim from each SKILL.md's
// "Official sources" block. `displayTitle` and `overview` are hand-written
// for SERP (keyword-leading titles, substantive prose intros) and are
// the only fields here that are editorial rather than verbatim. Nothing
// technical is invented — overviews paraphrase the SKILL.md description.
// `lastReviewed` is pulled from each SKILL.md's `last_reviewed` frontmatter
// at build time so a single-skill update flows through automatically.
const SKILLS_RAW: Omit<Skill, "lastReviewed">[] = [
  {
    slug: "roblox",
    title: "roblox",
    hub: true,
    oneLiner: "Architecture principles, cross-skill workflows, quick-reference patterns",
    displayTitle: "Roblox development hub: architecture and skill routing",
    overview:
      "The entry-point skill for the suite. It gives your agent the big-picture architecture — server authority, the client-server model, performance mindset, and code organization — plus a decision tree that routes to the right specialist skill for datastores, animation, UI, monetization, networking, and more. Load this first; it tells the agent which deep skill to read next.",
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
    displayTitle: "Roblox core services, Luau types, and RunContext",
    overview:
      "The foundational layer every other skill assumes you know: the important services via `game:GetService`, Luau data types and serialization rules, script locations and execution contexts (including modern `BaseScript.RunContext`), and the client-server data model. Load this first so higher-level skills rest on correct assumptions. Also covers the reality that there is no runtime filesystem I/O inside experiences.",
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
    displayTitle: "Roblox networking: remotes, server authority, security",
    overview:
      "Complete coverage of the Roblox client-server model: RemoteEvent and RemoteFunction versus Bindable equivalents, RunService execution contexts, network ownership of assemblies, and server authority as the foundation for secure experiences. Includes common exploit vectors and the defensive patterns that stop them — validation, rate limiting, source-of-truth tables, and capability-based access control.",
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
    displayTitle: "Roblox DataStores: safe saves, versioning, quotas",
    overview:
      "Production-grade expertise on every Roblox DataStore type — DataStore, OrderedDataStore, MemoryStore Service — their differences, scopes, and operations. Covers `UpdateAsync` with a pure transform for contended values, hourly versioning for recovery, every error code and quota, throttling strategy, and the save/load patterns that avoid data loss, races, and throttling walls. Always combine with roblox-networking for validation.",
    covers: [
      "DataStore vs OrderedDataStore vs MemoryStore Service decision tree.",
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
    displayTitle: "Roblox UI: containers, responsive layouts, interaction",
    overview:
      "An exhaustive, modern guide to every Roblox GUI container — ScreenGui, SurfaceGui, BillboardGui — and every building block from Frame and TextLabel to ScrollingFrame and ViewportFrame. Covers scale + offset responsive layouts that survive every screen size, the interaction model (Activated versus mouse events, drag detectors), and particles-in-UI techniques, including the truth that 3D ParticleEmitters do not render inside ViewportFrame.",
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
    displayTitle: "Roblox animation: Animator, IK, TweenService, markers",
    overview:
      "Production-oriented coverage of Roblox's two motion systems: 3D character animation with `Animator`, `AnimationTrack`, `KeyframeSequence`, priorities, markers, and `IKControl` for procedural posing; and `TweenService` for UI and 3D property interpolation, sequences, chaining, and typewriter effects. Corrects the deprecated `Humanoid:LoadAnimation` pattern and covers the Animation Editor workflow, exporting, and performance tradeoffs.",
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
    displayTitle: "Roblox VFX: ParticleEmitter, Beam, Trail, performance",
    overview:
      "A deep dive into Roblox visual effects: `ParticleEmitter` properties, sequences, shapes, and flipbooks, plus `Beam`, `Trail`, and `Highlight`. Covers one-shot versus continuous emission, LOD-aware patterns that degrade gracefully on low-end devices, and the performance discipline that separates effects that look good from ones that tank FPS. Surface-level `add a ParticleEmitter and tweak Rate` is not enough.",
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
    displayTitle: "Roblox audio: modern graph, legacy Sound, 3D, effects",
    overview:
      "Complete coverage of Roblox audio: the modern modular audio graph (`AudioPlayer`, `AudioEmitter`, `AudioListener`, `Wire`, `AudioTextToSpeech`, `AudioSpeechToText`) and the legacy `Sound`/`SoundGroup`/`SoundEffect` system it replaces. Covers 2D versus 3D audio, spatial attenuation, effect chains, the 2022 audio privacy changes, mobile performance caps, preloading, and script-context rules. Use whenever implementing any sound, music, or voice feedback.",
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
    displayTitle: "Roblox monetization: game passes, products, subscriptions",
    overview:
      "A rule-accurate, production implementation guide for Roblox monetization: game passes (one-time Robux purchases), developer products (repeatable via `ProcessReceipt`), and subscriptions (auto-renewing via `UserSubscriptionStatusChanged`). Covers server-authoritative granting with idempotency guards, `PlayerAdded` re-verification, and current policy — cross-experience sales disabled as of May 30 2026, and Creator Rewards replaced Premium Payouts as of July 24 2025.",
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
    displayTitle: "Roblox Open Cloud: REST APIs, keys, in-experience calls",
    overview:
      "Complete coverage of Roblox Open Cloud — the REST API surface for data stores, assets, universes, places, users, groups, subscriptions, notifications, bans, and Luau execution, accessed from outside the engine or in-experience via `HttpService`. Covers authentication (API keys, OAuth 2.0, the 60-day key auto-expiry rule), least-privilege scopes, IP allowlists, the Secrets Store for in-experience key storage, webhooks, and the decision tree for in-engine versus Open Cloud.",
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
    displayTitle: "Roblox TeleportService: TeleportAsync, reserved servers",
    overview:
      "Complete coverage of `TeleportService`, multi-place architecture, reserved servers, and matchmaking. Covers the unified `TeleportAsync` API that replaces the deprecated `Teleport`/`TeleportPartyAsync`/`TeleportToPlaceInstance` methods, `TeleportOptions` for reserved servers, `TeleportAsyncResult` error handling, the 50-player group teleport limit, DataStore handoff patterns across teleports, and the security caveat that teleport data is client-spoofable.",
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
    displayTitle: "Roblox Studio MCP: connect AI agents to Studio",
    overview:
      "How to set up and use the official Roblox Studio MCP (Model Context Protocol) server so an AI agent can read and write scripts, explore the data model, execute Luau, run playtests, capture the viewport, and control Studio directly. Covers prerequisites, enabling Studio as an MCP server, quick-connect versus JSON/CLI configuration for Cursor, VS Code, Claude, and Codex, every available MCP tool, and combining MCP with Script Sync for a file-based workflow.",
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
    displayTitle: "Roblox physics: assemblies, constraints, network ownership",
    overview:
      "Complete coverage of Roblox rigid-body physics for vehicles, mechanisms, doors, platforms, and dynamic objects. Covers assemblies, root parts, anchoring, `WeldConstraint` versus `RigidConstraint`, mechanical constraints (hinge, spring, prismatic, rope), mover constraints (`AlignPosition`, `LinearVelocity`, `VectorForce`) as the modern replacements for deprecated `BodyMover` objects, network ownership for vehicles, the sleep system, and adaptive timestepping.",
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
    displayTitle: "Roblox NPCs: PathfindingService, AI patterns, patrol",
    overview:
      "Complete coverage of Roblox pathfinding and NPC AI: `PathfindingService`, agent parameters (radius, height, jump, climb), waypoint actions, blocked-path handling, `PathfindingModifier` and `PathfindingLink`, material and region costs, and streaming compatibility. Plus the NPC design patterns that scale — state machines, behavior trees, and simple follow, patrol, and chase — and the performance considerations for AI at scale.",
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
    displayTitle: "Roblox testing: Developer Console, MicroProfiler, TestEZ",
    overview:
      "Practical guidance for testing, debugging, and profiling Roblox experiences. Covers the Developer Console and Output discipline, `pcall` and assertion patterns, TestEZ unit tests, the MicroProfiler (client and server), Scene Analysis, the Script Profiler, memory diagnostics, and a methodology for isolating issues. Use when something is broken, slow, or unreliable, or when setting up automated and manual test workflows.",
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

// Fallback freshness date if a SKILL.md frontmatter can't be read.
// This should never be the active value in a normal build — every skill
// ships a `last_reviewed` frontmatter field — but it keeps the build
// type-safe and gives a sane default if a SKILL.md is unreadable.
const FALLBACK_LAST_REVIEWED = "2026-06-17";

// Enriched at module load: pulls `last_reviewed` from each SKILL.md so a
// single-skill update propagates to its page's schema and badge without
// a manual trust.ts bump. Awaited by the pages that consume it.
let skillsPromise: Promise<Skill[]> | null = null;

export async function loadSkills(): Promise<Skill[]> {
  if (!skillsPromise) {
    skillsPromise = (async () => {
      const fm = await getFrontmatterForSlugs(SKILLS_RAW.map((s) => s.slug));
      return SKILLS_RAW.map((s) => ({
        ...s,
        lastReviewed: fm[s.slug]?.last_reviewed ?? FALLBACK_LAST_REVIEWED,
      }));
    })();
  }
  return skillsPromise;
}

// Synchronous access for callers that don't need the freshness enrichment
// (e.g. getStaticPaths only needs slug + title). Uses the raw data with the
// fallback date; pages that need the real date should await loadSkills().
export const skills: Skill[] = SKILLS_RAW.map((s) => ({
  ...s,
  lastReviewed: FALLBACK_LAST_REVIEWED,
}));

// Synchronous map keyed by slug (uses the fallback date).
export const skillsBySlug = new Map(skills.map((s) => [s.slug, s]));

// Async map keyed by slug — the version pages should use to get real
// per-skill freshness dates from SKILL.md frontmatter.
let bySlugPromise: Promise<Map<string, Skill>> | null = null;
export async function loadSkillsBySlug(): Promise<Map<string, Skill>> {
  if (!bySlugPromise) {
    bySlugPromise = loadSkills().then((list) => new Map(list.map((s) => [s.slug, s])));
  }
  return bySlugPromise;
}

export function skillsForGroup(skillSlugs: string[]): Skill[] {
  return skillSlugs
    .map((slug) => skillsBySlug.get(slug))
    .filter((s): s is Skill => Boolean(s));
}