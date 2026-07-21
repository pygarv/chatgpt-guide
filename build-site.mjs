import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

// ---- Languages (source .md -> output page) ----
// `dir: 'rtl'` would be set for Urdu when added later. `bcp` drives read-aloud voice + og:locale.
const LANGS = [
  { code: 'english', native: 'English',   en: 'English',  bcp: 'en-IN', locale: 'en_US', file: 'guides/english.md' },
  { code: 'hindi',   native: 'हिंदी',      en: 'Hindi',    bcp: 'hi-IN', locale: 'hi_IN', file: 'guides/hindi.md' },
  { code: 'bengali', native: 'বাংলা',      en: 'Bengali',  bcp: 'bn-IN', locale: 'bn_IN', file: 'guides/bengali.md' },
  { code: 'tamil',   native: 'தமிழ்',      en: 'Tamil',    bcp: 'ta-IN', locale: 'ta_IN', file: 'guides/tamil.md' },
  { code: 'telugu',  native: 'తెలుగు',     en: 'Telugu',   bcp: 'te-IN', locale: 'te_IN', file: 'guides/telugu.md' },
  { code: 'kannada', native: 'ಕನ್ನಡ',      en: 'Kannada',  bcp: 'kn-IN', locale: 'kn_IN', file: 'guides/kannada.md' },
  { code: 'marathi', native: 'मराठी',      en: 'Marathi',  bcp: 'mr-IN', locale: 'mr_IN', file: 'guides/marathi.md' },
  { code: 'punjabi', native: 'ਪੰਜਾਬੀ',     en: 'Punjabi',  bcp: 'pa-IN', locale: 'pa_IN', file: 'guides/punjabi.md' },
  { code: 'odia',    native: 'ଓଡ଼ିଆ',       en: 'Odia',     bcp: 'or-IN', locale: 'or_IN', file: 'guides/odia.md' },
  { code: 'gujarati', native: 'ગુજરાતી',   en: 'Gujarati',  bcp: 'gu-IN', locale: 'gu_IN', file: 'guides/gujarati.md' },
];

const PORTFOLIO = 'https://pygarv.github.io/Portfolio/';
const CREDIT = `Built by <a href="${PORTFOLIO}" target="_blank" rel="noopener">Garv</a>`;
const BASE = 'https://pygarv.github.io/chatgpt-guide/';
const REPO = 'https://github.com/pygarv/chatgpt-guide';
const OPENAI = 'https://openai.com';
const OG_IMG = BASE + 'assets/og.png';
const DESC = 'A simple, beginner-friendly guide to using ChatGPT on your phone. Written for first-time users and people not comfortable with English or technology. Free to read in 10 languages.';
// Cloudflare Web Analytics (cookieless, privacy-friendly visitor counts)
const ANALYTICS = `<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "cd4d7943c34641419a7b764d9fac038b"}'></script>`;

// ---- inline SVG icon set (currentColor, no external files) ----
const P = {
  home: '<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/>',
  download: '<path d="M12 3v12"/><path d="m7 12 5 5 5-5"/><path d="M5 21h14"/>',
  moon: '<path d="M21 12.8A8 8 0 1 1 11.2 3 6 6 0 0 0 21 12.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  speak: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8a5 5 0 0 1 0 8"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  arrowR: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  arrowL: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  check: '<path d="m5 12 5 5 9-9"/>',
};
const svg = (n) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const ICON = Object.fromEntries(Object.keys(P).map((k) => [k, svg(k)]));
const ICON_SCRIPT = `<script>var IC=${JSON.stringify(ICON)};</script>`;
// GitHub mark (filled, own viewBox)
const GH_SVG = '<svg class="ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 2-.4 3-.4s2.1.1 3 .4c2.3-1.6 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>';

function footer() {
  return `<footer class="site-foot">
  <div class="foot-links">
    <a href="${REPO}" target="_blank" rel="noopener">${GH_SVG} Contribute on GitHub</a>
  </div>
  <p class="credit">${CREDIT}</p>
  <p class="fine">A free, independent guide to help first-time users. ChatGPT is a product of <a href="${OPENAI}" target="_blank" rel="noopener">OpenAI</a> — this guide is not affiliated with or endorsed by OpenAI. Free to read &amp; share. It is open source, so anyone can suggest fixes or improvements.</p>
</footer>`;
}

const ROOT = path.resolve('.');
const OUT = path.join(ROOT, 'docs');
fs.mkdirSync(OUT, { recursive: true });

// Open Graph + Twitter card so shared links (WhatsApp, social) show a title, blurb and preview.
function meta({ title, url, locale = 'en_US' }) {
  const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  return `<meta name="description" content="${esc(DESC)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="A Basic ChatGPT Guide">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(DESC)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMG}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(DESC)}">
<meta name="twitter:image" content="${OG_IMG}">`;
}

// ---- shared stylesheet ----
const CSS = `
:root {
  --accent:#0e8f6f; --accent2:#f59e0b; --accent-soft:#e7f7f1; --accent-border:#bfe6d8;
  --ink:#20242c; --muted:#6b7280; --line:#e9e6df;
  --bg:#fbf9f5; --surface:#ffffff; --surface2:#f4f1ea; --quote:#f0faf6;
  --fs:1;
}
:root[data-theme="dark"] {
  --accent:#34d3a6; --accent2:#fbbf24; --accent-soft:#122a22; --accent-border:#1f6b55;
  --ink:#eceef2; --muted:#9aa3b2; --line:#2a2f3a;
  --bg:#0f1216; --surface:#171b22; --surface2:#1c212a; --quote:#12211b;
}
* { box-sizing:border-box; }
button { appearance:none; -webkit-appearance:none; font:inherit; }
html { -webkit-text-size-adjust:100%; font-size:calc(18px * var(--fs)); }
.ic { width:1.15em; height:1.15em; display:inline-block; vertical-align:-0.18em; flex:none; }
.iconbtn .ic, .btn .ic { width:20px; height:20px; vertical-align:middle; }
.pdf-dl .ic { width:15px; height:15px; vertical-align:-0.2em; }
.chapcard .go .ic { width:22px; height:22px; display:block; }
.chnav .ic { width:16px; height:16px; }
body { margin:0; color:var(--ink); background:var(--bg);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans','Noto Sans Devanagari','Noto Sans Bengali','Noto Sans Tamil','Noto Sans Telugu','Noto Sans Kannada','Noto Sans Oriya','Noto Sans Gurmukhi', sans-serif;
  line-height:1.75; font-size:1rem;
  transition: background .2s ease, color .2s ease; }
h1,h2,h3 { line-height:1.3; }

/* ---- buttons / controls ---- */
.btn { cursor:pointer; border:1px solid var(--line); background:var(--surface); color:var(--ink);
  border-radius:10px; padding:8px 12px; font-size:1rem; line-height:1; display:inline-flex; align-items:center; gap:6px; }
.btn:hover { border-color:var(--accent); }
.btn.on { background:var(--accent); color:#fff; border-color:var(--accent); }
.iconbtn { cursor:pointer; border:1px solid var(--line); background:var(--surface); color:var(--ink);
  border-radius:10px; width:40px; height:40px; font-size:1.1rem; line-height:1; display:inline-flex; align-items:center; justify-content:center; }
.iconbtn:hover { border-color:var(--accent); }
.floating { position:fixed; top:14px; right:14px; z-index:30; box-shadow:0 2px 10px rgba(0,0,0,.1); }

/* ---- top bar ---- */
.topbar { position:sticky; top:0; z-index:20; background:color-mix(in srgb, var(--bg) 90%, transparent);
  backdrop-filter:blur(8px); border-bottom:1px solid var(--line); display:flex; align-items:center; gap:8px; padding:8px 12px;
  flex-wrap:nowrap; overflow-x:auto; scrollbar-width:none; }
.topbar::-webkit-scrollbar { display:none; }
.topbar > * { flex:none; }
.topbar .home { text-decoration:none; color:var(--accent); font-weight:800; font-size:1.15rem; white-space:nowrap; }
.topbar .spacer { flex:1 1 auto; min-width:0; }
.topbar select { font-size:.95rem; padding:8px; border:1px solid var(--line); border-radius:10px; background:var(--surface); color:var(--ink); max-width:36vw; }
.topbar .pdf-dl { text-decoration:none; font-size:.85rem; font-weight:700; color:var(--accent);
  border:1px solid var(--accent-border); border-radius:10px; padding:8px 10px; white-space:nowrap; }
.fsgroup { display:inline-flex; gap:4px; }

/* ---- reading progress bar (chapter view) ---- */
.readbar[hidden] { display:none; }
.readbar { position:sticky; top:57px; z-index:15; display:flex; align-items:center; gap:12px;
  padding:8px 14px; background:var(--surface); border-bottom:1px solid var(--line); }
.readbar .count { font-size:.85rem; color:var(--muted); font-weight:700; white-space:nowrap; }
.progress { flex:1; height:8px; background:var(--surface2); border-radius:999px; overflow:hidden; }
.progress > i { display:block; height:100%; width:0; background:linear-gradient(90deg,var(--accent),var(--accent2)); transition:width .25s ease; }
.readbar .speak { font-weight:700; }

/* ---- content ---- */
.wrap { max-width:760px; margin:0 auto; padding:22px 20px 60px; }
.wrap img { display:block; width:100%; max-width:300px; height:auto; margin:20px auto;
  border-radius:14px; border:1px solid var(--line); box-shadow:0 4px 16px rgba(16,24,40,.10); }
h1 { font-size:1.85em; margin:.2em 0 .5em; }
h2 { font-size:1.35em; margin:1.4em 0 .4em; }
h3 { font-size:1.12em; margin:1.1em 0 .3em; }
p, li { font-size:1rem; }
a { color:var(--accent); }
blockquote { border-left:4px solid var(--accent2); background:var(--quote); margin:1.1em 0; padding:.7em 1.1em; border-radius:0 12px 12px 0; }
table { border-collapse:collapse; width:100%; margin:1em 0; display:block; overflow-x:auto; }
th,td { border:1px solid var(--line); padding:9px 11px; text-align:left; }
th { background:var(--surface2); }
hr { border:0; border-top:1px solid var(--line); margin:1.4em 0; }
code { background:var(--surface2); padding:2px 6px; border-radius:6px; font-size:.92em; }
.shot { border:2px dashed var(--line); background:var(--surface2); color:var(--muted); padding:14px 16px; margin:16px 0; border-radius:12px; font-style:italic; }
.shot::before { content:"📷 "; font-style:normal; }
.page-break { display:none; }

/* ---- chapter view ---- */
.chapter[hidden] { display:none; }
.chapter { scroll-margin-top:112px; }
.ch-title { display:flex; align-items:center; gap:12px; margin:.1em 0 .3em; }
.ch-title .num { flex:none; width:44px; height:44px; border-radius:12px; background:var(--accent); color:#fff;
  font-weight:800; font-size:1.15rem; display:flex; align-items:center; justify-content:center; }
.ch-title h1 { font-size:1.5em; margin:0; }

/* prev / next */
.chnav { display:flex; gap:12px; margin-top:38px; }
.chnav a { flex:1; text-decoration:none; border:1px solid var(--line); background:var(--surface); color:var(--ink);
  border-radius:14px; padding:14px 16px; display:flex; flex-direction:column; gap:3px; transition:border-color .12s, transform .08s; }
.chnav a:hover { border-color:var(--accent); transform:translateY(-1px); }
.chnav a.next { text-align:right; align-items:flex-end; }
.chnav a .dir { font-size:.78rem; color:var(--muted); font-weight:700; text-transform:uppercase; letter-spacing:.03em; }
.chnav a .lbl { font-weight:700; color:var(--accent); }

/* ---- home (per-language cover + chapter list) ---- */
.cover { text-align:center; padding:14px 0 6px; }
.cover h1 { font-size:1.9em; margin:.1em 0 .3em; }
.cover .tagline { color:var(--muted); font-size:1.02em; max-width:600px; margin:.2em auto 0; font-style:normal; }
.note { background:var(--surface); border:1px solid var(--line); border-radius:16px; padding:6px 20px; margin:22px 0; }
.note h2 { font-size:1.15em; }
.chapter-list { display:flex; flex-direction:column; gap:12px; margin-top:8px; }
.chapcard { display:flex; align-items:center; gap:14px; cursor:pointer; text-align:left; width:100%;
  border:1px solid var(--line); background:var(--surface); color:var(--ink); border-radius:16px; padding:16px 16px;
  font:inherit; transition:border-color .12s, transform .08s, box-shadow .12s; }
.chapcard:hover { border-color:var(--accent); transform:translateY(-1px); box-shadow:0 6px 18px rgba(16,24,40,.08); }
.chapcard .num { flex:none; width:40px; height:40px; border-radius:11px; background:var(--accent-soft); color:var(--accent);
  font-weight:800; display:flex; align-items:center; justify-content:center; font-size:1.05rem; }
.chapcard .name { font-weight:700; font-size:1.05rem; line-height:1.3; }
.chapcard .go { margin-left:auto; color:var(--muted); font-size:1.3rem; }

/* ---- landing page ---- */
.hero { max-width:820px; margin:0 auto; padding:52px 20px 6px; text-align:center; }
.hero h1 { font-size:2.2em; margin:.15em 0; }
.hero p { color:var(--muted); font-size:1.08em; max-width:600px; margin:.5em auto; }
.badge { display:inline-block; background:var(--accent-soft); color:var(--accent); border:1px solid var(--accent-border);
  padding:6px 14px; border-radius:999px; font-size:.9em; font-weight:700; margin-top:12px; }
.pick { text-align:center; color:var(--muted); font-weight:700; margin:30px 0 4px; font-size:.95em; }
.grid { max-width:820px; margin:10px auto 50px; padding:0 20px; display:grid;
  grid-template-columns:repeat(auto-fill, minmax(160px,1fr)); gap:14px; }
.card { position:relative; display:block; text-decoration:none; border:1px solid var(--line); border-radius:18px; background:var(--surface);
  padding:26px 16px; text-align:center; transition:transform .08s ease, box-shadow .12s ease, border-color .12s; }
.card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(16,24,40,.12); border-color:var(--accent); }
.card .lang { font-size:1.7em; font-weight:800; color:var(--ink); }
.card .en { color:var(--muted); font-size:.92em; margin-top:6px; }
.card.suggested { border-color:var(--accent); }
.card .tag { position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:var(--accent); color:#fff;
  font-size:.72rem; font-weight:700; padding:3px 10px; border-radius:999px; white-space:nowrap; }

/* footer */
.site-foot { border-top:1px solid var(--line); margin-top:44px; padding:30px 20px 46px; text-align:center; color:var(--muted); }
.foot-links { display:flex; flex-wrap:wrap; gap:10px 14px; justify-content:center; margin-bottom:16px; }
.foot-links a { display:inline-flex; align-items:center; gap:8px; text-decoration:none; color:var(--ink); font-weight:700;
  border:1px solid var(--line); background:var(--surface); border-radius:999px; padding:9px 16px; font-size:.92rem; transition:border-color .12s, color .12s; }
.foot-links a:hover { border-color:var(--accent); color:var(--accent); }
.foot-links .ic { width:18px; height:18px; }
.site-foot .credit { color:var(--ink); font-weight:700; margin:8px 0; font-size:1rem; }
.site-foot .credit a { color:var(--accent); text-decoration:none; }
.site-foot .credit a:hover { text-decoration:underline; }
.site-foot .fine { font-size:.83rem; max-width:540px; margin:8px auto 0; line-height:1.65; }
.site-foot .fine a { color:var(--accent); }

@media (max-width:480px) {
  html { font-size:calc(17px * var(--fs)); }
  .hero { padding:30px 18px 4px; }
  .hero h1 { font-size:1.7em; }
  .grid { grid-template-columns:1fr 1fr; gap:12px; }
  .card { padding:20px 10px; }
  .card .lang { font-size:1.4em; }
  .wrap { padding:18px 16px 44px; }
  .topbar select { max-width:30vw; }
}
`;

// theme + font-size init before paint (avoid flash)
const HEAD_JS = `<script>
(function(){try{
  var t=localStorage.getItem('theme');
  if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  document.documentElement.dataset.theme=t;
  var f=parseFloat(localStorage.getItem('fs'))||1; document.documentElement.style.setProperty('--fs',f);
}catch(e){}})();
function toggleTheme(){var d=document.documentElement;var t=d.dataset.theme==='dark'?'light':'dark';d.dataset.theme=t;try{localStorage.setItem('theme',t);}catch(e){}var b=document.getElementById('themeBtn');if(b)b.innerHTML=(t==='dark'?IC.sun:IC.moon);}
function bumpFont(step){var d=document.documentElement;var f=parseFloat(getComputedStyle(d).getPropertyValue('--fs'))||1;f=Math.min(1.4,Math.max(.85,Math.round((f+step)*100)/100));d.style.setProperty('--fs',f);try{localStorage.setItem('fs',f);}catch(e){}}
</script>`;
const THEME_INIT = `<script>var _b=document.getElementById('themeBtn');if(_b)_b.innerHTML=document.documentElement.dataset.theme==='dark'?IC.sun:IC.moon;</script>`;

// PWA: installable / add-to-home-screen
const PWA_HEAD = `<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#0e8f6f">
<link rel="apple-touch-icon" href="assets/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="ChatGPT Guide">`;
const SW_REG = `<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}</script>`;

// controls block reused on every page (theme + font size)
const controls = () =>
  `<div class="fsgroup"><button class="iconbtn" onclick="bumpFont(-0.1)" aria-label="Smaller text" title="Smaller text">A−</button>` +
  `<button class="iconbtn" onclick="bumpFont(0.1)" aria-label="Bigger text" title="Bigger text">A+</button></div>` +
  `<button id="themeBtn" class="iconbtn" onclick="toggleTheme()" aria-label="Toggle dark mode" title="Toggle dark mode">${ICON.moon}</button>`;

// ---- markdown transforms ----
function preprocess(md) {
  md = md.replace(/\[SCREENSHOT:\s*([^\]]+)\]/g, (_, d) => {
    const safe = d.trim().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    return `<div class="shot">${safe}</div>`;
  });
  md = md.replace(/^(\s*\d+\.\s+\*\*.+?\*\*)\s*[—–-]\s*[^—–\-\n]*\d+\s*$/gm, '$1'); // strip "— page N"
  return md;
}

function bodyToHtml(md) {
  md = md.replace(/<div class="page-break">\s*<\/div>/g, '').replace(/^[ \t]*---[ \t]*\r?$/gm, '');
  let h = marked.parse(md, { mangle: false, headerIds: true });
  return h.replaceAll('<img ', '<img loading="lazy" '); // hidden chapters don't fetch until opened
}

// drop the manual Table-of-Contents block (a run of numbered **bold** lines) — replaced by chapter cards.
// language-agnostic: detects the numbered-bold list, not the localized heading text.
function stripTOC(md) {
  return md
    .split(/<div class="page-break">\s*<\/div>/)
    .filter((seg) => (seg.match(/^\s*\d+\.\s+\*\*/gm) || []).length < 5)
    .join('\n');
}
// split a guide into [cover, ...chapters]; each = {title, name, html}
function splitChapters(md) {
  md = preprocess(md);
  const parts = md.split(/^# (.+)$/m); // [pre, t0, b0, t1, b1, ...]
  const chaps = [];
  for (let i = 1; i < parts.length; i += 2) chaps.push({ title: parts[i].trim(), body: parts[i + 1] || '' });
  return chaps;
}
// strip "<word> <num> — " prefix (Section 1 —, खंड 1 —, …) to get a clean chapter name
function chapterName(title) {
  const stripped = title.replace(/^[^\d\n]*\d+\s*[—–-]\s*/, '').trim();
  return stripped || title;
}

function langSwitcher(currentCode) {
  const opts = LANGS.map(
    (l) => `<option value="${l.code}.html"${l.code === currentCode ? ' selected' : ''}>${l.native} — ${l.en}</option>`
  ).join('');
  return `<select onchange="if(this.value)location.href=this.value+location.hash" aria-label="Choose language">${opts}</select>`;
}

// per-language page: cover + chapter list (home) and one hidden section per chapter, driven by inline JS.
function pageHtml(lang, chaps) {
  const cover = chaps[0];
  // pull the intro ("A Note Before You Begin") out of the cover so it becomes chapter 1
  // (gets its own reading bar + read-aloud); the cover keeps only title + tagline.
  const coverRaw = stripTOC(cover.body);
  const hIdx = coverRaw.search(/^##\s/m);
  const taglineMd = hIdx >= 0 ? coverRaw.slice(0, hIdx) : coverRaw;
  const introTitle = hIdx >= 0 ? (coverRaw.slice(hIdx).match(/^##\s+(.+)/) || [])[1] : '';
  const introMd = hIdx >= 0 ? coverRaw.slice(hIdx).replace(/^##\s+.+\r?\n?/, '') : '';
  const chapters = (introTitle ? [{ title: introTitle, body: introMd }] : []).concat(chaps.slice(1));
  const coverHtml = bodyToHtml(taglineMd);

  const chapterList = chapters
    .map(
      (c, i) =>
        `<button class="chapcard" onclick="openCh(${i})"><span class="num">${i + 1}</span>` +
        `<span class="name">${escapeHtml(chapterName(c.title))}</span><span class="go">${ICON.arrowR}</span></button>`
    )
    .join('\n');

  const chapterSections = chapters
    .map((c, i) => {
      const name = escapeHtml(chapterName(c.title));
      return `<section class="chapter" id="c${i}" data-name="${name}" hidden>
  <div class="ch-title"><span class="num">${i + 1}</span><h1>${name}</h1></div>
  <div class="chapter-body">${bodyToHtml(c.body)}</div>
  <nav class="chnav" id="nav${i}"></nav>
</section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="${lang.code === 'english' ? 'en' : lang.code}" dir="${lang.dir || 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A Basic ChatGPT Guide — ${lang.native}</title>
${meta({ title: `A Basic ChatGPT Guide — ${lang.native} (${lang.en})`, url: `${BASE}${lang.code}.html`, locale: lang.locale })}
${PWA_HEAD}
${ICON_SCRIPT}
${HEAD_JS}
<link rel="stylesheet" href="style.css">
${ANALYTICS}
</head>
<body data-bcp="${lang.bcp}">
<div class="topbar">
  <a class="home" href="index.html" title="All languages">${ICON.home}</a>
  <span class="spacer"></span>
  ${langSwitcher(lang.code)}
  <a class="pdf-dl" href="pdfs/${lang.code}.pdf" download>${ICON.download} PDF</a>
  ${controls()}
</div>

<div class="readbar" id="readbar" hidden>
  <button class="iconbtn" onclick="goHome()" aria-label="Contents" title="Contents">${ICON.list}</button>
  <button class="iconbtn speak" id="speakBtn" onclick="toggleSpeak()" hidden>${ICON.speak}</button>
  <button class="iconbtn arrow" onclick="prevCh()" aria-label="Previous chapter">${ICON.chevL}</button>
  <div class="progress"><i id="progFill"></i></div>
  <span class="count" id="chCount"></span>
  <button class="iconbtn arrow" onclick="nextCh()" aria-label="Next chapter">${ICON.chevR}</button>
</div>

<main class="wrap">
  <section id="home">
    <div class="cover">
      <h1>${escapeHtml(cover.title)}</h1>
      ${coverHtml}
    </div>
    <div class="chapter-list">
${chapterList}
    </div>
  </section>
${chapterSections}
</main>

${footer()}
${THEME_INIT}
${SW_REG}
${GUIDE_JS}
</body>
</html>`;
}

function indexHtml() {
  const cards = LANGS.map(
    (l) =>
      `  <a class="card" data-code="${l.code}" data-bcp="${l.bcp}" href="${l.code}.html"><div class="lang">${l.native}</div><div class="en">${l.en}</div></a>`
  ).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A Basic ChatGPT Guide — in Your Language</title>
${meta({ title: 'A Basic ChatGPT Guide — Free, in 10 languages', url: BASE })}
${PWA_HEAD}
${ICON_SCRIPT}
${HEAD_JS}
<link rel="stylesheet" href="style.css">
${ANALYTICS}
</head>
<body>
<div class="topbar"><span class="spacer"></span>${controls()}</div>
<section class="hero">
  <h1>A Basic ChatGPT Guide</h1>
  <p>A simple, friendly guide to using ChatGPT on your phone. For first-time users. It can even read aloud to you.</p>
  <span class="badge">100% Free · No experience needed</span>
</section>
<div class="pick">Choose your language</div>
<nav class="grid" id="langGrid">
${cards}
</nav>
${footer()}
${THEME_INIT}
<script>
// suggest the visitor's likely language: pin its card to the front with a tag
(function(){try{
  var pref=(navigator.languages||[navigator.language||'']).map(function(x){return (x||'').toLowerCase().split('-')[0];});
  var grid=document.getElementById('langGrid');
  var cards=[].slice.call(grid.children);
  var map={en:'english',hi:'hindi',bn:'bengali',ta:'tamil',te:'telugu',kn:'kannada',mr:'marathi',pa:'punjabi',or:'odia',gu:'gujarati'};
  var want=null; for(var i=0;i<pref.length && !want;i++){ if(map[pref[i]]) want=map[pref[i]]; }
  if(!want) return;
  var card=cards.filter(function(c){return c.dataset.code===want;})[0];
  if(!card) return;
  card.classList.add('suggested');
  var tag=document.createElement('span'); tag.className='tag'; tag.textContent='Suggested for you'; card.appendChild(tag);
  grid.insertBefore(card, grid.firstChild);
}catch(e){}})();
</script>
${SW_REG}
</body>
</html>`;
}

function escapeHtml(s) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

// ---- client controller for guide pages (chapters + read-aloud). No ${} template vars inside. ----
const GUIDE_JS = `<script>
(function(){
  var sections=[].slice.call(document.querySelectorAll('.chapter'));
  var N=sections.length;
  var home=document.getElementById('home');
  var readbar=document.getElementById('readbar');
  var speakBtn=document.getElementById('speakBtn');
  var progFill=document.getElementById('progFill');
  var chCount=document.getElementById('chCount');
  var bcp=document.body.getAttribute('data-bcp')||'en-IN';
  var cur=-1;
  var ttsSupported=('speechSynthesis' in window);

  function name(i){ return sections[i]?sections[i].getAttribute('data-name'):''; }
  function buildNav(i){
    var nav=document.getElementById('nav'+i); if(!nav) return;
    var prev = i>0 ? '<a href="#ch'+(i-1)+'" class="prev"><span class="dir">'+IC.arrowL+' Back</span><span class="lbl">'+name(i-1)+'</span></a>'
                   : '<a href="#" onclick="goHome();return false;" class="prev"><span class="dir">'+IC.arrowL+'</span><span class="lbl">'+IC.list+' Contents</span></a>';
    var next = i<N-1 ? '<a href="#ch'+(i+1)+'" class="next"><span class="dir">Next '+IC.arrowR+'</span><span class="lbl">'+name(i+1)+'</span></a>'
                     : '<a href="#" onclick="goHome();return false;" class="next"><span class="dir">'+IC.check+' Done</span><span class="lbl">'+IC.list+' Contents</span></a>';
    nav.innerHTML=prev+next;
  }
  function stopSpeak(){ if(ttsSupported) window.speechSynthesis.cancel(); speaking=false; if(speakBtn){speakBtn.classList.remove('on'); speakBtn.innerHTML=IC.speak;} }

  function show(i){
    stopSpeak();
    cur=i;
    home.hidden = (i>=0);
    for(var k=0;k<N;k++) sections[k].hidden = (k!==i);
    if(i>=0){
      buildNav(i);
      readbar.hidden=false;
      progFill.style.width=((i+1)/N*100)+'%';
      chCount.textContent=(i+1)+' / '+N;
      updateSpeak();
    } else {
      readbar.hidden=true;
    }
    window.scrollTo(0,0);
  }
  window.openCh=function(i){ location.hash='ch'+i; };
  window.goHome=function(){ if(location.hash){ location.hash=''; } else { show(-1); } };
  window.nextCh=function(){ if(cur<N-1) openCh(cur+1); else goHome(); };
  window.prevCh=function(){ if(cur>0) openCh(cur-1); else goHome(); };

  function fromHash(){
    var m=(location.hash||'').match(/^#ch(\\d+)$/);
    if(m){ var i=Math.min(N-1,Math.max(0,parseInt(m[1],10))); show(i); }
    else { show(-1); }
  }
  window.addEventListener('hashchange', fromHash);

  // ---- read aloud ----
  var speaking=false, queue=[], qi=0;
  function pickVoice(){
    var vs=window.speechSynthesis.getVoices()||[]; var p=bcp.split('-')[0];
    return vs.filter(function(v){return v.lang && v.lang.replace('_','-')===bcp;})[0]
        || vs.filter(function(v){return v.lang && v.lang.replace('_','-').toLowerCase().indexOf(p)===0;})[0]
        || null;
  }
  // only offer read-aloud when the device actually has a voice for THIS language —
  // otherwise it stays silent or reads with a wrong-language voice (gibberish).
  function updateSpeak(){ if(speakBtn) speakBtn.hidden = !(ttsSupported && cur>=0 && pickVoice()); }
  function speakNext(){
    if(!speaking || qi>=queue.length){ stopSpeak(); return; }
    var u=new SpeechSynthesisUtterance(queue[qi++]);
    u.lang=bcp; var v=pickVoice(); if(v) u.voice=v; u.rate=0.95;
    u.onend=speakNext; u.onerror=function(){ stopSpeak(); };
    window.speechSynthesis.speak(u);
  }
  window.toggleSpeak=function(){
    if(!ttsSupported) return;
    if(speaking){ stopSpeak(); return; }
    if(cur<0) return;
    var body=sections[cur].querySelector('.chapter-body');
    var text=(name(cur)+'. '+(body?body.innerText:'')).replace(/\\s+/g,' ').trim();
    // split into sentence-ish chunks WITHOUT lookbehind (old Safari throws on lookbehind regex literals)
    queue=(text.match(/[^.!?।]+[.!?।]*/g)||[text]).map(function(s){return s.trim();}).filter(Boolean);
    if(!queue.length) return;
    qi=0; speaking=true; speakBtn.classList.add('on'); speakBtn.innerHTML=IC.stop;
    speakNext();
  };
  window.addEventListener('beforeunload', stopSpeak);
  // voices often load async; re-check whether to show the button once they arrive
  if(ttsSupported){ try{ window.speechSynthesis.onvoiceschanged=function(){ updateSpeak(); }; }catch(e){} }

  fromHash();
})();
</script>`;

// ---- build ----
let built = 0;
for (const lang of LANGS) {
  const src = path.join(ROOT, lang.file);
  if (!fs.existsSync(src)) { console.log(`skip ${lang.code} (missing ${lang.file})`); continue; }
  const chaps = splitChapters(fs.readFileSync(src, 'utf8'));
  fs.writeFileSync(path.join(OUT, `${lang.code}.html`), pageHtml(lang, chaps));
  built++;
  console.log(`built docs/${lang.code}.html  (${chaps.length - 1} chapters)`);
}
fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml());
fs.writeFileSync(path.join(OUT, 'style.css'), CSS.trim() + '\n');
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// PWA manifest + service worker (installable, offline after first visit)
const MANIFEST = {
  name: 'A Basic ChatGPT Guide',
  short_name: 'ChatGPT Guide',
  description: DESC,
  start_url: 'index.html',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#fbf9f5',
  theme_color: '#0e8f6f',
  icons: [
    { src: 'assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify(MANIFEST, null, 2));

const SW = `// cache-first with background refresh; offline after first visit. Bump CACHE to invalidate.
const CACHE='cg-v1';
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){if(k!==CACHE)return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
  e.respondWith(caches.open(CACHE).then(function(c){return c.match(r).then(function(hit){
    var net=fetch(r).then(function(res){if(res&&res.status===200)c.put(r,res.clone());return res;}).catch(function(){return hit;});
    return hit||net;
  });}));
});
`;
fs.writeFileSync(path.join(OUT, 'sw.js'), SW);

// copy assets into docs/ (GitHub Pages serves only docs/)
const assetsSrc = path.join(ROOT, 'assets');
const assetsDst = path.join(OUT, 'assets');
if (fs.existsSync(assetsSrc)) {
  fs.rmSync(assetsDst, { recursive: true, force: true });
  fs.cpSync(assetsSrc, assetsDst, { recursive: true });
  for (const p of fs.readdirSync(path.join(assetsDst, 'screenshots'), { withFileTypes: true })) {
    if (p.name === '.DS_Store' || p.name === 'README.txt') fs.rmSync(path.join(assetsDst, 'screenshots', p.name));
  }
  const n = fs.readdirSync(path.join(assetsDst, 'screenshots')).length;
  console.log(`copied assets → docs/assets (${n} files in screenshots/)`);
}

// copy generated PDFs into docs/
const pdfSrc = path.join(ROOT, 'pdfs');
const pdfDst = path.join(OUT, 'pdfs');
if (fs.existsSync(pdfSrc)) {
  fs.rmSync(pdfDst, { recursive: true, force: true });
  fs.cpSync(pdfSrc, pdfDst, { recursive: true });
  const n = fs.readdirSync(pdfDst).filter((f) => f.endsWith('.pdf')).length;
  console.log(`copied pdfs → docs/pdfs (${n} files)`);
} else {
  console.log('no pdfs/ folder — run pdf-tools/build-pdfs.mjs first');
}
console.log(`built docs/index.html + style.css  (${built} language pages)`);
