// Builds the profile: the card photo, a slow fade to dark, and one end-credit line.
// Two SVGs (desktop 830 wide, phone 380 wide), each with the photo embedded and the
// line outlined to paths from Open Sans, named by content hash so GitHub's image
// cache always picks up a rebuild. README.md is rewritten to point at them.
// Run: npm install && node scripts/build.mjs   (needs ffmpeg)
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);
const LIGHT = opentype.loadSync(require.resolve('@fontsource/open-sans/files/open-sans-latin-300-normal.woff'));

// ── content ────────────────────────────────────────────────────────────────
const SOURCE = 'assets/source/card.jpg'; // 2752 x 1536
const LINE = 'Any resemblance to a functioning company is intentional.';
const ALT = 'A hand holds a business card: “I’m CEO, B*tch.” ansor juraev, formzo.ai. The film fades to black. End credit: any resemblance to a functioning company is intentional.';
// ──────────────────────────────────────────────────────────────────────────

const GROUND = '#050B0E'; // the photo's own bottom edge, a blue-black from the floor
const INK = '#D8D4CA';    // warm off-white, like projected light, not screen white

const LAYOUTS = {
  '': {
    W: 830, crop: [2752, 1536, 0, 0], px: 1660, fade: [0.66, 1],
    lines: [LINE], size: 15.5, lead: 24, after: 300, track: 0.045,
  },
  '-m': {
    // tighter on the card so its print stays legible in a ~343px column
    W: 380, crop: [1800, 1270, 380, 60], px: 760, fade: [0.8, 1],
    lines: ['Any resemblance to a functioning', 'company is intentional.'], size: 14, lead: 22, after: 200, track: 0.04,
  },
};

function run(font, str, size, track) {
  const glyphs = font.stringToGlyphs(str);
  const scale = size / font.unitsPerEm;
  let pen = 0;
  const parts = glyphs.map((g, i) => {
    const at = pen;
    pen += g.advanceWidth * scale + track * size;
    if (i < glyphs.length - 1) pen += font.getKerningValue(g, glyphs[i + 1]) * scale;
    return { g, at };
  });
  return { parts, w: pen - track * size };
}
function centered(str, cx, y, L) {
  const { parts, w } = run(LIGHT, str, L.size, L.track);
  const x0 = cx - w / 2;
  return parts.map(({ g, at }) => g.getPath(x0 + at, y, L.size).toPathData(2)).join('');
}

function photo(L) {
  const [cw, ch, cx, cy] = L.crop;
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', SOURCE, '-vf', `crop=${cw}:${ch}:${cx}:${cy},scale=${L.px}:-2:flags=lanczos`, '-q:v', '4', '-f', 'mjpeg', '-'], { maxBuffer: 64 << 20 });
  return { b64: buf.toString('base64'), h: Math.round(L.W * ch / cw) };
}

function card(L) {
  const { b64, h: ph } = photo(L);
  const H = ph + L.after;
  const block = L.lines.length * L.lead;
  const top = ph + (L.after - block) / 2 + L.size * 0.72; // optical centre of the dark
  const d = L.lines.map((s, i) => centered(s, L.W / 2, top + i * L.lead, L)).join('');
  const [f0, f1] = L.fade;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${L.W} ${H}" width="${L.W}" height="${H}" role="img">
<title>${ALT}</title>
<style>
.shot{transform-origin:46% 52%;animation:settle 7s cubic-bezier(.16,1,.3,1) both}
@keyframes settle{from{transform:scale(1.045)}to{transform:none}}
@media (prefers-reduced-motion:reduce){.shot{animation:none}}
</style>
<defs>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
${[0, .15, .3, .45, .6, .75, .9, 1].map((t) => `<stop offset="${t}" stop-color="${GROUND}" stop-opacity="${(t * t * (3 - 2 * t)).toFixed(3)}"/>`).join('')}
</linearGradient>
<clipPath id="frame"><rect width="${L.W}" height="${ph}"/></clipPath>
<filter id="grain" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" stitchTiles="stitch"/>
<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 -.35"/>
</filter>
</defs>
<rect width="${L.W}" height="${H}" fill="${GROUND}"/>
<g clip-path="url(#frame)"><image class="shot" width="${L.W}" height="${ph}" preserveAspectRatio="xMidYMid slice" href="data:image/jpeg;base64,${b64}" xlink:href="data:image/jpeg;base64,${b64}"/></g>
<rect y="${(ph * f0).toFixed(1)}" width="${L.W}" height="${(ph * (f1 - f0) + 1).toFixed(1)}" fill="url(#fade)"/>
<rect y="${Math.round(ph * f0)}" width="${L.W}" height="${H - Math.round(ph * f0)}" filter="url(#grain)" opacity=".05"/>
<path d="${d}" fill="${INK}"/>
</svg>
`;
}

for (const f of fs.readdirSync('assets')) if (/^credits-.*\.svg$/.test(f)) fs.unlinkSync(`assets/${f}`);
const out = {};
for (const [suffix, L] of Object.entries(LAYOUTS)) {
  const svg = card(L);
  const hash = crypto.createHash('sha1').update(svg).digest('hex').slice(0, 8);
  out[suffix] = `assets/credits${suffix}-${hash}.svg`;
  fs.writeFileSync(out[suffix], svg);
  console.log(out[suffix], (svg.length / 1024).toFixed(0) + 'KB');
}
fs.writeFileSync('README.md', `<p align="center"><picture><source media="(max-width: 600px)" srcset="${out['-m']}"><img src="${out['']}" width="100%" alt="${ALT}"></picture></p>\n`);
