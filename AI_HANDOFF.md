# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 19 (inferred, continued Codex improvement)
- Loop number inferred from: Previous handoff was Loop 19 with `Current owner: Codex`, `Next owner: Claude Code`, and no Claude Code handoff occurred before this continuation. This remains Loop 19.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-08 08:15 +09:00

## 1. Current Goal
This pass continued the standing autonomous improvement goal toward 100/100 on:

- function / screen-transition / no-bug confidence,
- daily-use list-generation tool value.

Focused goal for this pass: harden official site crawling so unsupported successful-status content and malformed PDFs are skipped safely instead of being parsed as HTML or crashing the crawl.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `4677c12ae1a8fdbcd6c878659741bd7ccfdb4cb3` (`Harden official crawler content handling`)
- Previous handoff commit: `a3120febbc9d0613298656845f5b7dd1d1c419df` (`Refresh handoff after LLM output validation`)
- Last known good code commit: `4677c12ae1a8fdbcd6c878659741bd7ccfdb4cb3`, with local `npm.cmd run quality` success, GitHub Actions `quality-gate` success, and CodeRabbit `SUCCESS` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on pushed code head `4677c12ae1a8fdbcd6c878659741bd7ccfdb4cb3`.

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
- Confirmed this pass touched ETL library code only; no Next.js route/page/component changes were made, so no additional Next.js docs were required for the edit.
- Updated the official site crawler:
  - skips unsupported non-text successful responses such as `image/png`,
  - still permits missing content type to preserve existing behavior,
  - treats `application/pdf` responses and `.pdf` URLs as PDFs,
  - catches malformed PDF parse failures and skips the page instead of crashing the crawl,
  - destroys the PDF parser in a `finally` block.
- Added unit coverage for unsupported content and malformed PDF responses.
- Ran targeted checks, the full local quality gate, mock self-evaluation, pushed the code commit, and confirmed CodeRabbit plus GitHub `quality-gate` on the pushed code head.
- Did not change `AGENTS.md` or `CLAUDE.md`; their current guidance already covers the workflow and no new persistent rule was introduced.

## 4. Files Changed
- `src/lib/etl/official-crawler.ts`
  - Adds content-type gating for non-PDF responses and defensive malformed-PDF handling.
- `tests/etl.test.ts`
  - Adds crawler regression coverage for unsupported content and malformed PDFs.
- `AI_HANDOFF.md`
  - Refreshes Loop 19 continuation, verification, CodeRabbit status, optional Bugbot status, and residual risk.

## 5. Current Status
- Local full quality gate is green.
- PR #1 latest pushed code head `4677c12ae1a8fdbcd6c878659741bd7ccfdb4cb3` is green:
  - CodeRabbit: pass / `Review completed`
  - `quality-gate`: pass
- Official site crawling now skips unsupported content types and malformed PDFs without throwing.
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
- Review status: `SUCCESS` / `Review completed` on pushed code head `4677c12ae1a8fdbcd6c878659741bd7ccfdb4cb3`.
- Critical findings: none open on the latest checked code head.
- Resolved findings:
  - Current pass: official site crawler skips unsupported non-text successful responses and malformed PDFs without crashing.
  - Previous Loop 19: LLM extraction output parsing converts malformed JSON and schema drift into stable, explicit failures before downstream enrichment.
  - Previous Loop 19: EDINET documents list fetch validates response/document shape and filters invalid rows before filing selection.
  - Previous Loop 19: HTTP search provider validates response/candidate shape and filters invalid official-URL candidates before scoring.
  - Previous Loop 19: gBizINFO fetch rejects successful-status non-object responses with a clear error before downstream extraction/persistence.
  - Previous Loop 19: CSV export UI rejects successful-status non-CSV responses and shows stable retry guidance instead of downloading an invalid CSV file.
  - Previous Loop 19: malformed/non-multipart mutation request parsing failures return recoverable errors across companies, jobs, lists, and CSV import preview flows.
  - Previous Loop 19: notice/status feedback paths for companies, jobs, lists, generated lists, saved-list details, and CSV import are covered with role-aware tests.
  - Previous Loop 19: shared helpers and regression coverage were added for search params, crawler scoring denominator, EDINET ZIP extraction, saved-list card locators, label derivation, and Git hook installation.
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
  - This pass was a narrow ETL crawler hardening with no auth, DB schema, permissions, payments, destructive data changes, or production-sensitive changes.

## 9. Verification Results
```bash
git status --short --branch
# success before editing: clean on codex/permanent-quality-gate-governance

git log --oneline -5
# success: reviewed recent Loop 19 commits before editing

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before editing: CodeRabbit pass / Review completed; quality-gate pass

gh pr view 1 --repo kotakase2022-jpg/collector --json headRefOid,headRefName,state,isDraft,reviewDecision,url,title
# success before editing: PR #1 open, ready for review

npm.cmd run test -- tests/etl.test.ts -t "official site crawler"
# success: 2 passed, 116 skipped

npm.cmd run typecheck
# success

npm.cmd run lint
# success

npm.cmd run quality
# success: typecheck, lint, test (118 passed), coverage (118 passed), E2E (8 passed), build

npm.cmd run etl:self-evaluate
# success command execution; mock-mode score 83, releaseReady false

git diff --check
# success: no whitespace errors

git commit -m "Harden official crawler content handling"
# success: commit 4677c12; hook passed check:test-integrity, lint, typecheck

git push
# success: pre-push passed check:test-integrity, lint, typecheck, test (118 passed)

gh pr checks 1 --repo kotakase2022-jpg/collector --watch
# success after code push: CodeRabbit pass / Review completed; quality-gate pass
```

## 10. Next Recommended Action
1. Review the focused Loop 19 continuation diff:
   - `src/lib/etl/official-crawler.ts`
   - `tests/etl.test.ts`
   - `AI_HANDOFF.md`
2. Confirm official crawler content handling:
   - unsupported successful-status non-text responses are skipped,
   - malformed PDFs are skipped without throwing,
   - valid HTML/text and valid PDF behavior remains intact.
3. Recheck PR #1 if a new CodeRabbit comment appears after this handoff-only update.
4. If continuing toward 100/100, prefer staging evidence next if credentials are available:
   - apply `202607070001` and `202607070002` to an isolated staging Supabase,
   - handle any duplicate `(name, address)` preflight failure manually,
   - run `npm run smoke:staging`.
5. If staging credentials remain unavailable, continue with one narrow CodeRabbit-friendly improvement; verify current code before trusting stale unresolved-thread listings.

## 11. Suggested Review Scope for Claude Code
- Official crawler content handling:
  - skips unsupported successful-status binary/image responses,
  - skips malformed PDFs without crashing,
  - does not weaken existing crawl/link extraction behavior for normal HTML pages.
- Unit coverage:
  - unsupported content and malformed PDF cases are covered.
- PR status accuracy:
  - confirm latest pushed code head `4677c12ae1a8fdbcd6c878659741bd7ccfdb4cb3` remains green after this handoff-only update.
- Residual staging risk:
  - confirm the handoff is honest that 100/100 cannot be claimed without isolated staging smoke/live evidence.

## 12. Risk Notes
- This pass touched one ETL crawler module and one unit-test section only; it did not change database schema, auth, permissions, crawler scheduling, CSV generation, UI flows, or persisted data.
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
