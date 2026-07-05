# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 7 (inferred)
- Loop number inferred from: Claude Code's previous handoff treated review of commit `7523545` as Loop 6 and recommended advancing the next fresh Codex development sub-task to Loop 7. Recent Codex passes have continued Loop 7 with focused CSV import UX and maintainability improvements. Historical handoffs did not originally contain explicit loop numbers, so this remains inferred.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-05 20:34:55 +09:00

## 1. Current Goal
今回の目的:
- Continue improving the existing Japan Company DB Collector toward:
  - all functions and screen transitions behaving as intended with no bugs or runtime errors
  - the list-generation workflow feeling fast, clear, and strong enough for daily business use
- This pass removed drift risk between the CSV import UI and API upload-size limit. The 1MB limit is now shared metadata, and oversized CSV uploads are covered by both route-level and browser-flow tests.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed baseline before this change set: `b59dec2` (`Prevent CSV alias help overflow`)
- Last known good committed baseline before this change set: `b59dec2`, verified by local `npm run quality` and GitHub Actions `quality-gate #61`

## 3. What Was Done
今回完了したこと:
- Reviewed required project files, current handoff, repo status, package scripts, CSV import API route, CSV import component, existing CSV tests, and the list-generation E2E flow.
- Added shared CSV import upload limit metadata:
  - `csvImportMaxBytes = 1_000_000`
  - `csvImportMaxSizeLabel = "1MB"`
- Updated `/api/lists/import-preview` to use the shared upload limit instead of a private hard-coded constant.
- Updated the CSV import panel to render the shared size label instead of hard-coded `1MB`.
- Added a route-level test that files larger than the shared upload limit are rejected with a message containing the shared label.
- Added an E2E browser-flow check that selecting a too-large CSV file shows the 1MB recovery message without crashing.
- Re-ran targeted type/unit/E2E checks, full `npm run quality`, and `npm run etl:self-evaluate`.

## 4. Files Changed
主な変更ファイル:
- `src/lib/list-quality.ts`
- `src/app/api/lists/import-preview/route.ts`
- `src/components/app/csv-import-preview.tsx`
- `tests/etl.test.ts`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

## 5. Current Status
現在の状態:
- Local full quality gate passed after the CSV import upload-limit sharing change.
- Unit/integration tests are now 74 tests and all pass.
- E2E remains 8 tests and all pass; the main list-generation flow now also checks too-large CSV upload recovery.
- CSV import API route coverage improved because the oversized upload branch is now tested.
- No database schema, Supabase permissions, or external API behavior were changed.
- No secrets were read, printed, or committed. No production DB/API/deploy action was performed.
- Current self-assessment after this pass:
  - Function / screen transition / no-bug score: 98.5 / 100
  - Daily-use list-generation UX value score: 99.0 / 100
  - Not 100 because Cursor Bugbot and real staging Supabase smoke remain unverified in this environment.

## 6. Known Issues
既知の問題:
- Cursor Bugbot has not been run on this latest diff. The user shared that the Bugbot usage cap is now 70 USD.
- Real staging Supabase smoke verification has not been run locally because staging credentials are absent.
- `npm run verify` does not exist; `npm run quality` is the canonical local quality gate.
- `npm run etl:self-evaluate` still reports `releaseReady: false` in mock mode because Supabase is unset and mock jobs include one failed and one running job.
- Coverage is useful but not exhaustive; current coverage summary is statements 71.75%, branches 62.72%, functions 87%, lines 75.74%.

## 7. Bugbot Findings
Cursor Bugbotの指摘と対応状況:
- 未実行.
- No actionable Bugbot finding text exists in the repo.
- Recommended next tool step: run Cursor Bugbot on the pushed branch/PR diff using the now-shared 70 USD usage cap. If findings appear, prioritize security/auth/data-integrity/runtime/build/test issues first.

## 8. Verification Results
実行した確認コマンドと結果:

```bash
git status --short --branch
# success: clean before this cycle; current change set is limited to CSV upload limit sharing/tests plus this handoff

npm run typecheck
# success

npm run test
# success: 74 tests passed; quality guard passed

npx playwright test e2e/collector.spec.ts -g "list generation supports conditions"
# success: 1 passed; oversized CSV upload recovery checked in browser flow

npm run quality
# success: typecheck, lint, test, coverage, E2E (8 passed), and build all passed

npm run etl:self-evaluate
# success: mock data score 83; releaseReady false because Supabase/staging smoke is not configured and mock jobs include failed/running states
```

## 9. Next Recommended Action
次にClaude Codeが最初にやるべきこと:
1. Review whether the CSV upload limit constants belong in `list-quality.ts`, or whether a small CSV import config module would be clearer if more upload settings are added.
2. Run Cursor Bugbot on the pushed branch/PR diff. The user has shared that Bugbot usage cap is now 70 USD.
3. If Bugbot is clean, continue the next quality/UX loop. Recommended candidate remains staging Supabase smoke coverage or saved-list success/error behavior under real isolated Supabase credentials.
4. If staging credentials are unavailable, continue with mock/fixture-backed workflow improvements and record the credential blocker honestly.

## 10. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:
- Whether importing `csvImportMaxBytes` into Playwright E2E is acceptable, or whether E2E should avoid app internals for this constant.
- Whether the oversized CSV test placement in the main list-generation flow is appropriate.
- Whether the API error message remains sufficiently user-actionable.
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
- Previous verified source commit `7523545` added CSV import preview detection for missing required header columns.
- Previous verified source commit `a260bec` added Japanese CSV header support for `法人番号`, `企業名`, `公式URL`, and `業種`.
- Previous verified source commit `6b6584c` broadened CSV header alias matching.
- Previous verified source commit `9225c97` added a local sample CSV download.
- Previous verified source commit `a31de31` added accepted-column-name guidance to the CSV import panel.
- Previous verified source commit `2a6dd77` made that guidance use the parser alias source directly.
- Previous verified source commit `50211c6` stabilized CSV alias display labels.
- Previous verified source commit `b59dec2` prevented CSV alias help overflow.
- This pass only shares CSV upload limit metadata and adds oversized-file checks; it does not add database writes or external service calls.
- GitHub Actions should be checked after this handoff commit is pushed.
