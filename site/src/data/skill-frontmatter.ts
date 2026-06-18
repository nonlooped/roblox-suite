// Build-time parser for skill SKILL.md frontmatter.
// Reads `last_reviewed` and `description` from each skill's SKILL.md so
// the site's freshness + overview prose stay in sync with the source of
// truth without a manual trust.ts bump.
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Walk up from site/src/data/ to the repo root, then into <slug>/.
const REPO_ROOT = join(__dirname, "..", "..", "..");

export type SkillFrontmatter = {
  name?: string;
  description?: string;
  last_reviewed?: string;
};

// Minimal YAML frontmatter parser. The skill frontmatter is simple:
// `name:`, `description:` (string or `>-` folded block), `last_reviewed:`.
// We don't pull in a YAML dependency for ~3 fields.
function parseFrontmatter(src: string): SkillFrontmatter {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const body = m[1];
  const out: SkillFrontmatter = {};
  let i = 0;
  const lines = body.split(/\r?\n/);
  while (i < lines.length) {
    const line = lines[i];
    // Match `key: value` or `key:` followed by a folded/scalar block.
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!kv) { i++; continue; }
    const key = kv[1];
    let val = kv[2].trim();
    if (val === ">" || val === ">-" || val === "|-" || val === "|") {
      // Folded/literal block: collect indented lines, join with spaces for `>`.
      const parts: string[] = [];
      i++;
      while (i < lines.length && /^\s+/.test(lines[i])) {
        parts.push(lines[i].replace(/^\s+/, ""));
        i++;
      }
      // For `>` folded, join with spaces; for `|` literal, join with newlines.
      // The skill descriptions use `>-` (folded, strip trailing newline).
      out[key as keyof SkillFrontmatter] = parts.join(" ").replace(/\s+/g, " ").trim() as any;
      continue;
    }
    if (val === "") {
      // Plain scalar on next indented line(s) (rare here).
      const parts: string[] = [];
      i++;
      while (i < lines.length && /^\s+/.test(lines[i])) {
        parts.push(lines[i].replace(/^\s+/, ""));
        i++;
      }
      out[key as keyof SkillFrontmatter] = parts.join(" ").trim() as any;
      continue;
    }
    // Strip surrounding quotes.
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key as keyof SkillFrontmatter] = val as any;
    i++;
  }
  return out;
}

const cache = new Map<string, SkillFrontmatter>();

export async function getSkillFrontmatter(slug: string): Promise<SkillFrontmatter> {
  if (cache.has(slug)) return cache.get(slug)!;
  let fm: SkillFrontmatter = {};
  try {
    const path = join(REPO_ROOT, slug, "SKILL.md");
    const src = await readFile(path, "utf-8");
    fm = parseFrontmatter(src);
  } catch {
    // SKILL.md unreadable or missing — leave defaults empty.
  }
  cache.set(slug, fm);
  return fm;
}

// The "last reviewed" date for a skill = the most recent `last_reviewed`
// frontmatter date across the skill's SKILL.md AND every file in its
// references/ directory. This reflects when any part of the skill was
// actually reviewed, not a single hand-maintained value. Returns ISO
// YYYY-MM-DD or undefined if no dated file is found.
async function getSkillLastReviewed(slug: string): Promise<string | undefined> {
  const dir = join(REPO_ROOT, slug);
  let latest: string | undefined;
  const candidates: string[] = [join(dir, "SKILL.md")];
  try {
    const refsDir = join(dir, "references");
    const entries = await readdir(refsDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && /\.md$/i.test(e.name)) candidates.push(join(refsDir, e.name));
    }
  } catch {
    // No references/ dir — fine, just check SKILL.md.
  }
  for (const path of candidates) {
    try {
      const src = await readFile(path, "utf-8");
      const fm = parseFrontmatter(src);
      const d = fm.last_reviewed;
      if (d && (!latest || d > latest)) latest = d;
    } catch {
      // File unreadable — skip.
    }
  }
  return latest;
}

// Convenience: read frontmatter + last-reviewed date for all skills.
// `last_reviewed` is the max across SKILL.md + references/ so a single
// reference update propagates without a manual bump.
export async function getFrontmatterForSlugs(
  slugs: string[]
): Promise<Record<string, SkillFrontmatter>> {
  const entries = await Promise.all(
    slugs.map(async (s) => {
      const fm = await getSkillFrontmatter(s);
      const lastReviewed = await getSkillLastReviewed(s);
      // Merge: prefer the directory-wide max last_reviewed over the
      // (often absent) SKILL.md-level one.
      return [s, { ...fm, last_reviewed: lastReviewed ?? fm.last_reviewed }] as const;
    })
  );
  return Object.fromEntries(entries);
}

// Sanity check used in dev/test only: list which skill dirs exist.
export async function listSkillDirs(): Promise<string[]> {
  const entries = await readdir(REPO_ROOT, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^roblox(-|$)/.test(e.name))
    .map((e) => e.name);
}