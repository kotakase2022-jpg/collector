# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 19 (inferred, continued Codex improvement)
- Loop number inferred from: Previous handoff was Loop 19 with `Current owner: Codex`, `Next owner: Claude Code`, and no Claude Code handoff occurred before this continuation. This remains Loop 19.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-08 09:08 +09:00

## 1. Current Goal
今回の目的：

- Continue the standing autonomous improvement goal toward 100/100 for function / screen-transition / no-bug confidence and daily-use list-generation tool value.
- Focused pass goal: make duplicate CSV import columns visible in the upload preview UI metrics/details, not only in the readiness issue chips, so users can spot ambiguous spreadsheet headers before trusting imported list data.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `f5ccdb269025fe3411035d8d228605316ef7b27c` (`Show duplicate CSV import columns`)
- Previous handoff commit before this update: `38f59508ac59bbec1446bc0f3ca33465d0b27db4` (`Refresh handoff after CSV duplicate column reporting`)
- Last known good code commit: `f5ccdb269025fe3411035d8d228605316ef7b27c`, with local `npm.cmd run quality` success, GitHub Actions `quality-gate` success, and CodeRabbit `pass` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `pass` / `Review completed` on pushed code head `f5ccdb269025fe3411035d8d228605316ef7b27c`.

## 3. What Was Done
今回完了したこと：

- Re-read required project context before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
  - current diff / recent commits / PR status / CodeRabbit status.
- Confirmed PR #1 was green before editing:
  - CodeRabbit: pass / `Review completed`
  - GitHub Actions `quality-gate`: pass
- Read the relevant local Next.js docs before touching the client component:
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`
- Updated the CSV import preview result UI:
  - adds a visible `列重複` metric,
  - shows `重複している列: ...` when uploaded headers map to the same canonical CSV field,
  - keeps the existing readiness issue and first-non-empty row preview behavior unchanged.
- Added an E2E fixture and Playwright coverage for duplicate canonical CSV headers in the list-generation upload preview flow.
- Ran focused checks, full local `npm.cmd run quality`, mock self-evaluation, pushed the code commit, and confirmed CodeRabbit plus GitHub `quality-gate` on the pushed code head.
- Did not change `AGENTS.md` or `CLAUDE.md`; their current guidance already covers this workflow and no new persistent rule was introduced.

## 4. Files Changed
主な変更ファイル：

- `src/components/app/csv-import-preview.tsx`
  - Shows duplicate canonical CSV columns as a metric and detail line in upload preview results.
- `e2e/collector.spec.ts`
  - Verifies duplicate-column visibility in the CSV upload preview workflow.
- `tests/fixtures/csv/duplicate-columns-list-upload.csv`
  - Adds a small fixture with duplicate canonical `corporate_number` headers.
- `AI_HANDOFF.md`
  - Refreshes Loop 19 continuation, verification, CodeRabbit status, optional Bugbot status, and residual risk.

## 5. Current Status
現在の状態：

- Local full quality gate is green.
- PR #1 latest pushed code head `f5ccdb269025fe3411035d8d228605316ef7b27c` is green:
  - CodeRabbit: pass / `Review completed`
  - `quality-gate`: pass
- CSV upload preview now reports duplicate canonical headers in both readiness details and the visible result metric/detail area.
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

- Review status: `pass` / `Review completed` on pushed code head `f5ccdb269025fe3411035d8d228605316ef7b27c`.
- Critical findings: none open on the latest checked code head.
- Resolved findings:
  - Current pass: CSV import preview duplicate canonical headers are visible in result metrics/details and covered by E2E.
  - Previous Loop 19: CSV import preview reports duplicate canonical headers in readiness issues.
  - Previous Loop 19: official site crawler skips oversized successful responses before parsing/storing HTML or PDF content.
  - Previous Loop 19: robots.txt loading fails closed when a successful response is explicit non-`text/plain` content, including binary/image and HTML responses.
  - Previous Loop 19: official site crawler skips unsupported non-text successful responses and malformed PDFs without crashing.
  - Previous Loop 19: LLM extraction output parsing converts malformed JSON and schema drift into stable, explicit failures before downstream enrichment.
  - Previous Loop 19: EDINET documents list fetch validates response/document shape and filters invalid rows before filing selection.
  - Previous Loop 19: HTTP search provider validates response/candidate shape and filters invalid official-URL candidates before scoring.
  - Previous Loop 19: gBizINFO fetch rejects successful-status non-object responses with a clear error before downstream extraction/persistence.
  - Previous Loop 19: CSV export/import and malformed mutation request recovery paths were hardened with unit/E2E coverage.
  - Previous Loop 18: queue crawl RPC execute privileges are restricted to `service_role`; regression coverage enforces ACL and pinned `search_path`.
  - Previous Loop 18: fallback company upsert has schema-backed `name,address` uniqueness.
- Deferred findings:
  - Low-risk maintainability nits may still exist in older CodeRabbit comments, but CodeRabbit status is currently passing on the latest checked code head. Claude Code should review any newly posted comments first.
- False positives / not applicable:
  - Historical Cursor Bugbot findings for invalid company error display, official revenue filtering, and employee range zero handling are already addressed in current code.
  - Historical CodeRabbit retry/stop route logging and `job-actions.ts` duplication comments are already addressed in current code.
  - The older self-evaluation duplicate-helper nit is already addressed in current code; only `normalizeOptionalText` remains.
  - The older saved-list CSV filename nit is already addressed in current code by `sanitizeDownloadFileName` in `src/app/lists/[id]/page.tsx`.
  - The older `job-actions.ts` duplication nit is already addressed in current code by `updateJobIfStatusIn`.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：

- Status: Not run in this pass.
- Findings: none newly requested or newly run in this pass.
- Actions taken:
  - Preserved CodeRabbit OSS as the standard reviewer.
- Rationale:
  - CodeRabbit OSS was available and passed on the pushed code head.
  - This pass was a narrow CSV import preview UI/test improvement with no auth, DB schema, permissions, payments, destructive data changes, or production-sensitive changes.

## 9. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success before editing: clean on codex/permanent-quality-gate-governance

git log --oneline -8
# success: reviewed recent Loop 19 commits before editing

gh pr view 1 --repo kotakase2022-jpg/collector --json headRefOid,headRefName,state,isDraft,reviewDecision,url,title
# success before editing: PR #1 open, ready for review, head 38f5950 before this pass

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before editing: CodeRabbit pass / Review completed; quality-gate pass

npm.cmd run test -- tests/etl.test.ts -t "CSV upload preview"
# success: 4 passed, 117 skipped

npm.cmd run test:e2e -- --grep "list generation supports conditions"
# success: 1 passed

npm.cmd run typecheck
# success

npm.cmd run lint
# success

git diff --check
# success: no whitespace errors

npm.cmd run quality
# success: typecheck, lint, test (121 passed), coverage (121 passed), E2E (8 passed), build

npm.cmd run etl:self-evaluate
# success command execution; mock-mode score 83, releaseReady false

git commit -m "Show duplicate CSV import columns"
# success: commit f5ccdb2; hook passed check:test-integrity, lint, typecheck

git push
# success: pre-push passed check:test-integrity, lint, typecheck, test (121 passed)

gh pr checks 1 --repo kotakase2022-jpg/collector
# success after code push: CodeRabbit pass / Review completed; quality-gate pass
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the focused Loop 19 continuation diff:
   - `src/components/app/csv-import-preview.tsx`
   - `e2e/collector.spec.ts`
   - `tests/fixtures/csv/duplicate-columns-list-upload.csv`
   - `AI_HANDOFF.md`
2. Confirm CSV duplicate-column behavior end to end:
   - duplicate canonical headers are reported in readiness issues,
   - `列重複` metric increments,
   - `重複している列: corporate_number` is visible,
   - existing row preview value selection remains stable.
3. Recheck PR #1 if a new CodeRabbit comment appears after this handoff-only update.
4. If continuing toward 100/100, prefer staging evidence next if credentials are available:
   - apply `202607070001` and `202607070002` to an isolated staging Supabase,
   - handle any duplicate `(name, address)` preflight failure manually,
   - run `npm run smoke:staging`.
5. If staging credentials remain unavailable, continue with one narrow CodeRabbit-friendly improvement; verify current code before trusting stale unresolved-thread listings.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- CSV import preview UI visibility:
  - result metric count matches `duplicateColumns.length`,
  - detail text exposes canonical duplicate column names,
  - layout remains readable with nine compact metrics.
- E2E coverage:
  - fixture represents duplicate alias-based `corporate_number` headers,
  - Playwright assertion checks the visible duplicate-column detail.
- PR status accuracy:
  - confirm latest pushed code head `f5ccdb269025fe3411035d8d228605316ef7b27c` remains green after this handoff-only update.
- Residual staging risk:
  - confirm the handoff is honest that 100/100 cannot be claimed without isolated staging smoke/live evidence.

## 12. Risk Notes
リスク・人間確認が必要な事項：

- This pass touched a client UI result panel, one E2E flow, and one CSV fixture only; it did not change database schema, auth, permissions, crawler scheduling, CSV parsing behavior, route behavior, or persisted data.
- The UI now has nine metrics at large widths. Existing responsive wrapping remains in place (`sm:grid-cols-4`, `lg:grid-cols-9`), but Claude Code should glance at the `/lists` upload preview layout if continuing UI review.
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

- Before touching Next.js pages, route handlers, or component boundaries, read the relevant local docs under `node_modules/next/dist/docs/`; this pass read the Client Component docs before editing `src/components/app/csv-import-preview.tsx`.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run in this pass.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- Standing self-score after this pass:
  - Function / screen-transition / no-bug confidence: 99 / 100
  - Daily-use list-generation tool value: 99 / 100
- Remaining reason not 100/100: staging Supabase migration/smoke proof and live external-service validation are still missing from this environment.
