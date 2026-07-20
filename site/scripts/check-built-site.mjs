#!/usr/bin/env node
/**
 * Post-build smoke test against dist/. Mirrors what the deploy workflow
 * checks against the live site, so failures surface locally and in PRs
 * instead of after a production deploy.
 */
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteRoot, "..");
const dist = path.join(siteRoot, "dist");

const SITE_ORIGIN = "https://roblox-suite.vercel.app";
const SITEMAP_BASE = `${SITE_ORIGIN}/`;

const errors = [];
const fail = (message) => errors.push(message);

const catalog = JSON.parse(
  await readFile(path.join(repoRoot, "catalog.json"), "utf8"),
);
const count = catalog.skills.length;

// dist/ is the static host root (Vercel serves it at the site origin).
const root = dist;

async function page(...segments) {
  const file = path.join(root, ...segments, "index.html");
  try {
    return await readFile(file, "utf8");
  } catch {
    fail(`missing page: ${path.relative(dist, file)}`);
    return null;
  }
}

const home = await page();
const skillsIndex = await page("skills");
const evidence = await page("evidence");

if (home && !/<meta name="google-site-verification" content="[^"]+">/.test(home)) {
  fail("home page is missing Google Search Console verification metadata");
}

// The deploy workflow greps both pages for "<count> skills" — enforce it here.
for (const [name, html] of [
  ["home", home],
  ["skills index", skillsIndex],
]) {
  if (html && !html.includes(`${count} skills`)) {
    fail(`${name} page does not render the string "${count} skills"`);
  }
}

for (const skill of catalog.skills) {
  const html = await page("skills", skill.slug);
  if (!html) continue;

  if (!html.includes(skill.slug)) {
    fail(`skills/${skill.slug}/ does not mention its own slug`);
  }
  if (!html.includes(skill.displayTitle)) {
    fail(`skills/${skill.slug}/ does not render its displayTitle`);
  }
  for (const [coverIndex, sourceIndexes] of skill.cover_sources.entries()) {
    for (const sourceIndex of sourceIndexes) {
      if (!html.includes(`data-claim-citation="${coverIndex + 1}:${sourceIndex}"`)) {
        fail(`skills/${skill.slug}/ is missing citation ${sourceIndex} for covers[${coverIndex}]`);
      }
    }
  }
  // Each detail page must actually surface its sources.
  for (const source of skill.sources) {
    if (!html.includes(source.url)) {
      fail(`skills/${skill.slug}/ is missing source URL ${source.url}`);
    }
  }
}

for (const [name, html] of [
  ["home", home],
  ["skills index", skillsIndex],
  ["evidence", evidence],
]) {
  if (!html) continue;
  const levels = [...html.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));
  for (let index = 1; index < levels.length; index++) {
    if (levels[index] > levels[index - 1] + 1) {
      fail(`${name} page skips from h${levels[index - 1]} to h${levels[index]}`);
    }
  }
}

for (const asset of ["404.html", "favicon.svg", "robots.txt"]) {
  try {
    await access(path.join(root, asset));
  } catch {
    try {
      await access(path.join(dist, asset));
    } catch {
      fail(`missing asset: ${asset}`);
    }
  }
}

const sitemapIndex = path.join(root, "sitemap-index.xml");
let sitemapIndexXml = null;

try {
  sitemapIndexXml = await readFile(sitemapIndex, "utf8");
} catch {
  fail("missing sitemap index: sitemap-index.xml");
}

if (sitemapIndexXml && !/<sitemapindex\b/.test(sitemapIndexXml)) {
  fail("sitemap-index.xml is not a sitemap index");
}

const sitemapUrls = sitemapIndexXml
  ? [...sitemapIndexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  : [];

if (sitemapIndexXml && sitemapUrls.length === 0) {
  fail("sitemap-index.xml does not reference any sitemap files");
}

const sitemapXml = [];
for (const sitemapUrl of sitemapUrls) {
  let url;
  try {
    url = new URL(sitemapUrl);
  } catch {
    fail(`sitemap index contains an invalid URL: ${sitemapUrl}`);
    continue;
  }

  if (url.origin !== SITE_ORIGIN) {
    fail(`sitemap index references a non-canonical sitemap: ${sitemapUrl}`);
    continue;
  }

  const relativePath = url.pathname.replace(/^\//, "");
  const sitemapFile = path.join(root, relativePath);
  try {
    const contents = await readFile(sitemapFile, "utf8");
    if (!/<urlset\b/.test(contents)) {
      fail(`referenced sitemap is not a URL sitemap: ${path.relative(dist, sitemapFile)}`);
    }
    sitemapXml.push(contents);
  } catch {
    fail(`missing referenced sitemap: ${path.relative(dist, sitemapFile)}`);
  }
}

const expectedSitemapUrls = [
  SITEMAP_BASE,
  `${SITEMAP_BASE}skills/`,
  `${SITEMAP_BASE}evidence/`,
  ...catalog.skills.map((skill) => `${SITEMAP_BASE}skills/${skill.slug}/`),
];

const sitemapContent = sitemapXml.join("\n");
for (const url of expectedSitemapUrls) {
  if (!sitemapContent.includes(`<loc>${url}</loc>`)) {
    fail(`sitemap is missing canonical URL: ${url}`);
  }
}

if (/<loc>[^<]*\/404\/?<\/loc>/.test(sitemapContent)) {
  fail("sitemap includes the generated 404 page");
}

if (errors.length > 0) {
  console.error(`Built-site check failed with ${errors.length} problem(s):\n`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Built site OK: ${count} skill pages, sitemap, index, evidence, and assets present.`);
