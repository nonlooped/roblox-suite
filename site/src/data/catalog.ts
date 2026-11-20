import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import catalog from "../../../catalog.json";
import { groupCopy, skillCopy, type SkillCopy } from "./copy";

export interface CatalogSource {
  label: string;
  url: string;
  verified_at: string;
}

export interface CatalogSkill {
  slug: string;
  title: string;
  hub?: boolean;
  oneLiner: string;
  displayTitle: string;
  overview: string;
  covers: string[];
  cover_sources: number[][];
  sources: CatalogSource[];
  risk: string;
  created_at: string;
  last_changed_at: string;
  examples: { status: string; files: { path: string; status: string }[] };
}

export interface CatalogGroup {
  id: string;
  title: string;
  description: string;
  skills: string[];
}

export interface SkillEntry extends CatalogSkill {
  copy: SkillCopy;
}

export interface GroupedSkills {
  id: string;
  title: string;
  description: string;
  entries: SkillEntry[];
}

export const repoUrl = "https://github.com/nonlooped/roblox-suite";
export const installCommand = "npx skills add nonlooped/roblox-suite";
export const reportUrl = `${repoUrl}/issues/new?template=inaccuracy.yml`;

export const skillInstallCommand = (slug: string) => `${installCommand} --skill ${slug}`;
export const skillSourceUrl = (slug: string) => `${repoUrl}/tree/main/${slug}`;
export const fileSourceUrl = (slug: string, file: string) => `${repoUrl}/blob/main/${slug}/${file}`;

export const skills = catalog.skills as CatalogSkill[];
export const groups = catalog.groups as CatalogGroup[];
export const skillCount = skills.length;

export const getSkill = (slug: string): CatalogSkill => {
  const skill = skills.find((s) => s.slug === slug);
  if (!skill) throw new Error(`Unknown skill "${slug}"`);
  return skill;
};

const copyFor = (slug: string): SkillCopy => {
  const copy = skillCopy[slug];
  if (!copy) throw new Error(`src/data/copy.ts has no skillCopy entry for "${slug}"`);
  return copy;
};

export const getEntry = (slug: string): SkillEntry => ({ ...getSkill(slug), copy: copyFor(slug) });

export const groupedSkills: GroupedSkills[] = groups.map((group) => {
  const text = groupCopy[group.id];
  if (!text) throw new Error(`src/data/copy.ts has no groupCopy entry for "${group.id}"`);
  return {
    id: group.id,
    title: text.title,
    description: text.description,
    entries: group.skills.map(getEntry),
  };
});

for (const skill of skills) copyFor(skill.slug);

const repoRoot = path.resolve(process.cwd(), "..");

export interface SkillReference {
  file: string;
  readWhen: string;
  reviewed: string;
}

export function skillReferences(slug: string): SkillReference[] {
  const dir = path.join(repoRoot, slug, "references");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => {
      const text = readFileSync(path.join(dir, file), "utf8");
      const readWhen = text.match(/^read_when:\s*"(.*)"\s*$/m)?.[1] ?? "";
      const reviewed = text.match(/^last_reviewed:\s*(\d{4}-\d{2}-\d{2})\s*$/m)?.[1] ?? "";
      return { file, readWhen, reviewed };
    });
}

export function skillScripts(slug: string): string[] {
  const dir = path.join(repoRoot, slug, "scripts");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).sort();
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));

export function withCode(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
}
