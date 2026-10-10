# UniTools brain folder

This folder is the memory of the project. Copilot reads `.github/copilot-instructions.md` automatically on every chat. That file points here for the details.

## What is in it

| File | What it holds |
|---|---|
| `00-PROJECT.md` | Vision, audience, principles, scope, what we skip |
| `01-TOOLS.md` | All 23 tools: inputs, outputs, rules, edge cases, libraries |
| `02-DESIGN-SYSTEM.md` | Colors, type, spacing, components, and the "never look AI-made" rules |
| `03-UX-RULES.md` | Flows, states, mobile rules, performance budget |
| `04-ARCHITECTURE.md` | Folders, tools.json, common.js, how a tool is added |
| `05-FILE-SHARING-SPEC.md` | Backend for Quick share, Link share, Receive file |
| `06-BUILD-PLAN.md` | Step by step plan with a copy-paste prompt for each step |
| `07-QUALITY-CHECKLIST.md` | "Done" means all of this passes |
| `08-COPY-AND-LABELS.md` | Voice, exact labels, good and bad wording |
| `09-PROGRESS.md` | Checklist Copilot updates after each task |
| `templates/tool-page.html` | The one layout every tool page copies |

## How to use it (VS Code + Copilot + Git)

1. Create the repo `unitools` on GitHub. Clone it. Copy `.github/`, `brain/` and `assets/` from this zip into the repo root. Commit: `add: project brain`.
2. In VS Code, open the folder. Open Copilot Chat and switch to **Agent** mode.
3. Open `06-BUILD-PLAN.md` and run the steps in order. Each step has a prompt you paste in.
4. For each tool, type `/new-tool` in chat, enter the tool name, and let it work.
5. Run the site locally (Live Server extension) and test it yourself on desktop and your phone.
6. Run `/design-review` on the page, then `/finish-step`.
7. `git add . && git commit -m "add: merge pdf tool"` and push. Cloudflare Pages deploys it.

## Habits that keep quality high

- One tool per chat. Start a fresh chat for the next tool so the context stays clean.
- If Copilot ignores a rule, attach the file in chat (drag it in, or type `#` and pick it) and say "follow this".
- If the result looks generic, say: "This looks like a template. Redo it using 02-DESIGN-SYSTEM.md, no card rows, no shadows."
- Never accept a big change you did not test. Commit after every working tool so you can undo.
- When a rule here is wrong for your real needs, edit the brain file. Then the AI follows the new rule everywhere.
- Things to verify yourself: exam photo sizes, GST rates, grade scales, Cloudflare free limits. The files mark them "verify".
