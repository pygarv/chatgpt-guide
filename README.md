# A Basic ChatGPT Guide — in Your Language

A simple, beginner-friendly guide to using **ChatGPT** on a phone — written for first-time users and people who aren't comfortable with English or technology. It walks through everything from installing the app to using voice and camera, with real everyday examples (cooking, health, farming, budgets, government forms, small business, and more).

Free to read, download, and share.

🌐 **Read it online:** https://garviiii.github.io/chatgpt-guide/

## Available in 9 languages

English · हिंदी (Hindi) · বাংলা (Bengali) · தமிழ் (Tamil) · తెలుగు (Telugu) · ಕನ್ನಡ (Kannada) · मराठी (Marathi) · ਪੰਜਾਬੀ (Punjabi) · ଓଡ଼ିଆ (Odia)

_(Gujarati and Urdu are planned.)_

Each language can be read on the website or **downloaded as a PDF** to read offline or print and hand out.

## What's inside the guide

- What ChatGPT is, in plain words — and that it's free
- Step-by-step install on Android and iPhone
- Talking to ChatGPT by **voice**, like a phone call
- Asking questions with a **photo** (plants, medicine strips, forms, homework)
- How to ask good questions, with examples
- 20 things to try today, and real daily-life conversations
- Sections for senior citizens, women & home managers, learning new skills, saving money
- What ChatGPT can't do, safety & privacy tips, and a quick-reference card

## Who it's for

Mothers, students, farmers, shopkeepers, elders — anyone curious about AI but unsure where to begin. No experience needed.

---

## For developers

The site and PDFs are generated from the markdown guides in `guides/`.

```
guides/<lang>.md      guide sources (one per language)
assets/screenshots/   screenshot images
build-site.mjs        builds the website into docs/
docs/                 generated site (served by GitHub Pages) + docs/pdfs, docs/assets
pdfs/                 generated PDFs (one per language)
pdf-tools/            build-pdfs.mjs (md → PDF)
```

**Build the site:** `npm install` then `npm run build` (regenerates `docs/`, copies assets + PDFs).
**Build the PDFs:** `cd pdf-tools && npm install && npm run pdfs`.
**Deploy:** GitHub Pages → Settings → Pages → branch `main`, folder `/docs`.

---

## Thanks & credits

Built by **Garv Sachdeva**.

This project was created with the help of:

- **[Claude](https://www.anthropic.com/claude) (Anthropic)** — used via **[Claude Code](https://www.anthropic.com/claude-code)** to write and translate all 9 language guides, build the website and PDF tooling, and organise the repo.
- **[ChatGPT](https://chatgpt.com/) / OpenAI** — the product this guide teaches people to use.
- **[marked](https://marked.js.org/)** — Markdown → HTML rendering.
- **[Puppeteer](https://pptr.dev/)** + **Google Chrome (headless)** — rendering the PDFs.
- **[pdf.js](https://mozilla.github.io/pdf.js/)** — measuring PDF layout during development.
- **[Noto Sans](https://fonts.google.com/noto)** & system Indic fonts — for clear rendering of every script.
- **[Node.js](https://nodejs.org/)** and **[GitHub Pages](https://pages.github.com/)** — build and free hosting.

Made with ❤️ for everyone who wants to learn. Educational use only. ChatGPT is a product of OpenAI; app screens may change over time, so always follow the on-screen steps and official sources.
