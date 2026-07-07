# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 18 (inferred, continued Codex phase)
- Loop number inferred from: Previous handoff was already Loop 18 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code handoff occurred before this continuation, so this remains Loop 18 instead of advancing.
- Phase: Handoff
- Last updated: 2026-07-07 22:32 +09:00

## 1. Current Goal
今回の目的：
- Continue the standing autonomous improvement goal for both top metrics:
  - Function / screen-transition / no-bug confidence.
  - Daily-use list-generation tool value.
- Address the next still-valid CodeRabbit-aligned persistence/data-integrity risk without deleting or auto-merging existing data.
- Keep CodeRabbit OSS as the standard PR reviewer and keep Cursor Bugbot optional/reserve only.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit before this handoff refresh: `16875a8c0eb0be0a4165066afd8e937918dd9579` (`Back fallback company upserts with unique index`)
- Last known good pushed code-bearing commit: `16875a8c0eb0be0a4165066afd8e937918dd9579`, with `quality-gate` pass and CodeRabbit `SUCCESS` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on pushed head `16875a8`.

## 3. What Was Done
今回完了したこと：
- Read the required project files before changing code:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Rechecked current git status/log, PR #1 state, GitHub Actions checks, CodeRabbit status, and the latest handoff.
- Verified the older CodeRabbit store fallback uniqueness concern against current code:
  - `upsertCompany` used fallback `onConflict: "name,address"` when `corporate_number` was unavailable.
  - The schema only had `corporate_number text unique`; no matching `name,address` uniqueness rule existed.
- Added a `companies_name_address_uidx` unique index on `public.companies(name, address) nulls not distinct` in the initial schema.
- Added an incremental migration `202607070002_company_fallback_unique_index.sql` for existing databases.
- The migration preflights existing duplicate `(name, address)` rows and raises a clear error instead of deleting, merging, or silently choosing a winner.
- Extracted `companyUpsertConflictTarget` so the app-side conflict target is explicit and testable.
- Added regression coverage proving corporate-number rows still target `corporate_number`, fallback rows target `name,address`, and both schema/migration define the nullable-address-safe unique index.
- Ran focused checks, the full local quality gate, ETL self-evaluation, pushed the code commit, and confirmed PR checks.
- Did not update `AGENTS.md` or `CLAUDE.md`; no project-rule changes were needed.

## 4. Files Changed
主な変更ファイル：
- `src/lib/etl/store.ts`
  - Adds `companyUpsertConflictTarget` and uses it for companies upsert conflict selection.
- `supabase/migrations/202607030001_initial_schema.sql`
  - Adds the fresh-schema `companies_name_address_uidx` unique index.
- `supabase/migrations/202607070002_company_fallback_unique_index.sql`
  - Adds the existing-DB migration with duplicate preflight and nullable-address-safe uniqueness.
- `tests/etl.test.ts`
  - Adds regression coverage for app-side conflict target selection and schema-backed fallback uniqueness.
- `AI_HANDOFF.md`
  - Refreshes Loop 18 status, verification, review state, and Claude handoff instructions.

Previously completed Loop 18 files still in this PR:
- `src/lib/lists.ts`
- `src/lib/etl/job-runner.ts`
- `src/lib/etl/edinet.ts`
- `src/lib/etl/self-evaluation.ts`
- `src/lib/etl/job-planner.ts`
- `supabase/migrations/202607070001_queue_crawl_jobs_rpc.sql`
- `src/app/api/companies/export/route.ts`
- `src/app/api/lists/export/route.ts`
- `src/app/api/lists/compare-export/route.ts`
- `src/app/api/lists/create/route.ts`
- `src/app/api/lists/update/route.ts`
- `src/app/api/lists/delete/route.ts`
- `src/lib/list-quality.ts`
- `src/app/page.tsx`
- `e2e/collector.spec.ts`
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
現在の状態：
- Local checks pass after the company fallback uniqueness cleanup.
- Pushed code-bearing head `16875a8` has GitHub Actions `quality-gate` success and CodeRabbit `SUCCESS`.
- This handoff refresh commit should be pushed after editing; recheck latest head if branch protection requires every doc-only commit to pass.
- App remains in mock/fallback mode locally because Supabase credentials are not configured.
- `npm run etl:self-evaluate` still reports mock-mode score `83` and `releaseReady: false`.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
既知の問題：
- After pushing this handoff-only commit, recheck PR #1 if a maintainer requires checks on the absolute latest head.
- The new `202607070002_company_fallback_unique_index.sql` migration has not been applied to a real staging Supabase project in this environment.
- If staging already contains duplicate `(name, address)` company rows, the new migration intentionally fails with a clear preflight error; duplicates must be reviewed/merged manually before applying the index.
- The coverage-queue migration from the previous continuation has not been applied to a real staging Supabase project in this environment.
- Live/staging Supabase smoke was not run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run verify` does not exist; `npm run quality` is the canonical full gate.
- `npm run etl:self-evaluate` still reports mock-mode score `83` and `releaseReady: false`.
- Coverage is useful but not exhaustive around live Supabase integration paths.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：
- Review status: pushed code-bearing head `16875a8c0eb0be0a4165066afd8e937918dd9579` had `quality-gate` `SUCCESS` and CodeRabbit `SUCCESS` / `Review completed`.
- Critical findings: none known.
- Resolved findings in this continuation:
  - Store fallback upsert now targets a schema-backed `name,address` unique index with `NULLS NOT DISTINCT` semantics.
  - Existing-database migration avoids silent data destruction by failing clearly if duplicate fallback keys already exist.
- Previously resolved findings in Loop 18:
  - Saved-list comparison CSV export now has an explicit unlimited option instead of relying on `Number.MAX_SAFE_INTEGER` as a preview-limit sentinel.
  - EDINET lookup no longer depends on only the current date; enrichment jobs search a bounded 30-day recent filing window.
  - EDINET document application count now depends on persisted observations, not only truthy extracted facts.
  - Self-evaluation release gates now use explicit `blocksRelease` metadata instead of Japanese message-prefix matching.
  - Coverage job queueing now has DB-backed active-job uniqueness and conflict-safe insertion.
  - CSV export route failures preserve stable client responses and log caught server-side operation errors.
  - Saved-list create/update/delete operation failures now log caught server-side errors.
  - Job priority, coverage planning, recrawl, and manual-review operation failures now log caught server-side errors.
  - `src/lib/etl/job-runner.ts` non-atomic pending job claim was fixed with conditional update plus a lost-claim test.
  - Retry/stop/run-next errors now log enough context before redirecting.
  - Duplicated guarded-update flow in `src/lib/job-actions.ts` was consolidated.
  - Saved-list CSV filenames are sanitized.
  - CSV row issue numbers now preserve source line numbers when blank lines are skipped.
- Deferred findings:
  - Remaining older nit suggestions include notice helper extraction and range label dedupe. Reassess against current code before acting because several older comments are stale or require broader decisions.
- False positives / not applicable:
  - EDINET ZIP fixture test suggestion appears stale; fixture-based ZIP tests already exist in `tests/etl.test.ts`.
  - Some file-name sanitization concerns are already covered in `CsvExportButton` and `src/lib/file-name.ts`; saved-list page call sites were also sanitized earlier for clarity.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：
- Status: Not run in this continuation.
- Findings: none from this continuation.
- Actions taken: none.
- Rationale: CodeRabbit is the standard reviewer and was available. This pass fixed a CodeRabbit-aligned persistence/data-integrity concern with tests; Bugbot remains optional unless CodeRabbit becomes inconclusive or a maintainer requests it.

## 9. Verification Results
実行した確認コマンドと結果：
```bash
git status --short --branch
# success: clean before this continuation; branch later had the fallback-uniqueness code commit and this handoff refresh

git log --oneline -8
# success: confirmed prior Loop 18 commits before editing

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before editing: CodeRabbit pass / Review completed; quality-gate pass on previous head 09759a1

gh pr view 1 --repo kotakase2022-jpg/collector --json number,title,state,isDraft,headRefName,headRefOid,url,statusCheckRollup,reviews,comments
# success: PR #1 open, isDraft=false; reviewed current CodeRabbit/status context

npm run typecheck
# success

npm run test -- tests/etl.test.ts -t "company"
# success: 5 passed, 104 skipped

npm run quality
# success: typecheck, lint, test (109 passed), coverage (109 passed), E2E (8 passed), build

npm run etl:self-evaluate
# success command execution; mock data score 83; releaseReady false due Supabase/staging evidence and mock running/failed jobs

git diff --check
# success: no whitespace errors

git commit -m "Back fallback company upserts with unique index"
# success; commit hook passed check:test-integrity, lint, and typecheck

git push origin codex/permanent-quality-gate-governance
# success; pre-push passed check:test-integrity, lint, typecheck, and test (109 passed)

gh pr checks 1 --repo kotakase2022-jpg/collector --watch --interval 10
# success on code-bearing pushed head 16875a8: CodeRabbit pass / Review completed; quality-gate pass
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：
1. Recheck PR #1 after this handoff-only commit is pushed:
   - `gh pr checks 1 --repo kotakase2022-jpg/collector`
   - inspect CodeRabbit comments/reviews if any are newly posted.
2. Review the focused persistence diff:
   - `src/lib/etl/store.ts`
   - `supabase/migrations/202607030001_initial_schema.sql`
   - `supabase/migrations/202607070002_company_fallback_unique_index.sql`
   - `tests/etl.test.ts`
3. Confirm `NULLS NOT DISTINCT` is acceptable for the fallback key and that existing duplicate `(name, address)` rows should require manual resolution instead of automatic merge/delete.
4. If continuing implementation, keep the next unit small. Good candidates remain:
   - staging smoke evidence workflow once safe staging credentials exist,
   - small UI helper dedupe only after reading the relevant Next.js local docs.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：
- `companies_name_address_uidx` syntax and compatibility with Supabase/Postgres for `onConflict: "name,address"`.
- Whether the duplicate preflight should remain a hard failure rather than auto-cleaning data.
- Regression test coverage for app-side conflict target and migration/index presence.
- Full `npm run quality` remains green after the latest pushed head.
- Current CodeRabbit and GitHub Actions state after the handoff-only commit.

## 12. Risk Notes
リスク・人間確認が必要な事項：
- Medium migration risk: if staging/live already has duplicate `(name, address)` rows, migration `202607070002` intentionally fails and requires manual duplicate review.
- No data deletion, merge, or production write was performed by Codex.
- No authentication, authorization, payment, or destructive data-flow changes in this pass.
- Operational risk remains: no staging Supabase smoke evidence is available locally.
- The self-evaluation score remains `83` in mock mode; this pass improves persistence integrity rather than mock data completeness.

## 13. Do Not Touch
触らない方がよい領域：
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not delete or weaken tests to make checks pass.
- Do not force-push.
- Do not rewrite the UI or data model broadly without an explicit product request.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`) unless intentionally regenerating local artifacts and keeping them uncommitted.

## 14. Notes for Claude Code
Claude Codeへの補足：
- The full quality gate is `npm run quality`; it passed in this continuation.
- `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot remains optional/reserve only and was not run in this continuation.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- The standing two-score goal remains active. Current honest self-score after this pass:
  - Function / screen-transition / no-bug: 99 / 100
  - Daily-use list-generation tool value: 99 / 100
- Remaining reason not 100/100: the new fallback uniqueness migration and previous coverage-queue migration need staging application proof, live/staging Supabase smoke evidence is missing, and live external-service paths remain unverified.
