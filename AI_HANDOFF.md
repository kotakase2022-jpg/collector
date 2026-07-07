# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 19 (inferred, continued Codex improvement)
- Loop number inferred from: Previous handoff was already Loop 19 with `Current owner: Codex`, `Next owner: Claude Code`, and no Claude Code handoff occurred before this continuation. This remains Loop 19.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-08 02:29 +09:00

## 1. Current Goal
今回の目的：

- Continue the standing autonomous improvement goal toward 100/100 on:
  - function / screen-transition / no-bug confidence,
  - daily-use list-generation tool value.
- Keep the diff small and CodeRabbit-friendly.
- Strengthen EDINET ZIP/XBRL extraction regression coverage for the hand-rolled ZIP parser on a critical external-data ingestion path.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `cd9bf64` (`Cover stored EDINET zip fixtures`)
- Last known good commit: `cd9bf64`, with local `npm.cmd run quality` success, GitHub Actions `quality-gate` success, and CodeRabbit `SUCCESS` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on pushed head `cd9bf647d65c2ddcf9c1aba17f7c4b420ea47582`.

## 3. What Was Done
今回完了したこと：

- Read the required project context before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
  - current diff / recent commits / PR status / CodeRabbit status.
- Confirmed this pass did not touch Next.js page/route/component code, so no new local Next.js doc read was required for the edit.
- Verified the older EDINET ZIP test-coverage CodeRabbit nit against current code:
  - `extractXbrlTextFromZip` supports compression method `0` (stored) and `8` (deflate),
  - existing fixture coverage only exercised method `8`.
- Updated the local ZIP fixture builder in `tests/etl.test.ts` to generate either stored (`0`) or deflated (`8`) entries.
- Expanded the EDINET ZIP extraction regression test to assert both `.xbrl` deflated archives and `.xml` stored archives extract the expected XBRL/XML body.
- Kept production EDINET parsing code unchanged; this was a test-only regression hardening pass.
- Ran targeted test, typecheck, lint, the full local quality gate, mock self-evaluation, pushed the code commit, and confirmed PR checks.
- Did not change `AGENTS.md` or `CLAUDE.md`; their current guidance already covers the workflow and no new persistent rule was introduced.

## 4. Files Changed
主な変更ファイル：

- `tests/etl.test.ts`
  - Adds stored ZIP fixture coverage for `extractXbrlTextFromZip`.
  - Extends `createZipFixture` with an explicit `0 | 8` compression method parameter.
- `AI_HANDOFF.md`
  - Refreshes Loop 19 continuation, verification, CodeRabbit status, optional Bugbot status, and residual risk.

## 5. Current Status
現在の状態：

- Local full quality gate is green.
- PR #1 latest pushed code head `cd9bf64` is green:
  - `quality-gate`: pass
  - CodeRabbit: pass / `Review completed`
- EDINET ZIP extraction now has fixture coverage for both supported ZIP compression methods.
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

- Review status: `SUCCESS` / `Review completed` on pushed head `cd9bf647d65c2ddcf9c1aba17f7c4b420ea47582`.
- Critical findings: none open.
- Resolved findings:
  - Current pass: EDINET ZIP extraction has fixture coverage for both supported compression methods `0` and `8`.
  - Previous Loop 19: saved-list card E2E locator no longer depends on Tailwind utility classes or ancestor XPath; the app exposes a stable card test id.
  - Previous Loop 19: `src/app/companies/page.tsx` no longer duplicates employee/revenue range labels by index; labels are sourced directly from the validation option arrays, with regression coverage.
  - Previous Loop 19: git hook installer tolerates a missing Git executable and has regression coverage.
  - Previous Loop 19: crawler score denominator derives from the same weight map used by score components; exact regression coverage was added.
  - Previous Loop 18: queue crawl RPC execute privileges are restricted to `service_role`; regression coverage enforces the ACL and pinned `search_path`.
  - Previous Loop 18: fallback company upsert has schema-backed `name,address` uniqueness.
  - Earlier Loop 18 findings remain in place: comparison export limits, EDINET lookup, release gates, coverage queue uniqueness, server route error logging, and CSV import source row numbering.
- Deferred findings:
  - Low-risk maintainability nits may still exist in older CodeRabbit comments, but CodeRabbit status is currently passing on the latest head. Claude Code should review any newly posted comments first.
- False positives / not applicable:
  - The older saved-list CSV filename nit is already addressed in current code by `sanitizeDownloadFileName` in `src/app/lists/[id]/page.tsx`.
  - The older `job-actions.ts` duplication nit is already addressed in current code by `updateJobIfStatusIn`.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：

- Status: Not run.
- Findings: none.
- Actions taken: none.
- Rationale: CodeRabbit OSS was available and passed on the pushed head. This pass was a narrow test-only EDINET regression improvement with no auth, DB writes, permissions, payments, deletion, or production-sensitive changes.

## 9. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success before editing: clean on codex/permanent-quality-gate-governance

gh pr view 1 --repo kotakase2022-jpg/collector --json number,title,url,isDraft,headRefName,headRefOid,statusCheckRollup,reviews,body
# success: PR #1 open, ready for review, latest head checked before editing was 3c4b211

npm.cmd run test -- tests/etl.test.ts -t "EDINET ZIP"
# success: 1 passed, 110 skipped

npm.cmd run typecheck
# success

npm.cmd run lint
# success

npm.cmd run quality
# success: typecheck, lint, test (111 passed), coverage (111 passed), E2E (8 passed), build

npm.cmd run etl:self-evaluate
# success command execution; mock-mode score 83, releaseReady false

git diff --check
# success: no whitespace errors

git commit -m "Cover stored EDINET zip fixtures"
# success: commit cd9bf64; hook passed check:test-integrity, lint, typecheck

git push
# success: pre-push passed check:test-integrity, lint, typecheck, test (111 passed)

gh run watch 28885646091 --repo kotakase2022-jpg/collector --interval 10 --exit-status
# success: GitHub Actions quality-gate passed in 2m19s

gh pr checks 1 --repo kotakase2022-jpg/collector
# success after push: CodeRabbit pass / Review completed; quality-gate pass
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the focused Loop 19 continuation diff:
   - `tests/etl.test.ts`
   - `AI_HANDOFF.md`
2. Confirm the test-only EDINET fixture change accurately covers both supported ZIP compression methods without changing runtime code.
3. Recheck PR #1 if a new CodeRabbit comment appears after this handoff-only update.
4. If continuing toward 100/100, prefer staging evidence next if credentials are available:
   - apply `202607070001` and `202607070002` to an isolated staging Supabase,
   - handle any duplicate `(name, address)` preflight failure manually,
   - run `npm run smoke:staging`.
5. If staging credentials remain unavailable, continue with one narrow CodeRabbit-friendly improvement; verify current code before trusting stale unresolved-thread listings.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- EDINET ZIP fixture coverage:
  - stored method `0` uses raw bytes,
  - deflated method `8` uses `deflateRawSync`,
  - both local and central directory headers record the same compression method.
- Regression scope:
  - runtime EDINET code is unchanged,
  - the full quality gate still passes.
- PR status accuracy:
  - confirm latest pushed code head `cd9bf64` remains green after any handoff-only update.
- Residual staging risk:
  - confirm the handoff is honest that 100/100 cannot be claimed without isolated staging smoke/live evidence.

## 12. Risk Notes
リスク・人間確認が必要な事項：

- This pass touched only EDINET tests; no database schema, server actions, auth, permissions, crawler execution, or external API behavior changed.
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

- Before touching Next.js pages, route handlers, or component boundaries, read the relevant local docs under `node_modules/next/dist/docs/`; this pass did not touch Next.js code.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- Standing self-score after this pass:
  - Function / screen-transition / no-bug confidence: 99 / 100
  - Daily-use list-generation tool value: 99 / 100
- Remaining reason not 100/100: staging Supabase migration/smoke proof and live external-service validation are still missing from this environment.
