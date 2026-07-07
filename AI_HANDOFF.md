# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 18 (inferred, continued Codex phase)
- Loop number inferred from: Previous handoff was already Loop 18 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code handoff occurred before this continuation, so this remains Loop 18 instead of advancing.
- Phase: Handoff
- Last updated: 2026-07-07 21:03 +09:00

## 1. Current Goal
今回の目的:
- Continue the standing autonomous improvement goal for both top metrics:
  - Function / screen-transition / no-bug confidence.
  - Daily-use list-generation tool value.
- Follow `Next Recommended Action` from the previous handoff.
- Address still-valid CodeRabbit OSS findings and one focused CSV import correction UX issue.
- Keep CodeRabbit OSS as the standard PR reviewer and keep Cursor Bugbot optional/reserve only.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit before this handoff-only refresh: `8cc2d57` (`Preserve CSV import source row numbers`)
- Last known good pushed code head: `8cc2d57968550f8387a51597393568c357c56a74`
- Last known good commit: `8cc2d57`
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on checked pushed head `8cc2d57968550f8387a51597393568c357c56a74`

## 3. What Was Done
今回完了したこと:
- Read the required project files before changing code:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Reviewed current git status/log, PR #1 state, GitHub Actions checks, CodeRabbit status, CodeRabbit comments/reviews, and the latest handoff.
- Confirmed no project-rule changes were needed in `AGENTS.md` or `CLAUDE.md`.
- Preserved previous Loop 18 work:
  - Dashboard crawl-health links to `/jobs?status=failed`, `/jobs?status=running`, and `/jobs`.
  - CodeRabbit follow-up fixes for atomic job claiming, route error logging, shared guarded job updates, and saved-list CSV filename sanitization.
- Added a focused CSV import preview fix:
  - `parseCompanyCsvImportPreview` now reads `csv-parse` `info.lines`.
  - Blank rows are still skipped for imported records.
  - Row-level validation issues now point to the original uploaded CSV source line, even when blank rows are present.
  - Added a regression test for blank-line CSV source row preservation.
- Re-ran focused tests, the full local quality gate, ETL self-evaluation, and PR checks.
- Updated this handoff for Claude Code.

## 4. Files Changed
主な変更ファイル:
- `src/lib/list-quality.ts`
  - Preserves original CSV source line numbers for import-preview row issues.
- `tests/etl.test.ts`
  - Adds regression coverage for CSV upload preview source line numbers when blank lines are skipped.
- `AI_HANDOFF.md`
  - Refreshes Loop 18 status, verification, review state, and Claude handoff instructions.

Previously completed Loop 18 files still in this PR:
- `src/app/page.tsx`
- `e2e/collector.spec.ts`
- `src/lib/etl/job-runner.ts`
- `src/app/api/jobs/retry/route.ts`
- `src/app/api/jobs/stop/route.ts`
- `src/app/api/jobs/run-next/route.ts`
- `src/lib/job-actions.ts`
- `src/app/lists/[id]/page.tsx`

## 5. Current Status
現在の状態:
- Local checks pass after the dashboard, CodeRabbit follow-up, and CSV row-number fixes.
- PR #1 latest checked pushed code head `8cc2d57` has GitHub Actions `quality-gate` success and CodeRabbit `SUCCESS`.
- App remains in mock/fallback mode locally because Supabase credentials are not configured.
- `npm run etl:self-evaluate` still reports mock-mode score `83` and `releaseReady: false`.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
既知の問題:
- After this handoff-only commit is pushed, recheck PR #1 because GitHub Actions and CodeRabbit attach to the latest pushed head.
- CodeRabbit may post a new review for the handoff-only commit; Claude Code should inspect any new finding first.
- Live/staging Supabase smoke was not run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run verify` does not exist; `npm run quality` is the canonical full gate.
- `npm run etl:self-evaluate` still reports mock-mode score `83` and `releaseReady: false`.
- Coverage is useful but not exhaustive around live Supabase integration paths.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況:
- Review status: latest checked pushed code head `8cc2d57968550f8387a51597393568c357c56a74` had `quality-gate` `SUCCESS` and CodeRabbit `SUCCESS` / `Review completed`.
- Critical findings: none known.
- Resolved findings:
  - Major: `src/lib/etl/job-runner.ts` non-atomic pending job claim. Fixed with conditional update plus lost-claim test.
  - Inline/nit: swallowed retry/stop/run-next errors. Fixed with injectable/default `console.error` logging and tests.
  - Nit: duplicated guarded-update flow in `src/lib/job-actions.ts`. Fixed with a shared helper.
  - Nit/functional: saved-list CSV filenames at call sites. Fixed with `sanitizeDownloadFileName`.
  - Medium UX/data-correction: CSV row issue numbers shifted when blank lines were skipped. Fixed by carrying `csv-parse` source line numbers into `rowIssues`.
- Deferred findings:
  - Older broad/nit suggestions not directly touched in this focused pass, including notice helper extraction, range label dedupe, comparison export naming semantics, and some ETL/staging schema follow-ups. Reassess against current code before acting because several older comments are stale.
  - Recheck current latest-head CodeRabbit status after this handoff-only commit is pushed.
- False positives / not applicable:
  - EDINET ZIP fixture test suggestion appears stale; fixture-based ZIP tests already exist in `tests/etl.test.ts`.
  - Some file-name sanitization concerns are already covered in `CsvExportButton` and `src/lib/file-name.ts`; this pass also sanitized the saved-list page call sites for clarity.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認:
- Status: Not run.
- Findings: none.
- Actions taken: none.
- Rationale: CodeRabbit is the standard reviewer and was available. This pass did touch data-integrity behavior for job claiming, but the fix is narrow, regression-tested, and CodeRabbit reviewed the PR. Bugbot remains optional unless CodeRabbit becomes inconclusive or a maintainer requests it.

## 9. Verification Results
実行した確認コマンドと結果:
```bash
git status --short --branch
# success: clean before final handoff refresh on codex/permanent-quality-gate-governance

git log --oneline -5
# success: latest code-bearing commit 8cc2d57 Preserve CSV import source row numbers

gh pr checks 1 --repo kotakase2022-jpg/collector
# success after CSV commit: CodeRabbit pass / Review completed; quality-gate pass

gh pr view 1 --repo kotakase2022-jpg/collector --json number,title,state,isDraft,headRefName,headRefOid,body,url,statusCheckRollup
# success: PR #1 open, isDraft=false, head 8cc2d57968550f8387a51597393568c357c56a74, quality-gate SUCCESS, CodeRabbit SUCCESS

npm run typecheck
# success after CSV parser type-cast fix

npm run test -- tests/etl.test.ts -t "CSVアップロードプレビュー"
# success: 5 passed, 96 skipped

npm run lint
# success

git diff --check
# success: no whitespace errors

npm run quality
# success: typecheck, lint, test (101 passed), coverage (101 passed), E2E (8 passed), build

npm run etl:self-evaluate
# success command execution; mock data score 83; releaseReady false due Supabase/staging evidence and mock running/failed jobs
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと:
1. Recheck PR #1 after this final handoff-only push:
   - `gh pr checks 1 --repo kotakase2022-jpg/collector`
   - inspect CodeRabbit comments/reviews if any are newly posted.
2. Review the focused CSV import row-number fix:
   - `src/lib/list-quality.ts`
   - `tests/etl.test.ts`
3. Reconfirm previous CodeRabbit follow-up areas:
   - `src/lib/etl/job-runner.ts`
   - `src/app/api/jobs/retry/route.ts`
   - `src/app/api/jobs/stop/route.ts`
   - `src/app/api/jobs/run-next/route.ts`
   - `src/lib/job-actions.ts`
   - `src/app/lists/[id]/page.tsx`
4. If CodeRabbit posts new findings, classify Critical/High/Medium/Low and fix correctness/security/data-integrity findings first.
5. If continuing implementation, keep the next unit small. Good candidates remain staging smoke evidence workflow once safe staging credentials exist, live Supabase proof, or another saved-list/CSV/list state-preservation edge case.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:
- Confirm CSV import preview row numbers match the source uploaded CSV when blank rows are present.
- Confirm `runNextCrawlJob` lost-claim behavior is correct: a selected pending job is only executed after the guarded `status = pending` update returns a row.
- Confirm retry/stop/run-next route logging does not alter redirects and does not expose secrets.
- Confirm saved-list filename sanitization is not harmful and preserves useful Japanese filenames.
- Confirm dashboard crawl-health links point to the correct job filters and are not visually crowded.
- Recheck CodeRabbit and GitHub Actions status after the latest push.

## 12. Risk Notes
リスク・人間確認が必要な事項:
- Medium CSV UX/data-correction improvement: uploaded spreadsheets with blank rows now report issue line numbers against the source file instead of the compacted parse result.
- Medium data-integrity improvement already in this PR: job execution now avoids double-running a selected job if another runner claims it first.
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
- Remaining reason not 100/100: final pushed-head PR checks need rechecking after the handoff-only commit, live/staging Supabase smoke evidence is missing, and live external-service paths remain unverified.
