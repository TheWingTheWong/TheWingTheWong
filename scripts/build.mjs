// Generates the animated profile SVGs in assets/ from live GitHub data.
// Usage: GITHUB_TOKEN=... node scripts/build.mjs
import fs from 'node:fs';

// ── edit me ────────────────────────────────────────────────────────────────
const CONFIG = {
  login: 'TheWingTheWong',
  name: 'ANSORJON JURAEV',
  handle: 'ansorjon',
  phrases: [
    'founder @ FormzoAI · forms that talk back',
    'I build AI agents that actually ship',
    'prompt → 3D robot → 1,024 simulations',
    'hackathon builder · Nebius × NVIDIA',
  ],
  facts: [
    ['Role', 'Founder · FormzoAI'],
    ['Focus', 'AI agents · conversational UX · simulation'],
    ['Stack', 'TypeScript · Next.js · React · Python · Claude'],
  ],
  projects: [
    {
      id: 'formzo', name: 'FormzoAI', label: 'FOUNDER · LIVE PRODUCT', accent: '#39d353',
      desc: 'Describe a form in one sentence and AI writes it. Answers come back summarized, scored and ranked.',
      tags: ['AI', 'SaaS', 'TypeScript'],
    },
    {
      id: 'anybuild', name: 'AnyBuild', label: 'HACKATHON BUILD', accent: '#a855f7', repo: 'anybuild_hackathon',
      desc: 'Describe a robot → Claude designs it in 3D → 1,024 browser simulations → parts, guide, firmware.',
      tags: ['Claude', '3D', 'Sim'],
    },
    {
      id: 'switchyard', name: 'SWITCHYARD', label: 'NEBIUS × NVIDIA · SIEMENS', accent: '#22d3ee', repo: 'switchyard',
      desc: 'The AI procurement decision room. Agents that argue the trade-offs so you can sign the PO.',
      tags: ['Agents', 'Enterprise', 'TS'],
    },
  ],
};
// ───────────────────────────────────────────────────────────────────────────

const OUT = 'assets';
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error('GITHUB_TOKEN missing');

const GREENS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const MONO = `ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace`;
const SANS = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => n.toLocaleString('en-US');

// seeded rng so visuals are stable between runs on the same day
let seed = [...new Date().toISOString().slice(0, 10)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

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
  const base = await gql(`query($login:String!){ user(login:$login){
    name createdAt followers{totalCount}
    repositories(ownerAffiliations:OWNER, privacy:PUBLIC, isFork:false, first:100){
      totalCount nodes{ name stargazerCount primaryLanguage{name color} } }
    contributionsCollection{ contributionCalendar{ totalContributions
      weeks{ contributionDays{ date weekday contributionCount contributionLevel } } } } } }`, { login: CONFIG.login });
  const u = base.user;

  // all-time daily counts, one request per year
  const days = new Map();
  const startYear = new Date(u.createdAt).getUTCFullYear();
  const thisYear = new Date().getUTCFullYear();
  for (let y = startYear; y <= thisYear; y++) {
    const d = await gql(`query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){
      contributionsCollection(from:$from,to:$to){ contributionCalendar{ weeks{ contributionDays{ date contributionCount } } } } } }`,
      { login: CONFIG.login, from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` });
    for (const w of d.user.contributionsCollection.contributionCalendar.weeks)
      for (const day of w.contributionDays) days.set(day.date, day.contributionCount);
  }
  const sorted = [...days.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  const today = new Date().toISOString().slice(0, 10);
  let best = 0, run = 0;
  for (const [, c] of sorted) { run = c > 0 ? run + 1 : 0; best = Math.max(best, run); }
  let current = 0;
  const past = sorted.filter(([d]) => d <= today);
  let i = past.length - 1;
  if (i >= 0 && past[i][1] === 0) i--; // today not counted yet is fine
  for (; i >= 0 && past[i][1] > 0; i--) current++;
  const allTime = sorted.reduce((a, [, c]) => a + c, 0);

  const created = new Date(u.createdAt);
  const months = (new Date().getUTCFullYear() - created.getUTCFullYear()) * 12 + new Date().getUTCMonth() - created.getUTCMonth();

  return {
    weeks: u.contributionsCollection.contributionCalendar.weeks,
    yearTotal: u.contributionsCollection.contributionCalendar.totalContributions,
    allTime, current, best,
    repos: u.repositories.totalCount,
    stars: u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0),
    followers: u.followers.totalCount,
    uptime: `${Math.floor(months / 12)}y ${months % 12}m`,
    since: created.getUTCFullYear(),
    repoMap: Object.fromEntries(u.repositories.nodes.map((r) => [r.name, r])),
  };
}

// ── hero ───────────────────────────────────────────────────────────────────
function hero(d) {
  const W = 1280, H = 460;
  const weeks = d.weeks.slice(-53);
  const step = 17, cell = 13;
  const gridW = weeks.length * step - (step - cell);
  const gx = (W - gridW) / 2, gy = 268;

  let cells = '';
  weeks.forEach((w, ci) => w.contributionDays.forEach((day) => {
    const lvl = LEVEL[day.contributionLevel] ?? 0;
    const delay = (ci * 0.045 + day.weekday * 0.035).toFixed(3);
    cells += `<rect class="c l${lvl}" x="${gx + ci * step}" y="${gy + day.weekday * step}" width="${cell}" height="${cell}" rx="3" style="animation-delay:${delay}s"><title>${day.date}: ${day.contributionCount}</title></rect>`;
  }));

  // rising particles
  let parts = '';
  for (let i = 0; i < 34; i++) {
    const x = (rnd() * W).toFixed(0), s = (2 + rnd() * 5).toFixed(1);
    const dur = (7 + rnd() * 9).toFixed(1), del = (-rnd() * 16).toFixed(1);
    const col = GREENS[1 + Math.floor(rnd() * 4)];
    parts += `<rect class="p" x="${x}" y="${H}" width="${s}" height="${s}" rx="1" fill="${col}" style="animation-duration:${dur}s;animation-delay:${del}s"/>`;
  }

  // typewriter phrases
  const fs_ = 23, cw = fs_ * 0.6;
  const longest = Math.max(...CONFIG.phrases.map((p) => p.length));
  const tx = W / 2 - ((longest + 2) * cw) / 2;
  const slot = 4.5, cycle = slot * CONFIG.phrases.length;
  let typeCss = '', typeSvg = '';
  CONFIG.phrases.forEach((p, i) => {
    const w = p.length * cw;
    const a = (i * slot) / cycle * 100, b = a + (1.6 / cycle) * 100, c = a + ((slot - 0.7) / cycle) * 100, e = a + (slot / cycle) * 100;
    const pc = (v) => v.toFixed(3) + '%';
    typeCss += `@keyframes t${i}{0%,${pc(a)}{transform:scaleX(0)}${pc(b)},${pc(c)}{transform:scaleX(1)}${pc(e)},100%{transform:scaleX(0)}}
@keyframes k${i}{0%,${pc(a)}{transform:translateX(0);opacity:${i === 0 ? 1 : 0}}${pc(a + 0.01)}{opacity:1}${pc(b)},${pc(c)}{transform:translateX(${w.toFixed(1)}px);opacity:1}${pc(e)}{transform:translateX(0);opacity:1}${pc(Math.min(e + 0.01, 100))},100%{opacity:0}}
.t${i}{animation:t${i} ${cycle}s steps(${p.length},end) infinite;transform-box:view-box;transform-origin:${(tx + 2 * cw).toFixed(1)}px 0}
.k${i}{animation:k${i} ${cycle}s steps(${p.length},end) infinite}\n`;
    typeSvg += `<clipPath id="cp${i}"><rect class="t${i}" x="${(tx + 2 * cw).toFixed(1)}" y="176" width="${w.toFixed(1)}" height="34"/></clipPath>
<text clip-path="url(#cp${i})" x="${(tx + 2 * cw).toFixed(1)}" y="200" font-family="${MONO}" font-size="${fs_}" fill="#e6edf3" textLength="${w.toFixed(1)}" lengthAdjust="spacingAndGlyphs">${esc(p)}</text>
<rect class="k${i} cur" x="${(tx + 2 * cw + 2).toFixed(1)}" y="180" width="12" height="25" fill="#39d353"/>`;
  });

  const nameW = 860;
  const chip = (x, label, val, col) => `<g transform="translate(${x},410)"><rect x="0" y="-17" width="262" height="34" rx="17" fill="#0d1117" stroke="${col}" stroke-opacity=".45"/><circle class="live" cx="20" cy="0" r="5" fill="${col}"/><text x="34" y="5" font-family="${MONO}" font-size="14" fill="#e6edf3"><tspan font-weight="700" fill="${col}">${esc(val)}</tspan> ${esc(label)}</text></g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>
.c{transform-box:fill-box;transform-origin:center;animation:wave 7s ease-in-out infinite}
.l0{fill:#161b22;animation-name:wave0}.l1{fill:${GREENS[1]}}.l2{fill:${GREENS[2]}}.l3{fill:${GREENS[3]}}.l4{fill:${GREENS[4]}}
@keyframes wave{0%,100%{transform:scale(1);opacity:.75}5%{transform:scale(1.45);opacity:1}11%{transform:scale(1);opacity:.85}}
@keyframes wave0{0%,100%{transform:scale(1);fill:#161b22}5%{transform:scale(1.3);fill:#2ea043}12%{transform:scale(1);fill:#161b22}}
.p{animation:rise linear infinite;opacity:0}
@keyframes rise{0%{transform:translateY(0);opacity:0}10%{opacity:.8}100%{transform:translateY(-${H + 20}px);opacity:0}}
.g1{animation:gl1 5s infinite steps(1)}.g2{animation:gl2 5s infinite steps(1)}
@keyframes gl1{0%,88%,100%{transform:translate(0,0);opacity:0}89%{transform:translate(-7px,2px);opacity:.85}91%{transform:translate(5px,-2px);opacity:.85}93%{transform:translate(-3px,1px);opacity:.6}95%{opacity:0}}
@keyframes gl2{0%,88%,100%{transform:translate(0,0);opacity:0}89%{transform:translate(6px,-1px);opacity:.85}91%{transform:translate(-5px,2px);opacity:.85}94%{transform:translate(3px,0);opacity:.6}96%{opacity:0}}
.live{animation:blink 1.6s ease-in-out infinite}@keyframes blink{50%{opacity:.25}}
.glow{animation:breathe 8s ease-in-out infinite}@keyframes breathe{50%{opacity:.55}}
.scan{animation:scan 5s linear infinite}@keyframes scan{0%{transform:translateY(-40px)}100%{transform:translateY(${H + 40}px)}}
${typeCss}</style>
<defs>
<linearGradient id="ng" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1280" y2="0" spreadMethod="repeat">
<stop offset="0" stop-color="#39d353"/><stop offset=".33" stop-color="#a5f3fc"/><stop offset=".66" stop-color="#c084fc"/><stop offset="1" stop-color="#39d353"/>
<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="1280 0" dur="6s" repeatCount="indefinite"/></linearGradient>
<linearGradient id="bd" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1280" y2="0" spreadMethod="repeat">
<stop offset="0" stop-color="#39d353"/><stop offset=".5" stop-color="#a855f7"/><stop offset="1" stop-color="#39d353"/>
<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="1280 0" dur="9s" repeatCount="indefinite"/></linearGradient>
<radialGradient id="r1"><stop offset="0" stop-color="#39d353" stop-opacity=".28"/><stop offset="1" stop-color="#39d353" stop-opacity="0"/></radialGradient>
<radialGradient id="r2"><stop offset="0" stop-color="#a855f7" stop-opacity=".28"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></radialGradient>
<linearGradient id="sl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#39d353" stop-opacity="0"/><stop offset="1" stop-color="#39d353" stop-opacity=".09"/></linearGradient>
<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#ffffff" stroke-opacity=".035"/></pattern>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="20"/></clipPath>
</defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="#05070d"/>
<rect width="${W}" height="${H}" fill="url(#grid)"/>
<ellipse class="glow" cx="230" cy="80" rx="520" ry="300" fill="url(#r1)"/>
<ellipse class="glow" cx="1080" cy="380" rx="560" ry="320" fill="url(#r2)" style="animation-delay:-4s"/>
${parts}
<rect class="scan" x="0" y="0" width="${W}" height="40" fill="url(#sl)"/>
<text x="40" y="44" font-family="${MONO}" font-size="13" fill="#7d8590" letter-spacing="2">◆ ${esc(CONFIG.login.toUpperCase())} / README.md</text>
<g transform="translate(${W - 40},44)"><circle class="live" cx="-186" cy="-4" r="5" fill="#39d353"/><text text-anchor="end" font-family="${MONO}" font-size="13" fill="#7d8590" letter-spacing="2">LIVE · ${new Date().toISOString().slice(0, 10)}</text></g>
<text x="${W / 2}" y="92" text-anchor="middle" font-family="${MONO}" font-size="16" fill="#7d8590" letter-spacing="6">// HELLO, WORLD — I'M</text>
<g font-family="${SANS}" font-size="80" font-weight="900" text-anchor="middle">
<text class="g1" x="${W / 2}" y="160" fill="#00e5ff" textLength="${nameW}" lengthAdjust="spacingAndGlyphs">${esc(CONFIG.name)}</text>
<text class="g2" x="${W / 2}" y="160" fill="#ff2bd6" textLength="${nameW}" lengthAdjust="spacingAndGlyphs">${esc(CONFIG.name)}</text>
<text x="${W / 2}" y="160" fill="url(#ng)" textLength="${nameW}" lengthAdjust="spacingAndGlyphs">${esc(CONFIG.name)}</text>
</g>
<text x="${tx.toFixed(1)}" y="200" font-family="${MONO}" font-size="${fs_}" font-weight="700" fill="#39d353">&gt;</text>
${typeSvg}
<text x="${gx}" y="${gy - 14}" font-family="${MONO}" font-size="12" fill="#7d8590" letter-spacing="2">LAST 12 MONTHS · REAL DATA · REFRESHED DAILY</text>
${cells}
${chip(W / 2 - 403, 'contributions · 12mo', fmt(d.yearTotal), '#39d353')}
${chip(W / 2 - 131, 'day streak', fmt(d.current), '#f0883e')}
${chip(W / 2 + 141, 'all-time contributions', fmt(d.allTime), '#a855f7')}
</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="19" fill="none" stroke="url(#bd)" stroke-width="2" stroke-opacity=".8"/>
</svg>`;
}

// ── neofetch terminal ─────────────────────────────────────────────────────
const FONT = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
};
function terminal(d) {
  const W = 1280, H = 560;
  const cmd = `neofetch --user ${CONFIG.login}`;
  const cw = 18 * 0.6;

  // pixel-art initials made of contribution squares
  let art = '';
  const step = 25, sz = 21, ax = 96, ay = 222;
  ['A', 'J'].forEach((ch, li) => FONT[ch].forEach((row, r) => [...row].forEach((px, c) => {
    const x = ax + (li * 6 + c) * step, y = ay + r * step;
    const on = px === '#';
    const col = on ? GREENS[2 + Math.floor(rnd() * 3)] : '#161b22';
    const del = (1.2 + (li * 6 + c + r) * 0.045).toFixed(2);
    art += `<rect class="px${on ? ' on' : ''}" x="${x}" y="${y}" width="${sz}" height="${sz}" rx="4" fill="${col}" style="animation-delay:${del}s,${(rnd() * -6).toFixed(2)}s"/>`;
  })));

  const lines = [
    ...CONFIG.facts,
    ['Commits', `${fmt(d.yearTotal)} in the last 12 months`],
    ['Streak', `${fmt(d.current)} days · best ${fmt(d.best)}`],
    ['All-time', `${fmt(d.allTime)} contributions since ${d.since}`],
    ['Repos', [`${fmt(d.repos)} public`, d.stars ? `${fmt(d.stars)} ★` : '', `${fmt(d.followers)} follower${d.followers === 1 ? '' : 's'}`].filter(Boolean).join(' · ')],
    ['Uptime', `${d.uptime} on GitHub`],
    ['Status', '● shipping something right now'],
  ];
  const ix = 440;
  let info = `<g class="ln" style="animation-delay:1.5s"><text x="${ix}" y="140" font-family="${MONO}" font-size="20" font-weight="700"><tspan fill="#39d353">${esc(CONFIG.handle)}</tspan><tspan fill="#e6edf3">@</tspan><tspan fill="#a855f7">${esc(CONFIG.login.toLowerCase())}</tspan></text>
<text x="${ix}" y="164" font-family="${MONO}" font-size="18" fill="#30363d">${'─'.repeat(CONFIG.handle.length + CONFIG.login.length + 1)}</text></g>`;
  lines.forEach(([k, v], i) => {
    const y = 198 + i * 30;
    const vc = k === 'Status' ? '#39d353' : '#e6edf3';
    info += `<g class="ln" style="animation-delay:${(1.7 + i * 0.13).toFixed(2)}s"><text x="${ix}" y="${y}" font-family="${MONO}" font-size="18"><tspan font-weight="700" fill="#39d353">${esc(k)}</tspan><tspan x="${ix + 120}" fill="${vc}">${esc(v)}</tspan></text></g>`;
  });
  const py = 198 + lines.length * 30 + 4;
  const pal = ['#0e4429', '#006d32', '#26a641', '#39d353', '#a855f7', '#22d3ee', '#f0883e', '#ff2bd6'];
  info += `<g class="ln" style="animation-delay:${(1.8 + lines.length * 0.13).toFixed(2)}s">${pal.map((c, i) => `<rect x="${ix + i * 34}" y="${py}" width="30" height="18" rx="3" fill="${c}"/>`).join('')}</g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>
.ty{animation:ty 1.1s steps(${cmd.length},end) .3s both;transform-box:fill-box;transform-origin:left}
@keyframes ty{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.ln{animation:ln .45s ease-out both}@keyframes ln{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
.px{transform-box:fill-box;transform-origin:center;animation:pop .5s cubic-bezier(.2,1.6,.4,1) both}
.px.on{animation:pop .5s cubic-bezier(.2,1.6,.4,1) both,tw 5s ease-in-out infinite}
@keyframes pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes tw{0%,100%{filter:brightness(1)}50%{filter:brightness(1.45)}}
.cur{animation:cb 1s steps(1) infinite}@keyframes cb{50%{opacity:0}}
.late{animation:ln .3s ease-out 3.4s both}
</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="#0a0d14" stroke="#30363d" stroke-width="2"/>
<path d="M1 17a16 16 0 0 1 16-16h${W - 34}a16 16 0 0 1 16 16v27H1z" fill="#161b22"/>
<circle cx="28" cy="23" r="7" fill="#ff5f57"/><circle cx="52" cy="23" r="7" fill="#febc2e"/><circle cx="76" cy="23" r="7" fill="#28c840"/>
<text x="${W / 2}" y="28" text-anchor="middle" font-family="${MONO}" font-size="14" fill="#7d8590">${esc(CONFIG.handle)}@wing — zsh — 128×32</text>
<text x="40" y="84" font-family="${MONO}" font-size="18"><tspan fill="#39d353" font-weight="700">➜</tspan><tspan fill="#22d3ee" font-weight="700">  ~ </tspan></text>
<clipPath id="tc"><rect class="ty" x="${40 + 5 * cw}" y="64" width="${cmd.length * cw}" height="28"/></clipPath>
<text clip-path="url(#tc)" x="${40 + 5 * cw}" y="84" font-family="${MONO}" font-size="18" fill="#e6edf3" textLength="${cmd.length * cw}" lengthAdjust="spacingAndGlyphs">${esc(cmd)}</text>
${art}
${info}
<g class="late"><text x="40" y="${H - 28}" font-family="${MONO}" font-size="18"><tspan fill="#39d353" font-weight="700">➜</tspan><tspan fill="#22d3ee" font-weight="700">  ~ </tspan></text>
<rect class="cur" x="${40 + 5 * cw}" y="${H - 45}" width="11" height="22" fill="#39d353"/></g>
</svg>`;
}

// ── project cards ─────────────────────────────────────────────────────────
function wrap(text, max) {
  const out = [];
  let line = '';
  for (const w of text.split(' ')) {
    if ((line + ' ' + w).trim().length > max) { out.push(line.trim()); line = w; } else line += ' ' + w;
  }
  if (line.trim()) out.push(line.trim());
  return out;
}
function card(p, d) {
  const W = 400, H = 260, a = p.accent;
  const desc = wrap(p.desc, 34).slice(0, 4);
  const repo = p.repo && d.repoMap[p.repo];
  let tx = 28;
  const tags = p.tags.map((t) => {
    const w = t.length * 9 + 22;
    const g = `<rect x="${tx}" y="214" width="${w}" height="26" rx="13" fill="${a}" fill-opacity=".12" stroke="${a}" stroke-opacity=".5"/><text x="${tx + w / 2}" y="231.5" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${a}">${esc(t)}</text>`;
    tx += w + 8;
    return g;
  }).join('');
  const meta = repo && repo.stargazerCount ? `★ ${repo.stargazerCount}` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>.sh{animation:sh 4s ease-in-out infinite}@keyframes sh{0%{transform:translateX(-${W}px)}60%,100%{transform:translateX(${W}px)}}
.dot{animation:d 1.8s ease-in-out infinite}@keyframes d{50%{opacity:.3}}</style>
<defs>
<linearGradient id="b" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="${H}" spreadMethod="reflect"><stop offset="0" stop-color="${a}"/><stop offset=".5" stop-color="${a}" stop-opacity=".1"/><stop offset="1" stop-color="${a}"/>
<animateTransform attributeName="gradientTransform" type="translate" values="0 0;${W} ${H};0 0" dur="6s" repeatCount="indefinite"/></linearGradient>
<radialGradient id="gl" cx="1" cy="0" r="1"><stop offset="0" stop-color="${a}" stop-opacity=".3"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient>
<linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="c"><rect width="${W}" height="${H}" rx="16"/></clipPath></defs>
<g clip-path="url(#c)"><rect width="${W}" height="${H}" fill="#0a0d14"/><rect width="${W}" height="${H}" fill="url(#gl)"/>
<rect class="sh" x="0" y="0" width="${W * 0.6}" height="${H}" fill="url(#s)" transform="skewX(-20)"/></g>
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="15" fill="none" stroke="url(#b)" stroke-width="2"/>
<circle class="dot" cx="34" cy="38" r="5" fill="${a}"/>
<text x="48" y="43" font-family="${MONO}" font-size="12" letter-spacing="1.5" fill="${a}">${esc(p.label)}</text>
<text x="${W - 28}" y="43" text-anchor="end" font-family="${MONO}" font-size="13" fill="#7d8590">${esc(meta)}</text>
<text x="28" y="90" font-family="${SANS}" font-size="32" font-weight="800" fill="#f0f6fc">${esc(p.name)}</text>
${desc.map((l, i) => `<text x="28" y="${124 + i * 23}" font-family="${SANS}" font-size="17" fill="#9da7b3">${esc(l)}</text>`).join('')}
${tags}
</svg>`;
}

// ── section headings ──────────────────────────────────────────────────────
function heading(idx, title, accent) {
  const W = 1280, H = 76;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>.u{animation:u 2.4s cubic-bezier(.6,0,.2,1) infinite alternate;transform-origin:40px 0}
@keyframes u{from{transform:scaleX(.08)}to{transform:scaleX(1)}}</style>
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient></defs>
<text x="40" y="46" font-family="${MONO}" font-size="16" fill="${accent}" letter-spacing="2">${esc(idx)}</text>
<text x="96" y="47" font-family="${SANS}" font-size="30" font-weight="800" fill="#8b949e" letter-spacing="3">${esc(title)}</text>
<rect class="u" x="40" y="62" width="1200" height="3" rx="1.5" fill="url(#g)"/>
</svg>`;
}

const d = await loadData();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/hero.svg`, hero(d));
fs.writeFileSync(`${OUT}/terminal.svg`, terminal(d));
for (const p of CONFIG.projects) fs.writeFileSync(`${OUT}/card-${p.id}.svg`, card(p, d));
const H = [['0x01', 'SHIPPED', '#39d353'], ['0x02', 'ARSENAL', '#a855f7'], ['0x03', 'CONTRIBUTION SKYLINE', '#22d3ee'], ['0x04', 'THE SNAKE EATS MY COMMITS', '#f0883e']];
H.forEach(([i, t, c], n) => fs.writeFileSync(`${OUT}/h${n + 1}.svg`, heading(i, t, c)));
console.log(`built: year=${d.yearTotal} allTime=${d.allTime} streak=${d.current} best=${d.best} repos=${d.repos}`);
