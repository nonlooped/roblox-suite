import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const REPO_ROOT = resolve(process.cwd(), "..");
const isoDate = z.preprocess(
  (value) => value instanceof Date ? value.toISOString().slice(0, 10) : value,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
);
const skillFrontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  last_reviewed: isoDate,
});
const referenceFrontmatterSchema = z.object({ last_reviewed: isoDate });

export type VerificationMetrics = {
  oldestVerifiedAt: string;
  newestVerifiedAt: string;
  verificationCoverage: number;
  verifiedFiles: number;
  totalFiles: number;
};

async function markdownFilesForSkill(slug: string) {
  const skillDir = join(REPO_ROOT, slug);
  const files = [join(skillDir, "SKILL.md")];
  const referencesDir = join(skillDir, "references");
  const entries = await readdir(referencesDir, { withFileTypes: true });
  files.push(
    ...entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => join(referencesDir, entry.name)),
  );
  return files;
}

async function readVerifiedDate(path: string, isSkill: boolean) {
  const source = await readFile(path, "utf8");
  const parsed = matter(source);
  const schema = isSkill ? skillFrontmatterSchema : referenceFrontmatterSchema;
  const result = schema.safeParse(parsed.data);
  if (!result.success) {
    throw new Error(`Invalid frontmatter in ${path}: ${z.prettifyError(result.error)}`);
  }
  return result.data.last_reviewed;
}

const verificationCache = new Map<string, Promise<VerificationMetrics>>();

export function getSkillVerification(slug: string) {
  const cached = verificationCache.get(slug);
  if (cached) return cached;

  const pending = (async () => {
    const files = await markdownFilesForSkill(slug);
    const dates = await Promise.all(
      files.map((path) => readVerifiedDate(path, path.endsWith("SKILL.md"))),
    );
    const sorted = dates.toSorted();
    return {
      oldestVerifiedAt: sorted[0],
      newestVerifiedAt: sorted.at(-1)!,
      verificationCoverage: dates.length / files.length,
      verifiedFiles: dates.length,
      totalFiles: files.length,
    };
  })();

  verificationCache.set(slug, pending);
  return pending;
}

export async function getVerificationForSlugs(slugs: string[]) {
  const entries = await Promise.all(
    slugs.map(async (slug) => [slug, await getSkillVerification(slug)] as const),
  );
  return Object.fromEntries(entries);
}

export async function getRepositoryVerification(slugs: string[]) {
  const bySkill = await getVerificationForSlugs(slugs);
  const metrics = Object.values(bySkill);
  const totalFiles = metrics.reduce((sum, item) => sum + item.totalFiles, 0);
  const verifiedFiles = metrics.reduce((sum, item) => sum + item.verifiedFiles, 0);
  return {
    oldestVerifiedAt: metrics.map((item) => item.oldestVerifiedAt).toSorted()[0],
    newestVerifiedAt: metrics.map((item) => item.newestVerifiedAt).toSorted().at(-1)!,
    verificationCoverage: verifiedFiles / totalFiles,
    verifiedFiles,
    totalFiles,
  };
}
