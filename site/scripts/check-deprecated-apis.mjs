#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rules = [
  "RemoveVersionAsync",
  "Humanoid:LoadAnimation",
  "TeleportPartyAsync",
  "BodyPosition",
  "BodyVelocity",
  "BodyGyro",
];
const acknowledgement = /deprecated?|deprecation|legacy|avoid|replace|migration|do not use|older api/i;
const errors = [];

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory() && ![".git", "node_modules", "dist"].includes(entry.name)) {
      files.push(...await markdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

for (const file of await markdownFiles(root)) {
  const lines = (await readFile(file, "utf8")).split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    for (const api of rules) {
      if (!lines[index].includes(api)) continue;
      const context = lines.slice(Math.max(0, index - 6), index + 7).join(" ");
      if (!acknowledgement.test(context)) {
        errors.push(`${path.relative(root, file)}:${index + 1} lists ${api} without a deprecation/migration warning`);
      }
    }
  }
}

if (errors.length) {
  console.error(`Deprecated API validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("Deprecated API validation passed.");
