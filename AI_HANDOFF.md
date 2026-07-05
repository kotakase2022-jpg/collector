# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 12 (inferred)
- Loop number inferred from: Loop 11 ended with `b89261f` after recording a clean Bugbot result for `1df37c8`; Cursor Bugbot then reported a new medium finding on `b89261f`, so this is the next Codex Bugbot follow-up pass.
- Phase: Bugbot Fix / Corporate Number Quality Semantics / Verification / Handoff
- Last updated: 2026-07-06 01:38 +09:00

## 1. Current Goal
今回の目的：
- Cursor Bugbot の `Whitespace corporate number quality mismatch` 指摘に対応する。
- 法人番号の「あり/なし」判定を、企業一覧フィルタ、リスト品質サマリ、行バッジで一貫させる。
- 差分を小さく保ち、Claude Code がレビューしやすい状態で渡す。

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest implementation commit: `eed366f` (`Align corporate number quality checks`).
- Latest handoff commit: this handoff-only update; run `git log -1 --oneline` for the exact tip after commit.
- Last known good commit: `eed366f`, with local `npm run quality` passing.

## 3. What Was Done
今回完了したこと：
- Required files were read: `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, plus current diff/log.
- Addressed Cursor Bugbot medium finding:
  - Bugbot said whitespace-only `corporate_number` values were treated as missing by filtering, but quality summaries and row badges still used raw truthiness.
- Added a shared `hasCorporateNumberValue` helper in `src/lib/corporate-number.ts`.
- Re-exported that helper from `src/lib/data.ts` to preserve existing imports.
- Updated `src/lib/list-quality.ts` so:
  - whitespace-only corporate numbers count as missing
  - quality issue badges show `missing_corporate_number`
  - duplicate corporate-number checks trim values before counting
- Added regression tests for whitespace-only corporate numbers and trimmed duplicate counting.
- Ran the full local quality gate successfully.

## 4. Files Changed
主な変更ファイル：
- `src/lib/corporate-number.ts`
  - New shared corporate-number presence helper.
- `src/lib/data.ts`
  - Imports/re-exports the shared helper; existing filter behavior remains unchanged.
- `src/lib/list-quality.ts`
  - Uses the same helper for missing corporate-number summaries and issue badges.
  - Trims corporate numbers before duplicate counting.
- `tests/etl.test.ts`
  - Adds regression coverage for whitespace-only corporate numbers and trimmed duplicate quality checks.
- `AI_HANDOFF.md`
  - Updated this Loop 12 handoff.

## 5. Current Status
現在の状態：
- Local `npm run quality` is green.
- Loop 12 implementation commit `eed366f` was pushed to `origin/codex/permanent-quality-gate-governance`.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.
- Cursor Bugbot rerun for the latest pushed head has not been run yet after the Loop 12 push.

## 6. Known Issues
既知の問題：
- Full EDINET XBRL download/extraction remains unimplemented; current behavior intentionally fails EDINET jobs when no facts are applied.
- Real staging Supabase smoke verification was not run because staging credentials were not provided.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` still reports mock-mode/staging-smoke readiness limitations when Supabase evidence is absent.
- Coverage remains useful but not exhaustive, especially around live Supabase integration paths.
- Supabase cannot natively trim whitespace in the simple `hasCorporateNumber=no` PostgREST filter; ingestion should ideally normalize whitespace-only corporate numbers to `null` or reject them in a future hardening task.

## 7. Bugbot Findings
Cursor Bugbotの指摘と対応状況：
- `f5ae483`: `Corporate number filter mismatch` (Medium) - fixed in Loop 11.
- `b89261f`: `Whitespace corporate number quality mismatch` (Medium) - fixed in this Loop 12 pass.
- Status after this handoff: rerun Cursor Bugbot on the next pushed commit and address any new actionable findings.

## 8. Verification Results
実行した確認コマンドと結果：
```bash
npm run typecheck
# first run failed before helper type guard:
# src/lib/list-quality.ts: corporate_number possibly null / undefined
# fixed by making hasCorporateNumberValue a type guard

npm run test
# success: quality guard passed; 82 tests passed

npm run lint
# success

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
- 機能・画面遷移・不具合ゼロ評価: 95 / 100
- リスト生成ツールとしての日常利用価値評価: 92 / 100

未達理由：
- Live Supabase/staging smoke evidence is still missing.
- Full EDINET enrichment is not complete.
- More high-value list operations could still be added, such as saved-list comparison and stronger persisted history analytics.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：
1. Review the focused Loop 12 diff around `src/lib/corporate-number.ts`, `src/lib/data.ts`, `src/lib/list-quality.ts`, and `tests/etl.test.ts`.
2. Run or confirm `npm run quality`.
3. Rerun Cursor Bugbot on the latest pushed head.
4. If Bugbot is clean, choose the next focused improvement toward the standing goal, preferably staging smoke readiness or live Supabase filter coverage.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：
- Whether the new helper location avoids undesirable client/server coupling.
- Whether trimming corporate numbers in duplicate counting is the desired behavior.
- Whether ingestion should normalize whitespace-only corporate numbers to `null` in a follow-up.

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
- This pass did not touch Next.js pages; no additional Next.js docs were needed beyond standing project instructions.
- The fix is intentionally narrow and directly tied to the latest Bugbot finding.
- The standing goal remains active; do not mark it complete until live/staging concerns and remaining ETL coverage gaps are actually resolved.
