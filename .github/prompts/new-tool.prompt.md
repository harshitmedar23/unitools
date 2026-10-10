---
description: Build one UniTools tool end to end
---
Build the tool "${input:toolName:e.g. Merge PDF}".

1. Read `brain/00-PROJECT.md`, `brain/02-DESIGN-SYSTEM.md`, `brain/03-UX-RULES.md`, `brain/08-COPY-AND-LABELS.md` and the section for this tool in `brain/01-TOOLS.md`.
2. Tell me your plan in 3 to 5 lines.
3. Create `public/tools/<slug>.html` from `brain/templates/tool-page.html`, `public/assets/js/tools/<slug>.js`, and add the entry to `public/assets/tools.json`.
4. Build the smallest working version first. Handle: empty input, wrong file type, very large file, phone screen.
5. Do not add options that are not in the tool spec.
6. When finished: list how I should test it, then tick it in `brain/09-PROGRESS.md`.
