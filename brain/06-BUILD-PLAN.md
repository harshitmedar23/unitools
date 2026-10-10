# 06 Build plan (with prompts)

Assume a few hours per week. Each step ends with something you can test. Run steps in order, in Copilot **Agent** mode, one step per chat. Commit after each step.

## Step 0: Setup (day 1)
Do this yourself:
```
git init unitools && cd unitools
# copy .github/, brain/, assets/ from the zip here
git add . && git commit -m "add: project brain"
# create GitHub repo "unitools", then:
git remote add origin <your-repo-url> && git push -u origin main
```
Create a free Cloudflare account. Install VS Code extensions: GitHub Copilot, Live Server.
Done when: empty repo with the brain exists on GitHub.

## Step 1: Skeleton (days 2 to 4)
Prompt:
> Read brain/00, 02, 03, 04. Build the site skeleton: index.html, assets/style.css (tokens from 02 exactly), assets/common.js (functions listed in 04), assets/icons.svg (icons listed in 02), assets/tools.json (already exists, use it), favicon.svg, a header with wordmark + search link + theme toggle, home page with search and flat tool cards grouped by category, light/dark mode, and a footer. Follow the "Never do this" list. No hero. Then run `/design-review`.

Then: connect the repo to Cloudflare Pages (no build command, root directory).
Done when: site is live on a `pages.dev` link and looks right on your phone.

## Step 2: First 3 tools (week 2)
Prompts, one chat each:
> `/new-tool` Merge PDF
> `/new-tool` Compress image
> `/new-tool` QR code generator

Build the drop-zone and result panel into `common.js` and `style.css` during Merge PDF, then reuse for the others.
Done when: classmates can use them on their phones.

## Step 3: Feedback (week 3)
Share the link. Watch people use it without helping them. Write down every moment of confusion. Prompt:
> Here are the issues testers hit: [paste]. Fix them without adding new features, following brain/03-UX-RULES.md.

Create a free Google Form for requests and bugs and link it in the footer.

## Step 4: Finish Phase 1 (weeks 4 and 5)
> `/new-tool` Split PDF
> `/new-tool` JPG to PDF
> `/new-tool` PDF to JPG
> `/new-tool` Resize image (fill `assets/data/presets.json` with the real exam sizes first; check the official notification)
> `/new-tool` Clean AI code

Done when: all 8 Phase 1 tools are live.

## Step 5: Polish (week 6)
> Create privacy.html (privacy and acceptable use, plain language, matches the labels in brain/08), sitemap.xml, robots.txt, a `_headers` file as in brain/04, page titles and meta descriptions for every page, and check every page at 360px. Then run `/finish-step` against brain/07 for all Phase 1 tools.

Add the site to Google Search Console and Cloudflare Web Analytics.

## Step 6: Sharing backend (weeks 7 to 9)
Do it in small pieces, test each:
> Read brain/05. Create the Cloudflare Worker in /worker with upload, meta, download and delete endpoints, KV and R2 bindings, and a wrangler.toml. No frontend yet.

> Add code generation with retry, attempt lockout, per-IP rate limit, expiry check and the cleanup cron to the Worker.

> `/new-tool` Quick share, then `/new-tool` Link share, then `/new-tool` Receive file (follow brain/05 for encryption and labels).

Done when: a file is shared, received, and expires correctly; wrong-code lockout works.

## Step 7: Phase 2 tools (weeks 10 and 11)
`/new-tool` for: Compress PDF, Image converter, Word and character counter, Password generator.

## Step 8: Phase 3 tools (weeks 12 to 14)
`/new-tool` for: Age, Percentage, EMI, GST, CGPA/SGPA, Attendance, JSON formatter, Base64.
Check the maths yourself with a calculator for at least 3 examples per tool.

## Inside every tool
1. Smallest working version first: one input, one button, one download.
2. Test with a small file, a large file, a phone, a wrong or empty input.
3. Only then add options, and only if testers ask.

## Getting users (free)
- Start with classmates and college groups.
- Name pages by what people search: "Compress image to 50 KB", "Merge PDF online free", "Resize photo for exam form".
- Post in student communities and developer communities (for Clean AI code).
- Use Search Console and the free analytics. Improve the most-used tools first.

## Master tracking sheet (Google Sheets, shared with testers)
Columns: Tool name, Category, Phase, Browser or backend, Library, Cost, Tested?, Done?
