# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 19 (inferred, continued Codex improvement)
- Loop number inferred from: Previous handoff was Loop 19 with `Current owner: Codex`, `Next owner: Claude Code`, and no Claude Code handoff occurred before this continuation. This remains Loop 19.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-08 08:55 +09:00

## 1. Current Goal
This pass continued the standing autonomous improvement goal toward 100/100 on:

- function / screen-transition / no-bug confidence,
- daily-use list-generation tool value.

Focused goal for this pass: improve CSV upload preview clarity by detecting duplicate canonical headers, so spreadsheet exports with multiple columns that map to the same app field are surfaced before users trust or reuse the imported list data.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `eee9cd434d2d593062b1efb826b1dad548ca1c1b` (`Report duplicate CSV import columns`)
- Previous handoff commit: `53cef5afb11bd99a421ce97b3bd10d8a3089727a` (`Refresh handoff after crawler size limit`)
- Last known good code commit: `eee9cd434d2d593062b1efb826b1dad548ca1c1b`, with local `npm.cmd run quality` success, GitHub Actions `quality-gate` success, and CodeRabbit `SUCCESS` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on pushed code head `eee9cd434d2d593062b1efb826b1dad548ca1c1b`.

## 3. What Was Done
- Re-read required project context before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
  - current diff / recent commits / PR status / CodeRabbit status.
- Confirmed the PR was green before editing:
  - CodeRabbit: pass / `Review completed`
  - GitHub Actions `quality-gate`: pass
- Confirmed this pass touched CSV/list-quality library code and tests only; no Next.js route/page/component changes were made, so no additional Next.js docs were required for the edit.
- Updated CSV import preview:
  - adds `duplicateColumns` to the preview model,
  - detects multiple uploaded headers that resolve to the same canonical app column,
  - surfaces duplicate canonical columns in readiness issues as `列重複 ...`,
  - preserves existing first-non-empty value behavior for row preview data.
- Added focused unit coverage for duplicate canonical headers such as `corporate_number` plus `corporateNumber`.
- Ran targeted checks, the full local quality gate, mock self-evaluation, pushed the code commit, and confirmed CodeRabbit plus GitHub `quality-gate` on the pushed code head.
- Did not change `AGENTS.md` or `CLAUDE.md`; their current guidance already covers the workflow and no new persistent rule was introduced.

## 4. Files Changed
- `src/lib/csv-import-preview.ts`
  - Adds `duplicateColumns` to `CsvImportPreview` and readiness issues.
- `src/lib/list-quality.ts`
  - Detects duplicate canonical CSV headers during import preview parsing.
- `tests/etl.test.ts`
  - Adds regression coverage for duplicate canonical CSV headers.
- `AI_HANDOFF.md`
  - Refreshes Loop 19 continuation, verification, CodeRabbit status, optional Bugbot status, and residual risk.

## 5. Current Status
- Local full quality gate is green.
- PR #1 latest pushed code head `eee9cd434d2d593062b1efb826b1dad548ca1c1b` is green:
  - CodeRabbit: pass / `Review completed`
  - `quality-gate`: pass
- CSV upload preview now warns when multiple uploaded headers map to the same canonical field.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.
- App remains locally in mock/fallback mode because isolated staging Supabase credentials are not configured.

## 6. Known Issues
- Neither `202607070001_queue_crawl_jobs_rpc.sql` nor `202607070002_company_fallback_unique_index.sql` has been applied to a real isolated staging Supabase project from this environment.
- If any database already received the original `202607070001` migration before the ACL revokes were added, the three revoke statements must be applied manually on that database.
- If staging already contains duplicate `(name, address)` company rows, `202607070002_company_fallback_unique_index.sql` intentionally fails with a preflight error; duplicates must be reviewed/merged manually before adding the unique index.
- Live/staging Supabase smoke was not run because isolated staging credentials are absent.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run verify` does not exist; `npm run quality` is the canonical full gate.
- `npm.cmd run etl:self-evaluate` remains mock-mode only in this environment and reports score `83` / `releaseReady: false`.

## 7. CodeRabbit Review
- Review status: `SUCCESS` / `Review completed` on pushed code head `eee9cd434d2d593062b1efb826b1dad548ca1c1b`.
- Critical findings: none open on the latest checked code head.
- Resolved findings:
  - Current pass: CSV import preview reports duplicate canonical headers before users trust ambiguous imported list data.
  - Previous Loop 19: official site crawler skips oversized successful responses before parsing/storing HTML or PDF content.
  - Previous Loop 19: robots.txt loading fails closed when a successful response is explicit non-`text/plain` content, including binary/image and HTML responses.
  - Previous Loop 19: official site crawler skips unsupported non-text successful responses and malformed PDFs without crashing.
  - Previous Loop 19: LLM extraction output parsing converts malformed JSON and schema drift into stable, explicit failures before downstream enrichment.
  - Previous Loop 19: EDINET documents list fetch validates response/document shape and filters invalid rows before filing selection.
  - Previous Loop 19: HTTP search provider validates response/candidate shape and filters invalid official-URL candidates before scoring.
  - Previous Loop 19: gBizINFO fetch rejects successful-status non-object responses with a clear error before downstream extraction/persistence.
  - Previous Loop 19: CSV export/import and malformed mutation request recovery paths were hardened with unit/E2E coverage.
  - Previous Loop 19: notice/status feedback paths and selected helper regressions were covered for companies, jobs, lists, generated lists, saved-list details, search params, crawler scoring, EDINET ZIP extraction, label derivation, and Git hook installation.
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
- Status: Not run in this pass.
- Findings: none newly requested or newly run in this pass.
- Actions taken:
  - Preserved historical Bugbot status in this handoff and kept CodeRabbit OSS as the standard reviewer.
- Rationale:
  - CodeRabbit OSS was available and passed on the pushed code head.
  - This pass was a narrow CSV import preview quality improvement with no auth, DB schema, permissions, payments, destructive data changes, or production-sensitive changes.

## 9. Verification Results
```bash
git status --short --branch
# success before editing: clean on codex/permanent-quality-gate-governance

git log --oneline -8
# success: reviewed recent Loop 19 commits before editing

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before editing: CodeRabbit pass / Review completed; quality-gate pass

gh pr view 1 --repo kotakase2022-jpg/collector --json headRefOid,headRefName,state,isDraft,reviewDecision,url,title
# success before editing: PR #1 open, ready for review

npm.cmd run test -- tests/etl.test.ts -t "CSV upload preview"
# success: 4 passed, 117 skipped

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

git commit -m "Report duplicate CSV import columns"
# success: commit eee9cd4; hook passed check:test-integrity, lint, typecheck

git push
# success: pre-push passed check:test-integrity, lint, typecheck, test (121 passed)

gh pr checks 1 --repo kotakase2022-jpg/collector --watch
# success after code push: CodeRabbit pass / Review completed; quality-gate pass
```

## 10. Next Recommended Action
1. Review the focused Loop 19 continuation diff:
   - `src/lib/csv-import-preview.ts`
   - `src/lib/list-quality.ts`
   - `tests/etl.test.ts`
   - `AI_HANDOFF.md`
2. Confirm CSV duplicate-column behavior:
   - duplicate canonical headers are reported in `duplicateColumns`,
   - readiness issues show `列重複 ...`,
   - existing row preview value selection remains stable.
3. Recheck PR #1 if a new CodeRabbit comment appears after this handoff-only update.
4. If continuing toward 100/100, prefer staging evidence next if credentials are available:
   - apply `202607070001` and `202607070002` to an isolated staging Supabase,
   - handle any duplicate `(name, address)` preflight failure manually,
   - run `npm run smoke:staging`.
5. If staging credentials remain unavailable, continue with one narrow CodeRabbit-friendly improvement; verify current code before trusting stale unresolved-thread listings.

## 11. Suggested Review Scope for Claude Code
- CSV import preview duplicate-column handling:
  - detects alias-based canonical duplicates,
  - exposes a visible readiness issue through existing readiness rendering,
  - keeps existing row-level validation, URL normalization, dangerous-value detection, and duplicate corporate-number checks intact.
- Unit coverage:
  - duplicate canonical headers are covered.
- PR status accuracy:
  - confirm latest pushed code head `eee9cd434d2d593062b1efb826b1dad548ca1c1b` remains green after this handoff-only update.
- Residual staging risk:
  - confirm the handoff is honest that 100/100 cannot be claimed without isolated staging smoke/live evidence.

## 12. Risk Notes
- This pass touched CSV preview metadata/parsing and one unit-test section only; it did not change database schema, auth, permissions, crawler scheduling, CSV export generation, route behavior, or persisted data.
- `duplicateColumns` is a new response field. Existing clients that ignore unknown fields remain compatible; current UI readiness rendering uses the new issue through the shared readiness helper.
- No production or staging database was touched in this pass.
- Migration `202607070001_queue_crawl_jobs_rpc.sql` was edited in a previous pass based on the statement that it has not been applied to any real Supabase project. If it has been applied anywhere, manually run the added revoke statements there.
- Migration `202607070002_company_fallback_unique_index.sql` is intentionally non-destructive; duplicate `(name, address)` rows require human review before the index can be added.
- Remaining reason not to claim 100/100: no isolated staging Supabase migration/smoke evidence and no live external-service validation are available from this environment.

## 13. Do Not Touch
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not apply migrations to production without maintainer sign-off.
- Do not remove or weaken tests to make checks pass.
- Do not force-push.
- Do not weaken the RPC ACL pattern for new `create function` migrations.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 14. Notes for Claude Code
- Before touching Next.js pages, route handlers, or component boundaries, read the relevant local docs under `node_modules/next/dist/docs/`; this pass did not edit Next.js files.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run in this pass.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- Standing self-score after this pass:
  - Function / screen-transition / no-bug confidence: 99 / 100
  - Daily-use list-generation tool value: 99 / 100
- Remaining reason not 100/100: staging Supabase migration/smoke proof and live external-service validation are still missing from this environment.
