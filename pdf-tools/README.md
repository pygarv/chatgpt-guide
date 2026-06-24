# pdf-tools

Markdown → PDF converter with **automatic page breaks** and **correct Table-of-Contents page numbers**.

## What it does

- `convert.mjs` — renders a `.md` to `.pdf` using your system Chrome.
  - Forces a new page at every `<div class="page-break"></div>` and at every `# H1`.
  - **2-pass TOC fix:** renders once, reads which page each section actually lands on, writes the real numbers into the TOC, then re-renders. No manual page-number guessing.
  - TOC entries are auto-detected from lines shaped like `**Title** — page 12`. Add/remove sections freely; no script edits needed.
  - `[SCREENSHOT: ...]` placeholders become styled dashed boxes.
- `verify.mjs` — opens a finished PDF and confirms every TOC number matches the real page.

## Setup (already done once)

```
cd pdf-tools && npm install
```

Needs Google Chrome installed (macOS default path). If Chrome is elsewhere:

```
CHROME_PATH="/path/to/chrome" node convert.mjs ...
```

## Use

Convert any markdown file:

```
node convert.mjs <input.md> [output.pdf]
```

Shortcuts for the English master guide (run from `pdf-tools/`):

```
npm run build    # convert ../chatgpt-guide-english-master.md -> .pdf
npm run check    # verify the TOC numbers in that PDF
```

## Output

- `<output>.pdf` — final PDF.
- `<output>.toc-fixed.md` — copy of your markdown with corrected TOC numbers (reference only; your source `.md` is never modified).

## Editing workflow

1. Edit your `.md`.
2. `node convert.mjs yourfile.md` (re-renders, re-fixes TOC).
3. `node verify.mjs yourfile.pdf` → expect `ALL MATCH ✅`.

## Notes / limits

- TOC requires a page whose text contains "Table of Contents" — that page is excluded from matching so titles don't match themselves.
- Each TOC line must contain its exact section title (matching the body heading) for the number to be found.
- Indic / Urdu fonts: the CSS lists Noto font families. Whatever your OS Chrome has installed will be used; install the matching Noto font if a script renders as boxes.
