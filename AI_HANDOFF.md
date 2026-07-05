# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 7 (inferred)
- Loop number inferred from: Claude Code's previous handoff treated review of commit `7523545` as Loop 6 and recommended advancing the next fresh Codex development sub-task to Loop 7. This Codex pass continued Loop 7 with a focused CSV import UX improvement. Historical handoffs did not originally contain explicit loop numbers, so this remains inferred.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-05 19:48:06 +09:00

## 1. Current Goal
今回の目的：

- Continue improving the existing Japan Company DB Collector toward:
  - all functions and screen transitions behaving as intended with no bugs or runtime errors
  - the list-generation workflow feeling fast, clear, and strong enough for daily business use
- This pass continued the spreadsheet-friendly CSV upload work by broadening accepted header aliases for common real-world exports. Users can now upload CSV files with practical labels such as `法人番号（１３桁）`, `会社名（商号）`, `ホームページ`, and `産業分類` without manually renaming them first.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed baseline before this change set: `a260bec` (`Accept Japanese CSV headers in list import preview`)
- Last known good committed baseline before this change set: `a260bec`, verified by local `npm run quality` and GitHub Actions `quality-gate #55`

## 3. What Was Done
今回完了したこと：

- Reviewed required project files, current handoff, repo status, package scripts, recent commits, CSV/list tests, and the list-generation E2E flow.
- Improved CSV import preview header matching:
  - normalizes header names with NFKC, whitespace removal, and lowercase comparison
  - preserves cell values exactly; only header matching is normalized
  - keeps existing canonical English headers working
  - accepts common variants including `corporateNumber`, `companyName`, `officialUrl`, `法人番号（１３桁）`, `会社名（商号）`, `法人名`, `名称`, `会社URL`, `企業URL`, `ホームページ`, `HP`, `Webサイト`, `ウェブサイト`, `産業分類`, `業界`, and `業態`
- Added regression coverage for full-width digit/parenthesis header variants and common spreadsheet labels.
- Re-ran the focused list-generation E2E flow and full local quality gate.

## 4. Files Changed
主な変更ファイル：

- `src/lib/list-quality.ts`
- `tests/etl.test.ts`
- `AI_HANDOFF.md`

## 5. Current Status
現在の状態：

- Local full quality gate passed after the CSV header alias improvement.
- Unit/integration tests remain 73 tests and all pass.
- E2E remains 8 tests and all pass.
- No UI layout, application routes, database schema, Supabase permissions, or external API behavior were changed.
- No secrets were read, printed, or committed. No production DB/API/deploy action was performed.
- Current self-assessment after this pass:
  - Function / screen transition / no-bug score: 98 / 100
  - Daily-use list-generation UX value score: 98 / 100
  - Not 100 because Cursor Bugbot and real staging Supabase smoke remain unverified in this environment.

## 6. Known Issues
既知の問題：

- Cursor Bugbot has not been run on this latest CSV import diff. The user shared that the Bugbot usage cap is now 70 USD.
- Real staging Supabase smoke verification has not been run locally because staging credentials are absent.
- `npm run verify` does not exist; `npm run quality` is the canonical local quality gate.
- `npm run etl:self-evaluate` still reports `releaseReady: false` in mock mode because Supabase is unset and mock jobs include one failed and one running job.
- Coverage is useful but not exhaustive; current coverage summary is statements 71.62%, branches 62.64%, functions 87%, lines 75.59%.

## 7. Bugbot Findings
Cursor Bugbotの指摘と対応状況：

- 未実行。
- No actionable Bugbot finding text exists in the repo.
- Recommended next tool step: run Cursor Bugbot on the pushed branch/PR diff using the now-shared 70 USD usage cap. If findings appear, prioritize security/auth/data-integrity/runtime/build/test issues first.

## 8. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success: clean before this cycle; current change set is limited to CSV header alias logic/tests plus this handoff

npm run test
# success: 73 tests passed; quality guard passed

npx playwright test e2e/collector.spec.ts -g "list generation supports conditions"
# success: 1 passed; main list-generation CSV upload preview flow still works

npm run quality
# success: typecheck, lint, test, coverage, E2E (8 passed), and build all passed

npm run etl:self-evaluate
# success: mock data score 83; releaseReady false because Supabase/staging smoke is not configured and mock jobs include failed/running states
```

## 9. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the header normalization in `src/lib/list-quality.ts`, especially NFKC/whitespace/lowercase matching and alias breadth.
2. Confirm the expanded aliases do not accidentally map unrelated columns in likely business CSVs.
3. Run Cursor Bugbot on the pushed branch/PR diff. The user has shared that Bugbot usage cap is now 70 USD.
4. If Bugbot is clean, continue the next quality/UX loop. Recommended candidate remains staging Supabase smoke coverage or saved-list success/error behavior under real isolated Supabase credentials.
5. If staging credentials are unavailable, continue with mock/fixture-backed workflow improvements and record the credential blocker honestly.

## 10. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- CSV header alias mapping and whether any aliases are too broad.
- Regression coverage for full-width and common spreadsheet labels.
- Whether a future pass should expose accepted aliases in README or downloadable sample CSV.
- Confirm no behavior outside CSV import preview changed unintentionally.
- Confirm `npm run quality` result and GitHub Actions result after push.

## 11. Do Not Touch
触らない方がよい領域：

- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not delete, skip, weaken, or comment out tests to make checks pass.
- Do not rewrite the UI, routes, or data model broadly without an explicit product request.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`) unless intentionally regenerating local artifacts and keeping them uncommitted.
- Do not force-push or deploy to production from this branch.

## 12. Notes for Claude Code
Claude Codeへの補足：

- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- The full quality gate is `npm run quality`.
- `npm run verify` is absent by design right now; do not assume it exists.
- Previous verified source commit `7523545` added CSV import preview detection for missing required header columns.
- Previous verified source commit `a260bec` added Japanese CSV header support for `法人番号`, `企業名`, `公式URL`, and `業種`.
- This pass expands header matching only; it does not add database writes or external service calls.
- GitHub Actions should be checked after this handoff commit is pushed.
