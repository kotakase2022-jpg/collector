# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 20 (inferred, continued)
- Loop number inferred from: The previous handoff recorded `Current owner: Claude Code`, `Next owner: Codex`, `Loop: 19 (inferred)`, and said to advance to Loop 20 for the next Codex development sub-task. The source lookup batching work started Loop 20; this Supabase production setup/test follow-up is a continuation of that same Codex phase, not a new Claude-completed loop.
- Phase: Handoff
- Last updated: 2026-07-08 12:11 +09:00

## 1. Current Goal
今回の目的：
- Continue the alternating Codex -> CodeRabbit OSS -> Claude Code loop.
- User explicitly requested Supabase production testing through the logged-in Chrome session.
- After the existing `supabase-erin-envelope` project was found to have a non-collector schema, user clarified that the schema mismatch was not intentional and requested creation of a new Supabase project.
- Codex created a new Supabase project, applied the collector migrations, and stopped at a clean handoff point before retrieving secrets or inserting seed/business data.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit: `56e219f` (`Record production Supabase smoke blocker`) before this handoff update.
- Latest code-bearing commit: `663977b` (`Reduce source lookup batch sizes`)
- Last known good commit: `56e219f`, with GitHub Actions `quality-gate` pass and CodeRabbit `pass` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `pass` / `Review completed` on the latest checked PR head before this handoff update.

## 3. What Was Done
今回完了したこと：
- Confirmed local branch was clean before external Supabase work.
- Used the logged-in Chrome Supabase session as explicitly requested by the user.
- Created a new Supabase project in `kotakase2022-jpg's projects`:
  - Project name: `collector-production`
  - Project ref: `xqhuigipensnrqsotvdd`
  - Project URL: `https://xqhuigipensnrqsotvdd.supabase.co`
  - Region: `Northeast Asia (Tokyo)` / `ap-northeast-1`
  - Compute: `NANO` / `t4g.nano`
  - Branch: `main` / `PRODUCTION`
- Project creation settings:
  - Data API: enabled
  - Automatically expose new tables: disabled
  - Automatic RLS trigger: left disabled because migrations explicitly enable RLS on the project tables.
  - DB password was generated in the Supabase UI and was not read, printed, copied into repo files, or stored by Codex.
- Applied all local Supabase migrations through the Supabase SQL Editor:
  - `202607030001_initial_schema.sql`
  - `202607040001_saved_company_lists.sql`
  - `202607040002_saved_company_list_rpc.sql`
  - `20260704130745_harden_saved_company_list_rpc.sql`
  - `202607070001_queue_crawl_jobs_rpc.sql`
  - `202607070002_company_fallback_unique_index.sql`
- SQL Editor returned `Success. No rows returned` for the migration batch.
- Ran a read-only SQL verification query in SQL Editor and confirmed:
  - Tables: `companies`, `company_observations`, `company_sources`, `crawl_jobs`, `crawl_logs`, `saved_company_list_items`, `saved_company_lists`
  - Functions: `queue_crawl_jobs`, `save_company_list`
  - RLS enabled on all seven collector public tables.
  - RPC execute privileges visible for `postgres` and `service_role`; no `public`, `anon`, or `authenticated` grants were reported by the verification query.
- Did not retrieve, print, store, or commit Supabase service-role keys.
- Did not insert seed rows or business data.
- Did not run app smoke against the new project because the local smoke script requires `SUPABASE_SERVICE_ROLE_KEY` and at least one `companies` row.

## 4. Files Changed
主な変更ファイル：
- `AI_HANDOFF.md`
  - Updated with the new Supabase project, migration verification, remaining smoke blocker, and Claude Code handoff instructions.

## 5. Current Status
現在の状態：
- New collector Supabase project exists and has the expected collector schema.
- The previous schema mismatch on `supabase-erin-envelope` is no longer treated as intended collector production state.
- The new project currently has schema only; no seed/company rows were inserted by Codex.
- Full app smoke remains pending until a maintainer-approved path exists for:
  - service role key handling without leaking/storing secrets,
  - seed/import data,
  - `STAGING_SMOKE_CONFIRM=read-only npm run smoke:staging`.
- Local code was not changed in this follow-up beyond this handoff file.

## 6. Known Issues
既知の問題：
- `npm run smoke:staging` was not run against `collector-production`.
- `scripts/staging-smoke.ts` requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STAGING_SMOKE_CONFIRM=read-only`, and at least one `companies` row.
- The new Supabase project has no imported company seed data yet, so `smoke:staging` would fail with the expected `companies has no rows` condition even if credentials were provided.
- DB password generated during project creation was intentionally not preserved by Codex. If humans need it, rotate/copy it from Supabase using the dashboard-supported flow.
- Production status initially showed `Unhealthy` immediately after creation while the project was still warming/receiving setup traffic. SQL Editor migrations and verification queries succeeded afterward.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real services.
- `npm run verify` does not exist; `npm run quality` is the canonical full local gate.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：
- Review status: `pass` / `Review completed` before this handoff-only update.
- Critical findings: none known open on the latest checked PR head.
- Resolved findings:
  - Loop 20 code change lowered source lookup batch sizes and added regression coverage.
  - Previous security/schema findings around RPC grants and fallback uniqueness remain represented in migrations and tests.
- Deferred findings:
  - Correct production/staging smoke evidence is still pending for the newly created `collector-production` Supabase project.
  - Claude Code should recheck CodeRabbit after this handoff commit/push, because CodeRabbit may post a fresh summary for the documentation-only change.
- False positives / not applicable:
  - The previous `supabase-erin-envelope` schema mismatch was not treated as collector production after user clarification; a new collector project was created instead.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：
- Status: Not run
- Findings: none
- Actions taken: none
- Rationale: CodeRabbit OSS is available and remains the standard reviewer. This pass involved Supabase project creation and schema migration, but no application code change; the remaining high-risk items are secrets/seed/smoke decisions for Claude/human review rather than Bugbot-only findings.

## 9. Verification Results
実行した確認コマンドと結果：
```bash
git status --short --branch
# success: clean before Supabase work

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before this handoff update:
# CodeRabbit pass / Review completed
# quality-gate pass

git diff --check
# success: no whitespace errors in the handoff diff

npm.cmd run typecheck
# success: tsc --noEmit

npm.cmd run lint
# success: eslint --max-warnings=0
```

Supabase Dashboard / SQL Editor verification:
```sql
-- Project creation
-- success: created collector-production
-- ref: xqhuigipensnrqsotvdd
-- URL: https://xqhuigipensnrqsotvdd.supabase.co
-- region: Northeast Asia (Tokyo), ap-northeast-1

-- Migration batch through SQL Editor
-- success: "Success. No rows returned"

select jsonb_build_object(
  'tables', (
    select jsonb_agg(table_name order by table_name)
    from information_schema.tables
    where table_schema = 'public'
  ),
  'functions', (
    select jsonb_agg(routine_name order by routine_name)
    from information_schema.routines
    where routine_schema = 'public'
      and routine_name in ('save_company_list', 'queue_crawl_jobs')
  ),
  'rpc_grants', (
    select jsonb_agg(jsonb_build_object('routine', routine_name, 'grantee', grantee, 'privilege', privilege_type) order by routine_name, grantee)
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name in ('save_company_list', 'queue_crawl_jobs')
  ),
  'rls_tables', (
    select jsonb_agg(tablename order by tablename)
    from pg_tables
    where schemaname = 'public'
      and rowsecurity = true
  )
) as collector_schema_check;

-- success: 1 row
-- tables:
--   companies
--   company_observations
--   company_sources
--   crawl_jobs
--   crawl_logs
--   saved_company_list_items
--   saved_company_lists
-- functions:
--   queue_crawl_jobs
--   save_company_list
-- rls_tables:
--   all seven collector public tables
-- rpc_grants:
--   postgres/service_role EXECUTE only for queue_crawl_jobs and save_company_list
```

Not run:
```bash
npm.cmd run quality
# not rerun after this handoff-only external Supabase update; local typecheck/lint and last PR quality-gate are green.

STAGING_SMOKE_CONFIRM=read-only npm run smoke:staging
# not run: requires service role key and at least one companies row; Codex did not retrieve keys or insert seed data.
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：
1. Review this handoff and the Supabase dashboard state for `collector-production` (`xqhuigipensnrqsotvdd`).
2. Confirm whether the new project should be treated as production or isolated staging for the next smoke step.
3. Decide the approved secret-handling path:
   - preferably configure `STAGING_SUPABASE_URL` and `STAGING_SUPABASE_SERVICE_ROLE_KEY` in GitHub Environment or a local `.env.local` only by human-approved secret entry,
   - do not print or commit keys.
4. Import approved seed/NTA data so `companies` has at least one row.
5. Run `STAGING_SMOKE_CONFIRM=read-only npm run smoke:staging` against the new project.
6. Recheck PR #1 CodeRabbit/quality-gate after this handoff update is pushed.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：
- Supabase project setup:
  - correct organization,
  - correct project ref/URL,
  - Tokyo region,
  - Data API on,
  - automatic table exposure off.
- Migration state:
  - all collector tables exist,
  - RLS is enabled,
  - RPC execute grants exclude `public`, `anon`, and `authenticated`.
- Whether seed/import should be run in this new project before app smoke.
- Whether this project should be named/used as production despite currently being newly empty.

## 12. Risk Notes
リスク・人間確認が必要な事項：
- A real Supabase project was created at the user's explicit request.
- SQL migrations were applied to that new project.
- No service role key, anon key, DB password, or `.env` contents were printed, stored, committed, or copied into repo files by Codex.
- No business/company data was inserted.
- The previous `supabase-erin-envelope` project still exists and was resumed in the prior pass, but it should not be used for collector validation unless a maintainer intentionally reclassifies it.
- The new project's generated DB password is not known to Codex; rotate/copy through Supabase if humans need it.

## 13. Do Not Touch
触らない方がよい領域：
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not retrieve or expose Supabase service-role keys in chat/logs.
- Do not insert production business data or run write-heavy imports without maintainer confirmation of the target project role.
- Do not use `supabase-erin-envelope` as collector production unless a maintainer confirms the schema mismatch has another explanation.
- Do not force-push.
- Do not weaken RLS/RPC ACL patterns.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 14. Notes for Claude Code
Claude Codeへの補足：
- Browser tab left open on the `collector-production` SQL Editor verification query as a handoff page.
- PowerShell may display Japanese text as mojibake; avoid rewriting UTF-8 docs just because console output looks garbled.
- Full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run.
- Standing reason not to claim 100/100: `smoke:staging` and live external-service validation remain pending for the new Supabase project.
