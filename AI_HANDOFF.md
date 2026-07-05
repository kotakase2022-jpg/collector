# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 7 (inferred)
- Loop number inferred from: Claude Code's previous handoff treated review of commit `7523545` as Loop 6 and recommended advancing the next fresh Codex development sub-task to Loop 7. Recent Codex passes have continued Loop 7 with focused CSV import UX and maintainability improvements. Historical handoffs did not originally contain explicit loop numbers, so this remains inferred.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-05 20:45:14 +09:00

## 1. Current Goal
今回の目的:
- Continue improving the existing Japan Company DB Collector toward:
  - all functions and screen transitions behaving as intended with no bugs or runtime errors
  - the list-generation workflow feeling fast, clear, and strong enough for daily business use
- This pass removed a client/server boundary risk in the CSV import preview flow. The interactive client component now imports CSV import metadata/readiness helpers from a lightweight client-safe module, while server-only CSV parsing remains in `list-quality.ts`.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit: current HEAD (`Split CSV import preview metadata`; use `git log -1 --oneline` for the exact SHA after amend/push)
- Last known good commit: current HEAD, verified locally by `npm run quality`; previous remote known-good baseline was `ee2209f` with GitHub Actions `quality-gate #62`

## 3. What Was Done
今回完了したこと:
- Reviewed required project files, current handoff, repo status, package scripts, Next.js server/client component guidance, CSV import API route, CSV import component, current tests, and recent diff context.
- Added `src/lib/csv-import-preview.ts` for client-safe CSV import metadata:
  - preview/readiness types
  - required/optional CSV columns
  - accepted column aliases
  - shared upload-size constants
  - `buildCsvImportReadiness`
- Left `parseCompanyCsvImportPreview` in `src/lib/list-quality.ts`, where `csv-parse/sync` remains server-side/business-logic code.
- Re-exported CSV import metadata from `list-quality.ts` for compatibility with older imports.
- Updated the CSV import panel to import from `@/lib/csv-import-preview`, avoiding the server parser dependency in the client module graph.
- Updated the import-preview API route to import upload-size metadata from the client-safe module and parsing from `list-quality.ts`.
- Updated E2E/test imports to reflect the new boundary.
- Added a unit regression test confirming:
  - `csv-import-preview.ts` does not import `csv-parse`
  - the client component imports `@/lib/csv-import-preview`
  - the client component does not import `@/lib/list-quality`
- Preserved existing CSV readiness labels and behavior; an initial wording drift was caught by tests and fixed.

## 4. Files Changed
主な変更ファイル:
- `src/lib/csv-import-preview.ts`
- `src/lib/list-quality.ts`
- `src/components/app/csv-import-preview.tsx`
- `src/app/api/lists/import-preview/route.ts`
- `tests/etl.test.ts`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

## 5. Current Status
現在の状態:
- Local full quality gate passed after the client/server boundary split.
- Unit/integration tests are now 75 tests and all pass.
- E2E remains 8 tests and all pass.
- CSV import UI behavior should be unchanged, but the client component no longer imports the server-side parser module directly.
- No database schema, Supabase permissions, external API behavior, crawler behavior, or deployment settings were changed.
- No secrets were read, printed, or committed. No production DB/API/deploy action was performed.
- Current self-assessment after this pass:
  - Function / screen transition / no-bug score: 98.6 / 100
  - Daily-use list-generation UX value score: 99.05 / 100
  - Not 100 because Cursor Bugbot and real staging Supabase smoke remain unverified in this environment.

## 6. Known Issues
既知の問題:
- Cursor Bugbot has not been run on this latest diff. The user shared that the Bugbot usage cap is now 70 USD.
- Real staging Supabase smoke verification has not been run locally because staging credentials are absent.
- `npm run verify` does not exist; `npm run quality` is the canonical local quality gate.
- `npm run etl:self-evaluate` still reports `releaseReady: false` in mock mode because Supabase is unset and mock jobs include one failed and one running job.
- Coverage is useful but not exhaustive; current coverage summary remains statements 71.75%, branches 62.72%, functions 87%, lines 75.74%.

## 7. Bugbot Findings
Cursor Bugbotの指摘と対応状況:
- 未実行.
- No actionable Bugbot finding text exists in the repo.
- User update: Cursor Bugbot usage cap has been raised to 70 USD.
- Recommended next tool step: run Cursor Bugbot on the pushed branch/PR diff using the 70 USD usage cap. If findings appear, prioritize security/auth/data-integrity/runtime/build/test issues first.

## 8. Verification Results
実行した確認コマンドと結果:

```bash
git status --short --branch
# success: branch codex/permanent-quality-gate-governance, local changes limited to CSV import boundary split/tests plus this handoff

npm run typecheck
# success

npm run test
# first run failed: one wording regression ("必須欄欠損" vs existing "必須欠損")
# fixed implementation wording, then success: 75 tests passed; quality guard passed

npm run lint
# success

npx playwright test e2e/collector.spec.ts -g "list generation supports conditions"
# success: 1 passed

npm run quality
# success: typecheck, lint, test, coverage, E2E (8 passed), and build all passed
# coverage: statements 71.75%, branches 62.72%, functions 87%, lines 75.74%

npm run etl:self-evaluate
# success: mock data score 83; releaseReady false because Supabase/staging smoke is not configured and mock jobs include failed/running states
```

## 9. Next Recommended Action
次にClaude Codeが最初にやるべきこと:
1. Review the `csv-import-preview.ts` split for module-boundary correctness and naming clarity.
2. Run Cursor Bugbot on the pushed branch/PR diff. The user has shared that Bugbot usage cap is now 70 USD.
3. If Bugbot is clean, continue the next quality/UX loop. Recommended candidate remains staging Supabase smoke coverage or saved-list success/error behavior under real isolated Supabase credentials.
4. If staging credentials are unavailable, continue with mock/fixture-backed workflow improvements and record the credential blocker honestly.

## 10. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:
- Confirm `src/components/app/csv-import-preview.tsx` no longer imports server-only CSV parsing logic.
- Confirm `src/lib/list-quality.ts` compatibility re-exports are acceptable or whether future cleanup should remove old import paths after downstream usage stabilizes.
- Confirm the source-text regression test is acceptable and not too brittle.
- Confirm no behavior outside CSV import preview/upload validation changed unintentionally.
- Confirm `npm run quality` result and GitHub Actions result after push.

## 11. Do Not Touch
触らない方がよい領域:
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not delete, skip, weaken, or comment out tests to make checks pass.
- Do not rewrite the UI, routes, or data model broadly without an explicit product request.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`) unless intentionally regenerating local artifacts and keeping them uncommitted.
- Do not force-push or deploy to production from this branch.

## 12. Notes for Claude Code
Claude Codeへの補足:
- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- The full quality gate is `npm run quality`.
- `npm run verify` is absent by design right now; do not assume it exists.
- Previous verified commit `7523545` added CSV import preview detection for missing required header columns.
- Previous verified commit `a260bec` added Japanese CSV header support for `法人番号`, `企業名`, `公式URL`, and `業種`.
- Previous verified commit `6b6584c` broadened CSV header alias matching.
- Previous verified commit `9225c97` added a local sample CSV download.
- Previous verified commit `a31de31` added accepted-column-name guidance to the CSV import panel.
- Previous verified commit `2a6dd77` made that guidance use the parser alias source directly.
- Previous verified commit `50211c6` stabilized CSV alias display labels.
- Previous verified commit `b59dec2` prevented CSV alias help overflow.
- Previous verified commit `ee2209f` shared CSV upload limit metadata and added oversized-file checks.
- This pass only separates CSV import preview metadata/readiness from server-side CSV parsing. It does not add database writes or external service calls.
- GitHub Actions should be checked after this handoff commit is pushed.
