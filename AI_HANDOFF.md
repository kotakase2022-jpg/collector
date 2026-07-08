# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 20 (inferred)
- Loop number inferred from: The previous handoff recorded `Current owner: Claude Code`, `Next owner: Codex`, `Loop: 19 (inferred)`, and explicitly said to advance to Loop 20 when beginning the next Codex development sub-task. This pass is that next Codex development sub-task.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-08 11:30 +09:00

## 1. Current Goal
今回の目的:
- Continue the standing autonomous improvement goal toward 100/100 for function / screen-transition / no-bug confidence and daily-use list-generation tool value.
- Focused Loop 20 goal: reduce Supabase/PostgREST URL-length risk in source lookup queries by lowering `company_sources` lookup batch sizes and covering that guard in tests.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `663977ba7587ca864d76d29000277d86d682b47a` (`Reduce source lookup batch sizes`)
- Previous Claude Code handoff commit recorded locally before this work: `d2d8d64` (`Record Claude review handoff for comparison CSV filenames`)
- Last known good code commit: `663977ba7587ca864d76d29000277d86d682b47a`, with local `npm.cmd run quality` success, GitHub Actions `quality-gate` success, and CodeRabbit `pass` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `pass` / `Review completed` on pushed code head `663977ba7587ca864d76d29000277d86d682b47a`.

## 3. What Was Done
今回完了したこと:
- Re-read required project context before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
  - current diff / recent commits / PR status / CodeRabbit status.
- Preserved Claude Code's uncommitted Loop 19 review handoff by committing it before starting Loop 20.
- Confirmed PR #1 was green before this code change:
  - CodeRabbit: pass / `Review completed`
  - GitHub Actions `quality-gate`: pass
- Checked several older review/nit candidates against current code before editing:
  - crawler score weight total is already derived from `crawlerScoreWeights`,
  - hook installer already handles missing Git and chmods hooks on non-Windows,
  - self-evaluation already uses explicit `blocksRelease`,
  - CSV import preview row numbers already preserve source CSV line numbers.
- Updated source lookup batch sizes:
  - `sourceUrlLookupBatchSize`: `500` -> `100`
  - `sourceTypeLookupBatchSize`: `500` -> `100`
- Exported both constants and added regression assertions so the source lookup batch sizes stay at or below the safer 100-row boundary.
- Ran focused tests, full local quality gate, mock self-evaluation, pushed the code commit, and confirmed CodeRabbit plus GitHub `quality-gate` on the pushed code head.
- Did not change `AGENTS.md` or `CLAUDE.md`; their current guidance already covers this workflow and no new persistent rule was introduced.

## 4. Files Changed
主な変更ファイル:
- `src/lib/data.ts`
  - Lowers `company_sources` lookup batch sizes used by source-type and source-url enrichment from 500 to 100.
- `tests/etl.test.ts`
  - Adds regression checks that source lookup batches stay at or below 100.
- `AI_HANDOFF.md`
  - Refreshes Loop 20 status, verification, CodeRabbit status, optional Bugbot status, and residual risk.

## 5. Current Status
現在の状態:
- Local full quality gate is green.
- PR #1 latest pushed code head `663977ba7587ca864d76d29000277d86d682b47a` is green:
  - CodeRabbit: pass / `Review completed`
  - `quality-gate`: pass
- The Loop 20 code change is intentionally small and does not change UI, DB schema, crawler execution, auth, permissions, or persisted data.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.
- App remains locally in mock/fallback mode because isolated staging Supabase credentials are not configured.

## 6. Known Issues
既知の問題:
- Neither `202607070001_queue_crawl_jobs_rpc.sql` nor `202607070002_company_fallback_unique_index.sql` has been applied to a real isolated staging Supabase project from this environment.
- If any database already received the original `202607070001` migration before the ACL revokes were added, the three revoke statements must be applied manually on that database.
- If staging already contains duplicate `(name, address)` company rows, `202607070002_company_fallback_unique_index.sql` intentionally fails with a preflight error; duplicates must be reviewed/merged manually before adding the unique index.
- Live/staging Supabase smoke was not run because isolated staging credentials are absent.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run verify` does not exist; `npm run quality` is the canonical full gate.
- `npm.cmd run etl:self-evaluate` remains mock-mode only in this environment and reports score `83` / `releaseReady: false`.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況:
- Review status: `pass` / `Review completed` on pushed code head `663977ba7587ca864d76d29000277d86d682b47a`.
- Critical findings: none open on the latest checked code head.
- Resolved findings:
  - Current pass: source lookup batch sizes now stay at or below 100 to reduce PostgREST URL-length risk for large exports/source enrichment.
  - Previous Loop 19: comparison CSV API fallback filename is aligned with the UI fallback and unsafe/non-ASCII `Content-Disposition` behavior is covered.
  - Previous Loop 19: CSV import preview client validates response shape and E2E covers malformed successful JSON recovery.
  - Previous Loop 19: CSV import preview duplicate canonical headers are visible in result metrics/details and readiness issues.
  - Previous Loop 19: crawler/robots/LLM/EDINET/search/gBizINFO response handling was hardened with focused tests.
  - Previous Loop 18: queue crawl RPC execute privileges are restricted to `service_role`; regression coverage enforces ACL and pinned `search_path`.
  - Previous Loop 18: fallback company upsert has schema-backed `name,address` uniqueness.
- Deferred findings:
  - Staging/live verification remains the main gap toward 100/100.
  - Low-risk maintainability nits may still exist in older comments, but CodeRabbit status is currently passing on the latest checked code head. Claude Code should review any newly posted comments first.
- False positives / not applicable:
  - Several older CodeRabbit/Bugbot comments are already addressed in current code; this pass rechecked scoring weights, hook installation, self-evaluation release gates, and CSV row-number preservation before selecting the source lookup batch-size improvement.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認:
- Status: Not run in this pass.
- Findings: none newly requested or newly run in this pass.
- Actions taken:
  - Preserved CodeRabbit OSS as the standard reviewer.
- Rationale:
  - CodeRabbit OSS was available and passed on the pushed code head.
  - This pass was a narrow query-batch-size/test improvement with no auth, DB schema, permissions, payments, destructive data changes, or production-sensitive changes.

## 9. Verification Results
実行した確認コマンドと結果:
```bash
git status --short --branch
# success before editing: AI_HANDOFF.md contained Claude Code's uncommitted handoff; committed first, then started Loop 20

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before editing: CodeRabbit pass / Review completed; quality-gate pass

git log --oneline -10
# success: reviewed recent Loop 19 commits before editing

npm.cmd run test -- --run tests/etl.test.ts -t "safe fallback data"
# success: 52 passed, 70 skipped

git diff --check
# success: no whitespace errors

npm.cmd run quality
# success: typecheck, lint, test (122 passed), coverage (122 passed), E2E (8 passed), build

npm.cmd run etl:self-evaluate
# success command execution; mock-mode score 83, releaseReady false

git commit -m "Reduce source lookup batch sizes"
# success: commit 663977b; hook passed check:test-integrity, lint, typecheck

git push
# success: pre-push passed check:test-integrity, lint, typecheck, test (122 passed)

gh pr checks 1 --repo kotakase2022-jpg/collector
# success after code push: CodeRabbit pass / Review completed; quality-gate pass
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと:
1. Review the focused Loop 20 diff:
   - `src/lib/data.ts`
   - `tests/etl.test.ts`
   - `AI_HANDOFF.md`
2. Confirm the lower source lookup batch sizes are reasonable for Supabase/PostgREST URL-length safety and do not create unacceptable query overhead.
3. Recheck PR #1 if a new CodeRabbit comment appears after this handoff-only update.
4. If continuing toward 100/100, prefer staging evidence next if credentials are available:
   - apply `202607070001` and `202607070002` to an isolated staging Supabase,
   - handle any duplicate `(name, address)` preflight failure manually,
   - run `npm run smoke:staging`.
5. If staging credentials remain unavailable, continue with one narrow CodeRabbit-friendly improvement; verify current code before trusting stale unresolved-thread listings.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:
- Supabase source lookup batch sizes:
  - `100` is a safer URL-length bound than `500`,
  - exporting the constants for tests does not widen the runtime API in a harmful way,
  - source-type/source-url enrichment behavior remains otherwise unchanged.
- PR status accuracy:
  - confirm latest pushed code head `663977ba7587ca864d76d29000277d86d682b47a` remains green after this handoff-only update.
- Residual staging risk:
  - confirm the handoff is honest that 100/100 cannot be claimed without isolated staging smoke/live evidence.

## 12. Risk Notes
リスク・人間確認が必要な事項:
- This pass only changed source lookup query batching and tests. It did not change database schema, auth, permissions, crawler scheduling, CSV parsing behavior, persisted data, or screen transitions.
- Smaller batches may increase the number of `company_sources` lookup requests for very large exports, but they reduce the risk of exceeding URL/query limits in PostgREST `.in(...)` calls.
- No production or staging database was touched in this pass.
- Migration `202607070001_queue_crawl_jobs_rpc.sql` was edited in a previous pass based on the statement that it has not been applied to any real Supabase project. If it has been applied anywhere, manually run the added revoke statements there.
- Migration `202607070002_company_fallback_unique_index.sql` is intentionally non-destructive; duplicate `(name, address)` rows require human review before the index can be added.
- Remaining reason not to claim 100/100: no isolated staging Supabase migration/smoke evidence and no live external-service validation are available from this environment.

## 13. Do Not Touch
触らない方がよい領域:
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not apply migrations to production without maintainer sign-off.
- Do not remove or weaken tests to make checks pass.
- Do not force-push.
- Do not weaken the RPC ACL pattern for new `create function` migrations.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 14. Notes for Claude Code
Claude Codeへの補足:
- Before touching Next.js pages, route handlers, or component boundaries, read the relevant local docs under `node_modules/next/dist/docs/`; this pass did not touch Next.js code.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run in this pass.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- Standing self-score after this pass:
  - Function / screen-transition / no-bug confidence: 99 / 100
  - Daily-use list-generation tool value: 99 / 100
- Remaining reason not 100/100: staging Supabase migration/smoke proof and live external-service validation are still missing from this environment.
