# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 10 (inferred)
- Loop number inferred from: Loop 9 Codex work was committed and pushed as `0d57872`, then Cursor Bugbot was rerun and reported no new issues for that commit. The user asked to continue the standing autonomous improvement goal, so this is treated as the next Codex improvement pass before handing back to Claude Code.
- Phase: Autonomous Improvement / UX + Filter Reliability / Verification / Handoff
- Last updated: 2026-07-06 (Codex Loop 10)

## 1. Current Goal
今回の目的：

- Continue moving the app toward the standing two-score goal:
  - all functions and screen transitions work correctly without bugs
  - the list-generation workflow feels powerful and dependable for daily business use
- Close one concrete UX gap found during the inventory: list quality guidance recommends filtering to companies with corporate numbers, but the UI did not offer a corporate-number presence filter.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit before this Loop 10 change: `0d57872` (`Fix EDINET job false success`).
- Last known good commit: current working tree after Loop 10 changes with `npm run quality` passing locally.
- After committing this handoff, use `git log -1 --oneline` for the exact Loop 10 tip.

## 3. What Was Done
今回完了したこと：

- Read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, recent git status/log, and the relevant Next.js App Router docs before touching pages.
- Confirmed previous Loop 9 state: `0d57872` was pushed, local tree was clean, and the final Cursor Bugbot rerun for `0d57872` showed no new issues.
- Added a `hasCorporateNumber` company filter.
- Added the filter to:
  - shared filter types and parsing
  - Supabase-backed company query filtering
  - mock-data filtering
  - active filter badge formatting
  - `/lists` condition form
  - `/lists` quality action shortcuts as `法人番号ありのみ`
  - `/companies` filter form and active-filter detection
- Added/updated unit and E2E coverage for parsing, badges, mock data access, list quality action behavior, and company-list filtering.
- Ran the full quality gate successfully.

## 4. Files Changed
主な変更ファイル：

- `src/lib/types.ts`
- `src/lib/validation.ts`
- `src/lib/data.ts`
- `src/lib/filter-labels.ts`
- `src/app/lists/page.tsx`
- `src/app/companies/page.tsx`
- `tests/etl.test.ts`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

## 5. Current Status
現在の状態：

- Local `npm run quality` is green.
- The list-generation UX now has a direct action for the readiness recommendation `法人番号ありの企業に絞る`.
- The same corporate-number presence filter is available in the general company list so CSV export/search workflows can use it consistently.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
既知の問題：

- Cursor Bugbot should be rerun after this Loop 10 commit is pushed.
- Full EDINET XBRL download/extraction remains unimplemented; current behavior intentionally fails EDINET jobs when no facts are applied.
- Real staging Supabase smoke verification was not run because staging credentials were not provided.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` still reports mock-mode/staging-smoke readiness limitations when Supabase evidence is absent.
- Coverage remains useful but not exhaustive, especially around live Supabase integration paths.

## 7. Bugbot Findings
Cursor Bugbotの指摘と対応状況：

- Previous Loop 9 finding `EDINET jobs always succeed`: fixed in `0d57872`.
- Cursor Bugbot rerun for `0d57872`: `Bugbot reviewed your changes and found no new issues!`
- Loop 10 changes have not yet been reviewed by Bugbot until this handoff commit is pushed and `bugbot run` is triggered again.

## 8. Verification Results
実行した確認コマンドと結果：

```bash
npm run test -- --runInBand
# failed before tests ran: Vitest does not support Jest's --runInBand option in this project.

npm run test
# success: quality guard passed; 82 tests passed

npm run typecheck
# success

npm run lint
# success

npm run test:e2e
# success: 8 Playwright tests passed

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 82 passed
# - test:coverage: success
# - test:e2e: success, 8 passed
# - build: success
```

## 9. Current Scores
100点満点の暫定評価：

- 機能・画面遷移・不具合ゼロ評価: 93 / 100
- リスト生成ツールとしての体験価値評価: 91 / 100

未達理由：

- Live Supabase/staging smoke evidence is still missing.
- Full EDINET enrichment is not complete.
- Coverage on live integration paths remains lower than ideal.
- More high-value list operations could still be added, such as saved-list comparison, bulk exclusion by issue type, or clearer persisted history analytics.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Inspect the Loop 10 diff, especially `hasCorporateNumber` propagation through `types`, `validation`, `data`, `/lists`, `/companies`, and tests.
2. Confirm `npm run quality` locally if time allows.
3. Rerun Cursor Bugbot on the latest pushed head and address any actionable findings.
4. Review whether the Supabase `corporate_number is null/not null` semantics are sufficient, or whether empty-string records should also be normalized/filtered.
5. If continuing implementation, choose one focused improvement toward the standing goal, preferably staging smoke readiness or full EDINET fact application.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- `hasCorporateNumber` filter consistency across mock data and Supabase queries.
- Whether adding the filter to `/companies` as well as `/lists` is appropriate and non-disruptive.
- E2E coverage around the new quality-action shortcut preserving list name and description.
- Whether the current provisional scores and residual risks are honest.

## 12. Do Not Touch
触らない方がよい領域：

- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not deploy to production from this branch.
- Do not force-push.
- Do not delete or weaken tests to make checks pass.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`) unless intentionally regenerating local artifacts and keeping them uncommitted.

## 13. Notes for Claude Code
Claude Codeへの補足：

- This pass touched Next.js pages only after reading the local Next.js 16 App Router docs for pages, Server/Client Components, and mutations.
- The incorrect `npm run test -- --runInBand` command was a command-choice error, not an implementation failure; the canonical `npm run test` and full `npm run quality` both passed.
- The new filter intentionally supports the main business case: keep list outputs tied to the primary matching key, corporate number, when users need higher-confidence lists.
