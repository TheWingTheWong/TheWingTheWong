// Wraps the third-party snake and 3D calendar SVGs in the profile's void screen,
// so they sit in the same world in both GitHub themes. Run after those actions.
import fs from 'node:fs';
import { text } from './bitmap.mjs';

const W = 1280, FROST = '#8a8a8a';
const label = (s, x, y) => text(s.toUpperCase(), { f: '6x12', x, y, s: 1.5, track: 2, fill: FROST });

function inner(src) {
  const svg = fs.readFileSync(src, 'utf8');
  const open = svg.match(/<svg[^>]*>/)[0];
  const vb = open.match(/viewBox="([^"]+)"/)[1].split(/[\s,]+/).map(Number);
  return { body: svg.slice(open.length, svg.lastIndexOf('</svg>')), vb };
}

function frame(src, out, title, caption, { scale = 1, top = 72, bottom = 40 } = {}) {
  if (!fs.existsSync(src)) { console.log(`frame: skip ${src} (missing)`); return; }
  const { body, vb } = inner(src);
  const w = vb[2] * scale, h = vb[3] * scale;
  const H = Math.round(top + h + bottom);
  const x = (W - w) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img"><title>${title}</title>
<rect width="${W}" height="${H}" fill="#000000"/>${label(caption, 48, 34)}
<svg x="${x}" y="${top}" width="${w}" height="${h}" viewBox="${vb.join(' ')}">${body}</svg></svg>`;
  fs.writeFileSync(out, svg);
  console.log(`frame: ${out}`);
}

frame('assets/raw/snake.svg', 'assets/snake.svg', 'a snake eating the contribution calendar', 'the snake eats the calendar', { scale: 1.36, top: 64, bottom: 8 });
frame('profile-3d-contrib/profile-custom-void.svg', 'assets/skyline.svg', '3d contribution calendar', 'skyline', { scale: 1, top: 64, bottom: 0 });
