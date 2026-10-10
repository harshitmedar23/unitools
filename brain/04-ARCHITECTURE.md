# 04 Architecture

## Stack (all free)
| Part | Choice |
|---|---|
| Site | Plain HTML, CSS, JavaScript (ES modules). No build step. |
| Hosting | Cloudflare Pages, auto-deploy from GitHub |
| PDF | pdf-lib (create, merge, split), pdf.js (render pages) |
| ZIP | fflate (small, MIT) |
| Images | Canvas API, browser-image-compression (or own canvas loop) |
| QR | qrcode (small, works offline) |
| Encryption | Web Crypto API, AES-GCM |
| Share backend | Cloudflare Workers + R2 (files) + KV (codes, expiry) |
| Analytics | Cloudflare Web Analytics (no cookies) |

Free-tier limits change. Check Cloudflare's current pricing pages before launch. R2 may ask for a payment method even for the free allowance.

## Folders
```
/index.html                 home: search + tool cards
/tools/<slug>.html          one file per tool
/assets/style.css           all shared styles + design tokens
/assets/common.js           shared helpers (see below)
/assets/tools.json          list of all tools (home page and search read it)
/assets/icons.svg           icon sprite
/assets/fonts/              self-hosted woff2
/assets/vendor/             pinned third-party libraries (never CDN)
/assets/data/               presets.json, gst-rates.json, wordlist.txt
/assets/js/tools/<slug>.js  logic for one tool
/privacy.html  /feedback link  /sitemap.xml  /robots.txt  /favicon.svg
/worker/                    Cloudflare Worker (added in Phase 2)
/brain/  /.github/          project memory and Copilot config
```

## Adding a tool = 3 things
1. `tools/<slug>.html` (copy `brain/templates/tool-page.html`)
2. `assets/js/tools/<slug>.js`
3. one entry in `assets/tools.json`
Nothing else changes. The home page cards and search read `tools.json`.

## tools.json entry
```json
{
  "id": "merge-pdf",
  "name": "Merge PDF",
  "title": "Merge PDF online, free",
  "description": "Combine several PDFs into one file.",
  "category": "PDF",
  "phase": 1,
  "runs": "browser",
  "keywords": ["combine pdf", "join pdf", "merge pdf files"],
  "url": "/tools/merge-pdf.html"
}
```
Categories: PDF, Image, Share, Text and Code, Calculators, Student.
`runs` is `browser` or `server`. It decides which privacy label shows.

## common.js should export
- `initDropzone(el, { accept, multiple, maxSizeMB, onFiles })`
- `formatBytes(n)` and `formatNumberIN(n)`
- `downloadBlob(blob, filename)` (creates, clicks, revokes the URL)
- `showError(container, message)` / `clearMessage(container)` (aria-live)
- `showProgress(container, label, fraction)`
- `loadScript(src)` (lazy load vendored libraries once)
- `initTheme()` (reads saved choice or system, toggles `data-theme`)
- `initSearch(input, list)` (filters tools from tools.json)
- `reorderList(listEl, onChange)` (drag and keyboard reorder)
- `saveSetting(key, value)` / `loadSetting(key)` (localStorage, try/catch)
Keep each function small and documented in one line.

## Libraries
- Download the exact release file once, save it in `assets/vendor/<name>-<version>.min.js`, and commit it. Note the version and license in `assets/vendor/README.md`.
- Lazy load with `loadScript` only on the pages that need them.

## Hosting setup (Cloudflare Pages)
- Connect the GitHub repo, no build command, output directory is the repo root.
- Add a `_headers` file: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and a strict Content-Security-Policy that allows only self (tool pages must not allow connections to other origins; only the three sharing tools may connect to the Worker).
