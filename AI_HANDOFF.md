# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 19 (inferred, continued Codex improvement)
- Loop number inferred from: Previous handoff was already Loop 19 with `Current owner: Codex`, `Next owner: Claude Code`, and no Claude Code handoff occurred before this continuation. This remains Loop 19.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-08 02:06 +09:00

## 1. Current Goal
今回の目的：

- Continue the standing autonomous improvement goal toward 100/100 on:
  - function / screen-transition / no-bug confidence,
  - daily-use list-generation tool value.
- Keep the diff small and CodeRabbit-friendly.
- Resolve the still-valid CodeRabbit nitpick in `src/app/companies/page.tsx` where employee/revenue range display labels were duplicated and index-matched against the validation option arrays.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `b4408aa` (`Use filter range options as labels`)
- Last known good commit: `b4408aa`, with local `npm.cmd run quality` success, GitHub Actions `quality-gate` success, and CodeRabbit `SUCCESS` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on pushed head `b4408aa5ab5b88114598ae0a8ce51cc316c6a878`.

## 3. What Was Done
今回完了したこと：

- Read the required project context before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
  - current diff / recent commits / PR status / CodeRabbit status.
- Read the local Next.js App Router page convention doc before touching `src/app/companies/page.tsx`:
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
- Confirmed this page correctly keeps `searchParams` as a promise and remains a Server Component.
- Removed local `employeeRangeLabels` and `revenueRangeLabels` from the companies page.
- Rendered the employee/revenue filter option labels directly from `employeeRangeOptions` and `revenueRangeOptions`, preserving the displayed text and submitted values.
- Added a focused regression assertion in `tests/etl.test.ts` so the validation option arrays remain the canonical self-labeling display values.
- Ran targeted verification, static checks, the full local quality gate, mock self-evaluation, pushed the code commit, and confirmed PR checks.
- Did not change `AGENTS.md` or `CLAUDE.md`; their current guidance already covers the workflow and no new persistent rule was introduced.

## 4. Files Changed
主な変更ファイル：

- `src/app/companies/page.tsx`
  - Removed duplicated range-label arrays.
  - Uses the canonical validation option arrays directly for select option display text.
- `tests/etl.test.ts`
  - Imports `employeeRangeOptions` / `revenueRangeOptions`.
  - Adds regression assertions for the expected display-value arrays.
- `AI_HANDOFF.md`
  - Refreshes Loop 19 continuation, verification, CodeRabbit status, optional Bugbot status, and residual risk.

## 5. Current Status
現在の状態：

- Local full quality gate is green.
- PR #1 latest pushed code head `b4408aa` is green:
  - `quality-gate`: pass
  - CodeRabbit: pass / `Review completed`
- The companies filter UI is behavior-preserving:
  - display labels remain the same,
  - submitted option values remain the same,
  - local duplicate arrays are gone.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.
- App remains locally in mock/fallback mode because isolated staging Supabase credentials are not configured.

## 6. Known Issues
既知の問題：

- Neither `202607070001_queue_crawl_jobs_rpc.sql` nor `202607070002_company_fallback_unique_index.sql` has been applied to a real isolated staging Supabase project from this environment.
- If any database already received the original `202607070001` migration before the ACL revokes were added, the three revoke statements must be applied manually on that database.
- If staging already contains duplicate `(name, address)` company rows, `202607070002_company_fallback_unique_index.sql` intentionally fails with a preflight error; duplicates must be reviewed/merged manually before adding the unique index.
- Live/staging Supabase smoke was not run because isolated staging credentials are absent.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run verify` does not exist; `npm run quality` is the canonical full gate.
- `npm.cmd run etl:self-evaluate` remains mock-mode only in this environment and reports score `83` / `releaseReady: false`.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：

- Review status: `SUCCESS` / `Review completed` on pushed head `b4408aa5ab5b88114598ae0a8ce51cc316c6a878`.
- Critical findings: none open.
- Resolved findings:
  - Current pass: `src/app/companies/page.tsx` no longer duplicates employee/revenue range labels by index; labels are sourced directly from the validation option arrays, with regression coverage.
  - Previous Loop 19: git hook installer tolerates a missing Git executable and has regression coverage.
  - Previous Loop 19: crawler score denominator derives from the same weight map used by score components; exact regression coverage was added.
  - Previous Loop 18: queue crawl RPC execute privileges are restricted to `service_role`; regression coverage enforces the ACL and pinned `search_path`.
  - Previous Loop 18: fallback company upsert has schema-backed `name,address` uniqueness.
  - Earlier Loop 18 findings remain in place: comparison export limits, EDINET lookup, release gates, coverage queue uniqueness, server route error logging, and CSV import source row numbering.
- Deferred findings:
  - Low-risk maintainability nits may still exist in older CodeRabbit comments, but CodeRabbit status is currently passing on the latest head. Claude Code should review any newly posted comments first.
- False positives / not applicable: none for this pass.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：

- Status: Not run.
- Findings: none.
- Actions taken: none.
- Rationale: CodeRabbit OSS was available and passed on the pushed head. This pass was a narrow presentation/maintainability cleanup with local regression coverage and did not touch auth, DB writes, permissions, payments, deletion, or production-sensitive paths.

## 9. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success before editing: clean on codex/permanent-quality-gate-governance

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before editing: CodeRabbit pass / Review completed; quality-gate pass

gh pr view 1 --repo kotakase2022-jpg/collector --json number,title,url,isDraft,headRefName,headRefOid,statusCheckRollup,reviews,body
# success: PR #1 open, ready for review, latest head checked before editing was 9bf9c28

npm.cmd run test -- tests/etl.test.ts -t "企業一覧フィルタ入力"
# success: 1 passed, 110 skipped

npm.cmd run typecheck
# success

npm.cmd run lint
# success

npm.cmd run quality
# success: typecheck, lint, test (111 passed), coverage (111 passed), E2E (8 passed), build

npm.cmd run etl:self-evaluate
# success command execution; mock-mode score 83, releaseReady false

git commit -m "Use filter range options as labels"
# success: commit b4408aa; hook passed check:test-integrity, lint, typecheck

git push
# success: pre-push passed check:test-integrity, lint, typecheck, test (111 passed)

gh run watch 28884311671 --repo kotakase2022-jpg/collector --interval 10 --exit-status
# success: GitHub Actions quality-gate passed in 2m7s

gh pr checks 1 --repo kotakase2022-jpg/collector
# success after push: CodeRabbit pass / Review completed; quality-gate pass
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the focused Loop 19 continuation diff:
   - `src/app/companies/page.tsx`
   - `tests/etl.test.ts`
   - `AI_HANDOFF.md`
2. Confirm the range options are intentionally self-labeling Japanese display values and that using `{range}` in the select options preserves behavior.
3. Recheck PR #1 if a new CodeRabbit comment appears after this handoff-only update.
4. If continuing toward 100/100, prefer staging evidence next if credentials are available:
   - apply `202607070001` and `202607070002` to an isolated staging Supabase,
   - handle any duplicate `(name, address)` preflight failure manually,
   - run `npm run smoke:staging`.
5. If staging credentials remain unavailable, continue with one narrow CodeRabbit-friendly improvement; verify current code before trusting stale unresolved-thread listings.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- Companies page filter selects:
  - no index-coupled display labels remain,
  - labels and submitted values are still the validation option values,
  - search/filter behavior remains unchanged.
- Regression strength:
  - tests pin the canonical employee/revenue option labels without broadening the test surface unnecessarily.
- PR status accuracy:
  - confirm latest pushed code head `b4408aa` remains green after any handoff-only update.
- Residual staging risk:
  - confirm the handoff is honest that 100/100 cannot be claimed without isolated staging smoke/live evidence.

## 12. Risk Notes
リスク・人間確認が必要な事項：

- This pass touched only a Next.js page display mapping and tests; no database schema, server actions, auth, permissions, crawler execution, or external API behavior changed.
- No production or staging database was touched in this pass.
- Migration `202607070001_queue_crawl_jobs_rpc.sql` was edited in a previous pass based on the statement that it has not been applied to any real Supabase project. If it has been applied anywhere, manually run the added revoke statements there.
- Migration `202607070002_company_fallback_unique_index.sql` is intentionally non-destructive; duplicate `(name, address)` rows require human review before the index can be added.
- Remaining reason not to claim 100/100: no isolated staging Supabase migration/smoke evidence and no live external-service validation are available from this environment.

## 13. Do Not Touch
触らない方がよい領域：

- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not apply migrations to production without maintainer sign-off.
- Do not remove or weaken tests to make checks pass.
- Do not force-push.
- Do not weaken the RPC ACL pattern for new `create function` migrations.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 14. Notes for Claude Code
Claude Codeへの補足：

- Before touching Next.js pages, route handlers, or component boundaries, read the relevant local docs under `node_modules/next/dist/docs/`; this pass read the App Router `page` convention doc before editing `src/app/companies/page.tsx`.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- Standing self-score after this pass:
  - Function / screen-transition / no-bug confidence: 99 / 100
  - Daily-use list-generation tool value: 99 / 100
- Remaining reason not 100/100: staging Supabase migration/smoke proof and live external-service validation are still missing from this environment.
