#!/usr/bin/env node
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(path.join(root, "catalog.json"), "utf8"));
const hub = await readFile(path.join(root, "roblox", "SKILL.md"), "utf8");
const errors = [];

const catalogSlugs = catalog.skills.map((skill) => skill.slug);
const diskSlugs = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^roblox(?:-|$)/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

for (const slug of catalogSlugs) {
  try {
    await access(path.join(root, slug, "SKILL.md"));
  } catch {
    errors.push(`catalog skill has no ${slug}/SKILL.md`);
  }
}
for (const slug of diskSlugs) {
  if (!catalogSlugs.includes(slug)) errors.push(`${slug}/ exists but is absent from catalog.json`);
}

const hubSpecialists = new Set(
  [...hub.matchAll(/\]\(\.\.\/(roblox-[a-z0-9-]+)\/SKILL\.md\)/g)].map((match) => match[1]),
);
for (const slug of catalogSlugs.filter((slug) => slug !== "roblox")) {
  if (!hubSpecialists.has(slug)) errors.push(`hub does not route to ${slug}/SKILL.md`);
}
if (/\.\.\/roblox-[^/)]+\/references\//.test(hub)) {
  errors.push("hub links directly to specialist references; deep references belong to specialist SKILL.md files");
}

for (const slug of catalogSlugs) {
  const skillPath = path.join(root, slug, "SKILL.md");
  const skillText = await readFile(skillPath, "utf8");
  const refsDir = path.join(root, slug, "references");
  let refs = [];
  try {
    refs = (await readdir(refsDir)).filter((file) => file.endsWith(".md"));
  } catch {
    continue;
  }
  const linked = new Set(
    [...skillText.matchAll(/\]\((?:\.\/)?references\/([a-z0-9-]+\.md)(?:#[^)]+)?\)/gi)].map(
      (match) => match[1],
    ),
  );
  for (const file of refs) {
    if (!linked.has(file)) errors.push(`${slug}/references/${file} is orphaned from ${slug}/SKILL.md`);
  }
  for (const file of linked) {
    if (!refs.includes(file)) errors.push(`${slug}/SKILL.md links missing references/${file}`);
  }
}

if (errors.length) {
  console.error(`Catalog/routing validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(
  `Catalog/routing validation passed: ${catalogSlugs.length} skills, hub routes to ${hubSpecialists.size} specialists.`,
);
