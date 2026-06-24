import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

// ---- Languages (source .md -> output page) ----
// `dir: 'rtl'` would be set for Urdu when added later.
const LANGS = [
  { code: 'english', native: 'English',   en: 'English',  file: 'chatgpt-guide-english-master.md' },
  { code: 'hindi',   native: 'हिंदी',      en: 'Hindi',    file: 'chatgpt-guide-hindi.md' },
  { code: 'bengali', native: 'বাংলা',      en: 'Bengali',  file: 'chatgpt-guide-bengali.md' },
  { code: 'tamil',   native: 'தமிழ்',      en: 'Tamil',    file: 'chatgpt-guide-tamil.md' },
  { code: 'telugu',  native: 'తెలుగు',     en: 'Telugu',   file: 'chatgpt-guide-telugu.md' },
  { code: 'kannada', native: 'ಕನ್ನಡ',      en: 'Kannada',  file: 'chatgpt-guide-kannada.md' },
  { code: 'marathi', native: 'मराठी',      en: 'Marathi',  file: 'chatgpt-guide-marathi.md' },
  { code: 'punjabi', native: 'ਪੰਜਾਬੀ',     en: 'Punjabi',  file: 'chatgpt-guide-punjabi.md' },
  { code: 'odia',    native: 'ଓଡ଼ିଆ',       en: 'Odia',     file: 'chatgpt-guide-odia.md' },
];

const CREDIT = 'Made with ❤️ by Garv Sachdeva';

const ROOT = path.resolve('.');
const OUT = path.join(ROOT, 'docs');
fs.mkdirSync(OUT, { recursive: true });

// ---- shared stylesheet ----
const CSS = `
:root {
  --accent:#10a37f; --accent-soft:#eafaf4; --accent-border:#bde9d8;
  --ink:#1f2430; --muted:#667085; --line:#e6e8ec;
  --bg:#ffffff; --surface:#ffffff; --surface2:#f7f8fa; --quote:#f6fbf9;
}
:root[data-theme="dark"] {
  --accent:#2dd4a7; --accent-soft:#11261f; --accent-border:#1f6b55;
  --ink:#e7eaf0; --muted:#9aa3b2; --line:#272d38;
  --bg:#0f1115; --surface:#161a22; --surface2:#1a1f29; --quote:#13201b;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin:0; color:var(--ink); background:var(--bg);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', 'Noto Sans Devanagari','Noto Sans Tamil','Noto Sans Telugu','Noto Sans Kannada','Noto Sans Oriya','Noto Sans Gurmukhi', sans-serif;
  line-height:1.7; font-size:17px;
  transition: background .2s ease, color .2s ease; }

/* theme toggle button */
.theme { cursor:pointer; border:1px solid var(--line); background:var(--surface); color:var(--ink);
  border-radius:9px; padding:7px 10px; font-size:16px; line-height:1; }
.theme.floating { position:fixed; top:14px; right:14px; z-index:20; box-shadow:0 2px 8px rgba(0,0,0,.08); }

/* top bar (guide pages) */
.topbar { position:sticky; top:0; z-index:10; background:color-mix(in srgb, var(--bg) 92%, transparent);
  backdrop-filter:blur(6px); border-bottom:1px solid var(--line); display:flex; align-items:center; gap:10px; padding:9px 14px; }
.topbar a.home { text-decoration:none; color:var(--accent); font-weight:700; font-size:15px; white-space:nowrap; }
.topbar .spacer { flex:1; }
.topbar select { font-size:15px; padding:7px 9px; border:1px solid var(--line); border-radius:8px;
  background:var(--surface); color:var(--ink); max-width:48vw; }

/* content */
.wrap { max-width:820px; margin:0 auto; padding:24px 20px 40px; }
.wrap img { display:block; width:100%; max-width:300px; height:auto; margin:18px auto;
  border-radius:12px; border:1px solid var(--line); box-shadow:0 2px 10px rgba(16,24,40,.08); }
h1 { font-size:1.9em; line-height:1.25; margin:1.4em 0 .5em; color:var(--ink); }
h1:first-child { margin-top:.2em; }
h2 { font-size:1.4em; margin:1.3em 0 .4em; color:var(--ink); }
h3 { font-size:1.15em; margin:1.1em 0 .3em; color:var(--ink); }
p, li { font-size:1rem; }
a { color:var(--accent); }
blockquote { border-left:4px solid var(--accent); background:var(--quote); margin:1em 0; padding:.6em 1em; border-radius:0 8px 8px 0; }
table { border-collapse:collapse; width:100%; margin:1em 0; display:block; overflow-x:auto; }
th,td { border:1px solid var(--line); padding:8px 10px; text-align:left; }
th { background:var(--surface2); }
hr { border:0; border-top:1px solid var(--line); margin:1.5em 0; }
code { background:var(--surface2); padding:2px 5px; border-radius:5px; font-size:.92em; }

/* screenshot placeholder box (shown until a real image is added) */
.shot { border:2px dashed var(--line); background:var(--surface2); color:var(--muted); padding:14px 16px; margin:14px 0;
  border-radius:10px; font-style:italic; font-size:.92em; }
.shot::before { content:"📷 "; font-style:normal; }

/* page-break markers become quiet section dividers on the web */
.page-break { border-top:1px dashed var(--line); margin:2em 0; height:0; }

/* ---- landing page ---- */
.hero { max-width:820px; margin:0 auto; padding:48px 20px 8px; text-align:center; }
.hero h1 { font-size:2.1em; margin:.2em 0; }
.hero p { color:var(--muted); font-size:1.05em; max-width:600px; margin:.4em auto; }
.badge { display:inline-block; background:var(--accent-soft); color:var(--accent); border:1px solid var(--accent-border);
  padding:4px 12px; border-radius:999px; font-size:.85em; font-weight:600; margin-top:10px; }
.grid { max-width:820px; margin:24px auto 50px; padding:0 20px; display:grid;
  grid-template-columns:repeat(auto-fill, minmax(150px,1fr)); gap:14px; }
.card { display:block; text-decoration:none; border:1px solid var(--line); border-radius:14px; background:var(--surface);
  padding:20px 16px; text-align:center; transition:transform .08s ease, box-shadow .12s ease, border-color .12s; }
.card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(16,24,40,.10); border-color:var(--accent); }
.card .lang { font-size:1.5em; font-weight:700; color:var(--ink); }
.card .en { color:var(--muted); font-size:.9em; margin-top:4px; }

/* footers */
.foot { text-align:center; color:var(--muted); font-size:.85em; padding:22px 20px; border-top:1px solid var(--line); }
.foot .credit { color:var(--ink); font-weight:600; }
.page-foot { max-width:820px; margin:0 auto; text-align:center; color:var(--muted); font-size:.85em;
  padding:20px; border-top:1px solid var(--line); }
.page-foot .credit { color:var(--ink); font-weight:600; }

/* ---- phone screens ---- */
@media (max-width:480px) {
  body { font-size:16px; }
  .hero { padding:26px 18px 4px; }
  .hero h1 { font-size:1.55em; }
  .hero p { font-size:.95em; }
  .badge { font-size:.8em; }
  .grid { grid-template-columns:1fr 1fr; gap:11px; margin:18px auto 36px; }
  .card { padding:16px 10px; border-radius:12px; }
  .card .lang { font-size:1.25em; }
  .card .en { font-size:.82em; }
  .wrap { padding:18px 16px 30px; }
  h1 { font-size:1.45em; }
  h2 { font-size:1.2em; }
  h3 { font-size:1.06em; }
}
`;

// theme init runs before paint to avoid a flash of the wrong theme
const THEME_HEAD = `<script>
(function(){try{var t=localStorage.getItem('theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();
function toggleTheme(){var d=document.documentElement;var t=d.dataset.theme==='dark'?'light':'dark';d.dataset.theme=t;try{localStorage.setItem('theme',t);}catch(e){}var b=document.getElementById('themeBtn');if(b)b.textContent=t==='dark'?'☀️':'🌙';}
</script>`;
const THEME_INIT = `<script>document.getElementById('themeBtn').textContent=document.documentElement.dataset.theme==='dark'?'☀️':'🌙';</script>`;
const themeBtn = (floating = false) =>
  `<button id="themeBtn" class="theme${floating ? ' floating' : ''}" onclick="toggleTheme()" aria-label="Toggle dark mode" title="Toggle dark mode">🌙</button>`;

// ---- transform markdown before rendering ----
function preprocess(md) {
  // [SCREENSHOT: desc] -> styled placeholder (skip if an image is already inline)
  md = md.replace(/\[SCREENSHOT:\s*([^\]]+)\]/g, (_, d) => {
    const safe = d.trim().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    return `<div class="shot">${safe}</div>`;
  });
  // drop the "— page N" tail from TOC list lines (page numbers are meaningless on a scrolling web page)
  md = md.replace(/^(\s*\d+\.\s+\*\*.+?\*\*)\s*[—–-]\s*[^—–\-\n]*\d+\s*$/gm, '$1');
  return md;
}

function langSwitcher(currentCode) {
  const opts = LANGS.map(
    (l) => `<option value="${l.code}.html"${l.code === currentCode ? ' selected' : ''}>${l.native} — ${l.en}</option>`
  ).join('');
  return `<select onchange="if(this.value)location.href=this.value" aria-label="Choose language">${opts}</select>`;
}

function pageHtml(lang, bodyHtml) {
  return `<!doctype html>
<html lang="${lang.code === 'english' ? 'en' : lang.code}" dir="${lang.dir || 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A Basic ChatGPT Guide — ${lang.native}</title>
${THEME_HEAD}
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="topbar">
  <a class="home" href="index.html">🏠 Home</a>
  <span class="spacer"></span>
  ${langSwitcher(lang.code)}
  ${themeBtn(false)}
</div>
<main class="wrap">
${bodyHtml}
</main>
<footer class="page-foot"><span class="credit">${CREDIT}</span></footer>
${THEME_INIT}
</body>
</html>`;
}

function indexHtml() {
  const cards = LANGS.map(
    (l) => `  <a class="card" href="${l.code}.html"><div class="lang">${l.native}</div><div class="en">${l.en}</div></a>`
  ).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A Basic ChatGPT Guide — in Your Language</title>
${THEME_HEAD}
<link rel="stylesheet" href="style.css">
</head>
<body>
${themeBtn(true)}
<section class="hero">
  <h1>A Basic ChatGPT Guide</h1>
  <p>A beginner-friendly guide to using ChatGPT on your phone — with simple tips to help in everyday life. Choose your language to begin.</p>
  <span class="badge">100% Free • No experience needed</span>
</section>
<nav class="grid">
${cards}
</nav>
<div class="foot">
  <p><span class="credit">${CREDIT}</span></p>
  <p>ChatGPT is a product of OpenAI. • Free to read &amp; share.</p>
</div>
${THEME_INIT}
</body>
</html>`;
}

// ---- build ----
let built = 0;
for (const lang of LANGS) {
  const src = path.join(ROOT, lang.file);
  if (!fs.existsSync(src)) { console.log(`skip ${lang.code} (missing ${lang.file})`); continue; }
  const md = preprocess(fs.readFileSync(src, 'utf8'));
  const body = marked.parse(md, { mangle: false, headerIds: true });
  fs.writeFileSync(path.join(OUT, `${lang.code}.html`), pageHtml(lang, body));
  built++;
  console.log(`built docs/${lang.code}.html`);
}
fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml());
fs.writeFileSync(path.join(OUT, 'style.css'), CSS.trim() + '\n');
fs.writeFileSync(path.join(OUT, '.nojekyll'), ''); // tell GitHub Pages to serve files as-is

// copy assets into docs/ so GitHub Pages (which serves only docs/) can reach the images.
// md image paths are "assets/screenshots/..." → resolve relative to each docs/*.html page.
const assetsSrc = path.join(ROOT, 'assets');
const assetsDst = path.join(OUT, 'assets');
if (fs.existsSync(assetsSrc)) {
  fs.rmSync(assetsDst, { recursive: true, force: true });
  fs.cpSync(assetsSrc, assetsDst, { recursive: true });
  // drop stray macOS metadata files
  for (const p of fs.readdirSync(path.join(assetsDst, 'screenshots'), { withFileTypes: true })) {
    if (p.name === '.DS_Store' || p.name === 'README.txt') fs.rmSync(path.join(assetsDst, 'screenshots', p.name));
  }
  const n = fs.readdirSync(path.join(assetsDst, 'screenshots')).length;
  console.log(`copied assets → docs/assets (${n} files in screenshots/)`);
}
console.log(`built docs/index.html + style.css  (${built} language pages)`);
