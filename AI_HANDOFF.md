# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 20 (inferred, continued)
- Loop number inferred from: The previous Claude Code handoff recorded Loop 19 and handed back to Codex. The source lookup batching work started Loop 20, and the Supabase project setup/smoke work is a continuation of that same Codex phase.
- Phase: Handoff
- Last updated: 2026-07-08 12:31 +09:00

## 1. Current Goal
今回の目的：
- Execute the previously blocked Supabase production/staging smoke path through the logged-in Chrome session.
- Use the new collector Supabase project instead of the mismatched `supabase-erin-envelope` schema.
- Retrieve the required service-role credential only transiently, seed the empty database enough for the read-only smoke, run `npm run smoke:staging`, and update the handoff.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit before this handoff update: `f275509` (`Record collector Supabase project setup`)
- Latest code-bearing commit: `663977b` (`Reduce source lookup batch sizes`)
- Last known good commit before this handoff update: `f275509`, with GitHub Actions `quality-gate` pass and CodeRabbit `pass` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `pass` / `Review completed` before this handoff update.

## 3. What Was Done
今回完了したこと：
- Re-read the local workflow context and current state:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
  - recent commits / current diff / PR checks.
- Used the logged-in Chrome Supabase session, as explicitly requested by the user.
- Confirmed the new Supabase project from the previous pass:
  - Project name: `collector-production`
  - Project ref: `xqhuigipensnrqsotvdd`
  - Project URL: `https://xqhuigipensnrqsotvdd.supabase.co`
  - Region: `Northeast Asia (Tokyo)` / `ap-northeast-1`
- Inserted/upserted one explicit smoke seed company through Supabase SQL Editor:
  - `corporate_number`: `0000000000000`
  - `name`: `Codex Smoke Test Company`
  - `address`: `Codex smoke seed 2026-07-08`
  - plus one matching `company_sources` row with `source_type = 'third_party'`.
- Verified through SQL Editor that the seed exists:
  - `company_count`: 1
  - `source_count`: 1
  - smoke company id: `3a646571-c230-49b8-9cdd-2a7d3a9f636f`
- Opened Supabase `API Keys (Legacy)` in Chrome and retrieved the `service_role` JWT only into an in-memory browser automation variable.
- Passed the key only as a transient child-process environment variable for `npm run smoke:staging`.
- Did not print, commit, or write the service role key to repo files.
- Cleared the in-memory key variable after the smoke run and navigated Chrome away from the API key page.
- Ran `npm run smoke:staging` successfully against `collector-production`.
- Ran `npm run etl:self-evaluate` after smoke; it found the staging smoke evidence but still reports `dataMode: "mock"` because the self-evaluation command itself was not run with Supabase env.

## 4. Files Changed
主な変更ファイル：
- `AI_HANDOFF.md`
  - Updated with the successful Supabase smoke result, seed details, credential handling, and remaining risks.

## 5. Current Status
現在の状態：
- `collector-production` has the expected collector schema from the previous pass.
- `collector-production` now has one explicit smoke seed company and one source row.
- `npm run smoke:staging` passed in read-only mode against `xqhuigipensnrqsotvdd.supabase.co`.
- Local smoke artifact was generated at `artifacts/staging-smoke/latest.json`; it is not shown in `git status`, likely because artifacts are ignored.
- Chrome is no longer left on the API key page.

## 6. Known Issues
既知の問題：
- The database currently contains only smoke seed data, not real NTA/imported business data.
- `company_observations`, `crawl_jobs`, `saved_company_lists`, and `saved_company_list_items` are still empty.
- `npm run etl:self-evaluate` still reports mock-mode score `83` / `releaseReady: false` when run without Supabase env; it does record the staging smoke evidence timestamp.
- Live EDINET/gBizINFO/OpenAI enrichment paths remain unverified against real external services.
- `npm run verify` does not exist; `npm run quality` is the canonical full local gate.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：
- Review status: `pass` / `Review completed` before this handoff-only update.
- Critical findings: none known open before this handoff-only update.
- Resolved findings:
  - Supabase schema mismatch blocker was resolved by using the new `collector-production` project.
  - `smoke:staging` blocker was resolved by adding a minimal smoke seed and running the read-only smoke successfully.
- Deferred findings:
  - Recheck CodeRabbit after this handoff commit/push.
  - Real data import and live external-service validation remain future work.
- False positives / not applicable:
  - The previous `supabase-erin-envelope` schema mismatch is not treated as intended collector production state.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：
- Status: Not run
- Findings: none
- Actions taken: none
- Rationale: CodeRabbit OSS remains available and is the standard reviewer. The high-risk part here was manual Supabase credential handling, which was bounded to transient local execution and documented.

## 9. Verification Results
実行した確認コマンドと結果：
```bash
git status --short --branch
# success: clean before this handoff update

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before this handoff update:
# CodeRabbit pass / Review completed
# quality-gate pass
```

Supabase SQL Editor:
```sql
-- Smoke seed upsert succeeded.
-- Separate verification result:
-- company_count: 1
-- source_count: 1
-- smoke_company:
--   id: 3a646571-c230-49b8-9cdd-2a7d3a9f636f
--   corporate_number: 0000000000000
--   name: Codex Smoke Test Company
```

Local smoke:
```bash
npm run smoke:staging
# success, with transient env:
# NEXT_PUBLIC_SUPABASE_URL=https://xqhuigipensnrqsotvdd.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=<transient only, not printed/stored>
# STAGING_SMOKE_CONFIRM=read-only
```

Smoke result summary:
```json
{
  "ok": true,
  "mode": "read-only",
  "passedAt": "2026-07-08T03:27:32.305Z",
  "commitSha": "f275509cdbb444904eb7b8963d9a83884172ce57",
  "supabaseHost": "xqhuigipensnrqsotvdd.supabase.co",
  "sampledCompanies": 1,
  "sampledExportRows": 1,
  "savedLists": 0
}
```

Table checks from smoke:
```text
companies: count 1, sampleRows 1
company_sources: count 1, sampleRows 1
company_observations: count 0, sampleRows 0
crawl_jobs: count 0, sampleRows 0
saved_company_lists: count 0, sampleRows 0
saved_company_list_items: count 0, sampleRows 0
```

Self-evaluation:
```bash
npm.cmd run etl:self-evaluate
# success command execution
# dataMode: mock
# score: 83
# releaseReady: false
# stagingSmoke.passedAt: 2026-07-08T03:27:32.305Z
# stagingSmoke.commitSha: f275509cdbb444904eb7b8963d9a83884172ce57
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：
1. Review this handoff and confirm that the smoke seed row is acceptable to leave in `collector-production`.
2. Recheck PR #1 CodeRabbit/quality-gate after this handoff update is pushed.
3. If moving beyond smoke, import approved real NTA/company data into `collector-production`.
4. Run `npm run smoke:staging` again after real data import.
5. If a connected self-evaluation is desired, run `npm run etl:self-evaluate` with approved transient Supabase env.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：
- Whether the smoke seed row should remain, be renamed, or be deleted after real data import.
- Whether the project should be treated as production or staging in naming and future scripts.
- Whether `scripts/staging-smoke.ts` should support a safer explicit seed/check mode in a future PR.
- Confirm no secrets were written to files or logs.

## 12. Risk Notes
リスク・人間確認が必要な事項：
- A real Supabase project was modified: one smoke company row and one source row were inserted/upserted.
- The service-role key was read from Chrome only for transient local execution and was not committed or written to repo files.
- The smoke seed is synthetic data and may appear in app UI until removed or replaced by real import data.
- The prior `supabase-erin-envelope` project still exists and should not be used for collector validation unless a maintainer confirms otherwise.

## 13. Do Not Touch
触らない方がよい領域：
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not print or persist Supabase service-role keys.
- Do not delete the smoke seed row without a maintainer decision, because it is currently the reason `smoke:staging` can pass on the otherwise empty project.
- Do not use `supabase-erin-envelope` as collector production unless a maintainer explicitly reclassifies it.
- Do not force-push.
- Do not weaken RLS/RPC ACL patterns.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 14. Notes for Claude Code
Claude Codeへの補足：
- Chrome was navigated away from the API key page after the smoke run.
- PowerShell may display Japanese text as mojibake; avoid rewriting UTF-8 docs just because console output looks garbled.
- Full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run.
- Standing reason not to claim 100/100: only smoke seed data exists; real data import and live external-service validation remain pending.
