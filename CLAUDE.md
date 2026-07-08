# Claude Code Project Instructions

Repository: https://github.com/kotakase2022-jpg/collector

This repository is developed in an alternating loop between Codex, CodeRabbit OSS PR review, and Claude Code. Cursor Bugbot is optional/reserve only because of usage cost.

## Claude Code Role

- Claude Code primarily handles review, quality improvement, bug fixes, test additions, and specification-gap checks.
- Start by reading `AI_HANDOFF.md`, the current diff, and any CodeRabbit findings.
- Read Cursor Bugbot findings only when Bugbot was explicitly run as a fallback or supplemental review.
- If CodeRabbit has not run, record the likely setup blocker and first next action in `AI_HANDOFF.md`; do not treat Cursor Bugbot as required unless a maintainer explicitly requested that fallback.
- Preserve Codex's implementation intent unless there is a clear correctness, security, maintainability, or testability issue.
- Avoid large rewrites, unrelated refactors, UI redesigns, or data model changes unless explicitly required.
- If behavior is unclear, prefer the existing implementation, `README.md`, tests, and observed UI behavior over assumptions.

## Required Reading Before Work

Read these files before making changes:

- `AGENTS.md`
- `CLAUDE.md`
- `AI_HANDOFF.md`
- `README.md`
- `package.json`

When touching Next.js code, read the relevant guide under `node_modules/next/dist/docs/` first.

## Quality and Safety Rules

- Do not remove, skip, weaken, or comment out tests just to pass checks.
- Do not silence type errors with broad `any` or hide runtime errors.
- Do not print or commit `.env`, API keys, passwords, tokens, or secrets.
- Do not touch production databases, production APIs, or production user data during tests.
- Keep changes focused on the current task and document any residual risk.

## Expected Verification

Prefer running the full gate:

```bash
npm run quality
```

At minimum, run the commands available in `package.json` for lint, typecheck, tests, and build. Record failures honestly in `AI_HANDOFF.md`.

## Handoff Back to Codex

After work, update `AGENTS.md`, `CLAUDE.md`, and `AI_HANDOFF.md` when relevant. In `AI_HANDOFF.md`, clearly leave:

- current loop number and how it was inferred when the previous handoff did not include one
- completed work
- files changed
- verification results
- CodeRabbit findings and responses, plus optional Cursor Bugbot findings if Bugbot was used
- unfinished items
- first recommended action for Codex

The goal is that the next Codex session can resume without rediscovering context.
