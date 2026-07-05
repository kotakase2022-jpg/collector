# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Phase: Codex implementation and handoff preparation; ready for Claude Code review after commit/push.
- Last updated: 2026-07-05 14:37:43 +09:00

## 1. Current Goal
現在の開発目的：

- Keep improving the existing Japan Company DB Collector until both top-level measures approach 100/100:
  - all features and screen transitions behave as intended with no bugs or errors
  - the list-generation workflow feels reliable, powerful, and useful for daily business work
- Current user request: prepare the repository for an alternating Codex -> Cursor Bugbot -> Claude Code -> Cursor Bugbot -> Codex development loop.
- Priority for this handoff cycle:
  - maintain/update `AGENTS.md`
  - maintain/update `CLAUDE.md`
  - create/update this `AI_HANDOFF.md`
  - keep current changes small and reviewable

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit: `5958eda` before the current handoff changes are committed
- Last known good commit: `5958eda` (`Preserve CSV extension for long downloads`)
- Current verified local changes: `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `src/components/app/csv-import-preview.tsx`, `e2e/collector.spec.ts`

## 3. What Was Done
今回完了したこと：

- Expanded `AGENTS.md` into Codex-facing top-level project instructions for the Codex / Bugbot / Claude Code loop.
- Replaced minimal `CLAUDE.md` with Claude Code-facing project instructions.
- Created `AI_HANDOFF.md` using the requested handoff structure.
- Improved CSV import recovery UX:
  - after a CSV preview error, selecting a new file now clears the old error/result before resubmission
  - E2E now covers the no-file error -> choose file -> error clears -> preview succeeds flow
- Updated the E2E error guard in the list-generation test to explicitly allow the intentional `400` from `/api/lists/import-preview` during the no-file recovery check.

## 4. Files Changed
主な変更ファイル：

- `AGENTS.md`
- `CLAUDE.md`
- `AI_HANDOFF.md`
- `src/components/app/csv-import-preview.tsx`
- `e2e/collector.spec.ts`

## 5. Current Status
現在の状態：

- Working tree changes have passed local verification.
- `npm run quality` passes locally.
- The repository already has:
  - `README.md`
  - `package.json`
  - `tsconfig.json`
  - `eslint.config.mjs`
  - `next.config.ts`
  - `vitest.config.ts`
  - `playwright.config.ts`
  - `.github/workflows/quality-gate.yml`
  - `.github/workflows/staging-smoke.yml`
- `AI_HANDOFF.md` did not exist before this cycle and is newly added.

## 6. Known Issues
既知の問題：

- Cursor Bugbot has not been run for the current diff yet.
- Real staging Supabase smoke verification has not been run in this local environment because staging credentials are not present.
- Some PowerShell `Get-Content` output may appear mojibake in this terminal, but tests and app strings are treated as UTF-8 by the project tooling.
- Coverage is useful but not exhaustive; current `npm run quality` is green.

## 7. Bugbot Findings
Cursor Bugbotの指摘：

- 未実行
- Next recommended human/tool step: run Cursor Bugbot on the pushed branch/PR diff. If findings are posted, prioritize security/auth/data integrity/runtime/build/test issues first.

## 8. Verification Results
実行した確認コマンドと結果：

```bash
npx playwright test e2e/collector.spec.ts -g "list generation supports conditions"
# success: 1 passed

npm run lint
# success

npm run typecheck
# success

npm run test
# success: quality guard passed; 71 tests passed

npm run build
# success

npm run quality
# success: typecheck, lint, test, coverage, E2E, and build all passed
```

## 9. Next Recommended Action

次のAIが最初にやるべきこと：

1. Read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, and `package.json`.
2. Inspect the latest commit and any PR/Bugbot comments.
3. Run or review Cursor Bugbot findings for this handoff diff.
4. If Bugbot finds issues, fix those first.
5. If no Bugbot findings exist, continue the active quality/UX improvement loop with one focused task.

## 10. Do Not Touch

触らない方がよい領域：

- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not delete or weaken tests to make checks pass.
- Do not rewrite the UI or data model broadly without an explicit product request.
- Do not edit generated/cache outputs such as `.next/`, `coverage/`, `playwright-report/`, `test-results/`, or `tsconfig.tsbuildinfo` unless intentionally regenerating local artifacts and keeping them uncommitted.

## 11. Notes for Next AI

次のAIへの補足：

- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- The full quality gate is `npm run quality`.
- The current branch is intended for governance and quality-gate improvements.
- Current local verification is green, but GitHub Actions should still be checked after push.
- For intentional browser-network failures in E2E tests, use the narrow `installErrorGuards` allow-list pattern with comments explaining why the failure is expected.
