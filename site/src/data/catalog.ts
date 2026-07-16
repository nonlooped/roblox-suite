import { z } from "zod";
import rawCatalog from "../../../catalog.json";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

const sourceSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
  verified_at: isoDate,
});

const skillSchema = z.object({
  slug: z.string().regex(/^roblox(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  hub: z.boolean().optional(),
  oneLiner: z.string().min(1),
  displayTitle: z.string().min(1),
  overview: z.string().min(1),
  covers: z.array(z.string().min(1)).min(1),
  sources: z.array(sourceSchema).min(1),
  risk: z.enum(["critical", "medium", "lower"]),
  created_at: isoDate,
  last_changed_at: isoDate,
  examples: z.object({
    status: z.enum(["none", "experimental", "reviewed", "tested"]),
    files: z.array(z.object({
      path: z.string().regex(/^scripts\/[A-Za-z0-9._-]+\.lua$/),
      status: z.enum(["experimental", "reviewed", "tested"]),
    })),
  }),
});

const groupSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().min(1),
  skills: z.array(z.string()).min(1),
});

const catalogSchema = z.object({
  schema_version: z.literal(1),
  groups: z.array(groupSchema).min(1),
  skills: z.array(skillSchema).min(1),
});

export const catalog = catalogSchema.parse(rawCatalog);

const slugs = catalog.skills.map((skill) => skill.slug);
const uniqueSlugs = new Set(slugs);
if (uniqueSlugs.size !== slugs.length) {
  throw new Error("catalog.json contains duplicate skill slugs");
}

const groupedSlugs = catalog.groups.flatMap((group) => group.skills);
const groupedCounts = new Map<string, number>();
for (const slug of groupedSlugs) {
  groupedCounts.set(slug, (groupedCounts.get(slug) ?? 0) + 1);
}

const missingFromGroups = slugs.filter((slug) => !groupedCounts.has(slug));
const duplicateGroupEntries = [...groupedCounts]
  .filter(([, count]) => count !== 1)
  .map(([slug]) => slug);
const unknownGroupEntries = groupedSlugs.filter((slug) => !uniqueSlugs.has(slug));
if (missingFromGroups.length || duplicateGroupEntries.length || unknownGroupEntries.length) {
  throw new Error(
    `catalog grouping mismatch: missing=${missingFromGroups.join(",") || "none"}; ` +
      `duplicated=${duplicateGroupEntries.join(",") || "none"}; ` +
      `unknown=${unknownGroupEntries.join(",") || "none"}`,
  );
}

export type CatalogSkill = z.infer<typeof skillSchema>;
