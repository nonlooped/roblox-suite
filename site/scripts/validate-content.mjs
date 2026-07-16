#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const catalog = JSON.parse(await readFile(path.join(root, "catalog.json"), "utf8"));
const isoDate = z.preprocess(
  (value) => value instanceof Date ? value.toISOString().slice(0, 10) : value,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
);
const source = z.object({ label: z.string().min(1), url: z.url(), verified_at: isoDate });
const example = z.object({
  path: z.string().regex(/^scripts\/[A-Za-z0-9._-]+\.lua$/),
  status: z.enum(["experimental", "reviewed", "tested"]),
});
const skill = z.object({
  slug: z.string().regex(/^roblox(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  hub: z.boolean().optional(),
  oneLiner: z.string().min(1),
  displayTitle: z.string().min(1),
  overview: z.string().min(1),
  covers: z.array(z.string().min(1)).min(1),
  sources: z.array(source).min(1),
  risk: z.enum(["critical", "medium", "lower"]),
  created_at: isoDate,
  last_changed_at: isoDate,
  examples: z.object({
    status: z.enum(["none", "experimental", "reviewed", "tested"]),
    files: z.array(example),
  }),
});
const schema = z.object({
  schema_version: z.literal(1),
  groups: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    skills: z.array(z.string()).min(1),
  })).min(1),
  skills: z.array(skill).min(1),
});
const parsed = schema.parse(catalog);
const errors = [];
const now = new Date();

const slugs = new Set(parsed.skills.map((item) => item.slug));
const grouped = parsed.groups.flatMap((group) => group.skills);
for (const slug of slugs) {
  const count = grouped.filter((item) => item === slug).length;
  if (count !== 1) errors.push(`${slug} occurs ${count} times in catalog groups`);
}
for (const slug of grouped) {
  if (!slugs.has(slug)) errors.push(`catalog group references unknown skill ${slug}`);
}

for (const item of parsed.skills) {
  const skillPath = path.join(root, item.slug, "SKILL.md");
  const files = [skillPath];
  const refsDir = path.join(root, item.slug, "references");
  for (const entry of await readdir(refsDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(path.join(refsDir, entry.name));
  }

  const verifiedDates = [];
  for (const file of files) {
    const parsedMatter = matter(await readFile(file, "utf8"));
    const required = file === skillPath
      ? z.object({ name: z.string().min(1), description: z.string().min(1), last_reviewed: isoDate })
      : z.object({ last_reviewed: isoDate });
    const check = required.safeParse(parsedMatter.data);
    if (!check.success) {
      errors.push(`${path.relative(root, file)} has invalid frontmatter: ${z.prettifyError(check.error)}`);
      continue;
    }
    verifiedDates.push(check.data.last_reviewed);
  }

  const oldest = verifiedDates.toSorted()[0];
  const maxAgeDays = item.risk === "critical" ? 120 : 180;
  if (oldest) {
    const ageDays = Math.floor((now.getTime() - new Date(`${oldest}T00:00:00Z`).getTime()) / 86400000);
    if (ageDays > maxAgeDays) errors.push(`${item.slug} oldest verification is ${ageDays} days old (limit ${maxAgeDays})`);
  }

  const scriptsDir = path.join(root, item.slug, "scripts");
  let diskScripts = [];
  try {
    diskScripts = (await readdir(scriptsDir)).filter((name) => name.endsWith(".lua")).sort();
  } catch {}
  const catalogScripts = item.examples.files.map((file) => path.basename(file.path)).sort();
  if (JSON.stringify(diskScripts) !== JSON.stringify(catalogScripts)) {
    errors.push(`${item.slug} example file list is out of sync with scripts/`);
  }
  for (const file of item.examples.files) {
    const text = await readFile(path.join(root, item.slug, file.path), "utf8");
    for (const field of ["Status", "Last verified", "Test coverage", "Intended use"]) {
      if (!text.includes(`-- ${field}:`)) errors.push(`${item.slug}/${file.path} is missing '${field}' maturity metadata`);
    }
    if (!text.includes(`-- Status: ${file.status}`)) {
      errors.push(`${item.slug}/${file.path} status disagrees with catalog.json`);
    }
  }
}

if (errors.length) {
  console.error(`Content validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Content validation passed for ${parsed.skills.length} skills.`);
