# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 8 (inferred)
- Loop number inferred from: The previous handoff had `Current owner: Claude Code`, `Next owner: Codex`, `Loop: 7`, and explicitly recommended advancing to Loop 8 when Codex began the next development sub-task. This pass is that Codex development/fix pass.
- Phase: Development / Bugbot Fix / Verification / Handoff
- Last updated: 2026-07-05 23:39:00 +09:00

## 1. Current Goal
今回の目的：

- Claude Codeから戻った状態を受け取り、`AI_HANDOFF.md`起点でLoop 8を開始する。
- Cursor Bugbotを最新PR上で手動実行し、指摘があれば最小差分で修正する。
- 品質ゲートを通し、次のClaude Codeレビューに渡せる状態にする。

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit at start of this pass: `305e6fe` (`Clarify saved list delete failure message`)
- Latest commit after this handoff update: pending commit
- Last known good commit: pending commit once this pass is committed and CI passes; locally `npm run quality` passed for the working tree.

## 3. What Was Done
今回完了したこと：

- Required files were read/reviewed: `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, recent diff/log.
- Next.js page docs were checked before touching `src/app/companies/page.tsx`:
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- Opened Cursor Bugbot dashboard and GitHub PR #1 using the logged-in Chrome session.
- Posted `bugbot run` on `https://github.com/kotakase2022-jpg/collector/pull/1`.
- Bugbot reviewed commit `305e6fe` and surfaced 3 issues from the PR history. All three were actionable in the current working tree, so this pass fixed them:
  - `invalid-company` redirects now show an alert on `/companies`.
  - Supabase `valueKind=official` filtering now includes rows where `annual_revenue` is present and `annual_revenue_type` is SQL `NULL`, while still excluding `estimated` and `unknown`.
  - `employeeRange(0)` now returns `null` so mock filtering no longer classifies zero employees as `1-9名`, matching Supabase `>= 1`.
- Added/updated tests to lock these fixes:
  - Unit coverage for `employeeRange(0)`.
  - Unit coverage for official revenue type semantics and Supabase filter fragment.
  - E2E coverage for `/companies?error=invalid-company`.
- Ran the full local quality gate successfully.

## 4. Files Changed
主な変更ファイル：

- `src/app/companies/page.tsx`
- `src/lib/data.ts`
- `src/lib/etl/normalize.ts`
- `tests/etl.test.ts`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

## 5. Current Status
現在の状態：

- Working tree contains the Loop 8 Bugbot fixes and this handoff update.
- Local full quality gate is green:
  - unit/integration tests: 79 passed
  - E2E tests: 8 passed
  - build succeeded
  - coverage: statements 72.88%, branches 63.65%, functions 87.25%, lines 76.93%
- No database schema, crawler behavior, external API behavior, deployment setting, or secret handling was changed.
- No production DB/API/deploy action was performed.

## 6. Known Issues
既知の問題：

- The post-comment Cursor Bugbot check for commit `305e6fe` was still shown as in progress on GitHub when last polled, even though the conversation summary already displayed the 3 findings. This pass fixed those 3 findings locally. After pushing this commit, Bugbot should be allowed to run again on the new commit.
- Real staging Supabase smoke verification has not been run locally because staging credentials are absent.
- `npm run verify` does not exist; `npm run quality` is the canonical local quality gate.
- `npm run etl:self-evaluate` was not rerun in this pass; previous runs report `releaseReady: false` in mock mode because Supabase/staging smoke is not configured.
- Coverage is useful but not exhaustive; `src/lib/store.ts` and live Supabase integration paths remain lower-confidence areas.

## 7. Bugbot Findings
Cursor Bugbotの指摘と対応状況：

- Executed manually by commenting `bugbot run` on PR #1.
- Latest visible review marker: `Reviewed by Cursor Bugbot for commit 305e6fe`.
- Findings handled in this pass:
  - `Invalid company error not shown` (Medium): fixed by adding `/companies?error=invalid-company` alert and E2E coverage.
  - `Official filter excludes null types` (Medium): fixed by changing Supabase official revenue filter to include `annual_revenue_type.is.null` and adding unit coverage.
  - `Employee range zero mismatch` (Low): fixed by making `employeeRange(0)` return `null` and adding unit coverage.

## 8. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success: branch codex/permanent-quality-gate-governance; working tree had AI_HANDOFF plus Loop 8 fix files

npm run typecheck
# success

npx vitest run tests/etl.test.ts -t "normalization helpers|official revenue filters|data accessors use mock data"
# success: 3 passed, 76 skipped by name filter

npx playwright test e2e/collector.spec.ts -g "company filters support"
# success: 1 passed

npm run quality
# success: typecheck, lint, test integrity, unit/integration tests, coverage, E2E, and build all passed
# tests: 79 passed
# E2E: 8 passed
# coverage: statements 72.88%, branches 63.65%, functions 87.25%, lines 76.93%

git diff --check
# success
```

## 9. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the Loop 8 Bugbot fixes:
   - `src/app/companies/page.tsx`
   - `src/lib/data.ts`
   - `src/lib/etl/normalize.ts`
   - `tests/etl.test.ts`
   - `e2e/collector.spec.ts`
2. Confirm the Supabase PostgREST filter string is correct for the project’s Supabase client version: `annual_revenue_type.is.null,annual_revenue_type.not.in.(estimated,unknown)`.
3. After the commit is pushed, check GitHub Actions `quality-gate` and Cursor Bugbot for the new commit.
4. If Bugbot is clean, continue the quality/UX loop with one focused sub-task. Good candidates:
   - Add contextual saved-list detail notices for detail-page-originated failures.
   - Add focused route/E2E coverage for saved-list export not-found and failure flows.
5. If staging Supabase credentials are available, run `npm run smoke:staging` with isolated staging credentials before production-readiness claims.

## 10. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- `/companies?error=invalid-company` notice behavior and copy.
- Supabase `or(...)` filter syntax for official annual revenue with `NULL` revenue type.
- Mock/Supabase consistency for official revenue and employee range filters.
- Whether `employeeRange(value < 1) -> null` has any unintended UX or metrics implication.

## 11. Do Not Touch
触らない方がよい領域：

- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not delete, skip, weaken, or comment out tests to make checks pass.
- Do not rewrite the UI, routes, data model, crawler behavior, or Supabase schema broadly without an explicit product request.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`) unless intentionally regenerating local artifacts and keeping them uncommitted.
- Do not force-push or deploy to production from this branch.

## 12. Notes for Claude Code
Claude Codeへの補足：

- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- Cursor Bugbot/on-demand spending cap was previously raised to 110 USD.
- The PR is still draft and requires review before merge.
- GitHub Actions should be checked after this handoff commit is pushed.
