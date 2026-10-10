# UniTools: instructions for Copilot

You are helping build UniTools: a free website of everyday online tools (PDF, image, text, calculators, student tools). No signup, no ads, no limits. Browser tools never upload files.

## Read first
- `brain/00-PROJECT.md` for what we are building and why.
- `brain/09-PROGRESS.md` to see what is already done. Do not rebuild finished things.
- For any UI work, read `brain/02-DESIGN-SYSTEM.md` and `brain/03-UX-RULES.md` before writing a line.
- For a specific tool, read its section in `brain/01-TOOLS.md`.
- For file sharing, read `brain/05-FILE-SHARING-SPEC.md`.
- All wording on the site follows `brain/08-COPY-AND-LABELS.md`.

## Non-negotiable rules
1. Plain HTML, CSS and JavaScript (ES modules). No React, no Tailwind, no build step, no npm bundler.
2. One tool = one HTML file in `/tools/` + one JS file in `/assets/js/tools/` + one entry in `/assets/tools.json`. Nothing else should need to change.
3. Shared styles live in `/assets/style.css`. Shared helpers live in `/assets/common.js`. Do not copy-paste helpers into tool files.
4. Third-party libraries are downloaded once, pinned to a version, and saved in `/assets/vendor/`. No CDN links. No trackers. No external fonts at runtime.
5. Browser tools must never send file contents over the network. No `fetch` or `XMLHttpRequest` with user files outside the three sharing tools.
6. The design must NOT look AI-generated or like a template. Follow the "Never do this" list in `02-DESIGN-SYSTEM.md` strictly.
7. Build the smallest working version first (one input, one button, one download). Add options only when asked.
8. Never invent facts: exam photo sizes, GST slabs, grade scales, free-tier limits. Put them in editable data files and mark them "verify".
9. Heavy work (PDF rendering, compression, zipping) must not freeze the page. Use a Web Worker or yield to the UI, and show progress.
10. Accessibility is part of "done": keyboard works, visible focus, labels on inputs, contrast passes, works at 360px width.

## How to work
- Before coding, state your plan in 3 to 5 lines. Then make the change.
- Touch only the files the task needs. Do not refactor unrelated code.
- If something in the brain files is unclear or conflicts, ask one short question instead of guessing.
- After finishing, tell me exactly how to test it (what to click, what to try, what should happen) and update `brain/09-PROGRESS.md`.
- Code style: small functions, clear names, comments only where the reason is not obvious. No decorative banner comments, no commented-out code, no leftover `console.log`.
