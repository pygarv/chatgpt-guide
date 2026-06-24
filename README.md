# ChatGPT Made Easy — A Simple Guide in Your Language

A friendly, beginner's guide to using **ChatGPT** on a phone — written for first-time and low-digital-literacy users in India. Available in multiple Indian languages, free to read and share.

🌐 **Live site:** _(GitHub Pages link goes here once deployed)_

## Languages

English, Hindi, Tamil, Telugu, Kannada, Marathi, Punjabi, Odia.
_(Bengali, Gujarati, Urdu planned.)_

## What's in this repo

```
chatgpt-guide-<lang>.md   # the guide, one markdown file per language (source of truth)
build-site.mjs            # builds the static website from the .md files
docs/                     # the generated website (served by GitHub Pages)
assets/screenshots/       # screenshot images used by the guides
pdf-tools/                # converts a guide .md into a print-ready PDF
```

## Build the website

```bash
npm install        # one time (installs marked)
npm run build      # regenerates docs/ from the .md files
```

Then open `docs/index.html` in a browser to preview. Rebuild whenever a `.md` changes.

## Deploy free on GitHub Pages

1. Push this repo to GitHub.
2. Repo **Settings → Pages → Build and deployment**.
3. Source: **Deploy from a branch**. Branch: **main**, folder: **/docs**. Save.
4. After a minute the site is live at `https://<username>.github.io/<repo>/`.

## Build a PDF of a guide

See [pdf-tools/README.md](pdf-tools/README.md). It renders a guide with automatic page breaks and a correct table-of-contents (numbers measured from the real PDF).

```bash
cd pdf-tools && npm install
node convert.mjs ../chatgpt-guide-hindi.md ../chatgpt-guide-hindi.pdf
```

## Adding screenshots

The guides contain `[SCREENSHOT: description]` placeholders — 37 of them, in the **same order in every language**. Drop matching images into `assets/screenshots/` and they can be wired into all language files at once.

## License & credit

Educational use. ChatGPT is a product of OpenAI. App interfaces change over time; steps are accurate at the time of writing.
