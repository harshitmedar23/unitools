# 07 Quality checklist

A tool is "done" only when every line passes.

## Works
- [ ] Works on a phone (Chrome Android, Safari iOS) and a laptop
- [ ] Tested with a small file (1 MB) and a large file (for PDFs, about 50 MB)
- [ ] Empty input, wrong file type, and corrupted file each show a clear message
- [ ] Output opens correctly in another app (PDF viewer, gallery, Word)
- [ ] Output file name is meaningful
- [ ] Numbers shown to the user are real (sizes, savings, counts)
- [ ] Page stays responsive while working; progress is shown

## Private
- [ ] Browser tool: no network request carries file contents (check the browser Network tab)
- [ ] No third-party requests at all (no CDN, no fonts, no analytics besides Cloudflare)
- [ ] Correct label shown (see 08)

## Looks right
- [ ] Nothing from the "Never do this" list in 02
- [ ] Only design tokens used, no stray colors or sizes
- [ ] Dark and light mode both readable
- [ ] Works at 360px width, no sideways scroll
- [ ] All states exist: empty, ready, working, done, error

## Accessible
- [ ] Whole tool works with keyboard only
- [ ] Visible focus ring everywhere
- [ ] Inputs have labels; status text is `aria-live`
- [ ] Contrast passes AA

## Findable
- [ ] Title, meta description, one h1, FAQ items, related tools
- [ ] Entry in tools.json, listed in sitemap.xml
- [ ] Feedback link in footer

## Sharing tools only
- [ ] Expiry works (file really disappears)
- [ ] Wrong-code lockout works
- [ ] Delete button works
- [ ] Cleanup cron verified
- [ ] Upload size and per-IP limits enforced on the server
- [ ] Honest label shown

## Launch (before sharing widely)
- [ ] All Phase 1 tools pass the above
- [ ] Privacy and acceptable-use page published
- [ ] Lighthouse mobile: Performance 95+, Accessibility 100, SEO 100
