import fs from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// Checks that the page number printed in the TOC matches the real page each
// section lands on. usage: node verify.mjs <file.pdf>
const pdfPath = process.argv[2];
if (!pdfPath) { console.error('usage: node verify.mjs <file.pdf>'); process.exit(1); }

const norm = (s) => s.toLowerCase().replace(/[—–-]/g, '-').replace(/\s+/g, ' ').trim();

const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)) }).promise;
const pages = [];
for (let i = 1; i <= doc.numPages; i++) {
  const p = await doc.getPage(i);
  const t = await p.getTextContent();
  pages.push(norm(t.items.map((x) => x.str).join(' ')));
}
const tocPage = pages.findIndex((t) => t.includes('table of contents')) + 1;
if (!tocPage) { console.error('No "Table of Contents" page found.'); process.exit(1); }
const tocText = pages[tocPage - 1];

// pull titles + printed numbers from the TOC page text.
// TOC lines are an ordered list, so each starts with "N." — anchor on that to
// avoid swallowing the previous entry / the "table of contents" heading.
const entries = [...tocText.matchAll(/(?:^|\s)\d+\.\s*([a-z0-9 ()?,'’&.:-]+?)\s*-\s*page\s*(\d+)/g)]
  .map((m) => ({ title: m[1].trim(), printed: +m[2] }));

let ok = true;
console.log(`TOC on page ${tocPage}, ${doc.numPages} pages total\n`);
for (const { title, printed } of entries) {
  const q = norm(title);
  let real = 0;
  for (let i = 0; i < pages.length; i++) {
    if (i + 1 === tocPage) continue;
    if (pages[i].includes(q)) { real = i + 1; break; }
  }
  const match = real === printed;
  if (!match) ok = false;
  console.log(`  real=${real}  printed=${printed}  ${match ? 'OK ' : 'MISMATCH'}  ${title}`);
}
console.log(ok ? '\nALL MATCH ✅' : '\nMISMATCH ❌  (re-run convert.mjs)');
process.exit(ok ? 0 : 1);
