#!/usr/bin/env node
// Hub-vs-disk reference consistency check.
//
// The hub skill (roblox/SKILL.md) is the routing layer: it promises agents
// "direct references (with file paths)" into each specialized skill's
// references/ folder. This script enforces that promise — every reference
// file on disk must be linked from the hub, and every reference link in the
// hub must resolve to a file on disk. lychee catches broken links (missing
// targets); it cannot catch the inverse — a reference file that exists but
// is never linked from the hub, silently invisible to agents following the
// hub's routing.
//
// Run locally:  node scripts/check-hub-refs.mjs
// CI:           invoked from .github/workflows/validate.yml

import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const HUB = path.join(ROOT, "roblox", "SKILL.md");
const SKILLS_GLOB_PREFIX = "roblox"; // every skill dir is roblox*/; the hub itself is roblox/

// Match hub links of the form ](../roblox-<name>/references/<file>.md)
const HUB_REF_LINK = /\]\(\.\.\/(roblox-[a-z0-9-]+)\/references\/([a-z0-9-]+\.md)\)/gi;

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

async function listSkillsWithReferences() {
  const entries = await readdir(ROOT, { withFileTypes: true });
  const skills = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.startsWith(SKILLS_GLOB_PREFIX)) continue;
    if (entry.name === "roblox") continue; // the hub itself has references/ but isn't self-linked
    const refsDir = path.join(ROOT, entry.name, "references");
    if (!existsSync(refsDir)) continue;
    const st = await stat(refsDir);
    if (!st.isDirectory()) continue;
    skills.push(entry.name);
  }
  return skills.sort();
}

async function diskReferences(skill) {
  const dir = path.join(ROOT, skill, "references");
  const files = await readdir(dir);
  return files.filter((f) => f.endsWith(".md")).sort();
}

async function hubReferencesBySkill() {
  const text = await readFile(HUB, "utf8");
  const map = new Map(); // skill -> Set<file.md>
  for (const match of text.matchAll(HUB_REF_LINK)) {
    const skill = match[1];
    const file = match[2];
    if (!map.has(skill)) map.set(skill, new Set());
    map.get(skill).add(file);
  }
  return map;
}

async function main() {
  if (!existsSync(HUB)) fail(`hub not found at ${path.relative(ROOT, HUB)}`);

  const skills = await listSkillsWithReferences();
  const hubRefs = await hubReferencesBySkill();

  // Also catch skills that have references/ on disk but zero links in the hub.
  const hubSkills = new Set(hubRefs.keys());
  const skillsMissingEntirely = skills.filter((s) => !hubSkills.has(s));

  let missingFromHub = []; // {skill, file}
  let missingFromDisk = []; // {skill, file}

  for (const skill of skills) {
    const onDisk = await diskReferences(skill);
    const inHub = hubRefs.get(skill) ?? new Set();

    for (const file of onDisk) {
      if (!inHub.has(file)) missingFromHub.push({ skill, file });
    }
    for (const file of inHub) {
      if (!onDisk.includes(file)) missingFromDisk.push({ skill, file });
    }
  }

  const hasErrors =
    missingFromHub.length > 0 ||
    missingFromDisk.length > 0 ||
    skillsMissingEntirely.length > 0;

  if (hasErrors) {
    console.error("Hub-vs-disk reference consistency check FAILED.\n");
    if (skillsMissingEntirely.length > 0) {
      console.error("Skills with references/ on disk but NO reference links in the hub:");
      for (const s of skillsMissingEntirely) console.error(`  ${s}/references/ — 0 links in hub`);
      console.error();
    }
    if (missingFromHub.length > 0) {
      console.error("Reference files on disk but NOT linked from the hub (agents can't discover them):");
      for (const { skill, file } of missingFromHub) {
        console.error(`  ${skill}/references/${file}`);
      }
      console.error();
    }
    if (missingFromDisk.length > 0) {
      console.error("Reference links in the hub but NO file on disk (broken routing):");
      for (const { skill, file } of missingFromDisk) {
        console.error(`  ${skill}/references/${file}`);
      }
      console.error();
    }
    console.error(
      "Fix: add the missing reference(s) to the skill's pointer block in roblox/SKILL.md, " +
        "or remove the file if it's obsolete. See CONTRIBUTING.md \"Cross-linking\"."
    );
    process.exit(1);
  }

  const totalLinks = [...hubRefs.values()].reduce((n, s) => n + s.size, 0);
  console.error(
    `Hub-vs-disk reference consistency check passed: ${totalLinks} reference links across ${hubRefs.size} skills, all resolve.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
