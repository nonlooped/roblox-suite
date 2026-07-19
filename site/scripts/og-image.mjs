#!/usr/bin/env node
/**
 * Renders public/og.png (1200x630) in the brand's own typefaces.
 *
 * Chromium is used rather than an SVG rasteriser because librsvg can only
 * reach system-installed fonts, and Unbounded/Hanken Grotesk ship as local
 * woff2 files. They are inlined as data URIs so the page needs no server.
 *
 * Playwright is not a project dependency; this is a one-off asset generator
 * and the resulting PNG is committed. Run it with playwright available:
 *   npx --yes playwright@1 node scripts/og-image.mjs
 * or with NODE_PATH pointing at an install that has it.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const BRAND = "#2438b8";
const INK = "#161b2e";
const PAPER = "#eef1f8";
const YELLOW = "#f5c518";
const RED = "#e8452f";
const GREEN = "#3dc96a";

async function fontFace(family, file, weight) {
  const buf = await readFile(path.join(siteRoot, "node_modules", file));
  return `@font-face{font-family:"${family}";font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${buf.toString(
    "base64",
  )}) format("woff2-variations");}`;
}

const [display, body] = await Promise.all([
  fontFace(
    "Unbounded",
    "@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2",
    "200 900",
  ),
  fontFace(
    "Hanken",
    "@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2",
    "100 900",
  ),
]);

/**
 * One brick, drawn flat with a hard ink edge and studs. Studs sit behind the
 * body so only their top half shows, which is what reads as a raised stud.
 */
const brick = (x, y, w, fill, studs) => `
  <div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:62px;">
    <div style="position:absolute;inset:0;display:flex;justify-content:space-evenly;">
      ${Array.from({ length: studs })
        .map(
          () =>
            `<span style="width:30px;height:22px;background:${fill};border:4px solid ${INK};
                          border-radius:5px;margin-top:-11px;"></span>`,
        )
        .join("")}
    </div>
    <div style="position:absolute;inset:0;background:${fill};border:4px solid ${INK};
                border-radius:8px;"></div>
  </div>`;

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  ${display}${body}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:${BRAND};color:${PAPER};
       font-family:Hanken,sans-serif;overflow:hidden;position:relative}
</style></head>
<body>
  <div style="position:absolute;inset:0;padding:70px 72px;display:flex;flex-direction:column;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:14px;font-family:Unbounded;font-weight:700;font-size:26px">
      <span style="position:relative;display:block;width:34px;height:34px">
        <span style="position:absolute;left:0;top:2px;width:24px;height:15px;background:${PAPER};border:3px solid ${INK};border-radius:4px"></span>
        <span style="position:absolute;right:0;bottom:2px;width:24px;height:15px;background:${YELLOW};border:3px solid ${INK};border-radius:4px"></span>
      </span>
      Roblox Suite
    </div>

    <div>
      <h1 style="font-family:Unbounded;font-weight:700;font-size:76px;line-height:0.98;letter-spacing:-0.035em;max-width:820px">
        Your AI writes Roblox code <span style="color:${YELLOW}">from 2019</span>
      </h1>

      <div style="margin-top:34px;display:inline-flex;flex-direction:column;gap:10px;
                  background:${INK};border:4px solid ${INK};border-radius:12px;padding:20px 26px;
                  font-family:ui-monospace,Consolas,monospace;font-size:25px;box-shadow:10px 10px 0 ${YELLOW}">
        <span style="color:${RED};text-decoration:line-through">- Humanoid:LoadAnimation</span>
        <span style="color:${GREEN}">+ Animator:LoadAnimation</span>
      </div>
    </div>

    <p style="font-size:25px;color:rgba(238,241,248,0.82)">
      16 skills that keep your coding agent on Roblox APIs that still work.
    </p>
  </div>

  <div style="position:absolute;right:-40px;top:120px;width:420px;height:420px">
    ${brick(40, 264, 240, "#4a63e8", 4)}
    ${brick(40, 202, 140, PAPER, 2)}
    ${brick(192, 202, 88, RED, 1)}
    ${brick(70, 140, 180, YELLOW, 3)}
    ${brick(110, 78, 100, GREEN, 1)}
  </div>
</body></html>`;

// ESM ignores NODE_PATH, so allow an explicit location for a non-local install.
const override = process.env.PLAYWRIGHT_DIR;
const pw = await import(
  override ? pathToFileURL(path.join(override, "playwright", "index.js")).href : "playwright"
);
// Playwright is CJS; the named export only survives on the default interop.
const chromium = pw.chromium ?? pw.default?.chromium;
// CHROME_PATH covers the case where the bundled browser build doesn't match.
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: "png" });
await browser.close();

await writeFile(path.join(siteRoot, "public", "og.png"), png);
console.log("Wrote public/og.png (1200x630)");
