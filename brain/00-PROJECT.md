# 00 Project: UniTools

## One line
Free, fast, private online tools. One clean page per tool. No signup, no ads, no daily limits.

## Why people should choose it over iLovePDF and similar sites
| Big sites | UniTools |
|---|---|
| Daily limits, then pay or sign up | No limits, no signup |
| Uploads your files to a server | Browser tools run on your device; files never leave it |
| Slow (upload + download) | Fast (local processing) |
| Cluttered, ads | One clean page per tool |
| Ignore students and exam forms | Photo/signature resizer, size-targeted compress, CGPA, attendance |

## Who it is for
Students and first-time job applicants who need to fix a photo, merge a PDF, or hit a file size limit quickly, usually on a phone, often on a slow connection, often in a hurry before a form deadline. Assume they are not technical and have never seen the site before.

## Principles
1. Simple: drop the file, press one button, download. No menus to learn.
2. Popular tools only: build what people search for every day.
3. Light: small pages, no frameworks, no server for 20 of 23 tools.
4. Private: browser tools never upload. Sharing tools encrypt and auto-delete.
5. No friction: no signup, no ads, no limits, no cookie banner.
6. Student friendly: exam-form tools and calculators that big sites ignore.
7. Honest: never claim more than the tool does (see labels in `08`).

## Scope
23 tools in 3 phases. List and specs in `01-TOOLS.md`.
Skipped on purpose: video/audio tools, AI tools, large file sharing, URL shortener, network tools. They cost money, need servers and attract abuse. Do not add them.

## Constraints
- Cost to build and host: Rs 0 (free tiers only).
- Server only for Quick share, Link share, Receive file (Cloudflare Workers + R2 + KV).
- Hosting: Cloudflare Pages. Source: GitHub. Domain: free `*.pages.dev` first.
- Analytics: Cloudflare Web Analytics only (no cookies).

## Success looks like
- A classmate opens the site on their phone and finishes a task in under 30 seconds without help.
- Pages load fast on a weak mobile connection.
- Nobody says "this looks like an AI-made site".
