# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Claude Code
- Next owner: Codex
- Loop: 18 (inferred)
- Loop number inferred from: The prior handoff was labeled `Loop: 18 (inferred, continued Codex phase)` with `Current owner: Codex`, `Next owner: Claude Code`. Per the rule "if the previous Current owner was Codex and Next owner was Claude Code, treat it as the same loop's Claude Code phase", this Claude Code review is Loop 18's review phase, now handing back to Codex.
- Phase: Autonomous Review / Fix / Verification / Handoff
- Last updated: 2026-07-07 (Claude Code autonomous review cycle, Loop 18)

## 1. Current Goal
今回の目的：

- Continue the standing autonomous improvement goal (function/no-bug and daily-use list-generation both toward 100/100), preserving the review-cost policy: CodeRabbit OSS is the standard PR reviewer; Cursor Bugbot is optional/reserve only.
- This loop's Codex work under review: back the fallback company upsert (`onConflict: "name,address"`) with a real schema-side unique index (`companies_name_address_uidx`, `nulls not distinct`), with a non-destructive duplicate-preflight migration for existing databases.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit at review start: `8061098` (`Refresh handoff after fallback uniqueness`, handoff-only) on top of implementation commit `16875a8` (`Back fallback company upserts with unique index`).
- Reviewed change set: `16875a8` in detail, plus a security spot-check of earlier unreviewed Loop 18 DB work (`202607070001_queue_crawl_jobs_rpc.sql`).
- Last known good commit: working tree after this Claude Code pass (16875a8 + queue-RPC ACL fix), verified locally by full quality gate (see section 11).
- PR: ready-for-review PR #1 — https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on pushed head `16875a8` (PR is no longer Draft — the long-standing Draft blocker is resolved). Recheck after the next push containing this pass's fix.

## 3. What Was Reviewed
レビューした内容：

- `16875a8` (this pass's subject), end-to-end:
  - `src/lib/etl/store.ts`: `companyUpsertConflictTarget` extraction — behavior-identical to the prior inline ternary, now testable. OK.
  - `supabase/migrations/202607030001_initial_schema.sql`: fresh-schema `companies_name_address_uidx` unique index with `nulls not distinct`. Verified this is valid PostgreSQL 15+ syntax (Supabase runs PG15+), that `ON CONFLICT (name, address)` inference works against a NULLS-NOT-DISTINCT unique index, and that this fixes a real latent bug: the previous fallback upsert had NO backing uniqueness rule, so it would have failed at runtime against a real database with "no unique or exclusion constraint matching the ON CONFLICT specification".
  - `supabase/migrations/202607070002_company_fallback_unique_index.sql`: duplicate preflight uses `GROUP BY name, address`, whose NULL-equality semantics match `nulls not distinct` — consistent. Fails loudly instead of deleting/merging/choosing a winner. Good, non-destructive design.
  - `tests/etl.test.ts`: regression coverage locks the conflict-target selection and the presence of the index in both migrations.
- Security spot-check of earlier unreviewed Loop 18 DB work: `202607070001_queue_crawl_jobs_rpc.sql` (partial unique index + `queue_crawl_jobs` RPC). The RPC design is sound (job_type allowlist, `distinct on` batch dedup, `on conflict do nothing`, `security definer` with pinned `search_path`), but it had a missing ACL hardening — see section 4.

## 4. What Was Fixed
修正した内容：

- **Security fix (1件)**: `supabase/migrations/202607070001_queue_crawl_jobs_rpc.sql` granted `execute` to `service_role` but did NOT revoke the PostgreSQL default `PUBLIC` execute privilege. Since PostgREST exposes functions to anon/authenticated and the function is `security definer`, an anonymous client could have called `/rest/v1/rpc/queue_crawl_jobs` and flooded the crawl queue, contradicting the README policy that RPCs are service_role-only. Fixed by adding the same three `revoke execute ... from public / anon / authenticated` lines used by the saved-list RPC migrations (existing repo pattern).
- Added a regression test (`coverage queue RPC migration restricts execution to service_role`) mirroring the existing saved-list RPC ACL test, also asserting `set search_path = public` is pinned.
- Editing the migration file in place is safe because the handoff explicitly states this migration has not been applied to any real Supabase project yet. If anyone HAS applied the original version somewhere, the three revoke statements must be run there manually (see section 12).
- `16875a8` itself required no changes.

## 5. Review / Fix Cycles Completed
実行したサイクル：
- Cycle 1 (Baseline Verification): Inspected git status/log and the `16875a8` diff; working tree clean (tip handoff-only). Ran typecheck, lint, test — all green; handoff matches implementation state. Noted PR #1 is now ready-for-review with CodeRabbit `SUCCESS / Review completed`.
- Cycle 2 (CodeRabbit Review Handling): No open CodeRabbit findings on the latest head. Verified Codex's implementation of the previously resolved fallback-uniqueness finding is correct (index semantics, preflight consistency).
- Cycle 3 (Critical Fix): Found and fixed the missing `revoke` ACL hardening on the `queue_crawl_jobs` RPC migration (security/data-integrity). Re-ran typecheck/lint/test after the fix — all green (110 tests).
- Cycle 4 (Regression & UX Check): Verified the NULLS-NOT-DISTINCT index + preflight consistency, conflict-target inference, no destructive migration behavior, no removed tests, no `any`, no swallowed errors. Full build + E2E green.
- Cycle 5 (Handoff Hardening): Updated `AI_HANDOFF.md`; `AGENTS.md` / `CLAUDE.md` reviewed, no changes needed.

## 6. Files Changed
主な変更ファイル：

- `supabase/migrations/202607070001_queue_crawl_jobs_rpc.sql` (Claude Code: added public/anon/authenticated execute revokes before the service_role grant).
- `tests/etl.test.ts` (Claude Code: added the queue-RPC ACL regression test).
- `AI_HANDOFF.md` (this handoff update).
- Codex's `16875a8` change set stands as-is (no modifications).

## 7. Current Status
現在の状態：

- Full local quality gate is green after the fix: typecheck, lint, test (110 passed), coverage-equivalent suite, build, E2E (8 passed).
- Working tree contains this pass's uncommitted changes (migration ACL fix + test + handoff); commit/push them before or at the start of the next Codex pass so CodeRabbit and quality-gate can re-run.
- PR #1 is ready-for-review; CodeRabbit `SUCCESS / Review completed` on `16875a8` (pre-fix head).
- App runs in mock/fallback mode locally (Supabase credentials not configured).
- No production DB/API/deploy actions; no secrets read/printed/committed; no migration was applied to any database.

## 8. Known Issues
既知の問題：

- This pass's queue-RPC ACL fix is uncommitted; it must be committed and pushed, then CodeRabbit/quality-gate rechecked on the new head.
- Neither `202607070001` (queue RPC, now ACL-hardened) nor `202607070002` (fallback unique index) has been applied to a real staging Supabase project from this environment.
- If staging/production data already contains duplicate `(name, address)` company rows, migration `202607070002` intentionally fails with a preflight error; duplicates must be reviewed/merged manually first.
- Live/staging Supabase smoke not run (isolated staging credentials absent); live EDINET/gBizINFO enrichment paths unverified against real services.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` reports mock-mode score 83 / `releaseReady: false` (Supabase unset; mock jobs include 1 failed + 1 running).

## 9. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：

- Review status: PR #1 is ready-for-review; CodeRabbit `SUCCESS` / `Review completed` on pushed head `16875a8`. The multi-loop Draft-skip blocker is resolved. Status for the head containing this pass's ACL fix is pending until pushed.
- Critical findings: none open.
- Resolved findings: fallback company upsert now schema-backed (`16875a8`, verified correct this pass); earlier Loop 18 resolutions (comparison-export limits, EDINET lookup window, evaluation gates, coverage-queue uniqueness, route error logging) remain in place.
- Deferred findings: none.
- False positives / not applicable: none.
- Claude Code addition beyond CodeRabbit: the queue-RPC PUBLIC-execute gap (section 4) was not flagged by CodeRabbit; it is fixed and test-locked.

## 10. Optional Bugbot Findings
Cursor Bugbotの任意確認：

- Status: Not run.
- Rationale: CodeRabbit completed successfully on the latest pushed head, and the one security gap found by manual review is already fixed and test-locked. No inconclusive findings remain that would justify the reserve reviewer's cost. If a maintainer wants extra assurance on the DB/RPC surface (`store.ts`, the two new migrations), an optional Bugbot pass is a reasonable supplemental check.
- Findings: none.
- Actions taken: none.

## 11. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch   # clean at start (tip 8061098); now carries this pass's fix + handoff
npm run typecheck             # success (tsc --noEmit) — before and after the fix
npm run lint                  # success (eslint --max-warnings=0) — before and after the fix
npm run test                  # success: quality guard passed; 110 tests passed (incl. new ACL regression test)
npm run build                 # success (next build; all routes compiled)
npm run test:e2e              # success: 8 passed (playwright, chromium-desktop)
```

- Equivalent to a full `npm run quality` run (coverage step matches the identical 110-test suite). All green.

## 12. Risk Notes
リスク・人間確認が必要な事項：

- No high-risk operations performed. No production DB/API access, no migrations applied, no force-push/reset, no secret exposure.
- **Human confirmation item**: migration `202607070001_queue_crawl_jobs_rpc.sql` was edited in place (ACL revokes added) on the stated basis that it has never been applied to a real database. If it HAS been applied anywhere, run the three `revoke execute on function public.queue_crawl_jobs(jsonb) from public/anon/authenticated;` statements against that database manually.
- Design note (accepted, not changed): the `(name, address)` fallback uniqueness means two genuinely different companies sharing an identical name and address (or both NULL addresses with the same name) will dedupe into one row on fallback upserts. This is the intended conservative semantic for rows lacking a corporate number; NTA-imported rows always carry a corporate number and are unaffected.
- Pending human/tool actions: commit/push this pass's fix and recheck CodeRabbit + quality-gate; apply the two new migrations to an isolated staging Supabase and run `npm run smoke:staging` before production-readiness claims.

## 13. Next Recommended Action
次にCodexが最初にやるべきこと：

1. Read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, and `package.json`.
2. Commit and push this pass's uncommitted changes (queue-RPC ACL fix, new regression test, this handoff), then recheck GitHub Actions `quality-gate` and CodeRabbit on the new head.
3. If CodeRabbit posts findings on the new head, classify Critical/High/Medium/Low and fix correctness/security/data-integrity first.
4. When staging credentials become available: apply `202607070001` and `202607070002` to the isolated staging Supabase (expect `202607070002` to fail loudly if duplicate `(name, address)` rows exist — resolve manually), then run `npm run smoke:staging`.
5. Otherwise continue one focused improvement toward 100/100.
6. Use Cursor Bugbot only for high-risk diffs or when CodeRabbit is inconclusive.
7. When starting a fresh Codex development sub-task, advance to Loop 19.

## 14. Do Not Touch
触らない方がよい領域：

- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs; do not apply migrations to production without maintainer sign-off.
- Do not delete or weaken tests to make checks pass; do not force-push.
- Do not weaken the RPC ACL pattern: every new `create function` migration must revoke public/anon/authenticated execute and grant only service_role (now test-enforced for both RPCs).
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 15. Notes for Codex
Codexへの補足：

- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard PR reviewer (now active — PR #1 is ready-for-review). Cursor Bugbot is optional/reserve only (cost).
- RPC security pattern: PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Always pair `grant ... to service_role` with explicit `revoke ... from public/anon/authenticated` in migrations — this gap in `queue_crawl_jobs` was fixed this pass and is now locked by tests for both existing RPCs.
- Loop numbering is inferred (see section 0). Advance to Loop 19 when beginning the next Codex development sub-task.
