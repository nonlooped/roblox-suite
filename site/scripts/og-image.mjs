// Generates a branded 1200x630 Open Graph image for Roblox Suite.
// Run: node scripts/og-image.mjs
// Output: public/og.png
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'og.png');

// Brand palette (kept in sync with the site's CSS tokens).
const BG = '#0a0a0a';
const SURFACE = '#141414';
const BORDER = '#262626';
const INK = '#f5f5f4';
const INK_SOFT = '#a8a29e';
const MUTED = '#78716c';
const CRIMSON = '#e11d48';

const W = 1200;
const H = 630;

// A clean editorial layout: eyebrow, wordmark + signal motif, headline, lede, code chip.
const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BG}"/>
      <stop offset="1" stop-color="#0d0d0d"/>
    </linearGradient>
    <radialGradient id="crimsonGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${CRIMSON}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${CRIMSON}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <circle cx="980" cy="120" r="320" fill="url(#crimsonGlow)"/>

  <!-- Border frame -->
  <rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" fill="none" stroke="${BORDER}" stroke-width="1"/>

  <!-- Top eyebrow -->
  <g transform="translate(80, 80)">
    <rect x="0" y="0" width="8" height="8" fill="${CRIMSON}"/>
    <text x="22" y="7.5" font-family="'Spline Sans Mono', ui-monospace, SFMono-Regular, Menlo, monospace" font-size="18" font-weight="600" letter-spacing="2.5" fill="${INK}" text-transform="uppercase">
      <tspan>ROBLOX SUITE</tspan>
    </text>
  </g>

  <!-- Wordmark + signal motif (top right) -->
  <g transform="translate(${W - 80 - 320}, 70)">
    <text x="0" y="22" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" letter-spacing="-0.4" fill="${INK}">Roblox Suite</text>
    <g transform="translate(230, 4)">
      <path d="M5 22 L12 15 L17 19 L27 9" fill="none" stroke="${CRIMSON}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="27" cy="9" r="3.2" fill="${CRIMSON}"/>
    </g>
  </g>

  <!-- Hairline divider -->
  <line x1="80" y1="130" x2="${W - 80}" y2="130" stroke="${BORDER}" stroke-width="1"/>

  <!-- Headline -->
  <text x="80" y="270" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="68" font-weight="700" letter-spacing="-2" fill="${INK}">
    <tspan x="80" y="270">Your AI agent,</tspan>
    <tspan x="80" y="345">writing current Roblox code.</tspan>
  </text>

  <!-- Lede -->
  <text x="80" y="410" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="400" fill="${INK_SOFT}">
    <tspan x="80" y="410">Fifteen skills. Each one tells your agent which Roblox APIs are current,</tspan>
    <tspan x="80" y="448">which are deprecated, and where the official docs say so.</tspan>
  </text>

  <!-- Code chip -->
  <g transform="translate(80, 500)">
    <rect x="0" y="0" width="520" height="50" rx="10" fill="${SURFACE}" stroke="${BORDER}" stroke-width="1"/>
    <text x="20" y="32" font-family="'Spline Sans Mono', ui-monospace, SFMono-Regular, Menlo, monospace" font-size="19" font-weight="500" fill="${INK}">
      <tspan fill="${MUTED}">$ </tspan><tspan>npx skills add nonlooped/roblox-suite</tspan>
    </text>
  </g>

  <!-- Bottom row: evidence chips -->
  <g transform="translate(80, 580)" font-family="'Spline Sans Mono', ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" font-weight="500">
    <g>
      <rect x="0" y="0" width="220" height="30" rx="999" fill="${SURFACE}" stroke="${BORDER}" stroke-width="1"/>
      <circle cx="18" cy="15" r="4" fill="${CRIMSON}"/>
      <text x="32" y="20" fill="${INK_SOFT}">15 skills · MIT licensed</text>
    </g>
    <g transform="translate(240, 0)">
      <rect x="0" y="0" width="260" height="30" rx="999" fill="${SURFACE}" stroke="${BORDER}" stroke-width="1"/>
      <circle cx="18" cy="15" r="4" fill="${CRIMSON}"/>
      <text x="32" y="20" fill="${INK_SOFT}">Accountable to the Engine API</text>
    </g>
  </g>
</svg>
`;

// Fix any stray refs before rendering.
const fixed = svg;

await sharp(Buffer.from(fixed)).png().toFile(OUT);
console.log('OG image written to', OUT);