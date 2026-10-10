# 02 Design system

Goal: a calm, tool-first site that feels made by a person who cares about students, not generated from a template. Think a well-made utility (like a good notebook or a hardware store label), not a startup landing page.

## The look in one paragraph
Warm paper background, near-black ink text, one burnt-orange accent used rarely. Flat surfaces separated by thin 1px lines. Sharp, small radii. Left-aligned text, a tight grid, real content instead of decoration. The tool is at the top of the page, not under a banner.

## NEVER DO THIS (this list is what makes sites look AI-made)
- No gradients anywhere (backgrounds, buttons, text).
- No purple, indigo or blue-violet palettes. No neon or glow.
- No glassmorphism, blur, frosted panels, floating blobs, mesh backgrounds.
- No box-shadows except the keyboard focus ring.
- No emoji, in UI or in copy. No sparkle icons.
- No big centered hero with a tagline and two buttons. No "Get started" CTA.
- No row of three identical cards with an icon in a colored circle on top.
- No everything-is-rounded-2xl. No pill buttons.
- No fake stats, fake testimonials, fake logos, stock illustrations.
- No marketing words: "supercharge", "unleash", "seamless", "effortless", "powerful", "revolutionary", "next-gen", "elevate", "game-changer".
- No scroll animations, parallax, bouncing, auto-playing motion.
- No lorem ipsum or placeholder text left anywhere.

## Design tokens (put these in `:root` in style.css, nowhere else)

```css
:root {
  /* color: light */
  --paper:      #F5F2EA;  /* page background */
  --surface:    #FFFEFB;  /* panels, inputs */
  --ink:        #1C1B18;  /* main text */
  --ink-soft:   #55524A;  /* secondary text */
  --line:       #D9D4C7;  /* borders */
  --accent:     #C2410C;  /* primary action, links, focus */
  --accent-ink: #FFFFFF;  /* text on accent */
  --accent-hover: #9A3412;
  --ok:         #2F6B3F;
  --warn:       #8A5A00;
  --error:      #B3261E;
  --mark:       #FBE7B5;  /* highlight, e.g. found characters */

  /* type */
  --font-body: "Hanken Grotesk", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --text-sm: 0.875rem;  /* 14 */
  --text-md: 1rem;      /* 16 */
  --text-lg: 1.125rem;  /* 18 */
  --text-xl: 1.5rem;    /* 24 */
  --text-2xl: 2rem;     /* 32, page title only */
  --leading: 1.55;

  /* space */
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px;
  --s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px;

  /* shape */
  --radius: 4px;        /* buttons, inputs */
  --radius-lg: 6px;     /* panels, cards */
  --border: 1px solid var(--line);

  /* layout */
  --page-w: 1040px;
  --tool-w: 720px;
}

[data-theme="dark"] {
  --paper:#171613; --surface:#1F1E1A; --ink:#ECE8DD; --ink-soft:#A8A396;
  --line:#34322B; --accent:#F08A4B; --accent-ink:#171613; --accent-hover:#FFA46E;
  --ok:#6FBF85; --warn:#E0A83A; --error:#F0837A; --mark:#4A3F1C;
}
/* also apply the dark values under @media (prefers-color-scheme: dark) when no data-theme is set */
```

Check contrast: body text and accent buttons must pass WCAG AA (4.5:1) in both themes.

## Typography
- Font: Hanken Grotesk for everything (weights 400, 500, 700), JetBrains Mono only for codes, file sizes in tables, JSON and code output. Self-host the `.woff2` files in `/assets/fonts/` (download once; subset to Latin) and use `font-display: swap`. The system stack is the fallback, so the page never waits for fonts.
- Page title (h1): 2rem desktop, 1.625rem mobile, weight 700, tight line height (1.15). Left aligned. Never bigger.
- Body 1rem, line-height 1.55. Max line length about 65 characters for prose.
- Hierarchy comes from size and weight, not from colors and boxes.

## Layout
- Header: text wordmark "UniTools" (weight 700) on the left, a Search link and a theme toggle on the right. Thin bottom border. No logo gradient, no nav bar of 6 links.
- Content column max 1040px. Tool panel max 720px, left aligned, not centered in a huge empty page.
- Footer: Privacy and acceptable use, Feedback, small line "Made by [name]". Nothing else.

## Home page
1. A single line of text: "Free tools for files, images, text and numbers. Nothing is uploaded unless it says so." (no hero image)
2. Search input, full width up to 640px, auto-focus on desktop, `/` key focuses it, filters as you type.
3. Tools grouped by category with a small text heading (PDF, Image, Share, Text and Code, Calculators, Student).
4. Each tool is a flat card: 1px border, name in bold, one line description, a small tag "Browser" or "Server". No icon bubble. Hover = border turns ink color. Grid: 1 column mobile, 2 tablet, 3 desktop.
5. Footer.
No testimonials, no counters, no "why choose us" section (the privacy label on each tool says it).

## Tool page (the layout every tool copies)
1. Small breadcrumb: `Home / PDF`.
2. h1: plain verb phrase ("Merge PDF files").
3. One-line description + the privacy label ("Files never leave your device") with a small line icon.
4. Tool panel (the work happens here, above the fold on a phone).
5. Below: "How it works" in 3 short numbered lines, 2 to 4 FAQ items (good for search), "Related tools" as a plain text list.

## Components
- **Drop zone**: 1.5px dashed `--line` border, `--surface` fill, radius-lg, min height 160px. Text: "Drop PDF files here" with a button "Choose files" beneath. On hover/drag-over border becomes `--accent`. On mobile the dashed box is replaced by a single large "Choose files" button.
- **Primary button**: solid `--accent`, `--accent-ink` text, radius 4px, height 44px, padding 0 20px, weight 500. One per screen.
- **Secondary button**: transparent, 1px `--ink` border, ink text.
- **Quiet button / link button**: underlined accent text.
- **Inputs, selects**: `--surface`, 1px `--line`, radius 4px, height 44px, label above (never placeholder-only labels).
- **File list row**: name (truncate in the middle, keep extension), size in mono, small remove button, drag handle. Rows separated by 1px lines, no cards.
- **Progress**: 4px bar in `--accent` on `--line` plus text "Merging 3 of 5".
- **Result block**: a bordered panel with a line like "Saved 412 KB (68% smaller)" and the primary Download button, plus a quiet "Start over".
- **Message boxes** (error / warn / ok): 1px border in the status color, left border 4px, plain text, no icons in circles.
- **Tabs** (QR types): underlined text tabs, not pills.
- **Tag**: small 12px text with 1px border, radius 3px.
- No modals, no toasts that vanish, no tooltips for essential info.

## Icons
About 12 to 15 icons only, drawn on a 20px grid with 1.5px stroke, round caps, stored in one sprite `/assets/icons.svg` and used with `<use>`. Needed: lock, upload, download, trash, grip (drag handle), arrow-up, arrow-down, search, sun, moon, copy, check, x, file. Do not use an icon library with hundreds of icons.

## Motion
Only 120ms color/border transitions and the progress bar. Wrap everything in `@media (prefers-reduced-motion: no-preference)`.

## The "does this look made by a person" test
Before accepting a page, check:
1. Squint test: is the main action obvious in one second?
2. Cover the wordmark: could this page belong to any random SaaS? If yes, redo it.
3. Is every element there because the user needs it?
4. Are numbers real ("Saved 412 KB") instead of vague ("Smaller files")?
5. Does the copy sound like a helpful classmate, not an advertisement?
