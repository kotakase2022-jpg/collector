# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 8 (inferred)
- Loop number inferred from: The previous handoff had `Current owner: Claude Code`, `Next owner: Codex`, `Loop: 7`, and explicitly recommended advancing to Loop 8 when Codex began the next development sub-task. This pass is that Codex development/fix pass.
- Phase: Handoff / Pause
- Last updated: 2026-07-06 00:17:13 +09:00

## 1. Current Goal
今回の目的：

- User requested stopping at a clean point and updating handoff docs.
- Preserve the current Loop 8 state after Bugbot fixes, local quality verification, GitHub Actions success, and the latest Bugbot rerun.
- Hand off to Claude Code to review the latest state and check final Bugbot results for commit `5a448ff`.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit at start of this pass: `305e6fe` (`Clarify saved list delete failure message`)
- Latest implementation commit before this handoff-only update: `5a448ff` (`Persist discovered URL jobs`)
- Latest commit after this handoff update: branch tip containing this handoff-only update
- Last known good implementation commit: `5a448ff`, verified locally by `npm run quality` and on GitHub by `quality-gate / quality-gate (pull_request)` successful in 2m.

## 3. What Was Done
今回完了したこと：

- Required files were read/reviewed: `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, recent diff/log.
- Next.js page docs were checked before touching `src/app/companies/page.tsx`:
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- Opened Cursor Bugbot dashboard and GitHub PR #1 using the logged-in Chrome session.
- Posted `bugbot run` on `https://github.com/kotakase2022-jpg/collector/pull/1`.
- Bugbot reviewed commit `305e6fe` and surfaced 6 total unresolved issues: 3 older company-filter findings plus 3 governance/job findings. A follow-up Bugbot run against `fec8793` surfaced 2 more job-runner findings. All visible actionable findings were fixed in this Codex pass:
  - `invalid-company` redirects now show an alert on `/companies`.
  - Supabase `valueKind=official` filtering now includes rows where `annual_revenue` is present and `annual_revenue_type` is SQL `NULL`, while still excluding `estimated` and `unknown`.
  - `employeeRange(0)` now returns `null` so mock filtering no longer classifies zero employees as `1-9名`, matching Supabase `>= 1`.
  - Supabase manual-exclusion filters now quote UUID values in the PostgREST `in` list.
  - Coverage planner job types `enrich_edinet` and `discover_official_url` are now executable by `runNextCrawlJob` instead of being marked unsupported immediately.
  - Git hook installer now chmods tracked hooks to `755` on non-Windows platforms; current tracked hook modes were confirmed as `100755`.
  - Manual-review `verify_data` jobs now complete instead of being marked unsupported.
  - `discover_official_url` jobs now persist a high-confidence official URL candidate as a `search` source and `official_url` observation; candidates below confidence 80 fail the job instead of producing a misleading completed status.
- Added/updated tests to lock these fixes:
  - Unit coverage for `employeeRange(0)`.
  - Unit coverage for official revenue type semantics, Supabase filter fragment, and quoted PostgREST `in` list formatting.
  - Unit coverage for planned EDINET, official URL discovery, manual verification, and unsupported job execution paths.
  - E2E coverage for `/companies?error=invalid-company`.
- Ran the full local quality gate successfully.
- Pushed final implementation commit `5a448ff`.
- Confirmed GitHub PR #1 shows `All checks have passed` for `5a448ff`.
- Posted `bugbot run` again on PR #1 for final commit `5a448ff`.
- Observed PR state after rerun:
  - `Reviewed by Cursor Bugbot for commit 5a448ff` appeared in the PR summary.
  - `quality-gate / quality-gate (pull_request)` remained successful.
  - The Bugbot check still displayed as in progress / recently started in the PR status area when the user asked to stop.
  - Older Bugbot findings were shown as resolved/outdated; no final clean/no-finding conclusion for the latest rerun was confirmed before stopping.

## 4. Files Changed
主な変更ファイル：

- `src/app/companies/page.tsx`
- `src/lib/data.ts`
- `src/lib/etl/normalize.ts`
- `src/lib/etl/job-runner.ts`
- `scripts/install-git-hooks.ts`
- `tests/etl.test.ts`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

## 5. Current Status
現在の状態：

- Working tree was clean and synced with origin before this handoff-only update.
- Local full quality gate is green from the implementation pass:
  - unit/integration tests: 81 passed
  - E2E tests: 8 passed
  - build succeeded
  - latest coverage: statements 72.93%, branches 63.74%, functions 86.89%, lines 77.21%
- GitHub Actions `quality-gate / quality-gate (pull_request)` is green for `5a448ff`.
- This handoff-only update changes documentation only. The preceding implementation pass intentionally changed job-runner behavior for Bugbot fixes; it did not change database schema, deployment settings, or secret handling.
- No production DB/API/deploy action was performed.

## 6. Known Issues
既知の問題：

- Cursor Bugbot review for `305e6fe` showed 6 unresolved issues total; follow-up review for `fec8793` showed 2 more issues. This pass fixed all 8 visible findings locally.
- A final `bugbot run` was posted for `5a448ff`, but the final terminal/clean Bugbot result was not confirmed before this pause. Claude Code should check the latest Bugbot result first.
- EDINET job-runner support currently executes the existing EDINET document-listing step and does not yet download/apply EDINET XBRL facts end-to-end; Claude should review whether the next loop should deepen this into full enrichment.
- Real staging Supabase smoke verification has not been run locally because staging credentials are absent.
- `npm run verify` does not exist; `npm run quality` is the canonical local quality gate.
- `npm run etl:self-evaluate` was not rerun in this pass; previous runs report `releaseReady: false` in mock mode because Supabase/staging smoke is not configured.
- Coverage is useful but not exhaustive; `src/lib/store.ts` and live Supabase integration paths remain lower-confidence areas.

## 7. Bugbot Findings
Cursor Bugbotの指摘と対応状況：

- Executed manually by commenting `bugbot run` on PR #1.
- Latest visible review marker: `Reviewed by Cursor Bugbot for commit 5a448ff`.
- Findings handled in this pass:
  - `Invalid company error not shown` (Medium): fixed by adding `/companies?error=invalid-company` alert and E2E coverage.
  - `Official filter excludes null types` (Medium): fixed by changing Supabase official revenue filter to include `annual_revenue_type.is.null` and adding unit coverage.
  - `Employee range zero mismatch` (Low): fixed by making `employeeRange(0)` return `null` and adding unit coverage.
  - `Coverage jobs runner cannot execute` (Medium): fixed by adding runner branches and tests for `enrich_edinet` and `discover_official_url`.
  - `Tracked hooks may not run` (Medium): fixed by chmodding hooks in `scripts/install-git-hooks.ts`; tracked modes confirmed as `100755`.
  - `Supabase exclusion filter format` (Medium): fixed by quoting excluded UUIDs in the PostgREST `in` list and adding unit coverage.
  - `Manual review jobs never run` (Medium): fixed by making `verify_data` jobs complete through the runner and adding unit coverage.
  - `URL discovery jobs save nothing` (Medium): fixed by scoring search candidates, persisting confidence >= 80 candidates to sources/observations, refreshing selected values, and adding unit coverage.
- Latest `bugbot run` for `5a448ff` was started after these fixes. Final result was still unconfirmed when stopping at user request.

## 8. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success: branch codex/permanent-quality-gate-governance; working tree had AI_HANDOFF plus Loop 8 fix files

npm run typecheck
# success

npx vitest run tests/etl.test.ts -t "normalization helpers|official revenue filters|data accessors use mock data"
# success: 3 passed, 76 skipped by name filter

npx vitest run tests/etl.test.ts -t "job runner executes planned|official revenue filters"
# success: 2 passed, 78 skipped by name filter

npx vitest run tests/etl.test.ts -t "job runner executes planned|manual verification|unsupported jobs"
# success: 3 passed, 78 skipped by name filter

npx playwright test e2e/collector.spec.ts -g "company filters support"
# success: 1 passed

npm run quality
# success: typecheck, lint, test integrity, unit/integration tests, coverage, E2E, and build all passed
# latest run tests: 81 passed
# E2E: 8 passed
# latest coverage: statements 72.93%, branches 63.74%, functions 86.89%, lines 77.21%

git ls-files -s .githooks/pre-commit .githooks/pre-push
# success: both hooks are tracked as 100755

git diff --check
# success

git status --short --branch
# success on 2026-07-06 00:17:13 +09:00: clean and synced with origin before this handoff-only update

GitHub PR #1
# success: latest implementation commit 5a448ff visible; quality-gate successful in 2m
# pending/unknown: final Bugbot rerun for 5a448ff was started but not confirmed clean before pause
```

## 9. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the Loop 8 Bugbot fixes:
   - `src/app/companies/page.tsx`
   - `src/lib/data.ts`
   - `src/lib/etl/normalize.ts`
   - `src/lib/etl/job-runner.ts`
   - `scripts/install-git-hooks.ts`
   - `tests/etl.test.ts`
   - `e2e/collector.spec.ts`
2. Confirm the Supabase PostgREST filter string is correct for the project’s Supabase client version: `annual_revenue_type.is.null,annual_revenue_type.not.in.(estimated,unknown)`.
3. Confirm the quoted UUID `not in` filter format is correct for Supabase/PostgREST.
4. First, check the final Cursor Bugbot result for commit `5a448ff`. If findings exist, fix them in priority order.
5. Confirm GitHub Actions remains green for the latest handoff commit after this document update is pushed.
6. If Bugbot is clean, continue the quality/UX loop with one focused sub-task. Good candidates:
   - Add contextual saved-list detail notices for detail-page-originated failures.
   - Add focused route/E2E coverage for saved-list export not-found and failure flows.
7. If staging Supabase credentials are available, run `npm run smoke:staging` with isolated staging credentials before production-readiness claims.

## 10. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- `/companies?error=invalid-company` notice behavior and copy.
- Supabase `or(...)` filter syntax for official annual revenue with `NULL` revenue type.
- Supabase quoted `not in` filter syntax for excluded UUIDs.
- Mock/Supabase consistency for official revenue and employee range filters.
- Whether `employeeRange(value < 1) -> null` has any unintended UX or metrics implication.
- Whether EDINET job execution should be expanded from document-listing to full XBRL download/apply in the next focused loop.
- Whether official URL discovery persistence should additionally store rejected candidates for operator review.

## 11. Do Not Touch
触らない方がよい領域：

- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not delete, skip, weaken, or comment out tests to make checks pass.
- Do not rewrite the UI, routes, data model, crawler behavior, or Supabase schema broadly without an explicit product request.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`) unless intentionally regenerating local artifacts and keeping them uncommitted.
- Do not force-push or deploy to production from this branch.

## 12. Notes for Claude Code
Claude Codeへの補足：

- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- Cursor Bugbot/on-demand spending cap was previously raised to 110 USD.
- The PR is still draft and requires review before merge.
- GitHub Actions should be checked after this handoff commit is pushed.
