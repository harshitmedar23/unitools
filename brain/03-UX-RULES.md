# 03 UX rules

## Core flow (every tool)
1. Land on the page: the tool is already visible. No intro screens.
2. Add the file(s): drag-drop, click, or paste (images). The panel updates in place.
3. Adjust only if needed. Defaults must give a good result without touching anything.
4. One primary button ("Merge PDF"). Disabled until valid, with a line that says why.
5. Progress, then the result appears in the same panel with a Download button.
6. "Start over" resets everything. Never navigate away.

## Every tool has these states, all designed
- **Empty**: drop zone, accepted types and size hint.
- **Ready**: files listed, options visible, primary button enabled.
- **Working**: progress text, buttons disabled, page still responsive, cancel if over a few seconds.
- **Done**: result with real numbers, Download, Start over.
- **Error**: plain sentence saying what went wrong and what to do next. Keep the user's files so they can retry.

## Mobile first
- Test at 360px width first. Then widen.
- Tap targets at least 44px. Space between them at least 8px.
- Drop zone becomes a big "Choose files" button on touch devices.
- Sticky primary action is allowed on long forms only. No horizontal scroll ever.
- Inputs use correct types (`inputmode="numeric"` for numbers and the 5-digit code) so the right keyboard shows.

## Performance budget
- Tool page: under 150 KB (HTML + CSS + page JS + fonts), not counting the lazy-loaded library.
- Load the heavy library (pdf-lib, pdf.js, fflate) only when the user adds a file, or on first interaction.
- No layout shift. Reserve space for the result panel.
- Lighthouse on mobile: Performance 95+, Accessibility 100, SEO 100.

## Accessibility
- All actions work with the keyboard. Visible `:focus-visible` ring (2px accent outline, 2px offset).
- Drop zone is a real `<label>` or button wrapping a file input, so keyboard and screen readers work.
- Status changes (progress, errors, done) are announced with `aria-live="polite"`.
- Reordering by drag also has up/down buttons.
- Do not rely on color alone: errors say "Error:" in text.
- Respect dark mode and reduced motion.

## Forgiving behavior
- Accept the wrong thing gracefully: if a user drops a PNG into Merge PDF, say "Merge PDF needs PDF files. For images use JPG to PDF" with a link.
- Keep settings the user chose (`localStorage`) for the same tool next visit, but never files.
- Never show NaN, undefined, Infinity. Empty input shows nothing or a hint.
- Large numbers and sizes are human readable: "1.4 MB", "2,50,000".

## SEO per page
- Title: `<Task> online, free: UniTools`. Example: "Compress image to 50 KB online, free: UniTools".
- One h1 matching the search phrase, a one-line meta description, 2 to 4 FAQ items, internal links to related tools, a sitemap.xml and robots.txt.
- Add `SoftwareApplication` / `FAQPage` JSON-LD only if it is accurate. No fake ratings.
