#!/usr/bin/env node
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteRoot, "..");
const dist = path.join(siteRoot, "dist");
const catalog = JSON.parse(await readFile(path.join(repoRoot, "catalog.json"), "utf8"));
const manifest = JSON.parse(await readFile(path.join(repoRoot, "skills.sh.json"), "utf8"));
const errors = [];
const count = catalog.skills.length;

const manifestSlugs = manifest.groupings.flatMap((group) => group.skills).toSorted();
const catalogSlugs = catalog.skills.map((skill) => skill.slug).toSorted();
if (JSON.stringify(manifestSlugs) !== JSON.stringify(catalogSlugs)) {
  errors.push("manifest skills do not match catalog skills");
}

for (const page of [path.join(dist, "index.html"), path.join(dist, "skills", "index.html")]) {
  const html = await readFile(page, "utf8");
  if (!html.includes(`${count} skills`)) errors.push(`${path.relative(dist, page)} does not show catalog count ${count}`);
}
for (const slug of catalogSlugs) {
  try {
    await access(path.join(dist, "skills", slug, "index.html"));
  } catch {
    errors.push(`missing deployed route /skills/${slug}/`);
  }
}

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(full));
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

for (const file of await htmlFiles(dist)) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|#)/.test(href)) continue;
    const pathname = href.split(/[?#]/)[0].replace(/^\/roblox-suite\/?/, "");
    if (!pathname) continue;
    const target = pathname.endsWith("/")
      ? path.join(dist, pathname, "index.html")
      : path.extname(pathname)
        ? path.join(dist, pathname)
        : path.join(dist, pathname, "index.html");
    try {
      await access(target);
    } catch {
      errors.push(`${path.relative(dist, file)} links missing local target ${href}`);
    }
  }
}

if (errors.length) {
  console.error(`Built-site smoke test failed:\n- ${[...new Set(errors)].join("\n- ")}`);
  process.exit(1);
}
console.log(`Built-site smoke test passed for ${count} skills.`);
