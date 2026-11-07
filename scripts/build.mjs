// Builds the profile's cracktro-style SVG screens in assets/ from live GitHub data.
// Usage: GITHUB_TOKEN=... node scripts/build.mjs
import fs from 'node:fs';
import { text, textWidth, glyphPaths, bitmapPath } from './bitmap.mjs';

// ── content (edit me) ─────────────────────────────────────────────────────
const LOGIN = 'TheWingTheWong';
const RELEASES = [
  {
    id: 'formzo', name: 'formzoai', live: true, status: 'live', kind: 'product',
    line: 'describe a form in one sentence. ai writes it,',
    line2: 'interviews people, then scores every answer.',
    tags: 'ai  .  saas  .  typescript', open: 'formzo.ai',
  },
  {
    id: 'raum', name: 'raum', status: 'open source', kind: 'on-device ai',
    line: 'a private ai interpreter that lives in the room.',
    line2: 'translates both ways, checks every number, forgets.',
    tags: 'rust  .  python  .  whisper  .  gemma', open: 'repo',
  },
  {
    id: 'anybuild', name: 'anybuild', status: 'shipped', kind: 'hackathon',
    line: 'describe a robot. claude designs it in 3d, runs',
    line2: '1,024 browser simulations, writes the firmware.',
    tags: 'claude  .  3d  .  simulation', open: 'repo',
  },
  {
    id: 'switchyard', name: 'switchyard', status: 'shipped', kind: 'hackathon',
    line: 'the ai procurement decision room. built at the',
    line2: 'nebius x nvidia hackathon, siemens track.',
    tags: 'agents  .  enterprise  .  typescript', open: 'repo',
  },
];
const SCROLL = 'formzoai .. forms that interview people .. raum .. an interpreter that translates, checks and forgets .. anybuild .. prompt to robot in 1,024 simulations .. switchyard .. the ai procurement decision room .. greetz to claude, nebius, nvidia and siemens .. this screen rebuilds itself every day .. ';
const TOOLS = [
  ['typescript', 'ts'], ['javascript', 'js'], ['react', 'react'], ['nextdotjs', 'next'], ['nodedotjs', 'node'],
  ['python', 'python'], ['tailwindcss', 'tailwind'], ['threedotjs', 'three'], ['postgresql', 'postgres'],
  ['vercel', 'vercel'], ['docker', 'docker'], ['git', 'git'], ['claude', 'claude'], ['rust', 'rust'],
];
// ──────────────────────────────────────────────────────────────────────────

const VOID = '#000000', DUST = '#4a4a4a', FROST = '#8a8a8a', IVORY = '#e6e2d6', SIGNAL = '#ffb000';
const W = 1280;
const OUT = 'assets';
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error('GITHUB_TOKEN missing');
const pad = (n, w = 4) => String(n).padStart(w, '0');
const fmt = (n) => n.toLocaleString('en-US');

let seed = 20261107;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;

// ── data ──────────────────────────────────────────────────────────────────
async function gql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-builder' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function loadData() {
  const { user: u } = await gql(`query($login:String!){ user(login:$login){ createdAt
    repositories(ownerAffiliations:OWNER, privacy:PUBLIC, isFork:false){ totalCount }
    contributionsCollection{ contributionCalendar{ totalContributions } } } }`, { login: LOGIN });
  const days = new Map();
  const years = [];
  const y0 = new Date(u.createdAt).getUTCFullYear(), y1 = new Date().getUTCFullYear();
  for (let y = y0; y <= y1; y++) {
    const d = await gql(`query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){
      contributionsCollection(from:$from,to:$to){ contributionCalendar{ totalContributions weeks{ contributionDays{ date weekday contributionCount contributionLevel } } } } } }`,
      { login: LOGIN, from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` });
    const cal = d.user.contributionsCollection.contributionCalendar;
    years.push({ year: y, total: cal.totalContributions, weeks: cal.weeks });
    for (const w of cal.weeks)
      for (const day of w.contributionDays) days.set(day.date, day.contributionCount);
  }
  const today = new Date().toISOString().slice(0, 10);
  const past = [...days.entries()].filter(([d]) => d <= today).sort(([a], [b]) => (a < b ? -1 : 1));
  let best = 0, run = 0;
  for (const [, c] of past) { run = c > 0 ? run + 1 : 0; best = Math.max(best, run); }
  let current = 0, i = past.length - 1;
  if (i >= 0 && past[i][1] === 0) i--;
  for (; i >= 0 && past[i][1] > 0; i--) current++;
  const last = (n, off = 0) => past.slice(past.length - n - off, past.length - off).reduce((a, [, c]) => a + c, 0);
  return {
    today, past, current, best,
    year: u.contributionsCollection.contributionCalendar.totalContributions,
    allTime: past.reduce((a, [, c]) => a + c, 0),
    week: last(7), prevWeek: last(7, 7),
    repos: u.repositories.totalCount, since: y0, years,
  };
}

// ── shared pieces ─────────────────────────────────────────────────────────
// ivory bitmap texture: each display pixel shows a hairline grid, like a lit dot-matrix cell
const tex = (s) => `<pattern id="tx${s}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><rect width="${s}" height="${s}" fill="${IVORY}"/><rect x="${s - 1}" width="1" height="${s}" fill="#b4afa2"/><rect y="${s - 1}" width="${s}" height="1" fill="#b4afa2"/></pattern>`;

// dust fields riding wave bands; rear fields drift, the rate halves per step forward
function dust(h, bands) {
  let css = '', out = '';
  bands.forEach((b, li) => {
    let dots = '';
    for (let i = 0; i < b.n; i++) {
      const x = rnd() * W;
      const cy = b.cy + b.amp * Math.sin((x / W) * Math.PI * 2 * b.k + b.ph);
      const y = cy + gauss() * b.th;
      if (y < 0 || y > h) continue;
      const s = b.size * (0.6 + rnd() * 0.8);
      const o = (b.op * (0.35 + rnd() * 0.65)).toFixed(2);
      dots += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill-opacity="${o}"/>`;
      dots += `<rect x="${(x + W).toFixed(1)}" y="${y.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill-opacity="${o}"/>`;
    }
    css += `.dl${li}{animation:drift ${b.dur}s linear infinite}`;
    out += `<g class="dl${li}" fill="${b.col}">${dots}</g>`;
  });
  return { css: css + `@keyframes drift{to{transform:translateX(-${W}px)}}`, svg: out };
}

const label = (str, x, y, fill = FROST) => text(str.toUpperCase(), { f: '6x12', x, y, s: 1.5, track: 2, fill });
const glyphRun = (str, x, y, s) => text(str, { f: '8x16', x, y, s }).match(/d="([^"]+)"/)[1];
const caretCss = `.cr{animation:cr 1.1s steps(1) infinite}@keyframes cr{50%{opacity:0}}`;

function screen(h, body, { css = '', defs = '', top = false, bottom = false, title = '' } = {}) {
  const r = 18, t = top ? r : 0, bt = bottom ? r : 0;
  const shape = `M0 ${t}${top ? `Q0 0 ${r} 0` : ''}H${W - t}${top ? `Q${W} 0 ${W} ${r}` : ''}V${h - bt}${bottom ? `Q${W} ${h} ${W - r} ${h}` : ''}H${bt}${bottom ? `Q0 ${h} 0 ${h - r}` : ''}Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img"><title>${title}</title>
<style>${caretCss}${css}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>
<defs><clipPath id="scr"><path d="${shape}"/></clipPath>${defs}</defs>
<g clip-path="url(#scr)"><rect width="${W}" height="${h}" fill="${VOID}"/>${body}</g></svg>`;
}

// ── hero: the title screen ────────────────────────────────────────────────
function hero(d) {
  const H = 720;
  const D = dust(H, [
    { n: 1100, cy: 300, amp: 110, k: 1, ph: 0.4, th: 46, size: 1.6, op: 0.75, col: FROST, dur: 70 },
    { n: 520, cy: 470, amp: 80, k: 2, ph: 2.1, th: 34, size: 2.3, op: 0.6, col: '#6b6b6b', dur: 140 },
    { n: 120, cy: 240, amp: 150, k: 1, ph: 3.6, th: 90, size: 3.4, op: 0.55, col: DUST, dur: 280 },
  ]);

  // credit line
  const handle = 'thewingthewong';
  const hw = textWidth(handle, { f: '8x16', s: 2 });
  let body = text(handle, { f: '8x16', x: 48, y: 36, s: 2 });
  body += `<rect class="cr" x="${48 + hw + 10}" y="${36 + 12}" width="12" height="12" fill="${SIGNAL}"/>`;
  body += label('presents', 48, 76);
  const stamp = d.today.replace(/-/g, '.');
  body += text(stamp, { f: '6x12', x: W - 48 - textWidth(stamp, { f: '6x12', s: 1.5, track: 2 }), y: 40, s: 1.5, track: 2, fill: FROST });

  // the name: front plane, never moves
  const s = 10, nx = 40, ny = 110;
  body += `<path d="${glyphRun('ansor', nx, ny, s)}" fill="url(#tx10)"/>`;
  body += `<path d="${glyphRun('juraev', nx, ny + 13 * s, s)}" fill="url(#tx10)"/>`;
  const jw = textWidth('juraev', { f: '8x16', s });
  body += `<rect class="cr" x="${nx + jw + s}" y="${ny + 13 * s + 9 * s}" width="${2 * s}" height="${3 * s}" fill="${SIGNAL}"/>`;
  body += text('founder of formzoai. building ai that listens,', { f: '8x16', x: 48, y: 418, s: 2 });
  body += text('translates, designs robots and runs offline.', { f: '8x16', x: 48, y: 452, s: 2 });

  // status column
  const cx = 980;
  body += label('signal', cx, 140);
  body += text('shipping daily', { f: '6x12', x: cx, y: 164, s: 2 });
  [4, 7, 10, 13].forEach((hgt, i) => { body += `<rect x="${cx + 186 + i * 6}" y="${186 - hgt}" width="4" height="${hgt}" fill="${IVORY}"/>`; });
  body += label('streak', cx, 224);
  body += `<path d="${glyphRun(pad(d.current), cx, 240, 5)}" fill="url(#tx5)"/>`;
  body += text('days', { f: '6x12', x: cx + textWidth(pad(d.current), { f: '8x16', s: 5 }) + 10, y: 290, s: 1.5, track: 2, fill: FROST });
  body += label('releases', cx, 336);
  body += text(`${pad(RELEASES.length, 3)} below`, { f: '6x12', x: cx, y: 360, s: 2 });

  // sine scroller: the wave stays put in screen space while the text runs left
  const gs = 3, track = 1, v = 95, lam = 560, A = 24, dur = lam / v;
  const glyphs = glyphPaths(SCROLL, { f: '8x16', s: gs, track });
  const L = textWidth(SCROLL, { f: '8x16', s: gs, track }) + track * gs;
  const uniq = {};
  for (const g of glyphs) if (g.d) uniq[g.ch] = g.d;
  const ids = Object.fromEntries(Object.keys(uniq).map((c, i) => [c, `g${i}`]));
  const glyphDefs = Object.entries(uniq).map(([c, dd]) => `<path id="${ids[c]}" d="${dd}"/>`).join('');
  let row = '';
  for (const copy of [0, 1, 2]) for (const g of glyphs) {
    if (!g.d) continue;
    const x0 = g.x + copy * L;
    const delay = -((1 - ((x0 / lam) % 1)) * dur).toFixed(3);
    row += `<g class="wv" style="animation-delay:${delay}s"><use href="#${ids[g.ch]}" x="${x0}" fill="${g.ch === '.' ? FROST : '#d4cfc2'}"/></g>`;
  }
  body += `<g transform="translate(0,600)"><g class="sc">${row}</g></g>`;

  const css = D.css + `.sc{animation:sc ${(L / v).toFixed(2)}s linear infinite}@keyframes sc{to{transform:translateX(-${L}px)}}
.wv{animation:wv ${dur.toFixed(3)}s ease-in-out infinite}@keyframes wv{0%,100%{transform:translateY(-${A}px)}50%{transform:translateY(${A}px)}}`;
  return screen(H, D.svg + body, { css, defs: tex(10) + tex(5) + glyphDefs, top: true, title: 'thewingthewong presents ansor juraev' });
}

// ── release rows ──────────────────────────────────────────────────────────
function release(r, i) {
  const first = i === 0;
  const H = first ? 236 : 176;
  const y0 = first ? 60 : 0;
  const D = dust(H, [{ n: 160, cy: H * 0.5, amp: 40, k: 1, ph: i * 1.7, th: 50, size: 1.6, op: 0.5, col: '#5a5a5a', dur: 90 }]);
  let b = first ? label('releases', 48, 28) : '';
  b += text('>', { f: '8x16', x: 44, y: y0 + 8, s: 4, fill: r.live ? SIGNAL : FROST });
  b += `<path d="${glyphRun(r.name, 88, y0 + 8, 4)}" fill="url(#tx4)"/>`;
  b += text(r.line, { f: '6x12', x: 92, y: y0 + 80, s: 2, fill: '#b9b5a9' });
  b += text(r.line2, { f: '6x12', x: 92, y: y0 + 108, s: 2, fill: '#b9b5a9' });
  b += text(r.tags, { f: '6x12', x: 92, y: y0 + 144, s: 1.5, track: 1, fill: FROST });
  const col = (lx, k, v, live) => label(k, lx, y0 + 26) + text(v, { f: '6x12', x: lx, y: y0 + 50, s: 2, fill: live ? SIGNAL : IVORY });
  b += col(800, 'status', r.status, r.live) + col(950, 'kind', r.kind);
  b += label('open', 1110, y0 + 26) + text(`${r.open} >`, { f: '6x12', x: 1110, y: y0 + 50, s: 2 });
  return screen(H, D.svg + b, { css: D.css, defs: tex(4), title: `${r.name}: ${r.line} ${r.line2}` });
}

// ── signal feed ───────────────────────────────────────────────────────────
function signal(d) {
  const H = 440;
  const D = dust(H, [{ n: 300, cy: 220, amp: 70, k: 1, ph: 5, th: 70, size: 1.6, op: 0.45, col: '#5a5a5a', dur: 110 }]);
  let b = label('signal feed', 48, 34);
  d.past.slice(-8).reverse().forEach(([date, c], i) => {
    const y = 74 + i * 42, live = i === 0, quiet = c === 0;
    const fill = quiet ? DUST : IVORY;
    if (live) b += text('>', { f: '6x12', x: 48, y, s: 2, fill: SIGNAL });
    b += text(date.slice(5).replace('-', '.'), { f: '6x12', x: 76, y, s: 2, fill: quiet ? DUST : FROST });
    b += text(quiet ? 'sys' : 'ansor', { f: '6x12', x: 172, y, s: 2, fill });
    b += text(quiet ? 'quiet' : 'pushed', { f: '6x12', x: 300, y, s: 2, fill });
    if (!quiet) {
      b += text(`${c} commit${c === 1 ? '' : 's'}`, { f: '6x12', x: 404, y, s: 2, fill });
      for (let k = 0; k < Math.min(c, 30); k++) b += `<rect x="${570 + k * 9}" y="${y + 9}" width="5" height="5" fill="${live ? SIGNAL : FROST}"/>`;
    }
  });
  const tx = 900;
  b += label('totals', tx, 34);
  const delta = d.week - d.prevWeek;
  [
    ['this week', `${d.week}`, `${delta >= 0 ? '+' : ''}${delta} vs last`],
    ['12 months', fmt(d.year), ''],
    ['all time', fmt(d.allTime), `since ${d.since}`],
    ['streak', `${d.current} day${d.current === 1 ? '' : 's'}`, `best ${d.best}`],
    ['public repos', `${d.repos}`, ''],
  ].forEach(([k, v, note], i) => {
    const y = 74 + i * 66;
    b += label(k, tx, y);
    b += text(v, { f: '6x12', x: tx, y: y + 24, s: 2 });
    if (note) b += text(note, { f: '6x12', x: tx + textWidth(v, { f: '6x12', s: 2 }) + 16, y: y + 30, s: 1.5, track: 1, fill: i === 0 && delta > 0 ? SIGNAL : FROST });
  });
  return screen(H, D.svg + b, { css: D.css, title: `signal feed: ${d.week} commits this week, ${d.year} in 12 months, ${d.current} day streak` });
}

// ── the archive: every year on one screen ─────────────────────────────────
function calendar(d) {
  const SHADE = ['#151515', '#3d3d3d', '#6f6d67', '#aaa598', IVORY];
  const years = [...d.years].reverse();
  const step = 17, cell = 13, gx = 300, top = 140, block = 168;
  const H = top + years.length * block;
  const D = dust(H, [{ n: 260, cy: H / 2, amp: 120, k: 1, ph: 0.8, th: 90, size: 1.6, op: 0.4, col: '#5a5a5a', dur: 120 }]);
  let b = label('the archive', 48, 34);
  b += text(`${fmt(d.allTime)} contributions since ${d.since}`, { f: '6x12', x: 48, y: 58, s: 2, fill: FROST });
  ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].forEach((m, i) => {
    b += text(m, { f: '6x12', x: gx + Math.round(i * 4.42) * step, y: top - 24, s: 1.25, fill: DUST });
  });
  let css = '';
  years.forEach((yr, yi) => {
    const y0 = top + yi * block;
    b += `<path d="${glyphRun(String(yr.year), 48, y0 - 6, 4)}" fill="url(#tx4)"/>`;
    b += text(`${fmt(yr.total)} commits`, { f: '6x12', x: 50, y: y0 + 64, s: 1.5, track: 1, fill: FROST });
    let cells = '';
    // shade by rank within the year, so every year reads at full range
    const counts = yr.weeks.flatMap((w) => w.contributionDays.map((x) => x.contributionCount)).filter((c) => c > 0).sort((p, q) => p - q);
    const q = (f) => counts[Math.floor(f * (counts.length - 1))] ?? 1;
    const cut = [q(0.25), q(0.5), q(0.75)];
    const shadeOf = (c) => (c === 0 ? 0 : c <= cut[0] ? 1 : c <= cut[1] ? 2 : c <= cut[2] ? 3 : 4);
    const jan1 = Date.UTC(yr.year, 0, 1), offset = new Date(jan1).getUTCDay();
    for (const w of yr.weeks) for (const day of w.contributionDays) {
      const idx = Math.floor((Date.parse(day.date) - jan1) / 864e5) + offset;
      const col = Math.floor(idx / 7), row = day.weekday;
      if (day.date > d.today) continue;
      const isToday = day.date === d.today;
      cells += `<rect x="${gx + col * step}" y="${y0 + row * step}" width="${cell}" height="${cell}" fill="${isToday ? SIGNAL : SHADE[shadeOf(day.contributionCount)]}"${isToday ? ' class="cr"' : ''}/>`;
    }
    b += cells;
    // playhead: an amber raster line sweeping the year
    const gw = 53 * step;
    b += `<g class="ph" style="animation-delay:${(yi * 1.6).toFixed(1)}s"><rect x="${gx - 44}" y="${y0 - 6}" width="44" height="${7 * step + 8}" fill="url(#trail)"/><rect x="${gx}" y="${y0 - 6}" width="2" height="${7 * step + 8}" fill="${SIGNAL}"/></g>`;
    css = `.ph{animation:ph 7s linear infinite;opacity:0}@keyframes ph{0%{transform:translateX(0);opacity:1}88%{transform:translateX(${gw}px);opacity:1}90%,100%{transform:translateX(${gw}px);opacity:0}}`;
  });
  const defs = tex(4) + `<linearGradient id="trail"><stop offset="0" stop-color="${SIGNAL}" stop-opacity="0"/><stop offset="1" stop-color="${SIGNAL}" stop-opacity=".28"/></linearGradient>`;
  return screen(H, D.svg + b, { css: D.css + css, defs, title: `contribution archive: ${fmt(d.allTime)} contributions since ${d.since}` });
}

// ── tools ─────────────────────────────────────────────────────────────────
function tools() {
  const H = 230;
  const icons = JSON.parse(fs.readFileSync(new URL('./icons.json', import.meta.url)));
  const D = dust(H, [{ n: 140, cy: 120, amp: 30, k: 2, ph: 1, th: 40, size: 1.5, op: 0.4, col: '#5a5a5a', dur: 100 }]);
  let b = label('tools', 48, 34);
  const step = 86, x0 = (W - (TOOLS.length - 1) * step - 60) / 2;
  TOOLS.forEach(([slug, name], i) => {
    const x = x0 + i * step;
    b += `<path class="ic" style="animation-delay:${(i * 0.18).toFixed(2)}s" d="${bitmapPath(icons[slug], { x, y: 80, s: 3 })}" fill="${IVORY}"/>`;
    b += text(name, { f: '6x12', x: x + 30 - textWidth(name, { f: '6x12', s: 1.5 }) / 2, y: 160, s: 1.5, fill: FROST });
  });
  const css = D.css + `.ic{animation:ic 6s steps(1) infinite}@keyframes ic{0%,92%{opacity:1}94%{opacity:.35}96%{opacity:1}}`;
  return screen(H, D.svg + b, { css, title: 'tools: ' + TOOLS.map((t) => t[1]).join(', ') });
}

// ── end of transmission ───────────────────────────────────────────────────
function end(d) {
  const H = 250;
  const D = dust(H, [
    { n: 260, cy: 130, amp: 50, k: 1, ph: 2, th: 50, size: 1.6, op: 0.6, col: FROST, dur: 70 },
    { n: 60, cy: 110, amp: 60, k: 1, ph: 4, th: 60, size: 3.2, op: 0.5, col: DUST, dur: 280 },
  ]);
  let b = label('greetz', 48, 34);
  b += text('claude . nebius . nvidia . siemens . every 3am hackathon crowd', { f: '8x16', x: 48, y: 64, s: 2 });
  const eot = 'end of transmission';
  b += text(eot, { f: '8x16', x: 48, y: 140, s: 2, fill: FROST });
  b += `<rect class="cr" x="${48 + textWidth(eot, { f: '8x16', s: 2 }) + 10}" y="${140 + 12}" width="12" height="12" fill="${SIGNAL}"/>`;
  b += text(`rebuilt ${d.today} by github actions from live data`, { f: '6x12', x: 48, y: 196, s: 1.5, track: 1, fill: '#6b6b6b' });
  return screen(H, D.svg + b, { css: D.css, bottom: true, title: 'end of transmission' });
}

const d = await loadData();
fs.mkdirSync(OUT, { recursive: true });
const write = (f, s) => fs.writeFileSync(`${OUT}/${f}`, s);
write('title.svg', hero(d));
RELEASES.forEach((r, i) => write(`release-${r.id}.svg`, release(r, i)));
write('signal.svg', signal(d));
write('calendar.svg', calendar(d));
write('tools.svg', tools());
write('end.svg', end(d));
console.log(`built: week=${d.week} year=${d.year} allTime=${d.allTime} streak=${d.current} best=${d.best}`);
