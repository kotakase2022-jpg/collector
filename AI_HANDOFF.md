# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 18 (inferred, continued Codex phase)
- Loop number inferred from: Previous handoff was already Loop 18 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code handoff occurred before this continuation, so this remains Loop 18 instead of advancing.
- Phase: Handoff
- Last updated: 2026-07-07 21:44 +09:00

## 1. Current Goal
今回の目的:
- Continue the standing autonomous improvement goal for both top metrics:
  - Function / screen-transition / no-bug confidence.
  - Daily-use list-generation tool value.
- Harden coverage job planning so overlapping planners cannot enqueue duplicate active crawl jobs for the same company/job type.
- Keep CodeRabbit OSS as the standard PR reviewer and keep Cursor Bugbot optional/reserve only.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit before this handoff refresh: `614a554e6556f1ef9f07652c02618e415051144f` (`Harden coverage job queueing`)
- Last known good pushed commit before this continuation: `2cf64fde21db2fc9a16d9f918a0901272d200afb`, with `quality-gate` pass and CodeRabbit pass.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on previous pushed head `2cf64fd`. Recheck after pushing `614a554` and this handoff refresh.

## 3. What Was Done
今回完了したこと:
- Read the required project files before changing code:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Reviewed current git status/log, PR #1 state, GitHub Actions checks, CodeRabbit status, CodeRabbit review/comment history, and the latest handoff.
- Revalidated an older CodeRabbit data-integrity concern against current code: `queueCoverageJobs` still relied on a pre-read of active jobs and plain insert, so concurrent planners could race.
- Added a Supabase migration with:
  - a partial unique index on active `crawl_jobs(company_id, job_type)` for `pending` / `running` jobs.
  - `public.queue_crawl_jobs(jsonb)`, an RPC that inserts planned jobs with `on conflict do nothing` and returns the actual inserted count.
- Updated `queueCoverageJobs` to call the conflict-safe RPC instead of plain inserting planned rows.
- Preserved dry-run behavior and existing plan-building behavior.
- Added regression coverage proving queueing goes through the DB-backed RPC and reports the RPC inserted count rather than the planned count.
- Re-ran focused checks, the full local quality gate, and ETL self-evaluation.
- Did not update `AGENTS.md` or `CLAUDE.md`; no project-rule changes were needed.

## 4. Files Changed
主な変更ファイル:
- `src/lib/etl/job-planner.ts`
  - Replaces plain `crawl_jobs` insert with `queue_crawl_jobs` RPC and returns the conflict-safe inserted count.
- `supabase/migrations/202607070001_queue_crawl_jobs_rpc.sql`
  - Adds active-job uniqueness and the conflict-safe queueing RPC.
- `tests/etl.test.ts`
  - Adds regression coverage for coverage planner RPC queueing and inserted-count behavior.
- `AI_HANDOFF.md`
  - Refreshes Loop 18 status, verification, review state, and Claude handoff instructions.

Previously completed Loop 18 files still in this PR:
- `src/app/api/companies/export/route.ts`
- `src/app/api/lists/export/route.ts`
- `src/app/api/lists/compare-export/route.ts`
- `src/app/api/lists/create/route.ts`
- `src/app/api/lists/update/route.ts`
- `src/app/api/lists/delete/route.ts`
- `src/lib/list-quality.ts`
- `src/app/page.tsx`
- `e2e/collector.spec.ts`
- `src/lib/etl/job-runner.ts`
- `src/app/api/jobs/retry/route.ts`
- `src/app/api/jobs/stop/route.ts`
- `src/app/api/jobs/run-next/route.ts`
- `src/lib/job-actions.ts`
- `src/app/lists/[id]/page.tsx`
- `src/app/api/jobs/priority/route.ts`
- `src/app/api/jobs/plan-coverage/route.ts`
- `src/app/api/companies/recrawl/route.ts`
- `src/app/api/companies/manual-review/route.ts`

## 5. Current Status
現在の状態:
- Local checks pass after the coverage job queueing hardening.
- Latest local code-bearing commit is `614a554`; push and PR checks still need to run for this new head plus the handoff refresh.
- Previous pushed PR head `2cf64fd` had GitHub Actions `quality-gate` success and CodeRabbit `SUCCESS`.
- App remains in mock/fallback mode locally because Supabase credentials are not configured.
- `npm run etl:self-evaluate` still reports mock-mode score `83` and `releaseReady: false`.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
既知の問題:
- After pushing `614a554` and this handoff refresh, recheck PR #1 because GitHub Actions and CodeRabbit attach to the latest pushed head.
- CodeRabbit may post a new review for the migration/RPC change; Claude Code should inspect any new finding first.
- The new migration has not been applied to a real staging Supabase project in this environment.
- Live/staging Supabase smoke was not run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run verify` does not exist; `npm run quality` is the canonical full gate.
- `npm run etl:self-evaluate` still reports mock-mode score `83` and `releaseReady: false`.
- Coverage is useful but not exhaustive around live Supabase integration paths.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況:
- Review status: previous pushed head `2cf64fde21db2fc9a16d9f918a0901272d200afb` had `quality-gate` `SUCCESS` and CodeRabbit `SUCCESS` / `Review completed`.
- Critical findings: none known.
- Resolved findings in this continuation:
  - Data integrity: coverage job queueing now has DB-backed active-job uniqueness and conflict-safe insertion, avoiding duplicate pending/running jobs under overlapping planners.
- Previously resolved findings in Loop 18:
  - CSV export route failures now preserve stable client responses and log caught server-side operation errors for diagnosis.
  - Medium diagnosability/UX recovery: saved-list create/update/delete operation failures now log caught server-side errors.
  - Medium diagnosability/UX recovery: job priority, coverage planning, recrawl, and manual-review operation failures now log caught server-side errors.
  - Major: `src/lib/etl/job-runner.ts` non-atomic pending job claim. Fixed with conditional update plus lost-claim test.
  - Inline/nit: swallowed retry/stop/run-next errors. Fixed with injectable/default `console.error` logging and tests.
  - Nit: duplicated guarded-update flow in `src/lib/job-actions.ts`. Fixed with a shared helper.
  - Nit/functional: saved-list CSV filenames at call sites. Fixed with `sanitizeDownloadFileName`.
  - Medium UX/data-correction: CSV row issue numbers shifted when blank lines were skipped. Fixed by carrying `csv-parse` source line numbers into `rowIssues`.
- Deferred findings:
  - Older broad/nit suggestions not directly touched in this focused pass, including notice helper extraction, range label dedupe, comparison export naming semantics, EDINET lookback/application-count refinements, self-evaluation risk flag cleanup, and store fallback uniqueness. Reassess against current code before acting because several older comments are stale or require larger schema/product decisions.
  - Recheck current latest-head CodeRabbit status after pushing this handoff.
- False positives / not applicable:
  - EDINET ZIP fixture test suggestion appears stale; fixture-based ZIP tests already exist in `tests/etl.test.ts`.
  - Some file-name sanitization concerns are already covered in `CsvExportButton` and `src/lib/file-name.ts`; this PR also sanitized the saved-list page call sites for clarity.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認:
- Status: Not run in this continuation.
- Findings: none from this continuation.
- Actions taken: none.
- Rationale: CodeRabbit is the standard reviewer and was available. This pass fixes a CodeRabbit-aligned data-integrity concern with tests; Bugbot remains optional unless CodeRabbit becomes inconclusive or a maintainer requests it.

## 9. Verification Results
実行した確認コマンドと結果:
```bash
git status --short --branch
# success: clean at start; after code commit branch is ahead of origin pending handoff refresh and push

git log --oneline -8
# success: previous latest pushed commit 2cf64fd before this continuation

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before this continuation: CodeRabbit pass / Review completed; quality-gate pass on 2cf64fd

gh pr view 1 --repo kotakase2022-jpg/collector --json number,title,state,isDraft,headRefName,headRefOid,url,statusCheckRollup
# success before this continuation: PR #1 open, isDraft=false, previous head 2cf64fde21db2fc9a16d9f918a0901272d200afb, quality-gate SUCCESS, CodeRabbit SUCCESS

npm run typecheck
# success

npm run test -- tests/etl.test.ts -t "coverage planner"
# success: 5 passed, 101 skipped

npm run lint
# success after fixing test mock unused-argument warnings

npm run quality
# success: typecheck, lint, test (106 passed), coverage (106 passed), E2E (8 passed), build

npm run etl:self-evaluate
# success command execution; mock data score 83; releaseReady false due Supabase/staging evidence and mock running/failed jobs

git diff --check
# success: no whitespace errors

git commit -m "Harden coverage job queueing"
# success; commit hook passed check:test-integrity, lint, and typecheck
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと:
1. Recheck PR #1 after the latest push:
   - `gh pr checks 1 --repo kotakase2022-jpg/collector`
   - inspect CodeRabbit comments/reviews if any are newly posted.
2. Review the focused data-integrity diff:
   - `src/lib/etl/job-planner.ts`
   - `supabase/migrations/202607070001_queue_crawl_jobs_rpc.sql`
   - `tests/etl.test.ts`
3. Confirm the migration shape is acceptable for Supabase/PostgREST:
   - active `pending` / `running` uniqueness on `(company_id, job_type)`.
   - `queue_crawl_jobs` returns actual inserted count and ignores conflicts.
4. Reconfirm previous Loop 18 areas if CodeRabbit comments mention them:
   - CSV export failure logging: `src/app/api/companies/export/route.ts`, `src/app/api/lists/export/route.ts`, `src/app/api/lists/compare-export/route.ts`
   - saved-list failure logging: `src/app/api/lists/*`
   - CSV source row numbers: `src/lib/list-quality.ts`, `tests/etl.test.ts`
   - job claim/logging paths: `src/lib/etl/job-runner.ts`, `src/app/api/jobs/*`
   - dashboard links: `src/app/page.tsx`, `e2e/collector.spec.ts`
5. If CodeRabbit posts new findings, classify Critical/High/Medium/Low and fix correctness/security/data-integrity findings first.
6. If continuing implementation, keep the next unit small. Good candidates remain staging smoke evidence workflow once safe staging credentials exist, EDINET lookback/application-count refinements, self-evaluation risk flag cleanup, or live Supabase proof.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:
- Confirm the partial unique index correctly prevents duplicate active jobs without blocking future completed/failed job history.
- Confirm `queue_crawl_jobs` handles duplicate/overlapping planner requests by ignoring conflicts and returning only inserted rows.
- Confirm `queueCoverageJobs` still preserves dry-run behavior and does not over-report inserted jobs.
- Confirm the migration is safe to apply to staging before production.
- Confirm full `npm run quality` remains green after the latest pushed head.
- Recheck CodeRabbit and GitHub Actions status after the latest push.

## 12. Risk Notes
リスク・人間確認が必要な事項:
- Medium implementation risk: this pass adds a Supabase migration/RPC, so staging application should be verified before production use.
- Medium operational value: overlapping coverage planning should no longer create duplicate active crawl jobs for the same company/job type.
- No authentication, authorization, payment, or destructive data-flow changes in this pass.
- Operational risk remains: no staging Supabase smoke evidence is available locally.
- The self-evaluation score remains `83` in mock mode; this pass improves data integrity and operational reliability rather than mock data completeness.

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
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot remains optional/reserve only and was not run in this continuation.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- The standing two-score goal remains active. Current honest self-score after this pass:
  - Function / screen-transition / no-bug: 99 / 100
  - Daily-use list-generation tool value: 99 / 100
- Remaining reason not 100/100: latest pushed-head PR checks need rechecking after this handoff, migration needs staging application proof, live/staging Supabase smoke evidence is missing, and live external-service paths remain unverified.
