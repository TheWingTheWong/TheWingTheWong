// Builds the profile's SVG cards in assets/: a title card and one row per work,
// each in a desktop size and a narrow phone size (README picks via <picture>).
// Text is outlined to paths from Schibsted Grotesk so GitHub renders it exactly.
// Static content, so this runs locally: npm install && node scripts/build.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);
const face = (w) => opentype.loadSync(require.resolve(`@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-${w}-normal.woff`));
const REG = face(400), MED = face(500), SEMI = face(600);

// ── content (edit me) ─────────────────────────────────────────────────────
const NAME = 'Ansor Juraev';
const LEAD = 'Founder, FormzoAI.';
const REST = 'I build AI that listens, translates and designs robots.';
const WORKS = [
  { id: 'formzo', name: 'FormzoAI', kind: 'Live product', link: 'formzo.ai', idea: 'Forms that interview people, then score every answer.' },
  { id: 'raum', name: 'RAUM', kind: 'Open source', link: 'GitHub', idea: 'A private AI interpreter that lives in the room.' },
  { id: 'anybuild', name: 'AnyBuild', kind: 'Hackathon', link: 'GitHub', idea: 'Describe a robot. Claude designs, simulates and codes it.' },
];
// ──────────────────────────────────────────────────────────────────────────

const GROUND = '#121211', INK = '#EEECE6', STONE = '#A3A099', SLATE = '#8A8881';

// two layouts in canvas units. desktop shows at ~1.09x in GitHub's 830px column,
// phone at ~0.9x in a ~343px column; sizes are picked so phone text stays >= 12px.
const LAYOUTS = {
  '': { W: 760, M: 48, R: 20, name: 96, bar: [56, 4, 30], ts: 30, lh: 40, gap: 74, ns: 34, ks: 18, ls: 20, aw: 13, is: 24, ilh: 32, rowTop: 46, ideaGap: 38, oneLine: true },
  '-m': { W: 380, M: 24, R: 14, name: 48, bar: [32, 3, 18], ts: 19, lh: 26, gap: 44, ns: 23, ks: 14, ls: 14, aw: 10, is: 16, ilh: 22, rowTop: 34, ideaGap: 26, oneLine: false },
};

// lay out a string as one path: kerning on, tracking in em
function run(font, str, x, y, size, track = 0) {
  const glyphs = font.stringToGlyphs(str);
  const scale = size / font.unitsPerEm;
  let d = '', pen = x;
  glyphs.forEach((g, i) => {
    d += g.getPath(pen, y, size).toPathData(2);
    pen += g.advanceWidth * scale + track * size;
    if (i < glyphs.length - 1) pen += font.getKerningValue(g, glyphs[i + 1]) * scale;
  });
  return { d, w: pen - x - track * size };
}
const width = (font, str, size, track = 0) => run(font, str, 0, 0, size, track).w;
const path = (d, fill) => `<path d="${d}" fill="${fill}"/>`;

// greedy wrap; pulls a word down rather than leave a single-word last line
function wrap(font, str, size, max, firstIndent = 0) {
  const lines = [];
  let line = '', limit = max - firstIndent;
  for (const word of str.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (width(font, next, size) > limit && line) { lines.push(line); line = word; limit = max; } else line = next;
  }
  lines.push(line);
  const n = lines.length;
  if (n > 1 && !lines[n - 1].includes(' ')) {
    const prev = lines[n - 2].split(' ');
    if (prev.length > 2) { lines[n - 1] = `${prev.pop()} ${lines[n - 1]}`; lines[n - 2] = prev.join(' '); }
  }
  return lines;
}

function card(L, h, body, { top = false, bottom = false, title, css = '' }) {
  const { W, R } = L, t = top ? R : 0, b = bottom ? R : 0;
  const shape = `M0 ${t}${top ? `Q0 0 ${R} 0` : ''}H${W - t}${top ? `Q${W} 0 ${W} ${R}` : ''}V${h - b}${bottom ? `Q${W} ${h} ${W - R} ${h}` : ''}H${b}${bottom ? `Q0 ${h} 0 ${h - R}` : ''}Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img"><title>${title}</title>${css ? `<style>${css}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>` : ''}<path d="${shape}" fill="${GROUND}"/>${body}</svg>\n`;
}

// ── title card ────────────────────────────────────────────────────────────
function title(L) {
  const { W, M } = L;
  let size = L.name;
  while (width(SEMI, NAME, size, -0.03) > W - 2 * M) size -= 1;
  const nameY = M + Math.round(size * 0.92);
  let b = path(run(SEMI, NAME, M - size * 0.03, nameY, size, -0.03).d, INK);
  const [bw, bh, boff] = L.bar, barY = nameY + boff;
  // the one authored moment: a short bar that draws in under the name, once
  b += `<rect class="bar" x="${M}" y="${barY}" width="${bw}" height="${bh}" fill="${INK}"/>`;

  const textY = barY + L.gap;
  const leadW = width(REG, LEAD, L.ts), space = width(REG, ' ', L.ts);
  b += path(run(REG, LEAD, M, textY, L.ts).d, INK);
  const lines = wrap(REG, REST, L.ts, W - 2 * M, leadW + space);
  lines.forEach((ln, i) => { b += path(run(REG, ln, i === 0 ? M + leadW + space : M, textY + i * L.lh, L.ts).d, STONE); });
  const h = Math.round(textY + (lines.length - 1) * L.lh + L.lh * 1.6);
  const css = `.bar{transform-origin:${M}px 0;animation:draw .9s cubic-bezier(.16,1,.3,1) .2s both}@keyframes draw{from{transform:scaleX(0)}}`;
  return card(L, h, b, { top: true, css, title: `${NAME}. ${LEAD} ${REST}` });
}

// ── work rows ─────────────────────────────────────────────────────────────
// north-east arrow, drawn: a diagonal and a corner
const arrow = (x, y, s, sw) => `<path d="M${x} ${y + s}L${x + s} ${y}M${x + s * 0.3} ${y}H${x + s}V${y + s * 0.7}" fill="none" stroke="${INK}" stroke-width="${sw}"/>`;

function row(L, wk, i) {
  const { W, M } = L, last = i === WORKS.length - 1;
  const nameY = L.rowTop;
  const nm = run(MED, wk.name, M - 1, nameY, L.ns, -0.01);
  let b = path(nm.d, INK);
  b += path(run(REG, wk.kind, M + nm.w + L.ns * 0.4, nameY, L.ks).d, SLATE);
  const lw = width(REG, wk.link, L.ls);
  b += path(run(REG, wk.link, W - M - L.aw - L.aw * 0.8 - lw, nameY, L.ls).d, INK);
  b += arrow(W - M - L.aw, nameY - L.aw * 1.08, L.aw, L.aw * 0.17);
  const ideaLines = wrap(REG, wk.idea, L.is, W - 2 * M);
  if (L.oneLine && ideaLines.length > 1) throw new Error(`${wk.name}: idea is too long for one line, shorten it`);
  ideaLines.forEach((ln, k) => { b += path(run(REG, ln, M, nameY + L.ideaGap + k * L.ilh, L.is).d, STONE); });
  const h = Math.round(nameY + L.ideaGap + (ideaLines.length - 1) * L.ilh + (last ? L.M + L.ilh * 0.6 : L.ilh * 1.3));
  return card(L, h, b, { bottom: last, title: `${wk.name}, ${wk.kind.toLowerCase()}: ${wk.idea}` });
}

fs.mkdirSync('assets', { recursive: true });
for (const [suffix, L] of Object.entries(LAYOUTS)) {
  fs.writeFileSync(`assets/title${suffix}.svg`, title(L));
  WORKS.forEach((wk, i) => fs.writeFileSync(`assets/work-${wk.id}${suffix}.svg`, row(L, wk, i)));
}
console.log('built', Object.keys(LAYOUTS).length * (WORKS.length + 1), 'cards');
