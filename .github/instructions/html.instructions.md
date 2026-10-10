---
applyTo: "**/*.html"
---
- Semantic structure: one `<header>`, one `<main>`, one `<footer>`, one `<h1>` per page.
- Every page needs: `<title>` in the form "Merge PDF online, free: UniTools", a one-line meta description, viewport meta, favicon link, `/assets/style.css`, and `<script type="module">`.
- Build tool pages from `brain/templates/tool-page.html`. Reuse its class names. If you need a new component, add it to `style.css` and describe it in `02-DESIGN-SYSTEM.md`.
- Every input has a `<label>`. Actions are `<button>`, navigation is `<a>`.
- No inline `style`, no `onclick` attributes, no emoji. Icons come from the sprite: `<svg class="icon"><use href="/assets/icons.svg#name"></use></svg>`.
- Page text follows `brain/08-COPY-AND-LABELS.md`.
