#!/usr/bin/env node
/**
 * Pre-build content checks. Guards the invariants the site relies on:
 * every catalog skill has a real directory, its frontmatter agrees with the
 * catalog, and required fields are present and well-formed.
 */
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteRoot, "..");

const errors = [];
const fail = (message) => errors.push(message);

const catalog = JSON.parse(
  await readFile(path.join(repoRoot, "catalog.json"), "utf8"),
);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RISKS = new Set(["lower", "medium", "critical"]);
const EXAMPLE_STATUSES = new Set(["none", "experimental", "reviewed"]);

if (!Array.isArray(catalog.skills) || catalog.skills.length === 0) {
  fail("catalog.json has no skills");
}

const slugs = new Set();

for (const skill of catalog.skills ?? []) {
  const where = `skill "${skill.slug ?? "<missing slug>"}"`;

  for (const field of ["slug", "title", "oneLiner", "displayTitle", "overview"]) {
    if (typeof skill[field] !== "string" || skill[field].trim() === "") {
      fail(`${where}: missing or empty "${field}"`);
    }
  }

  if (slugs.has(skill.slug)) fail(`${where}: duplicate slug`);
  slugs.add(skill.slug);

  if (!/^[a-z0-9-]+$/.test(skill.slug ?? "")) {
    fail(`${where}: slug must be lowercase kebab-case`);
  }

  if (!Array.isArray(skill.covers) || skill.covers.length === 0) {
    fail(`${where}: needs at least one "covers" entry`);
  }

  if (!RISKS.has(skill.risk)) {
    fail(`${where}: risk must be one of ${[...RISKS].join(", ")}`);
  }

  for (const field of ["created_at", "last_changed_at"]) {
    if (!ISO_DATE.test(skill[field] ?? "")) {
      fail(`${where}: "${field}" must be YYYY-MM-DD`);
    }
  }

  if (!EXAMPLE_STATUSES.has(skill.examples?.status)) {
    fail(`${where}: examples.status must be one of ${[...EXAMPLE_STATUSES].join(", ")}`);
  }

  // Sources are the product's core promise — hold them to a strict shape.
  if (!Array.isArray(skill.sources) || skill.sources.length === 0) {
    fail(`${where}: needs at least one source`);
  }

  for (const source of skill.sources ?? []) {
    if (!source.label?.trim()) fail(`${where}: a source is missing a label`);
    if (!/^https:\/\//.test(source.url ?? "")) {
      fail(`${where}: source "${source.label}" must have an https URL`);
    }
    if (!ISO_DATE.test(source.verified_at ?? "")) {
      fail(`${where}: source "${source.label}" needs a YYYY-MM-DD verified_at`);
    }
  }

  if (!Array.isArray(skill.cover_sources) || skill.cover_sources.length !== skill.covers?.length) {
    fail(`${where}: cover_sources must cite every covers entry exactly once`);
  } else {
    for (const [coverIndex, sourceIndexes] of skill.cover_sources.entries()) {
      if (!Array.isArray(sourceIndexes) || sourceIndexes.length === 0) {
        fail(`${where}: covers[${coverIndex}] needs at least one source citation`);
        continue;
      }
      for (const sourceIndex of sourceIndexes) {
        if (!Number.isInteger(sourceIndex) || sourceIndex < 1 || sourceIndex > skill.sources.length) {
          fail(`${where}: covers[${coverIndex}] has an invalid source index ${sourceIndex}`);
        }
      }
    }
  }

  // The site links to SKILL.md and derives routes from the slug, so the
  // directory has to exist in the repo.
  const skillFile = path.join(repoRoot, skill.slug ?? "", "SKILL.md");
  try {
    await access(skillFile);
    const contents = await readFile(skillFile, "utf8");
    const nameMatch = contents.match(/^name:\s*(.+)$/m);
    if (!nameMatch) {
      fail(`${where}: ${skill.slug}/SKILL.md has no "name" in frontmatter`);
    } else if (nameMatch[1].trim() !== skill.slug) {
      fail(
        `${where}: SKILL.md name "${nameMatch[1].trim()}" does not match catalog slug`,
      );
    }
  } catch {
    fail(`${where}: missing ${skill.slug}/SKILL.md`);
  }
}

// Groups must cover every skill exactly once, or the catalog pages drop one.
const grouped = new Set();
for (const group of catalog.groups ?? []) {
  if (!group.id || !group.title || !group.description) {
    fail(`group "${group.id ?? group.title}": needs id, title, and description`);
  }
  for (const slug of group.skills ?? []) {
    if (!slugs.has(slug)) fail(`group "${group.title}": unknown skill "${slug}"`);
    if (grouped.has(slug)) fail(`skill "${slug}" appears in more than one group`);
    grouped.add(slug);
  }
}

for (const slug of slugs) {
  if (!grouped.has(slug)) fail(`skill "${slug}" is not in any group`);
}

// Corrections shown on the homepage must point at real skills.
const correctionsSource = await readFile(
  path.join(siteRoot, "src", "data", "corrections.ts"),
  "utf8",
);
for (const [, slug] of correctionsSource.matchAll(/skill:\s*"([^"]+)"/g)) {
  if (!slugs.has(slug)) {
    fail(`corrections.ts references unknown skill "${slug}"`);
  }
}

if (errors.length > 0) {
  console.error(`Content validation failed with ${errors.length} problem(s):\n`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `Content OK: ${catalog.skills.length} skills, ${catalog.groups.length} groups, ` +
    `${catalog.skills.reduce((n, s) => n + s.sources.length, 0)} sources.`,
);
