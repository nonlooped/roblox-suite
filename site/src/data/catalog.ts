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

/**
 * A citation URL, stripped of its scheme and given a break opportunity before
 * each path separator. Long doc URLs otherwise either get truncated (hiding
 * the page being cited, which is the proof) or break mid-word on a phone.
 * Returns HTML, so it escapes before inserting the `<wbr>` markers.
 */
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

export const hubSkill = skills.find((skill) => skill.hub);

const sourceCheckDates = skills
  .flatMap((skill) => skill.sources.map((source) => source.verified_at))
  .sort();

/** Oldest and newest citation checks shown by the site. */
export const oldestSourceCheckAt = sourceCheckDates[0]!;
export const latestSourceCheckAt = sourceCheckDates.at(-1)!;

export const sourceCount = skills.reduce(
  (total, skill) => total + skill.sources.length,
  0,
);

/** Unique documentation pages backing the suite. */
export const uniqueSourceUrls = new Set(
  skills.flatMap((skill) => skill.sources.map((source) => source.url)),
);

/*
 * Not every citation is Roblox's own page. The Rojo skill cites Rojo's docs
 * and release notes, because Rojo is a third-party tool and Roblox does not
 * document it. Calling all 62 "official Roblox documentation" is the kind of
 * rounding-up the sceptical-developer persona checks first, and being caught
 * on it costs more trust than the five citations are worth. So the split is
 * derived here and stated plainly wherever a count is shown.
 */
const ROBLOX_DOCS_HOST = "create.roblox.com";

export function isOfficialRobloxSource(url: string): boolean {
  try {
    return new URL(url).host === ROBLOX_DOCS_HOST;
  } catch {
    return false;
  }
}

const allSources = skills.flatMap((skill) => skill.sources);

/** Citations that point at Roblox's own Creator Hub documentation. */
export const officialSourceCount = allSources.filter((source) =>
  isOfficialRobloxSource(source.url),
).length;

/** Citations that point at a tool's own docs (currently Rojo). */
export const supportingSourceCount = sourceCount - officialSourceCount;

export function skillPath(slug: string): string {
  return `/skills/${slug}/`;
}

export const repoUrl = "https://github.com/nonlooped/roblox-suite";
export const installCommand = "npx skills add nonlooped/roblox-suite";

/**
 * Plain-language labels for the marketing surfaces. The catalog's own copy is
 * written for agents; these are written for people skimming a page.
 */
export const plainLabels: Record<string, { name: string; blurb: string }> = {
  roblox: { name: "Start here", blurb: "Sends your agent to the right skill" },
  "roblox-core": { name: "Fundamentals", blurb: "Services, types, and how scripts run" },
  "roblox-networking": { name: "Client & server", blurb: "Stop exploiters from cheating" },
  "roblox-datastores": { name: "Saving data", blurb: "Don't lose player progress" },
  "roblox-user-interfaces": { name: "Menus & HUDs", blurb: "UI that fits every screen" },
  "roblox-animation": { name: "Animation", blurb: "Characters and objects that move" },
  "roblox-vfx": { name: "Visual effects", blurb: "Particles, beams, and trails" },
  "roblox-audio": { name: "Sound & music", blurb: "Modern audio that fits the world" },
  "roblox-gamepasses": { name: "Monetization", blurb: "Passes, products, and Robux" },
  "roblox-open-cloud": { name: "Outside tools", blurb: "Control your game from the web" },
  "roblox-teleport": { name: "Teleporting", blurb: "Move players between places" },
  "roblox-rojo": { name: "Real code files", blurb: "Work in your editor, sync to Studio" },
  "roblox-mcp": { name: "Agent in Studio", blurb: "Connect your AI straight to Studio" },
  "roblox-physics": { name: "Physics", blurb: "Vehicles, doors, and moving parts" },
  "roblox-npcs": { name: "NPCs", blurb: "Enemies that chase and patrol" },
  "roblox-testing": { name: "Finding bugs", blurb: "Debug and profile your game" },
};

export function plainLabel(slug: string) {
  return plainLabels[slug] ?? { name: slug, blurb: "" };
}

export function skillSourceUrl(slug: string): string {
  return `${repoUrl}/blob/main/${slug}/SKILL.md`;
}
