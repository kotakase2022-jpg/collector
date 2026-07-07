# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 19 (inferred, continued Codex improvement)
- Loop number inferred from: Previous handoff was already Loop 19 with `Current owner: Codex`, `Next owner: Claude Code`, and no Claude Code handoff occurred before this continuation. This remains Loop 19.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-08 07:01 +09:00

## 1. Current Goal
今回の目的：
- Continue the standing autonomous improvement goal toward 100/100 on:
  - function / screen-transition / no-bug confidence,
  - daily-use list-generation tool value.
- Keep this pass narrow and CodeRabbit-friendly.
- Harden the CSV import preview UI so a non-JSON failure response from infrastructure/proxy/API fallback shows a stable Japanese recovery message instead of a raw JSON parse error.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `b6c7ff65403d80fd51c5b6538fcc9423070e3f45` (`Handle non-JSON CSV import preview failures`)
- Handoff refresh commit: this handoff-only commit (see `git log -1` after the final push for the exact SHA).
- Last known good code commit: `b6c7ff65403d80fd51c5b6538fcc9423070e3f45`, with local `npm.cmd run quality` success, GitHub Actions `quality-gate` success, and CodeRabbit `SUCCESS` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on pushed code head `b6c7ff65403d80fd51c5b6538fcc9423070e3f45`.

## 3. What Was Done
今回完了したこと：
- Re-read required project context before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
  - current diff / recent commits / PR status / CodeRabbit status.
- Confirmed the PR was green before editing:
  - `quality-gate`: pass
  - CodeRabbit: pass / `Review completed`.
- Read local Next.js Client Component docs before touching the `"use client"` CSV preview component:
  - `node_modules/next/dist/docs/01-app/04-glossary.md`
- Updated `CsvImportPreviewPanel` response handling:
  - Reads the preview API response through a small helper.
  - Converts non-JSON or non-object response bodies into the stable recovery message `CSVの検査に失敗しました。時間をおいて再実行してください。`.
  - Keeps server-provided JSON validation messages, such as file size and missing file errors, unchanged.
- Added E2E coverage for a one-time `text/plain` 500 response from `/api/lists/import-preview`.
- Verified the UI shows the stable recovery alert and then recovers when the user selects a valid CSV and retries.
- Ran targeted checks, the full local quality gate, mock self-evaluation, pushed the code commit, and confirmed CodeRabbit plus GitHub `quality-gate` on the pushed code head.
- Did not change `AGENTS.md` or `CLAUDE.md`; their current guidance already covers the workflow and no new persistent rule was introduced.

## 4. Files Changed
主な変更ファイル：
- `src/components/app/csv-import-preview.tsx`
  - Adds stable fallback parsing for CSV import preview responses.
  - Avoids exposing low-level JSON parse errors to users.
- `e2e/collector.spec.ts`
  - Adds regression coverage for non-JSON CSV import preview API failures and retry recovery.
- `AI_HANDOFF.md`
  - Refreshes Loop 19 continuation, verification, CodeRabbit status, optional Bugbot status, and residual risk.

## 5. Current Status
現在の状態：
- Local full quality gate is green.
- PR #1 latest pushed code head `b6c7ff65403d80fd51c5b6538fcc9423070e3f45` is green:
  - CodeRabbit: pass / `Review completed`
  - `quality-gate`: pass
- CSV import preview now handles non-JSON failure responses deterministically with a recoverable user-facing message.
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
- Review status: `SUCCESS` / `Review completed` on pushed code head `b6c7ff65403d80fd51c5b6538fcc9423070e3f45`.
- Critical findings: none open on the latest checked code head.
- Resolved findings:
  - Current pass: CSV import preview UI now catches non-JSON failure responses and shows stable retry guidance instead of a JSON parse error.
  - Previous Loop 19: company recrawl / manual-review routes catch malformed/non-multipart request parsing failures and return recoverable `/companies` error redirects.
  - Previous Loop 19: job priority / plan coverage / retry / stop routes catch malformed/non-multipart request parsing failures and return recoverable `/jobs` error redirects.
  - Previous Loop 19: saved-list create/update/delete mutation routes catch malformed/non-multipart request parsing failures and return recoverable `/lists` error redirects without persistence or revalidation side effects.
  - Previous Loop 19: CSV import preview API catches malformed/non-multipart request parsing failures and returns a stable 400 JSON validation error.
  - Previous Loop 19: shared CSV export now defers object URL cleanup until after the generated download link click, reducing cross-browser download timing risk.
  - Previous Loop 19: unknown `/lists?notice=...` values now use neutral accepted-operation status feedback instead of the misleading saved-list success message.
  - Previous Loop 19: configured `/jobs` retry/stop success redirect `notice=updated` now uses explicit status copy and has E2E coverage.
  - Previous Loop 19: unknown company-detail notice values now use neutral accepted-operation status feedback instead of the misleading Supabase-dry-run message.
  - Previous Loop 19: company-detail direct success-query notices (`notice=recrawl` / `notice=manual-review`) are covered as `role="status"`, and direct `error=operation-failed` is covered as alert feedback.
  - Previous Loop 19: company-detail recrawl/manual-review dry-run feedback now uses `role="status"` and is covered by E2E.
  - Previous Loop 19: `/lists` success and dry-run feedback now uses `role="status"`, `error=not-found` reaches the specific not-found copy, and CSV import status assertions are scoped to the panel.
  - Previous Loop 19: `/jobs` success and dry-run feedback now uses `role="status"` and is covered by E2E.
  - Previous Loop 19: saved-list detail success feedback now uses `role="status"` and is covered by E2E.
  - Previous Loop 19: unknown `/lists` and `/jobs` error query values reuse existing operation-failure recovery copy and are covered by E2E.
  - Previous Loop 19: `/companies` invalid/generic company action errors render as destructive notices and are covered by E2E.
  - Previous Loop 19: CSV export success/error feedback reuses `NoticeBanner`, and related E2E assertions are role/scoped instead of tag-specific.
  - Previous Loop 19: notice-like list-generation, saved-list, and CSV import static/status boxes reuse `NoticeBanner`, with static info boxes explicitly rendered without alert/status roles.
  - Previous Loop 19: generated-list duplicate corporate-number destructive alert uses `NoticeBanner`.
  - Previous Loop 19: repeated App Router `value(input)` query-param helper was moved into `src/lib/search-params.ts` and covered by a focused unit test.
  - Previous Loop 19: EDINET ZIP extraction has fixture coverage for both supported compression methods `0` and `8`.
  - Previous Loop 19: saved-list card E2E locator no longer depends on Tailwind utility classes or ancestor XPath; the app exposes a stable card test id.
  - Previous Loop 19: `src/app/companies/page.tsx` no longer duplicates employee/revenue range labels by index; labels are sourced directly from validation option arrays, with regression coverage.
  - Previous Loop 19: git hook installer tolerates a missing Git executable and has regression coverage.
  - Previous Loop 19: crawler score denominator derives from the same weight map used by score components; exact regression coverage was added.
  - Previous Loop 18: queue crawl RPC execute privileges are restricted to `service_role`; regression coverage enforces the ACL and pinned `search_path`.
  - Previous Loop 18: fallback company upsert has schema-backed `name,address` uniqueness.
  - Earlier Loop 18 findings remain in place: comparison export limits, EDINET lookup, release gates, coverage queue uniqueness, server route error logging, and CSV import source row numbering.
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
  - Rechecked historical Bugbot status in the handoff notes and preserved the note that the three company/data issues are already addressed.
- Rationale:
  - CodeRabbit OSS was available and passed on the pushed code head.
  - This pass was a narrow client-side CSV preview recovery hardening with no auth, DB schema, permissions, payments, destructive data changes, or production-sensitive changes.

## 9. Verification Results
実行した確認コマンドと結果：
```bash
git status --short --branch
# success before editing: clean on codex/permanent-quality-gate-governance

git log --oneline -8
# success: reviewed recent Loop 19 commits before editing

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before editing: CodeRabbit pass / Review completed; quality-gate pass

gh pr view 1 --repo kotakase2022-jpg/collector --json headRefOid,headRefName,state,isDraft,reviewDecision,url,title
# success: PR #1 open, ready for review, head before editing was 4f2e591986d55eba5aee6dd9e84eb17e0616e40b

npm.cmd run typecheck
# first run failed before the type guard: TypeScript could not narrow CsvImportPreviewResponse for setResult
# rerun success after adding isCsvImportPreviewError

npm.cmd run lint
# success

npx.cmd playwright test e2e/collector.spec.ts --grep "list generation supports conditions"
# first run failed because the test reselected the same file path after the injected failure, so the browser did not fire a change event and the old alert remained
# rerun success after using a different fixture for the injected failure case: 1 passed

npm.cmd run quality
# success: typecheck, lint, test (115 passed), coverage (115 passed), E2E (8 passed), build

npm.cmd run etl:self-evaluate
# success command execution; mock-mode score 83, releaseReady false

git diff --check
# success: no whitespace errors

git commit -m "Handle non-JSON CSV import preview failures"
# success: commit b6c7ff6; hook passed check:test-integrity, lint, typecheck

git push
# success: pre-push passed check:test-integrity, lint, typecheck, test (115 passed)

gh pr checks 1 --repo kotakase2022-jpg/collector --watch --interval 10
# success after code push: CodeRabbit pass / Review completed; quality-gate pass
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：
1. Review the focused Loop 19 continuation diff:
   - `src/components/app/csv-import-preview.tsx`
   - `e2e/collector.spec.ts`
   - `AI_HANDOFF.md`
2. Confirm CSV import preview behavior:
   - API-provided JSON validation errors still show their specific messages.
   - non-JSON 500 responses show `CSVの検査に失敗しました。時間をおいて再実行してください。`.
   - selecting a valid CSV after the failure clears the alert and shows normal preview/readiness feedback.
3. Recheck PR #1 if a new CodeRabbit comment appears after this handoff-only update.
4. If continuing toward 100/100, prefer staging evidence next if credentials are available:
   - apply `202607070001` and `202607070002` to an isolated staging Supabase,
   - handle any duplicate `(name, address)` preflight failure manually,
   - run `npm run smoke:staging`.
5. If staging credentials remain unavailable, continue with one narrow CodeRabbit-friendly improvement; verify current code before trusting stale unresolved-thread listings.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：
- CSV import preview client error boundary:
  - non-JSON response handling,
  - preserving specific JSON validation messages,
  - avoiding overbroad swallowing of successful-but-invalid responses.
- E2E coverage:
  - one-time text/plain 500 mock does not leak into later CSV preview requests,
  - retry recovery still verifies the normal preview state.
- PR status accuracy:
  - confirm latest pushed code head `b6c7ff65403d80fd51c5b6538fcc9423070e3f45` remains green after this handoff-only update.
- Residual staging risk:
  - confirm the handoff is honest that 100/100 cannot be claimed without isolated staging smoke/live evidence.

## 12. Risk Notes
リスク・人間確認が必要な事項：
- This pass touched one Client Component and one E2E flow only; it did not change database schema, auth, permissions, crawler execution, external API behavior, CSV generation, or persisted data.
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
- Before touching Next.js pages, route handlers, or component boundaries, read the relevant local docs under `node_modules/next/dist/docs/`; this pass read the Client Component glossary before editing `csv-import-preview.tsx`.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run in this pass.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- Standing self-score after this pass:
  - Function / screen-transition / no-bug confidence: 99 / 100
  - Daily-use list-generation tool value: 99 / 100
- Remaining reason not 100/100: staging Supabase migration/smoke proof and live external-service validation are still missing from this environment.
