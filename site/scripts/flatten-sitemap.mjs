#!/usr/bin/env node
/**
 * @astrojs/sitemap always emits sitemap-index.xml + sitemap-0.xml.
 * For a small static site, a single sitemap.xml is simpler for GSC.
 */
import { readFile, writeFile, unlink, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const files = await readdir(dist);
const chunk = files.find((name) => /^sitemap-\d+\.xml$/.test(name));

if (!chunk) {
  console.error("flatten-sitemap: no sitemap-*.xml chunk found in dist/");
  process.exit(1);
}

const xml = await readFile(path.join(dist, chunk), "utf8");
if (!/<urlset\b/.test(xml)) {
  console.error(`flatten-sitemap: ${chunk} is not a urlset sitemap`);
  process.exit(1);
}

await writeFile(path.join(dist, "sitemap.xml"), xml, "utf8");

for (const name of files) {
  if (name === "sitemap-index.xml" || /^sitemap-\d+\.xml$/.test(name)) {
    await unlink(path.join(dist, name));
  }
}

console.log(`flatten-sitemap: wrote sitemap.xml from ${chunk}`);
