<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Codex Project Instructions

Repository: https://github.com/kotakase2022-jpg/collector

This project is developed in an alternating loop between Codex, CodeRabbit OSS PR review, and Claude Code. Cursor Bugbot is optional/reserve only because of usage cost:

1. Codex implements focused changes.
2. Before stopping, Codex updates `AGENTS.md`, `CLAUDE.md`, and `AI_HANDOFF.md` when relevant.
3. CodeRabbit reviews the pull request diff; actionable findings are fixed.
4. Claude Code reviews, improves quality, fixes bugs, and updates the handoff files.
5. CodeRabbit reviews the updated pull request diff again when needed.
6. Work returns to Codex with the latest handoff.

Cursor Bugbot may be used as an additional manual review tool only when CodeRabbit is unavailable, inconclusive, or a maintainer explicitly asks for it. Do not require Bugbot for normal completion. If CodeRabbit does not run, record the reason and next setup action in `AI_HANDOFF.md` instead of substituting Bugbot by default.

## Required Reading Before Work

Before changing code, read:

- `AGENTS.md`
- `CLAUDE.md`
- `AI_HANDOFF.md`
- `README.md`
- `package.json`

When touching Next.js code, also read the relevant guide under `node_modules/next/dist/docs/` first.

## Codex Role

- Codex is primarily responsible for implementation, bug fixes, tests, and small UX improvements.
- Keep each work unit to one task whenever possible.
- Respect existing specifications, UI, data structures, and screen transitions.
- Do not perform unrelated refactors or broad rewrites.
- Do not invent new product behavior unless it directly supports the current task.
- Do not remove, skip, weaken, or comment out important tests to make checks pass.
- Do not hide errors with broad `any`, swallowed exceptions, or weakened assertions.

## Security

- Never print, commit, or store `.env` contents, API keys, passwords, tokens, or other secrets.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and similar secrets server-side only.
- Do not use production databases or production APIs for tests unless explicitly instructed by a maintainer.

## Quality Gate

Before completing or handing off a change, run the relevant checks. Prefer the full gate:

```bash
npm run quality
```

At minimum, run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If any command fails, either fix it or record the failure, error summary, likely cause, and next action in `AI_HANDOFF.md`.

## Handoff Requirement

Before stopping, always update `AI_HANDOFF.md` with:

- current owner and next owner
- current loop number, including the inference source when no canonical loop number exists
- current branch and latest commit
- what changed
- files changed
- verification commands and results
- CodeRabbit review status, plus optional Cursor Bugbot status if it was used
- known issues and next recommended action

Leave enough detail for Claude Code to continue without guessing.
