/*
 * What changes when a skill is installed, in words a new builder understands.
 * "without" is hedged on purpose: assistants do not always get these wrong.
 * Every catalog skill needs an entry here and a glyph (validate-content checks both).
 */

export const skillStory: Record<string, { without: string; with: string }> = {
  "roblox": {
    without: "Mixes client and server concerns or misses cross-system constraints.",
    with: "Plans server authority first and routes each task to the right specialist skill.",
  },
  "roblox-core": {
    without: "Suggests legacy wait() and spawn(), or places scripts where they never execute.",
    with: "Uses the task library with strict Luau types and explicit RunContext.",
  },
  "roblox-networking": {
    without: "Trusts client-sent values like prices or damage, leaving remotes open to exploits.",
    with: "Validates every client request on the server and enforces per-player rate limits.",
  },
  "roblox-physics": {
    without: "Reaches for deprecated BodyMovers like BodyVelocity and ignores ownership.",
    with: "Uses mechanical and mover constraints with proper assemblies and network ownership.",
  },
  "roblox-npcs": {
    without: "Generates naive MoveTo loops that stall on obstacles or doors.",
    with: "Configures PathfindingService with blocked-path recovery and scalable patrol or chase loops.",
  },
  "roblox-teleport": {
    without: "Uses deprecated Teleport methods and skips failure handling or reserved routing.",
    with: "Uses TeleportAsync with TeleportOptions, backoff retries, and DataStore handoffs.",
  },
  "roblox-user-interfaces": {
    without: "Hardcodes pixel offsets that break on mobile screens and gamepads.",
    with: "Builds responsive Scale layouts in the right GUI containers for touch, mouse, and gamepad.",
  },
  "roblox-animation": {
    without: "Loads tracks via deprecated Humanoid:LoadAnimation and relies on arbitrary waits.",
    with: "Loads tracks on Animator with marker events, IKControl, and TweenService.",
  },
  "roblox-vfx": {
    without: "Spawns uncapped emitters that drop frame rates on low-end devices.",
    with: "Tunes emitters, beams, and trails within mobile overdraw budgets.",
  },
  "roblox-audio": {
    without: "Defaults to legacy Sound objects when routing, effects, or voice need graphs.",
    with: "Wires modular AudioPlayer and AudioEmitter graphs, with migration paths from Sound.",
  },
  "roblox-datastores": {
    without: "Calls SetAsync on contended keys, risking silent overwrites across servers.",
    with: "Saves via UpdateAsync pure transforms with quota tracking and version recovery.",
  },
  "roblox-gamepasses": {
    without: "Grants perks on prompt close and skips server verification or receipt idempotency.",
    with: "Verifies ownership server-side and implements idempotent ProcessReceipt handlers.",
  },
  "roblox-open-cloud": {
    without: "Hardcodes API keys in scripts or misses scopes, retries, and key expiry.",
    with: "Loads keys from Secrets Store with least-privilege scopes and retry backoff.",
  },
  "roblox-testing": {
    without: "Guesses at fixes and skips reproduction or performance profiling.",
    with: "Reproduces bugs first, profiles with MicroProfiler, and covers fixes with TestEZ.",
  },
  "roblox-rojo": {
    without: "Writes broken default.project.json trees that sync scripts to the wrong services.",
    with: "Writes valid Rojo 7 project trees with .server/.client conventions and syncback.",
  },
  "roblox-mcp": {
    without: "Only sees local files, with no access to the Studio DataModel or playtests.",
    with: "Connects via official Studio MCP to inspect the DataModel, edit scripts, and playtest.",
  },
};

/* 9x9 dot-matrix glyphs, one per skill. "#" is a lit dot. */
export const glyphs: Record<string, string[]> = {
  "roblox": ["..#......", "..##.....", "..###....", "..####...", "..#####..", "..####...", "..###....", "..##.....", "..#......"],
  "roblox-core": [".........", ".........", "..#...#..", ".#.....#.", "#...#...#", ".#.....#.", "..#...#..", ".........", "........."],
  "roblox-networking": ["#########", "#.......#", "#.....#.#", "#....#..#", "#.#.#...#", ".#.#...#.", "..#...#..", "...#.#...", "....#...."],
  "roblox-physics": [".........", ".........", "..####...", ".#....#..", "#########", "#########", ".##...##.", ".##...##.", "........."],
  "roblox-npcs": [".#######.", "#.......#", "#.##.##.#", "#.##.##.#", "#.......#", "#..###..#", "#.......#", ".#######.", "........."],
  "roblox-teleport": [".........", ".#...#...", "..#...#..", "...#...#.", "....#...#", "...#...#.", "..#...#..", ".#...#...", "........."],
  "roblox-user-interfaces": ["#########", "#########", "#.......#", "#.###...#", "#.......#", "#.#####.#", "#.......#", "#.......#", "#########"],
  "roblox-animation": ["...###...", "...###...", "....#....", ".#######.", "....#....", "....#....", "...#.#...", "..#...#..", ".#.....#."],
  "roblox-vfx": ["....#....", "....#....", "...###...", "..#####..", "#########", "..#####..", "...###...", "....#....", "....#...."],
  "roblox-audio": [".........", "....#....", "....#.#..", "..#.#.#..", "..#.#.#.#", "#.#.#.#.#", "#.#.#.#.#", "#.#.#.#.#", "#.#.#.#.#"],
  "roblox-datastores": [".........", "..#####..", ".#######.", ".........", ".#######.", ".........", ".#######.", "..#####..", "........."],
  "roblox-gamepasses": [".........", "..#####..", ".#.#.#.#.", "#########", ".#.....#.", "..#...#..", "...#.#...", "....#....", "........."],
  "roblox-open-cloud": [".........", "....##...", "..##..#..", ".#.....##", "#.......#", "#.......#", ".#######.", ".........", "........."],
  "roblox-testing": [".#.....#.", "..#...#..", "...###...", "#.#####.#", ".#######.", "#.#####.#", ".#######.", "#..###..#", "........."],
  "roblox-rojo": [".........", "####.....", "#########", "#.......#", "#.......#", "#.......#", "#.......#", "#########", "........."],
  "roblox-mcp": ["..#...#..", "..#...#..", ".#######.", ".#######.", ".#######.", "..#####..", "....#....", "....#....", "....#...."],
};
