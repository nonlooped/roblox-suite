import catalogJson from "../../../catalog.json";

export type Risk = "lower" | "medium" | "critical";
export type ExampleStatus = "none" | "experimental" | "reviewed";

export interface Source {
  label: string;
  url: string;
  verified_at: string;
}

export interface ExampleFile {
  path: string;
  status: ExampleStatus;
}

export interface Skill {
  slug: string;
  title: string;
  hub?: boolean;
  oneLiner: string;
  displayTitle: string;
  overview: string;
  covers: string[];
  /** One-based source indexes that support each corresponding `covers` item. */
  cover_sources: number[][];
  sources: Source[];
  risk: Risk;
  created_at: string;
  examples: { status: ExampleStatus; files: ExampleFile[] };
  last_changed_at: string;
}

/** Render the markdown code spans used throughout the catalog copy. */
export function withCode(text: string): string {
  return text.replace(
    /`([^`]+)`/g,
    (_, code: string) =>
      `<code>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`,
  );
}

/* Strip the scheme and add breaks at path separators so citation URLs remain readable on narrow screens. */
export function breakableUrl(url: string): string {
  return url
    .replace(/^https:\/\//, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\//g, "<wbr>/");
}

export interface Group {
  id: string;
  title: string;
  description: string;
  skills: string[];
}

interface Catalog {
  schema_version: number;
  groups: Group[];
  skills: Skill[];
}

const catalog = catalogJson as Catalog;

export const skills: Skill[] = catalog.skills;
export const groups: Group[] = catalog.groups;
export const skillCount = skills.length;

const bySlug = new Map(skills.map((skill) => [skill.slug, skill]));

export function getSkill(slug: string): Skill {
  const skill = bySlug.get(slug);
  if (!skill) throw new Error(`Unknown skill slug: ${slug}`);
  return skill;
}

/** Groups with their skills resolved, in catalog order. */
export const groupedSkills = groups.map((group) => ({
  ...group,
  entries: group.skills.map(getSkill),
}));

export const repoUrl = "https://github.com/nonlooped/roblox-suite";
export const installCommand = "npx skills add nonlooped/roblox-suite";

export function skillInstallCommand(slug: string): string {
  return `${installCommand} --skill ${slug}`;
}

/**
 * Plain-language labels for the marketing surfaces. The catalog's own copy is
 * written for agents; these are written for people skimming a page.
 *
 * `does` is the job in the reader's words — an imperative, not a subject
 * heading — because the home page asks "what are you building?" and these are
 * the answers. Keep each one short enough to sit on two lines in a tile.
 */
export const plainLabels: Record<string, { name: string; blurb: string; does: string }> = {
  roblox: {
    name: "Start here",
    blurb: "Sends your agent to the right skill",
    does: "Plan a game and pick the right skill",
  },
  "roblox-core": {
    name: "Fundamentals",
    blurb: "Services, types, and how scripts run",
    does: "Put scripts in the right place",
  },
  "roblox-networking": {
    name: "Client & server",
    blurb: "Validate client requests on the server",
    does: "Stop players from cheating",
  },
  "roblox-datastores": {
    name: "Saving data",
    blurb: "Save progress and handle write failures",
    does: "Save coins, levels, and inventories",
  },
  "roblox-user-interfaces": {
    name: "Menus & HUDs",
    blurb: "Layouts for different screen sizes",
    does: "Build menus that fit every screen",
  },
  "roblox-animation": {
    name: "Animation",
    blurb: "Characters and objects that move",
    does: "Animate characters and UI",
  },
  "roblox-vfx": {
    name: "Visual effects",
    blurb: "Particles, beams, and trails",
    does: "Add particles, beams, and trails",
  },
  "roblox-audio": {
    name: "Sound & music",
    blurb: "Audio routing, spatial sound, and effects",
    does: "Play music and 3D sound",
  },
  "roblox-gamepasses": {
    name: "Monetization",
    blurb: "Passes, products, and Robux",
    does: "Sell passes and dev products",
  },
  "roblox-open-cloud": {
    name: "Outside tools",
    blurb: "Automate Roblox through REST APIs",
    does: "Reach your game from outside Roblox",
  },
  "roblox-teleport": {
    name: "Teleporting",
    blurb: "Move players between places",
    does: "Move players between places",
  },
  "roblox-rojo": {
    name: "Rojo projects",
    blurb: "Work in your editor, sync to Studio",
    does: "Code in your editor, sync to Studio",
  },
  "roblox-mcp": {
    name: "Agent in Studio",
    blurb: "Connect your AI straight to Studio",
    does: "Let your agent drive Studio directly",
  },
  "roblox-physics": {
    name: "Physics",
    blurb: "Vehicles, doors, and moving parts",
    does: "Build vehicles, doors, and platforms",
  },
  "roblox-npcs": {
    name: "NPCs",
    blurb: "Enemies that chase and patrol",
    does: "Make NPCs chase and patrol",
  },
  "roblox-testing": {
    name: "Finding bugs",
    blurb: "Debug and profile your game",
    does: "Track down bugs and lag",
  },
};

export function plainLabel(slug: string) {
  return plainLabels[slug] ?? { name: slug, blurb: "", does: "" };
}

export function skillSourceUrl(slug: string): string {
  return `${repoUrl}/blob/main/${slug}/SKILL.md`;
}
