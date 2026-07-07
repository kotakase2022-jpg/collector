# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 18 (inferred, Codex close-out after Claude Code review)
- Loop number inferred from: The previous handoff had `Current owner: Claude Code`, `Next owner: Codex`, and `Loop: 18 (inferred)`. That handoff asked Codex to commit/push Claude Code's queue-RPC ACL fix before starting a fresh development sub-task. This pass completed that Loop 18 close-out rather than advancing to a new feature loop.
- Phase: Handoff
- Last updated: 2026-07-08 01:37 +09:00

## 1. Current Goal
今回の目的：

- Commit, push, and verify Claude Code's Loop 18 security fix for the `queue_crawl_jobs` RPC ACL hardening.
- Keep CodeRabbit OSS as the standard PR reviewer and keep Cursor Bugbot optional/reserve only.
- Preserve the standing improvement goal toward 100/100 function/no-bug confidence and daily-use list-generation value without broadening this pass beyond the pending security handoff.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `7d879da` (`Harden crawl job queue RPC grants`)
- Last known good commit: `7d879da`, with local `npm run quality` success and PR checks green (`quality-gate` pass, CodeRabbit `SUCCESS` / `Review completed`).
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on pushed head `7d879da`.

## 3. What Was Done
今回完了したこと：

- Read the required project context before acting: `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, current diff, recent commits, PR state, and CodeRabbit/check status.
- Confirmed Claude Code's uncommitted diff matched the prior handoff:
  - Add explicit `revoke execute` statements for `public`, `anon`, and `authenticated` on `public.queue_crawl_jobs(jsonb)`.
  - Keep `grant execute ... to service_role`.
  - Add a regression test that locks the RPC ACL and pinned `search_path`.
  - Add the project rule to `AGENTS.md` so future `create function` migrations do not rely on PostgreSQL's default PUBLIC execute behavior.
- Ran focused verification and the full local quality gate before committing.
- Committed the fix as `7d879da` (`Harden crawl job queue RPC grants`) and pushed it to PR #1.
- Waited for PR checks; `quality-gate` passed and CodeRabbit completed successfully on the pushed head.
- Updated this handoff for Claude Code with final verification and review status.

## 4. Files Changed
主な変更ファイル：

- `AGENTS.md`
  - Documents the required RPC migration ACL pattern: revoke execute from `public`, `anon`, and `authenticated`; grant only `service_role`.
- `supabase/migrations/202607070001_queue_crawl_jobs_rpc.sql`
  - Adds explicit execute revokes before the service-role grant.
- `tests/etl.test.ts`
  - Adds `coverage queue RPC migration restricts execution to service_role`.
- `AI_HANDOFF.md`
  - Refreshes Loop 18 close-out, verification results, CodeRabbit status, risks, and next action.

## 5. Current Status
現在の状態：

- Local full quality gate is green.
- PR #1 latest pushed head is green:
  - `quality-gate`: pass
  - CodeRabbit: pass / `Review completed`
- Working branch has the Claude Code security fix committed and pushed.
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
- `npm run etl:self-evaluate` remains mock-mode only in this environment and previously reported score `83` / `releaseReady: false`.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：

- Review status: `SUCCESS` / `Review completed` on pushed head `7d879da`.
- Critical findings: none open.
- Resolved findings:
  - Queue crawl RPC now explicitly revokes execute from `public`, `anon`, and `authenticated`, and grants only `service_role`.
  - Regression coverage now enforces the queue RPC ACL and pinned `search_path`.
  - Previously resolved Loop 18 findings remain in place: fallback company upsert has schema-backed `name,address` uniqueness, comparison export limits were clarified, EDINET lookup was broadened, release gates were made explicit, coverage queue uniqueness was added, and server route error logging was improved.
- Deferred findings: none for this pass.
- False positives / not applicable: none for this pass.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：

- Status: Not run.
- Findings: none.
- Actions taken: none.
- Rationale: CodeRabbit OSS was available, completed successfully on the pushed head, and the DB/RPC security fix is covered by a focused regression test. Bugbot remains optional/reserve only unless a maintainer requests a second review or CodeRabbit becomes inconclusive.

## 9. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success: confirmed Claude Code's pending diff before commit; clean except this final handoff update after the pushed fix

git diff --check
# success: no whitespace errors

npm.cmd run typecheck
# success

npm.cmd run lint
# success

npm.cmd run test -- tests/etl.test.ts -t "RPC migration restricts execution"
# success: 1 passed, 109 skipped

npm.cmd run quality
# success: typecheck, lint, test (110 passed), coverage (110 passed), E2E (8 passed), build

git commit -m "Harden crawl job queue RPC grants"
# success: commit 7d879da; hook passed check:test-integrity, lint, typecheck

git push origin codex/permanent-quality-gate-governance
# success: pre-push passed check:test-integrity, lint, typecheck, test (110 passed)

gh pr checks 1 --repo kotakase2022-jpg/collector --watch --interval 10
# success: CodeRabbit pass / Review completed; quality-gate pass on head 7d879da
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the focused Loop 18 close-out diff:
   - `AGENTS.md`
   - `supabase/migrations/202607070001_queue_crawl_jobs_rpc.sql`
   - `tests/etl.test.ts`
   - `AI_HANDOFF.md`
2. Confirm the RPC ACL pattern is now correct and should remain the standard for all future `create function` migrations.
3. Recheck PR #1 if GitHub/CodeRabbit posted anything after this handoff-only update.
4. If continuing toward 100/100, prefer staging evidence next:
   - apply `202607070001` and `202607070002` to an isolated staging Supabase,
   - handle any duplicate `(name, address)` preflight failure manually,
   - run `npm run smoke:staging`.
5. If staging credentials are still unavailable, start Loop 19 with one narrow improvement and keep the diff reviewable.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- Confirm the queue RPC migration now matches the saved-list RPC security posture.
- Confirm the new regression test is strict enough to catch future accidental omission of `public` / `anon` / `authenticated` revokes.
- Confirm `AGENTS.md` wording is clear and not broader than intended.
- Confirm no additional CodeRabbit comments appeared after the latest push.

## 12. Risk Notes
リスク・人間確認が必要な事項：

- Migration `202607070001_queue_crawl_jobs_rpc.sql` was edited in place based on the prior handoff's statement that it has not been applied to any real Supabase project. If it has been applied anywhere, manually run the added revoke statements there.
- Migration `202607070002_company_fallback_unique_index.sql` is intentionally non-destructive; duplicate `(name, address)` rows require human review before the index can be added.
- No production or staging database was touched in this pass.
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

- This pass did not touch Next.js code, so no Next.js docs were needed beyond the required project read.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- When starting fresh development after this review, advance to Loop 19.
