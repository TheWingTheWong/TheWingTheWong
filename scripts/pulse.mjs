// Daily pulse: makes a random number of commits so every day on the
// contribution graph is green, at a different shade each day.
// Runs once per UTC day; a second scheduled run is a no-op backup.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';

const STATE = 'pulse/state.json';
const now = new Date();
const today = now.toISOString().slice(0, 10);

let state = {};
try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch {}

if (state.last === today && process.env.FORCE !== 'true') {
  console.log(`pulse: already done for ${today} (${state.count} commits)`);
  process.exit(0);
}

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

// Weighted so the graph uses all four green shades.
const r = Math.random();
let n = r < 0.25 ? rand(1, 3)
      : r < 0.60 ? rand(4, 8)
      : r < 0.87 ? rand(9, 15)
      :            rand(16, 30);
const dow = now.getUTCDay();
if (dow === 0 || dow === 6) n = Math.max(1, Math.round(n * 0.55)); // lighter weekends

// Spread commit times between 06:00 UTC and now, all on the same UTC day.
const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 0, 0);
const end = Math.max(start + 60_000, now.getTime() - 60_000);
const times = Array.from({ length: n }, () => start + Math.random() * (end - start)).sort((a, b) => a - b);

const [y, m] = today.split('-');
const logDir = `pulse/${y}`;
const logFile = `${logDir}/${m}.log`;
fs.mkdirSync(logDir, { recursive: true });

times.forEach((t, i) => {
  const iso = new Date(t).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const beat = crypto.randomBytes(4).toString('hex');
  fs.appendFileSync(logFile, `${iso}  ${beat}  beat ${i + 1}/${n}\n`);
  if (i === n - 1) {
    state = { last: today, count: n, total: (state.total || 0) + n };
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');
  }
  execFileSync('git', ['add', 'pulse'], { stdio: 'inherit' });
  execFileSync('git', ['commit', '-q', '-m', `pulse: ${today} beat ${i + 1}/${n} [${beat}]`], {
    stdio: 'inherit',
    env: { ...process.env, GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso },
  });
});

console.log(`pulse: ${n} commits for ${today}`);
