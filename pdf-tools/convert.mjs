import fs from 'node:fs';
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// macOS system Chrome. Override with env CHROME_PATH if elsewhere.
const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const inPath = process.argv[2];
const outPath = process.argv[3] || inPath.replace(/\.md$/i, '.pdf');
if (!inPath) {
  console.error('usage: node convert.mjs <input.md> [output.pdf]');
  process.exit(1);
}

const norm = (s) =>
  s.toLowerCase().replace(/[—–-]/g, '-').replace(/\s+/g, ' ').trim();

// Auto-derive TOC titles from lines like:  **Some Title** — page 12
function extractTitles(md) {
  const titles = [];
  const re = /\*\*([^*]+?)\*\*\s*[—–-]\s*page\s*\d+/g;
  let m;
  while ((m = re.exec(md))) titles.push(m[1].trim());
  return titles;
}

const CSS = `
@page { size: A4; margin: 18mm 16mm 20mm 16mm; }
body { font-family: 'Helvetica Neue', 'Noto Sans', Arial, 'Noto Sans Devanagari','Noto Sans Bengali','Noto Sans Tamil','Noto Sans Telugu','Noto Sans Gujarati','Noto Sans Kannada','Noto Sans Oriya','Noto Sans Gurmukhi','Noto Naskh Arabic', sans-serif; line-height: 1.6; margin: 0; color: #222; }
img { max-width: 100%; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ddd; padding: 8px; }
th { background: #f4f4f4; }
blockquote { border-left: 4px solid #ddd; padding-left: 1em; margin-left: 0; color: #555; background:#fafafa; }
h1 { font-size: 2em; color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: .4rem; margin: 1.2rem 0; }
h2 { font-size: 1.5em; color: #34495e; margin: 1.2rem 0; }
h3 { font-size: 1.2em; color: #455a64; }
.screenshot { border: 2px dashed #b0bec5; background: #eceff1; color: #546e7a; padding: 14px 16px; margin: 12px 0; border-radius: 6px; font-style: italic; font-size: .95em; }
.screenshot::before { content: "📷 SCREENSHOT  "; font-style: normal; font-weight: bold; color: #37474f; }
.page-break { page-break-after: always; break-after: page; height: 0; }
h1 { page-break-before: always; break-before: page; }
h1:first-of-type { page-break-before: avoid; break-before: avoid; }
table, blockquote, pre, img { page-break-inside: avoid; break-inside: avoid; }
h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
`;

function mdToHtml(md) {
  md = md.replace(/\[SCREENSHOT:\s*([^\]]+)\]/g, (_, d) => {
    const safe = d.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div class="screenshot">${safe.trim()}</div>`;
  });
  const body = marked.parse(md, { mangle: false, headerIds: true });
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;
}

async function renderPdf(browser, html) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const buf = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="width:100%;font-size:9px;color:#888;text-align:center;">' +
      '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
  });
  await page.close();
  return buf;
}

async function pageMap(pdfBuffer, titles) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const tc = await pg.getTextContent();
    pages.push(norm(tc.items.map((it) => it.str).join(' ')));
  }
  const tocPage = pages.findIndex((t) => t.includes('table of contents')) + 1;
  const map = {};
  for (const title of titles) {
    const q = norm(title);
    let found = 0;
    for (let i = 0; i < pages.length; i++) {
      if (i + 1 === tocPage) continue; // skip the TOC page itself
      if (pages[i].includes(q)) { found = i + 1; break; }
    }
    map[title] = found;
  }
  return { map, numPages: doc.numPages, tocPage };
}

function injectTocNumbers(md, titles, map) {
  let out = md;
  for (const title of titles) {
    const n = map[title];
    if (!n) continue;
    const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(\\*\\*${esc}\\*\\*\\s*[—–-]\\s*page\\s*)\\d+`);
    out = out.replace(re, `$1${n}`);
  }
  return out;
}

(async () => {
  if (!fs.existsSync(CHROME)) {
    console.error(`Chrome not found at:\n  ${CHROME}\nSet CHROME_PATH env var to your Chrome/Chromium binary.`);
    process.exit(1);
  }
  const md = fs.readFileSync(inPath, 'utf8');
  const titles = extractTitles(md);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });

  // PASS 1 — render, measure real section pages
  const pdf1 = await renderPdf(browser, mdToHtml(md));
  const { map, numPages, tocPage } = await pageMap(pdf1, titles);
  console.log(`pass1: ${numPages} pages, TOC on page ${tocPage || '(none found)'}`);
  if (!titles.length) console.log('  (no TOC entries detected — skipping number injection)');
  for (const t of titles) console.log(`  ${map[t] || '??'}\t${t}`);

  // PASS 2 — inject true numbers, final render
  const fixedMd = titles.length ? injectTocNumbers(md, titles, map) : md;
  const pdf2 = await renderPdf(browser, mdToHtml(fixedMd));
  fs.writeFileSync(outPath, pdf2);
  if (titles.length) {
    const fixedPath = outPath.replace(/\.pdf$/i, '') + '.toc-fixed.md';
    fs.writeFileSync(fixedPath, fixedMd);
    console.log(`wrote ${fixedPath}`);
  }
  await browser.close();
  console.log(`wrote ${outPath}`);
})();
