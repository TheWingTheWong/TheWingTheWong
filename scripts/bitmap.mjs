// Renders text with Spleen bitmap fonts (fonts/, BSD-2-Clause, Frederic Cambus)
// as pixel geometry, so the type is identical on every machine and needs no web font.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = {};

export function font(name) {
  if (cache[name]) return cache[name];
  const src = fs.readFileSync(path.join(ROOT, 'fonts', `spleen-${name}.bdf`), 'utf8');
  const [cw, ch] = name.split('x').map(Number);
  const ascent = +src.match(/FONT_ASCENT (\d+)/)[1];
  const glyphs = {};
  for (const block of src.split('STARTCHAR').slice(1)) {
    const enc = +block.match(/ENCODING (\d+)/)[1];
    const [w, h, xo, yo] = block.match(/BBX (-?\d+) (-?\d+) (-?\d+) (-?\d+)/).slice(1).map(Number);
    const rows = block.split('BITMAP')[1].split('ENDCHAR')[0].trim().split(/\s+/).filter(Boolean);
    const top = ascent - (yo + h);
    const px = [];
    rows.forEach((hex, r) => {
      const bits = parseInt(hex, 16), n = hex.length * 4;
      for (let c = 0; c < w; c++) if (bits & (1 << (n - 1 - c))) px.push([xo + c, top + r]);
    });
    glyphs[enc] = px;
  }
  return (cache[name] = { cw, ch, glyphs });
}

// merge horizontal pixel runs into one compact path
function runs(pixels, ox, oy, s) {
  const rows = new Map();
  for (const [x, y] of pixels) {
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push(x);
  }
  let d = '';
  for (const [y, xs] of rows) {
    xs.sort((a, b) => a - b);
    let start = xs[0], prev = xs[0];
    const flush = () => { d += `M${+(ox + start * s).toFixed(2)} ${+(oy + y * s).toFixed(2)}h${+((prev - start + 1) * s).toFixed(2)}v${s}h${-+((prev - start + 1) * s).toFixed(2)}z`; };
    for (let i = 1; i < xs.length; i++) {
      if (xs[i] === prev + 1) prev = xs[i];
      else { flush(); start = prev = xs[i]; }
    }
    flush();
  }
  return d;
}

// text -> path data. x,y = top-left of the cell box. track = extra pixels between glyphs (font units)
export function textPath(str, { f = '8x16', x = 0, y = 0, s = 1, track = 0 } = {}) {
  const F = font(f);
  const px = [];
  [...str].forEach((c, i) => {
    const g = F.glyphs[c.codePointAt(0)] || F.glyphs[63];
    for (const [gx, gy] of g) px.push([gx + i * (F.cw + track), gy]);
  });
  return runs(px, x, y, s);
}

export function textWidth(str, { f = '8x16', s = 1, track = 0 } = {}) {
  const F = font(f);
  return [...str].length * (F.cw + track) * s - track * s;
}

export const text = (str, o = {}) =>
  `<path d="${textPath(str, o)}" fill="${o.fill || '#e6e2d6'}"${o.attrs ? ' ' + o.attrs : ''}/>`;

// one path per glyph, for per-letter animation
export function glyphPaths(str, { f = '8x16', s = 1, track = 0 } = {}) {
  const F = font(f);
  return [...str].map((c, i) => ({
    ch: c,
    x: i * (F.cw + track) * s,
    d: runs(F.glyphs[c.codePointAt(0)] || [], 0, 0, s),
  }));
}

// arbitrary bitmap (array of strings, '#' = on) -> path
export function bitmapPath(rows, { x = 0, y = 0, s = 1 } = {}) {
  const px = [];
  rows.forEach((r, ry) => [...r].forEach((c, rx) => { if (c === '#') px.push([rx, ry]); }));
  return runs(px, x, y, s);
}
