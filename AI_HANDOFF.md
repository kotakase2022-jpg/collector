# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 19 (inferred, continued Codex improvement)
- Loop number inferred from: Previous handoff was Loop 19 with `Current owner: Codex`, `Next owner: Claude Code`, and no Claude Code handoff occurred before this continuation. This remains Loop 19.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-08 09:22 +09:00

## 1. Current Goal
今回の目的：

- Continue the standing autonomous improvement goal toward 100/100 for function / screen-transition / no-bug confidence and daily-use list-generation tool value.
- Focused pass goal: harden the CSV import preview client against malformed successful JSON responses, so the list-generation workflow shows the existing recovery message instead of risking a render crash when an intermediary or server regression returns an unexpected shape.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `00891543a8336416ef04f35af24ddac5db62154c` (`Guard CSV import preview responses`)
- Previous handoff commit before this update: `7b9dd7d05a78b98bc8f0268e9eeb298daf4e9dd7` (`Refresh handoff after CSV duplicate column UI`)
- Last known good code commit: `00891543a8336416ef04f35af24ddac5db62154c`, with local `npm.cmd run quality` success, GitHub Actions `quality-gate` success, and CodeRabbit `pass` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `pass` / `Review completed` on pushed code head `00891543a8336416ef04f35af24ddac5db62154c`.

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
- Reviewed current CodeRabbit/Bugbot-related PR comments against current code:
  - retry/stop route error logging is already present,
  - `job-actions.ts` guarded-update duplication is already consolidated,
  - self-evaluation release gate already uses explicit `blocksRelease`.
- Read the relevant local Next.js docs before touching the client component:
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`
- Updated CSV import preview client response handling:
  - validates successful JSON before treating it as `CsvImportPreview`,
  - accepts typed `{ error?: string }` error payloads,
  - converts malformed or non-JSON responses to the existing generic recovery message,
  - preserves normal success, 400/500, file-change, and CSV preview behavior.
- Added E2E coverage for a `200 application/json` malformed import-preview response and verified the user can recover by selecting a valid CSV afterward.
- Ran focused checks, full local `npm.cmd run quality`, mock self-evaluation, pushed the code commit, and confirmed CodeRabbit plus GitHub `quality-gate` on the pushed code head.
- Did not change `AGENTS.md` or `CLAUDE.md`; their current guidance already covers this workflow and no new persistent rule was introduced.

## 4. Files Changed
主な変更ファイル：

- `src/components/app/csv-import-preview.tsx`
  - Adds runtime shape guards for CSV import preview responses.
- `e2e/collector.spec.ts`
  - Verifies malformed successful import-preview JSON shows the recovery message and does not block subsequent valid preview runs.
- `AI_HANDOFF.md`
  - Refreshes Loop 19 continuation, verification, CodeRabbit status, optional Bugbot status, and residual risk.

## 5. Current Status
現在の状態：

- Local full quality gate is green.
- PR #1 latest pushed code head `00891543a8336416ef04f35af24ddac5db62154c` is green:
  - CodeRabbit: pass / `Review completed`
  - `quality-gate`: pass
- CSV upload preview now fails closed to the existing user-facing recovery message if a successful HTTP response has the wrong JSON shape.
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

- Review status: `pass` / `Review completed` on pushed code head `00891543a8336416ef04f35af24ddac5db62154c`.
- Critical findings: none open on the latest checked code head.
- Resolved findings:
  - Current pass: CSV import preview client validates response shape and E2E covers malformed successful JSON recovery.
  - Previous Loop 19: CSV import preview duplicate canonical headers are visible in result metrics/details and covered by E2E.
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
  - The older self-evaluation release-gate and duplicate-helper nits are already addressed in current code.
  - The older saved-list CSV filename nit is already addressed in current code by `sanitizeDownloadFileName` in `src/app/lists/[id]/page.tsx`.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：

- Status: Not run in this pass.
- Findings: none newly requested or newly run in this pass.
- Actions taken:
  - Preserved CodeRabbit OSS as the standard reviewer.
- Rationale:
  - CodeRabbit OSS was available and passed on the pushed code head.
  - This pass was a narrow CSV import preview client resilience/test improvement with no auth, DB schema, permissions, payments, destructive data changes, or production-sensitive changes.

## 9. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success before editing: clean on codex/permanent-quality-gate-governance

git log --oneline -8
# success: reviewed recent Loop 19 commits before editing

gh pr view 1 --repo kotakase2022-jpg/collector --json headRefOid,headRefName,state,isDraft,reviewDecision,url,title,statusCheckRollup
# success before editing: PR #1 open, ready for review, head 7b9dd7d, CodeRabbit pass, quality-gate pass

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before editing: CodeRabbit pass / Review completed; quality-gate pass

npm.cmd run typecheck
# success

npm.cmd run lint
# success

npm.cmd run test:e2e -- --grep "list generation supports conditions"
# first run failed because the new test reused the same selected file and the browser did not fire a change event; test was corrected to select a different fixture before recovery.
# success after correction: 1 passed

git diff --check
# success: no whitespace errors

npm.cmd run quality
# success: typecheck, lint, test (121 passed), coverage (121 passed), E2E (8 passed), build

npm.cmd run etl:self-evaluate
# success command execution; mock-mode score 83, releaseReady false

git commit -m "Guard CSV import preview responses"
# success: commit 0089154; hook passed check:test-integrity, lint, typecheck

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
   - `AI_HANDOFF.md`
2. Confirm CSV import preview malformed-response behavior:
   - non-JSON and 500 responses still show the existing recovery message,
   - malformed `200 application/json` responses also show the recovery message,
   - selecting a valid CSV afterward clears the alert and renders the normal preview.
3. Recheck PR #1 if a new CodeRabbit comment appears after this handoff-only update.
4. If continuing toward 100/100, prefer staging evidence next if credentials are available:
   - apply `202607070001` and `202607070002` to an isolated staging Supabase,
   - handle any duplicate `(name, address)` preflight failure manually,
   - run `npm run smoke:staging`.
5. If staging credentials remain unavailable, continue with one narrow CodeRabbit-friendly improvement; verify current code before trusting stale unresolved-thread listings.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- CSV import preview client guards:
  - shape guard is strict enough to prevent render crashes,
  - error payload guard still preserves server-provided error messages,
  - no unnecessary `any` or swallowed failures were introduced.
- E2E coverage:
  - malformed success response is covered,
  - recovery after selecting a valid CSV is covered by the existing subsequent normal-preview assertions.
- PR status accuracy:
  - confirm latest pushed code head `00891543a8336416ef04f35af24ddac5db62154c` remains green after this handoff-only update.
- Residual staging risk:
  - confirm the handoff is honest that 100/100 cannot be claimed without isolated staging smoke/live evidence.

## 12. Risk Notes
リスク・人間確認が必要な事項：

- This pass touched a client response parser and one E2E flow only; it did not change database schema, auth, permissions, crawler scheduling, CSV parsing behavior, route behavior, or persisted data.
- Runtime shape validation is intentionally local to the CSV preview client. It is not a generalized API schema layer.
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
