import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve('..');            // repo root (script lives in pdf-tools/)
const OUT = path.join(ROOT, 'pdfs');
fs.mkdirSync(OUT, { recursive: true });

const CREDIT = 'Made with ❤️ by Garv Sachdeva';

const LANGS = [
  { code: 'english', file: 'guides/english.md' },
  { code: 'hindi',   file: 'guides/hindi.md' },
  { code: 'bengali', file: 'guides/bengali.md' },
  { code: 'tamil',   file: 'guides/tamil.md' },
  { code: 'telugu',  file: 'guides/telugu.md' },
  { code: 'kannada', file: 'guides/kannada.md' },
  { code: 'marathi', file: 'guides/marathi.md' },
  { code: 'punjabi', file: 'guides/punjabi.md' },
  { code: 'odia',    file: 'guides/odia.md' },
];
const only = process.argv.slice(2);
const targets = only.length ? LANGS.filter((l) => only.includes(l.code)) : LANGS;

const CSS = `
@page { size: A4; margin: 16mm 15mm 18mm 15mm; }
body { font-family: 'Helvetica Neue', Arial,
  'Noto Sans','Noto Sans Devanagari','Noto Sans Bengali','Noto Sans Tamil','Noto Sans Telugu','Noto Sans Kannada','Noto Sans Oriya','Noto Sans Gurmukhi',
  'Kohinoor Devanagari','Kohinoor Bangla','Tamil Sangam MN','Kohinoor Telugu','Kannada Sangam MN','Gurmukhi MN','Oriya Sangam MN', sans-serif;
  line-height: 1.6; margin: 0; color: #222; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ddd; padding: 7px 9px; }
th { background: #f4f4f4; }
blockquote { border-left: 4px solid #10a37f; padding: .4em 1em; margin: 1em 0; background: #f6fbf9; border-radius: 0 6px 6px 0; }
h1 { font-size: 1.9em; color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: .35rem; margin: 1.1rem 0; }
h2 { font-size: 1.4em; color: #34495e; margin: 1.1rem 0; }
h3 { font-size: 1.15em; color: #455a64; }
img { display: block; max-width: 320px; width: 100%; height: auto; margin: 14px auto;
  border: 1px solid #e6e8ec; border-radius: 10px; }
.page-break { page-break-after: always; break-after: page; height: 0; }
h1 { page-break-before: always; break-before: page; }
h1:first-of-type { page-break-before: avoid; break-before: avoid; }
table, blockquote, pre, img { page-break-inside: avoid; break-inside: avoid; }
h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
.pdf-credit { page-break-before: always; text-align: center; color: #444; margin-top: 45%; font-size: 1.1em; }
.pdf-credit .heart { color: #e25555; }
`;

// strip the "— page N" tail from numbered TOC lines (page numbers are unreliable across scripts;
// the PDF has page-number footers anyway). Language-agnostic.
function preprocess(md) {
  return md.replace(/^(\s*\d+\.\s+\*\*.+?\*\*)\s*[—–-]\s*[^—–\-\n]*\d+\s*$/gm, '$1');
}

// inline <img src="relative/path"> as base64 data URIs — Chrome blocks file:// subresources
// from setContent's about:blank origin, so referencing image files never loads them.
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
function inlineImages(html) {
  return html.replace(/(<img\b[^>]*\bsrc=")([^"]+)"/g, (m, pre, src) => {
    if (src.startsWith('data:') || /^https?:\/\//.test(src)) return m;
    const file = path.join(ROOT, src);
    if (!fs.existsSync(file)) { console.warn(`  missing image: ${src}`); return m; }
    const mime = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    return `${pre}data:${mime};base64,${fs.readFileSync(file).toString('base64')}"`;
  });
}

function mdToHtml(md) {
  const body = inlineImages(marked.parse(preprocess(md), { mangle: false, headerIds: true }));
  const credit = `<div class="pdf-credit">${CREDIT.replace('❤️', '<span class="heart">❤️</span>')}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8">
<style>${CSS}</style></head><body>${body}${credit}</body></html>`;
}

// Runs in the browser. Simulates the real paginated flow top-to-bottom so each image's
// true position on its page is known, then shrinks an image to fill the leftover space on
// its current page (instead of jumping to the next and leaving a blank gap) — but only when
// at least MIN_REMAIN of the page is still free; otherwise let it flow to the next page.
//
// getBoundingClientRect is continuous (ignores page breaks), so we walk every top-level
// block and reproduce what Chrome does: snap to a new page at forced breaks (h1, the block
// after a .page-break) AND at break-inside:avoid blocks (img/table/blockquote/pre) that
// don't fit the space left on the current page. Modelling those avoid-pushes is the key fix
// — without them every position below the first pushed image is wrong.
function fitImages({ PAGE_H, MIN_REMAIN, MARGIN }) {
  const ceilPage = (y) => Math.ceil(y / PAGE_H) * PAGE_H;
  const isImgBlock = (el) => el.tagName === 'IMG' || el.querySelector('img');
  const avoids = (el) => isImgBlock(el) || /^(BLOCKQUOTE|TABLE|PRE)$/.test(el.tagName);

  let shrunk = 0;
  for (let pass = 0; pass < 8; pass++) {
    const blocks = [...document.body.children];
    const tops = blocks.map((b) => b.getBoundingClientRect().top + window.scrollY);
    // continuous footprint of each block incl. collapsed margin = distance to next block's top
    const adv = blocks.map((b, i) =>
      i < blocks.length - 1 ? tops[i + 1] - tops[i] : b.getBoundingClientRect().height + MARGIN);

    let firstH1 = blocks.findIndex((b) => b.tagName === 'H1');
    let offset = 0;          // accumulated push (forced breaks + avoid pushes)
    let changed = false;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      let realTop = tops[i] + offset;

      // forced break before: every h1 except the first, and the block right after a .page-break
      const forced = (b.tagName === 'H1' && i !== firstH1) ||
                     (i > 0 && blocks[i - 1].classList.contains('page-break'));
      if (forced) { const nt = ceilPage(realTop); offset += nt - realTop; realTop = nt; }

      const h = adv[i];
      const remaining = PAGE_H - (realTop % PAGE_H);
      if (avoids(b) && h > remaining && h <= PAGE_H) {
        // Chrome would push this block to the next page, leaving `remaining` blank.
        const img = b.tagName === 'IMG' ? b : b.querySelector('img');
        if (img && remaining >= PAGE_H * MIN_REMAIN) {
          // enough space free -> shrink the image to fill it instead of pushing
          const target = remaining - MARGIN;
          const cur = parseFloat(img.style.maxHeight) || Infinity;
          if (target < cur - 1) { img.style.maxHeight = target + 'px'; img.style.width = 'auto'; shrunk++; changed = true; }
          // (positions below recompute next pass from updated layout)
        } else {
          const nt = ceilPage(realTop); offset += nt - realTop; realTop = nt;
        }
      }
    }
    if (!changed) break;
  }
  return shrunk;
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
for (const lang of targets) {
  const md = fs.readFileSync(path.join(ROOT, lang.file), 'utf8');
  const page = await browser.newPage();
  await page.setContent(mdToHtml(md), { waitUntil: 'load', timeout: 0 });
  const shrunk = await page.evaluate(fitImages, { PAGE_H: 994, MIN_REMAIN: 0.4, MARGIN: 32 });
  await page.pdf({
    path: path.join(OUT, `${lang.code}.pdf`),
    format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;font-size:9px;color:#999;text-align:center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' },
  });
  await page.close();
  const kb = Math.round(fs.statSync(path.join(OUT, `${lang.code}.pdf`)).size / 1024);
  console.log(`${lang.code}.pdf  (${kb} KB, ${shrunk} image(s) fitted)`);
}
await browser.close();
console.log(`\nwrote ${targets.length} PDF(s) to pdfs/`);
