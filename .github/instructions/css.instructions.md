---
applyTo: "**/*.css"
---
- Use the design tokens (CSS custom properties) from `02-DESIGN-SYSTEM.md`. No hard-coded colors, sizes or radii outside the `:root` token block.
- Forbidden: gradients, box-shadows (except the focus ring), `backdrop-filter`, blur, glow, animated backgrounds.
- Mobile first. Min tap target 44px. Content must work at 360px wide with no sideways scroll.
- Dark mode: default to `prefers-color-scheme`, allow override with `[data-theme="dark"]` and `[data-theme="light"]` on `<html>`.
- Always provide `:focus-visible` styles. Respect `prefers-reduced-motion`.
- Transitions: only color, background-color and border-color, 120ms.
- Keep selectors flat and class-based. No `!important`, no ID selectors.
