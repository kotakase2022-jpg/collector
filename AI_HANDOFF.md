# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 18 (inferred, continued Codex phase)
- Loop number inferred from: The previous handoff was already Loop 18 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code handoff occurred before this continuation, so this remains Loop 18 instead of advancing.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-07 20:57 +09:00

## 1. Current Goal
今回の目的:
- Continue the standing autonomous improvement goal for both top metrics:
  - Function / screen-transition / no-bug confidence.
  - Daily-use list-generation tool experience value.
- Improve daily operations from the dashboard by linking crawl-health signals directly to filtered job views.
- Address still-valid CodeRabbit OSS findings with priority on data integrity and diagnosability.
- Improve CSV import correction UX so row-level validation points users to the correct uploaded-file line even when spreadsheets contain blank rows.
- Keep CodeRabbit OSS as the standard PR reviewer and keep Cursor Bugbot optional/reserve only.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest implementation commit before this handoff update: `4060a5c` (`Refresh handoff after CodeRabbit pass`)
- Latest local change pending commit at this handoff update: CSV import preview row-number preservation for blank-line CSVs, plus this handoff refresh.
- Last known good pushed head before this handoff update: `4060a5cd613a7504a357e663a0a34d8c16b828f6`, verified by GitHub Actions `quality-gate` and CodeRabbit.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on checked pushed head `4060a5cd613a7504a357e663a0a34d8c16b828f6`.

## 3. What Was Done
今回完了したこと:
- Read the required files:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Reviewed current git status/log, PR #1 state, CodeRabbit status, CodeRabbit comments/reviews, and the latest handoff.
- Read relevant Next.js 16.2.10 App Router docs before touching App Router files:
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- Added dashboard crawl-health action links:
  - `失敗ジョブを確認` -> `/jobs?status=failed`
  - `実行中ジョブを確認` -> `/jobs?status=running`
  - `全ジョブ` -> `/jobs`
- Added a short operational message below the dashboard crawl-health actions.
- Added E2E coverage confirming the dashboard exposes failed/running job links and that the failed-job link preserves the job status filter.
- Rechecked CodeRabbit OSS review bodies. Several older comments were already stale or covered by current code/tests, but these still-valid items were fixed:
  - Major data-integrity finding: `runNextCrawlJob` now claims a selected job with a conditional `status = pending` update before execution. If another runner claims it first, execution is skipped and `null` is returned.
  - Retry/stop/run-next route handlers now log caught operation failures while preserving the same redirect behavior.
  - `markJobForRetry` and `markJobStopped` now share one guarded-update helper to avoid drift.
  - Saved-list detail and comparison export filenames are sanitized at the call site before passing to `CsvExportButton`.
- Added regression coverage for the lost-claim race and route error logging.
- Fixed CSV import preview row numbering:
  - `parseCompanyCsvImportPreview` now reads csv-parse `info.lines` and carries original source line numbers through row issue generation.
  - Blank lines are still excluded from imported records, but validation errors now point to the actual line in the uploaded CSV.
  - Added regression coverage for blank-line CSVs.
- Re-ran the full local quality gate and ETL self-evaluation.
- Did not update `AGENTS.md` or `CLAUDE.md`; no project-rule changes were needed.

## 4. Files Changed
主な変更ファイル:
- `src/app/page.tsx`
  - Added dashboard links from crawl health to filtered job management views.
  - Added an operational status message aligned with mock self-evaluation risks.
- `e2e/collector.spec.ts`
  - Added dashboard-to-job-filter regression coverage.
- `src/lib/etl/job-runner.ts`
  - Added atomic pending-job claim behavior before job execution.
- `src/app/api/jobs/retry/route.ts`
  - Logs retry failures before redirecting to the existing operation-failed state.
- `src/app/api/jobs/stop/route.ts`
  - Logs stop failures before redirecting to the existing operation-failed state.
- `src/app/api/jobs/run-next/route.ts`
  - Logs run-next failures before redirecting to the existing operation-failed state.
- `src/lib/job-actions.ts`
  - Consolidated duplicated guarded-update logic.
- `src/app/lists/[id]/page.tsx`
  - Sanitizes saved-list and comparison CSV download filenames at the page call site.
- `tests/etl.test.ts`
  - Added/updated regression tests for atomic job claim, route logging, CSV source line-number preservation, and updated mocks.
- `src/lib/list-quality.ts`
  - Preserves original CSV source line numbers for import-preview row issues.
- `AI_HANDOFF.md`
  - Updated this Loop 18 continuation handoff for Claude Code.

## 5. Current Status
現在の状態:
- Local checks pass after the dashboard, CodeRabbit follow-up, and CSV row-number fixes.
- PR #1 latest checked pushed head `4060a5c` had GitHub Actions `quality-gate` success and CodeRabbit `SUCCESS`.
- App remains in mock/fallback mode locally because Supabase credentials are not configured.
- `npm run etl:self-evaluate` still reports mock-mode score `83` and `releaseReady: false`; the dashboard actions make the reported failed/running job risks easier to act on, but do not change mock data quality.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
既知の問題:
- After the final CSV/handoff commit/push, recheck PR #1 because GitHub Actions and CodeRabbit attach to the latest pushed head.
- CodeRabbit may still post a new review for the final CSV/handoff commit; Claude Code should inspect any new findings first.
- Live/staging Supabase smoke was not run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run verify` does not exist; `npm run quality` is the canonical full gate.
- `npm run etl:self-evaluate` still reports mock-mode score `83` and `releaseReady: false`.
- Coverage is useful but not exhaustive around live Supabase integration paths.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況:
- Review status: latest checked pushed head `4060a5c` had `quality-gate` `SUCCESS` and CodeRabbit `SUCCESS` / `Review completed`.
- Critical findings: none known.
- Resolved findings:
  - Major: `src/lib/etl/job-runner.ts` non-atomic pending job claim. Fixed with conditional update plus lost-claim test.
  - Inline/nit: swallowed retry/stop/run-next errors. Fixed with injectable/default `console.error` logging and tests.
  - Nit: duplicated guarded-update flow in `src/lib/job-actions.ts`. Fixed with shared helper.
  - Nit/functional: saved-list CSV filenames at call sites. Fixed with `sanitizeDownloadFileName`.
  - Medium UX/data-correction: CSV row issue numbers shifted when blank lines were skipped. Fixed by carrying `csv-parse` source line numbers into `rowIssues`.
- Deferred findings:
  - Older broad/nit CodeRabbit suggestions not directly touched in this focused pass, including notice helper extraction, range label dedupe, comparison export naming semantics, and some ETL/staging schema follow-ups. Reassess against current code before acting because several older comments are stale.
  - Current latest-head CodeRabbit review may need one more recheck after the final CSV/handoff push.
- False positives / not applicable:
  - EDINET ZIP fixture test suggestion appears stale; fixture-based ZIP tests already exist in `tests/etl.test.ts`.
  - Some file-name sanitization concerns are already covered in `CsvExportButton` and `src/lib/file-name.ts`; this pass also sanitized the saved-list page call sites for clarity.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認:
- Status: Not run.
- Findings: none for this pass.
- Actions taken: none.
- Rationale: CodeRabbit is the standard reviewer and was available. This pass did touch data-integrity behavior for job claiming, but the fix is narrow, regression-tested, and CodeRabbit is already reviewing the PR; Bugbot remains optional unless CodeRabbit becomes inconclusive or a maintainer requests it.

## 9. Verification Results
実行した確認コマンドと結果:
```bash
git status --short --branch
# success: clean at start on codex/permanent-quality-gate-governance, tracking origin

git log --oneline -6
# success: latest checked local heads during this pass included 70e4f65, 9cdebbc, 867c05c, and 4060a5c

gh pr checks 1 --repo kotakase2022-jpg/collector
# before dashboard commit: CodeRabbit pass / Review completed; quality-gate pass on 70e4f65
# after dashboard commit push: quality-gate pass on 9cdebbc
# after CodeRabbit follow-up push: quality-gate pass and CodeRabbit pass on 867c05c
# after final handoff-status push: quality-gate pass and CodeRabbit pass on 4060a5c

gh pr view 1 --repo kotakase2022-jpg/collector --json number,url,state,isDraft,headRefOid,statusCheckRollup,body
# success: PR #1 open, isDraft=false; latest checked pushed head 4060a5c; quality-gate SUCCESS; CodeRabbit SUCCESS

gh api repos/kotakase2022-jpg/collector/issues/1/comments --paginate
# success: CodeRabbit comments were inspected with PowerShell JSON filtering after jq quoting failed

gh api repos/kotakase2022-jpg/collector/pulls/1/reviews --paginate
# success: CodeRabbit review bodies were inspected; still-valid findings were addressed as listed above

npm run typecheck
# success

npm run test:e2e -- --grep "dashboard navigation"
# success: 1 passed

npm run lint
# success

npm run test -- tests/etl.test.ts -t "job runner|job retry and stop routes|run-next route|list export and import preview API handlers"
# success: 13 passed, 87 skipped

npm run test -- tests/etl.test.ts -t "CSVアップロードプレビュー"
# success: 5 passed, 96 skipped

npm run quality
# success: typecheck, lint, test (101 passed), coverage (101 passed), E2E (8 passed), build

npm run etl:self-evaluate
# success: mock data score 83; releaseReady false due Supabase/staging evidence and mock running/failed jobs

git diff --check
# success: no whitespace errors

gh pr edit 1 --repo kotakase2022-jpg/collector --body-file -
# success: PR body updated for head 867c05c, latest validation, and CodeRabbit pass status
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと:
1. Recheck PR #1 after the latest push:
   - `gh pr checks 1 --repo kotakase2022-jpg/collector`
   - CodeRabbit comments/reviews if any are posted.
2. Review the focused CodeRabbit follow-up diff:
   - `src/lib/etl/job-runner.ts`
   - `src/app/api/jobs/retry/route.ts`
   - `src/app/api/jobs/stop/route.ts`
   - `src/app/api/jobs/run-next/route.ts`
   - `src/lib/job-actions.ts`
   - `src/app/lists/[id]/page.tsx`
   - `tests/etl.test.ts`
3. Review the dashboard daily-operations diff:
   - `src/app/page.tsx`
   - `e2e/collector.spec.ts`
4. Review the CSV import row-number fix:
   - `src/lib/list-quality.ts`
   - `tests/etl.test.ts`
5. If CodeRabbit posts new findings, classify Critical/High/Medium/Low and fix correctness/security/data-integrity findings first.
6. If continuing implementation, keep the next unit small. Good candidates remain staging smoke evidence workflow once safe staging credentials exist, live Supabase proof, or another saved-list/CSV/list state-preservation edge case.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:
- Confirm `runNextCrawlJob` lost-claim behavior is correct: selected pending job is only executed after the guarded `status = pending` update returns a row.
- Confirm retry/stop/run-next route logging does not alter redirects and does not expose secrets.
- Confirm saved-list filename sanitization is not redundant in a harmful way and preserves useful Japanese filenames.
- Confirm dashboard crawl-health links point to the correct job filters and are not visually crowded.
- Confirm CSV import preview row numbers match the source uploaded CSV when blank rows are present.
- Recheck CodeRabbit and GitHub Actions status after the latest push.

## 12. Risk Notes
リスク・人間確認が必要な事項:
- Medium data-integrity improvement: job execution now avoids double-running a selected job if another runner claims it first.
- Medium CSV UX/data-correction improvement: uploaded spreadsheets with blank rows now report issue line numbers against the source file instead of the compacted parse result.
- Low UI risk: dashboard links and saved-list filename sanitization are presentation/UX-level changes.
- No DB schema changes.
- No authentication, authorization, payment, or destructive data-flow changes in this pass.
- Operational risk remains: no staging Supabase smoke evidence is available locally.
- The self-evaluation score remains `83` in mock mode; this pass improves reliability and actionability rather than data completeness.

## 13. Do Not Touch
触らない方がよい領域:
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not delete or weaken tests to make checks pass.
- Do not force-push.
- Do not rewrite the UI or data model broadly without an explicit product request.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`) unless intentionally regenerating local artifacts and keeping them uncommitted.

## 14. Notes for Claude Code
Claude Codeへの補足:
- The full quality gate is `npm run quality`; it passed in this continuation.
- `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot remains optional/reserve only and was not run.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- The standing two-score goal remains active. Current honest self-score after this pass:
  - Function / screen-transition / no-bug: 99 / 100
  - Daily-use list-generation tool value: 99 / 100
- Remaining reason not 100/100: final pushed-head PR checks need rechecking, live/staging Supabase smoke evidence is missing, and live external-service paths remain unverified.
