# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 7 (inferred)
- Loop number inferred from: Claude Code's previous handoff treated review of commit `7523545` as Loop 6 and recommended advancing the next fresh Codex development sub-task to Loop 7. This Codex pass continued Loop 7 with focused CSV import UX improvements. Historical handoffs did not originally contain explicit loop numbers, so this remains inferred.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-05 20:03:59 +09:00

## 1. Current Goal
今回の目的：

- Continue improving the existing Japan Company DB Collector toward:
  - all functions and screen transitions behaving as intended with no bugs or runtime errors
  - the list-generation workflow feeling fast, clear, and strong enough for daily business use
- This pass improved CSV import discoverability by adding an expandable accepted-column-name reference in the CSV import panel. Users can now see supported aliases such as `ホームページ` and `産業分類` without leaving the workflow.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed baseline before this change set: `9225c97` (`Add CSV import sample download`)
- Last known good committed baseline before this change set: `9225c97`, verified by local `npm run quality` and GitHub Actions `quality-gate #57`

## 3. What Was Done
今回完了したこと：

- Reviewed required project files, current handoff, repo status, package scripts, recent commits, README, CSV/list tests, and the list-generation E2E flow.
- Read the relevant Next.js 16 Client Component docs before touching the CSV import client component:
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- Added a compact `<details>` block labeled `対応している列名` to the CSV import preview panel.
- The expandable reference lists accepted aliases for:
  - `法人番号`
  - `企業名`
  - `URL`
  - `業種`
- Updated E2E coverage to open the details block and verify practical aliases such as `ホームページ` and `産業分類` are visible in the main list-generation CSV flow.

## 4. Files Changed
主な変更ファイル：

- `src/components/app/csv-import-preview.tsx`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

## 5. Current Status
現在の状態：

- Local full quality gate passed after the accepted-column-name reference improvement.
- Unit/integration tests remain 73 tests and all pass.
- E2E remains 8 tests and all pass; the main list-generation flow now checks the accepted-column-name reference.
- No application routes, database schema, Supabase permissions, or external API behavior were changed.
- No secrets were read, printed, or committed. No production DB/API/deploy action was performed.
- Current self-assessment after this pass:
  - Function / screen transition / no-bug score: 98 / 100
  - Daily-use list-generation UX value score: 98.7 / 100
  - Not 100 because Cursor Bugbot and real staging Supabase smoke remain unverified in this environment.

## 6. Known Issues
既知の問題：

- Cursor Bugbot has not been run on this latest CSV import diff. The user shared that the Bugbot usage cap is now 70 USD.
- Real staging Supabase smoke verification has not been run locally because staging credentials are absent.
- `npm run verify` does not exist; `npm run quality` is the canonical local quality gate.
- `npm run etl:self-evaluate` still reports `releaseReady: false` in mock mode because Supabase is unset and mock jobs include one failed and one running job.
- Coverage is useful but not exhaustive; current coverage summary remains statements 71.62%, branches 62.64%, functions 87%, lines 75.59%.

## 7. Bugbot Findings
Cursor Bugbotの指摘と対応状況：

- 未実行。
- No actionable Bugbot finding text exists in the repo.
- Recommended next tool step: run Cursor Bugbot on the pushed branch/PR diff using the now-shared 70 USD usage cap. If findings appear, prioritize security/auth/data-integrity/runtime/build/test issues first.

## 8. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success: clean before this cycle; current change set is limited to CSV accepted-column help plus this handoff

npx playwright test e2e/collector.spec.ts -g "list generation supports conditions"
# success: 1 passed; accepted-column details opened and alias labels verified in the main list-generation flow

npm run test
# success: 73 tests passed; quality guard passed

npm run quality
# success: typecheck, lint, test, coverage, E2E (8 passed), and build all passed

npm run etl:self-evaluate
# success: mock data score 83; releaseReady false because Supabase/staging smoke is not configured and mock jobs include failed/running states
```

## 9. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the accepted-column-name details UI for clarity and density.
2. Confirm the alias list shown in the UI matches `src/lib/list-quality.ts` closely enough for user guidance.
3. Run Cursor Bugbot on the pushed branch/PR diff. The user has shared that Bugbot usage cap is now 70 USD.
4. If Bugbot is clean, continue the next quality/UX loop. Recommended candidate remains staging Supabase smoke coverage or saved-list success/error behavior under real isolated Supabase credentials.
5. If staging credentials are unavailable, continue with mock/fixture-backed workflow improvements and record the credential blocker honestly.

## 10. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- Whether the `<details>` UI is discoverable without making the CSV panel noisy.
- Whether the visible alias list should be generated from shared constants in a future pass to avoid drift.
- E2E stability around opening the details element.
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
- Previous verified source commit `6b6584c` broadened CSV header alias matching.
- Previous verified source commit `9225c97` added a local sample CSV download.
- This pass adds accepted-column-name guidance only; it does not add database writes or external service calls.
- GitHub Actions should be checked after this handoff commit is pushed.
