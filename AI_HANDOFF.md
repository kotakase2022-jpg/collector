# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Phase: Codex quality/UX improvement loop; current local changes are verified and ready for review/commit.
- Last updated: 2026-07-05 15:22:06 +09:00

## 1. Current Goal
現在の開発目的：

- Keep improving the existing Japan Company DB Collector until both top-level measures approach 100/100:
  - all features and screen transitions behave as intended with no bugs or errors
  - the list-generation workflow feels reliable, powerful, and useful for daily business work
- Current continuation: reduce residual UX risk in the existing list-generation tool while preserving the current UI, routes, and data model.
- Priority for this cycle:
  - make CSV import preview identify missing required columns separately from row-level missing values
  - keep changes small and reviewable
  - add regression coverage for the improved behavior

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit: branch tip before this cycle is `ef107f8` (`Clarify saved list delete confirmation`)
- Last known good commit: `ef107f8`, verified by local `npm run quality` and GitHub Actions `quality-gate`
- Current verified change set: `AI_HANDOFF.md`, `src/lib/list-quality.ts`, `src/components/app/csv-import-preview.tsx`, `tests/etl.test.ts`, `e2e/collector.spec.ts`, `tests/fixtures/csv/missing-columns-list-upload.csv`

## 3. What Was Done
今回完了したこと：

- Improved CSV import preview validation:
  - detects missing required header columns as `missingRequiredColumns`
  - displays missing required columns separately from row-level required-value gaps
  - keeps existing row count, valid row, duplicate key, and invalid URL checks intact
- Added a missing-column CSV fixture plus unit and E2E regression coverage.

## 4. Files Changed
主な変更ファイル：

- `AI_HANDOFF.md`
- `src/lib/list-quality.ts`
- `src/components/app/csv-import-preview.tsx`
- `tests/etl.test.ts`
- `e2e/collector.spec.ts`
- `tests/fixtures/csv/missing-columns-list-upload.csv`

## 5. Current Status
現在の状態：

- The current change set has passed local verification.
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
- Check `git status --short --branch` first; the verified change set above may be either uncommitted locally or the latest branch diff, depending on whether the current agent has already committed/pushed it.

## 6. Known Issues
既知の問題：

- Cursor Bugbot has not been run for the current CSV missing-required-column preview diff yet.
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
npm run test
# success: quality guard passed; 72 tests passed

npx playwright test e2e/collector.spec.ts -g "list generation supports conditions"
# success: 1 passed

npm run quality
# success: typecheck, lint, test, coverage, E2E (8 passed), and build all passed
```

## 9. Next Recommended Action

次のAIが最初にやるべきこと：

1. Read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, and `package.json`.
2. Inspect the current diff and any PR/Bugbot comments.
3. Run or review Cursor Bugbot findings for the current CSV missing-required-column preview diff.
4. If Bugbot finds issues, fix those first.
5. If no Bugbot findings exist, continue the active quality/UX improvement loop with one focused task, preferably staging Supabase smoke coverage or saved-list success/error behavior under real Supabase credentials.

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
- The current branch is intended for governance and quality-gate improvements, plus small verified reliability/UX fixes.
- Current local verification is green, but GitHub Actions should still be checked after any push.
- For intentional browser-network failures in E2E tests, use the narrow `installErrorGuards` allow-list pattern with comments explaining why the failure is expected.
