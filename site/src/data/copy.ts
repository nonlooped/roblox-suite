/*
 * The plain-language layer over catalog.json. The catalog names things the way
 * the skill files do; this file names them the way a builder would ask for them.
 * Every catalog skill and group needs an entry here (validate-content checks it).
 */

export interface SkillCopy {
  /** What a builder would call this area of their game. */
  name: string;
  /** What the skill helps the assistant do, in one short line. */
  does: string;
  /** Three things a builder might type to their assistant. */
  asks: [string, string, string];
}

export const groupCopy: Record<string, { title: string; description: string }> = {
  "core": { title: "Core", description: "Architecture, Luau, and server authority." },
  "gameplay": { title: "Gameplay", description: "Physics, NPCs, and cross-place transfers." },
  "presentation": { title: "Presentation", description: "UI, animation, VFX, and audio." },
  "systems": { title: "Systems", description: "DataStores, monetization, and Open Cloud." },
  "quality": { title: "Testing", description: "Debugging and performance profiling." },
  "agent-workflows": { title: "Tooling", description: "Rojo sync and Studio MCP." },
};

export const skillCopy: Record<string, SkillCopy> = {
  "roblox": {
    name: "Architecture",
    does: "Plan architecture and route tasks across skills",
    asks: [
      "Architect a round-based obby with server authority",
      "Split this shop system between server and client",
      "Design a daily reward system with DataStores and UI",
    ],
  },
  "roblox-core": {
    name: "Luau & core",
    does: "Modern Luau types and script RunContext",
    asks: [
      "Pick the right RunContext and folder for this script",
      "Add strict Luau types to my inventory module",
      "Migrate wait() and spawn() calls to task",
    ],
  },
  "roblox-networking": {
    name: "Networking",
    does: "Server-authoritative remotes and rate limiting",
    asks: [
      "Validate shop prices and ownership on the server",
      "Audit this RemoteEvent for client-trust exploits",
      "Add per-player rate limiting to my attack remote",
    ],
  },
  "roblox-physics": {
    name: "Physics",
    does: "Mechanical constraints and network ownership",
    asks: [
      "Build a vehicle chassis with spring suspension",
      "Rig a hinged door with mechanical constraints",
      "Replace BodyVelocity with LinearVelocity",
    ],
  },
  "roblox-npcs": {
    name: "NPCs",
    does: "PathfindingService navigation and patrol/chase AI",
    asks: [
      "Make an NPC chase the nearest player cleanly",
      "Build a waypoint patrol loop for guards",
      "Fix pathfinding when NPCs stall on doorways",
    ],
  },
  "roblox-teleport": {
    name: "Teleporting",
    does: "Cross-place transfers with TeleportAsync",
    asks: [
      "Teleport a lobby party into a reserved match server",
      "Add retry handling for failed TeleportAsync calls",
      "Hand off player data safely across places",
    ],
  },
  "roblox-user-interfaces": {
    name: "UI & HUDs",
    does: "Responsive ScreenGuis and cross-device input",
    asks: [
      "Build a shop ScreenGui that scales to mobile",
      "Add a BillboardGui health bar above characters",
      "Wire button focus for touch, mouse, and gamepad",
    ],
  },
  "roblox-animation": {
    name: "Animation",
    does: "Animator tracks, IKControl, and TweenService",
    asks: [
      "Play a sword swing via Animator and keyframe markers",
      "Set up IKControl so hands grip a door handle",
      "Tween a modal menu in with TweenService",
    ],
  },
  "roblox-vfx": {
    name: "VFX",
    does: "Particles, beams, and trails tuned for mobile",
    asks: [
      "Emit a one-shot spark burst on coin pickup",
      "Attach a blade Trail that activates during swings",
      "Cap particle overdraw for low-end mobile devices",
    ],
  },
  "roblox-audio": {
    name: "Audio",
    does: "Modular audio graphs and legacy Sound migration",
    asks: [
      "Crossfade background music between map zones",
      "Route 3D footsteps through AudioEmitter",
      "Migrate legacy Sound objects to the audio graph",
    ],
  },
  "roblox-datastores": {
    name: "DataStores",
    does: "Contention-safe saves with UpdateAsync",
    asks: [
      "Save player coins with UpdateAsync on leave",
      "Build a global wins leaderboard with OrderedDataStore",
      "Roll back a player's save to an earlier version",
    ],
  },
  "roblox-gamepasses": {
    name: "Monetization",
    does: "Server-verified passes, ProcessReceipt, and subscriptions",
    asks: [
      "Verify VIP game pass ownership on the server",
      "Handle repeatable coin packs with ProcessReceipt",
      "Check pass ownership on join and grant perks",
    ],
  },
  "roblox-open-cloud": {
    name: "Open Cloud",
    does: "REST automation with Secrets Store and OAuth2",
    asks: [
      "Read a player's DataStore entry from my web backend",
      "Upload assets from a CI script via Open Cloud",
      "Load my API key via HttpService:GetSecret",
    ],
  },
  "roblox-testing": {
    name: "Testing",
    does: "MicroProfiler, debugging, and TestEZ",
    asks: [
      "Profile a server lag spike with MicroProfiler",
      "Write TestEZ specs for my inventory module",
      "Isolate a bug that only reproduces in live servers",
    ],
  },
  "roblox-rojo": {
    name: "Rojo",
    does: "Rojo 7 live sync and project mappings",
    asks: [
      "Create a Rojo 7 default.project.json for my game",
      "Map src/server into ServerScriptService",
      "Export my Studio place to disk with rojo syncback",
    ],
  },
  "roblox-mcp": {
    name: "Studio MCP",
    does: "Direct Studio inspection and playtests via MCP",
    asks: [
      "Connect my coding agent to Roblox Studio MCP",
      "Inspect the DataModel and list every script",
      "Run a Studio playtest and capture errors",
    ],
  },
};

/** How to say an example script's maturity (REVIEW_POLICY.md) in plain words. */
export const exampleStatusCopy: Record<string, { label: string; explain: string }> = {
  experimental: { label: "Experimental", explain: "Unverified in live servers. Adapt and test before shipping." },
  reviewed: { label: "Reviewed", explain: "Reviewed with focused tests. Verify in your place." },
  tested: { label: "Tested", explain: "Covered by automated tests, including Studio fixtures." },
};

export const assistants = [
  { name: "Claude Code", icon: "claude-code.svg" },
  { name: "Cursor", icon: "cursor.svg" },
  { name: "Codex", icon: "openai.svg" },
  { name: "GitHub Copilot", icon: "github-copilot.svg" },
  { name: "Windsurf", icon: "windsurf.svg" },
  { name: "Gemini CLI", icon: "gemini.svg" },
  { name: "Cline", icon: "cline.svg" },
  { name: "OpenCode", icon: "opencode-icon.svg" },
];

export const faq: { q: string; a: string }[] = [
  {
    q: "What is a skill?",
    a: "Markdown guidance and Luau examples your agent loads on demand, grounded in official Roblox docs.",
  },
  {
    q: "Which agents are supported?",
    a: "Claude Code, Cursor, Codex, GitHub Copilot, Windsurf, Gemini CLI, Cline, OpenCode, and any target supported by the skills CLI.",
  },
  {
    q: "Do I need to install all 16 skills?",
    a: "Install the full suite so the root roblox skill can route tasks automatically, or pick individual skills with --skill.",
  },
  {
    q: "Is generated code guaranteed safe?",
    a: "No. Skills reduce deprecated APIs and common security mistakes, but you still need to review and playtest output, especially for DataStores, remotes, and purchases.",
  },
  {
    q: "What is the license?",
    a: "MIT. Free, open source, and not affiliated with Roblox Corporation.",
  },
];
