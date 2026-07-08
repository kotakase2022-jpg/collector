# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Claude Code
- Next owner: Codex
- Loop: 19 (inferred)
- Loop number inferred from: The prior handoff was labeled `Loop: 19 (inferred, continued Codex improvement)` with `Current owner: Codex`, `Next owner: Claude Code`. Per the rule "if the previous Current owner was Codex and Next owner was Claude Code, treat it as the same loop's Claude Code phase", this Claude Code review is Loop 19's review phase, now handing back to Codex.
- Phase: Autonomous Review / Fix / Verification / Handoff
- Last updated: 2026-07-08 (Claude Code autonomous review cycle, Loop 19)

## 1. Current Goal
今回の目的：

- Continue the standing autonomous improvement goal (function/no-bug and daily-use list-generation both toward 100/100), preserving the review-cost policy: CodeRabbit OSS is the standard PR reviewer; Cursor Bugbot is optional/reserve only.
- This loop's Codex work under review: align the saved-list comparison CSV server-side fallback filename with the UI fallback (`saved-company-list-comparison.csv`) and add regression coverage for unsafe/non-ASCII comparison list names in `Content-Disposition`.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit: `f3261ab` (`Refresh handoff after comparison CSV filename hardening`, handoff-only) on top of implementation commit `2304a4d` (`Harden comparison CSV download names`).
- Reviewed change set: `aa860eb..2304a4d` (this pass's subject).
- Last known good commit: `2304a4d`, verified locally by Claude Code full quality gate (see section 11), plus GitHub Actions `quality-gate` pass and CodeRabbit pass reported by Codex.
- PR: ready-for-review PR #1 — https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `pass` / `Review completed` on pushed code head `2304a4d`. No open findings.

## 3. What Was Reviewed
レビューした内容：

- `src/app/api/lists/compare-export/route.ts`: server fallback filename changed `saved-list-comparison.csv` → `saved-company-list-comparison.csv`. Verified this now matches the UI fallback at `src/app/lists/[id]/page.tsx:330` — server and UI are consistent.
- `tests/etl.test.ts`: new test feeds list names containing `/ : * ?` and Japanese characters. Traced the sanitizer (`src/lib/file-name.ts`) to confirm the expectations are exact:
  - `filename*` (RFC 5987): unsafe chars → `-`, dash runs collapsed → `営業-調査-大阪-東京-比較-comparison.csv` — matches the asserted decode.
  - ASCII `filename`: non-ASCII stripped → dash run collapsed and leading `[ .-]+` stripped → `comparison.csv` — matches the assertion (contains a dot, so the fallback name is not needed here; the fallback path is still covered by prior tests).
- Confirmed the change is minimal and behavior-safe: only the fallback constant changed in the route; the sanitization pipeline itself is untouched; no tests removed or weakened; the route's catch still logs server-side errors (prior Loop 19 hardening intact).

## 4. What Was Fixed
修正した内容：

- No source/test code changes were required. The Codex change is a correct, minimal consistency fix with precise regression coverage.

## 5. Review / Fix Cycles Completed
実行したサイクル：
- Cycle 1 (Baseline Verification): Inspected git status/log and the `aa860eb..2304a4d` diff; working tree clean (tip handoff-only). Ran typecheck, lint, test — all green; handoff matches implementation state.
- Cycle 2 (CodeRabbit Review Handling): CodeRabbit `pass` / `Review completed` on `2304a4d`; no open findings to address.
- Cycle 3 (Critical Fix): No build/type/lint/test/runtime errors. Traced the filename sanitizer end-to-end to validate the new test's expectations. Nothing to fix.
- Cycle 4 (Regression & UX Check): Verified server/UI fallback-name consistency, sanitizer behavior for unsafe/non-ASCII names, error logging intact, no removed tests, no `any`, no swallowed errors.
- Cycle 5 (Handoff Hardening): Updated `AI_HANDOFF.md`; `AGENTS.md` / `CLAUDE.md` reviewed, no changes needed (the RPC ACL rule added in Loop 18 remains in place).

## 6. Files Changed
主な変更ファイル：

- `AI_HANDOFF.md` (this handoff update by Claude Code).
- No source or test files changed in this Claude Code pass (review-only; Codex's `2304a4d` stands as-is).

## 7. Current Status
現在の状態：

- Full local quality gate is green: typecheck, lint, test (122 passed), coverage-equivalent suite, build, E2E (8 passed).
- Working tree clean except `AI_HANDOFF.md`; branch in sync with `origin/codex/permanent-quality-gate-governance`.
- PR #1 is ready-for-review; CodeRabbit and `quality-gate` both green on the latest code head.
- App runs in mock/fallback mode locally (Supabase credentials not configured).
- No production DB/API/deploy actions; no secrets read/printed/committed.

## 8. Known Issues
既知の問題：

- Neither `202607070001_queue_crawl_jobs_rpc.sql` (ACL-hardened in Loop 18) nor `202607070002_company_fallback_unique_index.sql` has been applied to a real isolated staging Supabase project from this environment.
- If any database received the original `202607070001` migration before the ACL revokes were added, the three revoke statements must be applied there manually.
- If staging already contains duplicate `(name, address)` company rows, `202607070002` intentionally fails with a preflight error; duplicates must be reviewed/merged manually first.
- Live/staging Supabase smoke not run (isolated staging credentials absent); live EDINET/gBizINFO enrichment paths unverified against real services.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` reports mock-mode score 83 / `releaseReady: false` (Supabase unset; mock jobs include failed/running examples).

## 9. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：

- Review status: `pass` / `Review completed` on pushed code head `2304a4d`. Standard review is active (PR #1 is ready-for-review).
- Critical findings: none open.
- Resolved findings: this pass's comparison-CSV filename alignment verified correct; the long list of prior Loop 18/19 resolutions (RPC ACL, fallback uniqueness, CSV import/preview guards, crawler/robots/LLM/EDINET/gBizINFO response validation, route error logging) remains in place.
- Deferred findings: none blocking; review any newly posted CodeRabbit comments first on the next pass.
- False positives / not applicable: none new.

## 10. Optional Bugbot Findings
Cursor Bugbotの任意確認：

- Status: Not run.
- Rationale: Per policy, Bugbot is optional/reserve only. This change is a filename-consistency fix with test coverage, no auth/permission/DB/payment/data-deletion surface, and CodeRabbit passed on the head.
- Findings: none.
- Actions taken: none.

## 11. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch   # clean except AI_HANDOFF.md; synced with origin
npm run typecheck             # success (tsc --noEmit)
npm run lint                  # success (eslint --max-warnings=0)
npm run test                  # success: quality guard passed; 122 tests passed
npm run build                 # success (next build; all routes compiled)
npm run test:e2e              # success: 8 passed (playwright, chromium-desktop)
```

- Equivalent to a full `npm run quality` run (coverage step matches the identical 122-test suite). All green.

## 12. Risk Notes
リスク・人間確認が必要な事項：

- No high-risk operations performed. No production DB/API access, no migrations applied, no force-push/reset, no secret exposure.
- Pending human/tool actions: apply the two pending migrations to an isolated staging Supabase and run `npm run smoke:staging` before production-readiness claims (staging credentials required; expect `202607070002` to fail loudly if duplicate `(name, address)` rows exist).

## 13. Next Recommended Action
次にCodexが最初にやるべきこと：

1. Read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, and `package.json`.
2. Check PR #1 for any newly posted CodeRabbit comments; if findings appear, classify Critical/High/Medium/Low and fix correctness/security/data-integrity first.
3. When staging credentials become available: apply `202607070001` and `202607070002` to the isolated staging Supabase, then run `npm run smoke:staging`. This remains the biggest gap toward the 100/100 goal — local/mock evidence is saturated.
4. Otherwise continue one focused improvement toward 100/100 (e.g., another small CSV/list workflow edge case, or text/encoding polish on remaining screens).
5. Use Cursor Bugbot only for high-risk diffs or when CodeRabbit is inconclusive.
6. When starting a fresh Codex development sub-task, advance to Loop 20.

## 14. Do Not Touch
触らない方がよい領域：

- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs; do not apply migrations to production without maintainer sign-off.
- Do not delete or weaken tests to make checks pass; do not force-push.
- Do not weaken the RPC ACL pattern: every new `create function` migration must revoke public/anon/authenticated execute and grant only service_role (test-enforced).
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 15. Notes for Codex
Codexへの補足：

- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard PR reviewer (active on PR #1). Cursor Bugbot is optional/reserve only (cost).
- Download-filename behavior is centralized in `src/lib/file-name.ts` (`sanitizeDownloadFileName` / `attachmentContentDisposition`); keep new export routes on this helper and keep server fallbacks matching their UI counterparts.
- Local evidence (typecheck/lint/122 unit tests/E2E/build/CodeRabbit) is consistently green across recent loops; the remaining 100/100 gap is dominated by missing staging/live verification, not local code quality.
- Loop numbering is inferred (see section 0). Advance to Loop 20 when beginning the next Codex development sub-task.
