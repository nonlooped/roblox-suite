#!/usr/bin/env node
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "catalog.json");
const manifestPath = path.join(root, "skills.sh.json");
const hubPath = path.join(root, "roblox", "SKILL.md");
const checkOnly = process.argv.includes("--check");

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const manifest = {
  $schema: "https://skills.sh/schemas/skills.sh.schema.json",
  notGrouped: "bottom",
  groupings: catalog.groups.map(({ title, description, skills }) => ({
    title,
    description,
    skills,
  })),
};
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;

const start = "<!-- catalog:specialists:start -->";
const end = "<!-- catalog:specialists:end -->";
const specialistLines = catalog.skills
  .filter((skill) => !skill.hub)
  .map(
    (skill) =>
      `- **${skill.displayTitle}:** [${skill.slug}/SKILL.md](../${skill.slug}/SKILL.md) — ${skill.oneLiner}`,
  );
const generatedBlock = `${start}\n${specialistLines.join("\n")}\n${end}`;
const hub = await readFile(hubPath, "utf8");
const blockPattern = new RegExp(`${start}[\\s\\S]*?${end}`);
if (!blockPattern.test(hub)) {
  throw new Error("roblox/SKILL.md is missing generated specialist markers");
}
const hubText = hub.replace(blockPattern, generatedBlock);

async function sync(pathname, expected) {
  const current = await readFile(pathname, "utf8");
  if (current === expected) return false;
  if (checkOnly) {
    console.error(`${path.relative(root, pathname)} is out of date; run node scripts/generate-catalog-artifacts.mjs`);
    process.exitCode = 1;
    return true;
  }
  await writeFile(pathname, expected);
  console.log(`updated ${path.relative(root, pathname)}`);
  return true;
}

await sync(manifestPath, manifestText);
await sync(hubPath, hubText);

const refsStart = "<!-- catalog:references:start -->";
const refsEnd = "<!-- catalog:references:end -->";
for (const skill of catalog.skills) {
  const skillPath = path.join(root, skill.slug, "SKILL.md");
  const refsDir = path.join(root, skill.slug, "references");
  let referenceFiles = [];
  try {
    referenceFiles = (await readdir(refsDir))
      .filter((file) => file.endsWith(".md"))
      .sort();
  } catch {
    continue;
  }
  const referenceBlock = [
    refsStart,
    "## Reference index",
    "",
    ...referenceFiles.map((file) => `- [${file}](references/${file})`),
    refsEnd,
  ].join("\n");
  const current = await readFile(skillPath, "utf8");
  const pattern = new RegExp(`${refsStart}[\\s\\S]*?${refsEnd}`);
  const expected = pattern.test(current)
    ? current.replace(pattern, referenceBlock)
    : `${current.trimEnd()}\n\n${referenceBlock}\n`;
  await sync(skillPath, expected);
}
