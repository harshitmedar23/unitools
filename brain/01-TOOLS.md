# 01 Tool specs

Format per tool: **Input > Output**, then rules and edge cases. Libraries are vendored locally, pinned to a version (see `04-ARCHITECTURE.md`).

Common to every browser tool: drag-drop + click to choose, file stays on device, clear progress, a download button named after the result, a "Start over" button, errors in plain words.

---
## PHASE 1 (launch, all in browser)

### 1. Merge PDF  (`pdf-lib`)
Several PDFs > one `merged.pdf`.
- List shows file name, page count, size. Reorder by drag AND with up/down buttons (phones). Remove button per file.
- Needs 2+ files to enable the merge button.
- Password-protected PDF: say "This PDF is locked. Remove the password first." Never silently ignore encryption.
- Warn if total size is over about 100 MB (phone memory).

### 2. Split PDF  (`pdf-lib`, `fflate` for ZIP)
One PDF > extracted pages.
- Modes: (a) page ranges like `1-3, 5, 8-10` > one file with those pages, or each range as separate files; (b) every page as its own file > ZIP.
- Show total page count after load. Validate ranges, say what is wrong ("Page 14 does not exist. This PDF has 12 pages.").

### 3. JPG to PDF  (`pdf-lib`)
Images > one `images.pdf`.
- Accept JPG, PNG, WebP. Reorder and remove like Merge.
- Always pass each image through a canvas (`createImageBitmap`) before embedding, so phone photos with EXIF rotation come out upright. Re-encode at JPEG quality 0.92.
- Options (collapsed by default): page size A4 or "fit to image", margin none/small, orientation auto.
- HEIC is not supported by browsers: say so and suggest the phone's "most compatible" camera setting.

### 4. PDF to JPG  (`pdf.js`)
PDF > one JPG per page.
- Quality choice: Normal (scale 2), High (scale 3), Small (scale 1).
- Render one page at a time, release the canvas after each. Cap canvas to about 16 million pixels (mobile limit).
- Output: single page = one file; many pages = ZIP plus per-page download. Show per-page progress.
- Set pdf.js worker from the vendored file.

### 5. Compress image  (`browser-image-compression` or own canvas loop)
Image > JPG under a target size.
- Targets: 50 KB, 100 KB, 200 KB, plus custom KB. Exam forms are the main use.
- Show before and after size and "Saved 412 KB (68%)". Show preview.
- If target cannot be reached without making it unreadable, say so and offer to shrink dimensions too.
- PNG with transparency becomes JPG with white background: tell the user.

### 6. Resize image  (Canvas API)
Image > exact pixel size, optionally under a max KB.
- Presets live in `assets/data/presets.json`: `{ name, width, height, maxKB, minKB, format, note }`. Every preset has `"verify": true` until the user has checked the official notification. Show the note "Check your exam notice for the exact size."
- Fit modes: crop to fill (default, drag to reposition), pad, stretch. Lock aspect ratio for custom sizes.
- Units: px, cm and inches (need DPI, default 300).
- If maxKB is set, reuse the compress logic from tool 5.
- Do not invent preset numbers. Seed the file with placeholders and ask the owner to fill real ones.

### 7. QR code generator  (`qrcode`)
URL / Text / Wi-Fi > PNG (and SVG).
- Wi-Fi payload: `WIFI:T:<WPA|WEP|nopass>;S:<ssid>;P:<password>;H:<true|false>;;` and escape `\ ; , : "` in values.
- Live preview as you type. Download PNG at 256 / 512 / 1024. Download SVG.
- Error correction L/M/Q/H (default M). Colors adjustable; warn if contrast is low.
- No watermark, no logo, no tracking, no redirect. The QR contains exactly what was typed.

### 8. Clean AI code  (plain JS)
Pasted text > cleaned text + report.
- Remove or replace: zero-width chars (U+200B, U+200C, U+200D, U+2060, U+FEFF), soft hyphen U+00AD, bidi controls (U+202A-U+202E, U+2066-U+2069), odd spaces (U+00A0, U+202F, U+2009, U+2007, etc.) > normal space, smart quotes > straight quotes.
- Remove leftover lines such as "As an AI language model...", "Sure, here is...", "I hope this helps". Show what was removed, never delete silently. Toggle per rule.
- Do not strip U+200D inside emoji sequences in plain text mode. Offer a "code mode" toggle that is stricter.
- Report: counts per character type, where found (line numbers), before/after length. Highlight view of found characters.
- Honesty: label it "invisible-character and formatting cleaner". It cannot remove statistical text watermarks and must never claim to.

---
## PHASE 2

### 9-11. Quick share, Link share, Receive file
Backend. See `05-FILE-SHARING-SPEC.md`.

### 12. Compress PDF  (`pdf-lib`, `pdf.js`)
- Two modes. **Light** (keeps selectable text): rewrite with pdf-lib, object streams, drop metadata. **Strong** (pages become images): render with pdf.js, rebuild with JPEG at a quality slider. Say clearly that Strong makes text unselectable.
- If output is not smaller, return the original and say "This file is already well compressed."
- Show before/after size. Test on real PDFs (scanned and text) before releasing.

### 13. Image converter
JPG, PNG, WebP both ways via `canvas.toBlob`. Quality slider for JPG/WebP. PNG to JPG fills white background. Multiple files > ZIP. Browser decides WebP support: check and tell the user.

### 14. Word and character counter
Live: words, characters (with and without spaces), sentences, paragraphs, reading time (200 wpm, say so), speaking time (130 wpm). Use `Intl.Segmenter` for words so non-English text works.

### 15. Password generator
- `crypto.getRandomValues` with rejection sampling (no modulo bias).
- Length 8-64 (default 16). Toggles: lower, upper, numbers, symbols, exclude look-alikes (`O0Il1`).
- Passphrase mode with a vendored word list (EFF short list, check its license text and include attribution).
- Show strength as bits of entropy, not a fake colored bar. Copy button. Nothing is stored or sent.

---
## PHASE 3 (calculators and student tools, all in browser)

Rules for all: results update live as you type, show the working ("how this was calculated"), format Indian numbers with `Intl.NumberFormat('en-IN')`, handle empty and zero input without showing NaN.

### 16. Age calculator
Date of birth + "age on" date (default today) > years, months, days; total days; days to next birthday. Handle month-end borrowing correctly (31 Jan to 28 Feb etc.) and leap years.

### 17. Percentage calculator
Four modes: X% of Y; X is what % of Y; change from X to Y (% increase/decrease); increase/decrease Y by X%. Show the formula used.

### 18. EMI calculator
Principal, annual rate, tenure (years or months). `r = rate/12/100`, `EMI = P*r*(1+r)^n / ((1+r)^n - 1)`. If rate is 0, EMI = P/n. Show EMI, total interest, total payment, principal-vs-interest bar, collapsible month-wise table.

### 19. GST calculator
Add GST (net > gross) and remove GST (gross > net). Show net, GST, gross, and CGST/SGST split. Rate buttons come from `assets/data/gst-rates.json` plus a custom rate field. Mark the rates "verify" and never hard-code them in the logic.

### 20. CGPA / SGPA calculator
- Grade point map is editable (default a common 10-point scale: O 10, A+ 9, A 8, B+ 7, B 6, C 5, P 4, F 0; universities differ, so say "edit to match your university").
- Rows: subject, credits, grade. `SGPA = sum(credits*points) / sum(credits)`. CGPA across semesters = credit-weighted. Optional percentage conversion with a user-set multiplier (off by default; universities differ).
- Save data in `localStorage` on the device only.

### 21. Attendance calculator
Attended, total, target % (default 75). Show current %. If below target: classes to attend in a row = `ceil((t*T - 100*A) / (100 - t))`. If above: classes you can miss = `floor((100*A - t*T) / t)`. Handle target 100 and total 0.

### 22. JSON formatter
Format (2/4 spaces/tab), validate with line and column of the error, minify, copy, optional sort keys. Handle up to about 5 MB without freezing. Warn about big integers losing precision in JS.

### 23. Base64 encode/decode
Text <> Base64, UTF-8 safe (`TextEncoder`/`TextDecoder`). URL-safe option. Clear error for invalid Base64. File to Base64 can come later.
