# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 11 (inferred)
- Loop number inferred from: Loop 10 was committed and pushed as `f5ae483` (`Add corporate number list filter`). The user continued the standing autonomous improvement goal, and Cursor Bugbot reported one actionable finding against `f5ae483`, so this is the next Codex fix pass.
- Phase: Bugbot Fix / Filter Semantics / Verification / Handoff
- Last updated: 2026-07-06 (Codex Loop 11)

## 1. Current Goal
今回の目的：

- Continue moving the app toward the standing two-score goal:
  - all functions and screen transitions work correctly without bugs
  - the list-generation workflow feels powerful and dependable for daily business use
- Address the latest Cursor Bugbot finding for the corporate-number presence filter.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest implementation commit: `1df37c8` (`Align corporate number filter semantics`).
- Last known good commit: `1df37c8`, with local `npm run quality`, GitHub `quality-gate`, and Cursor Bugbot no-new-issues confirmed.
- After committing this handoff, use `git log -1 --oneline` for the exact Loop 11 tip.

## 3. What Was Done
今回完了したこと：

- Read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, git status/log, and current PR/Bugbot state.
- Confirmed Cursor Bugbot completed on `f5ae483` and reported one medium finding: `Corporate number filter mismatch`.
- Fixed `hasCorporateNumber` Supabase filtering so empty strings are treated as missing, matching mock/local filtering semantics.
- Added `hasCorporateNumberValue` helper and `missingCorporateNumberSupabaseFilter` constant.
- Updated tests to lock:
  - non-empty corporate numbers are present
  - empty strings and whitespace-only values are missing
  - Supabase missing filter covers `null` and empty string
- Ran the full quality gate successfully.

## 4. Files Changed
主な変更ファイル：

- `src/lib/data.ts`
  - `hasCorporateNumber=yes` now applies `not is null` and `neq ""`.
  - `hasCorporateNumber=no` now applies `corporate_number.is.null,corporate_number.eq.`.
  - Mock filtering uses the same whitespace-aware helper semantics.
- `tests/etl.test.ts`
  - Added tests for corporate-number presence semantics and the PostgREST missing filter string.
- `AI_HANDOFF.md`
  - Updated this Loop 11 handoff.

## 5. Current Status
現在の状態：

- Local `npm run quality` is green.
- GitHub `quality-gate` for `1df37c8` is green.
- Cursor Bugbot rerun for `1df37c8` reported no new issues.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
既知の問題：

- Full EDINET XBRL download/extraction remains unimplemented; current behavior intentionally fails EDINET jobs when no facts are applied.
- Real staging Supabase smoke verification was not run because staging credentials were not provided.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` still reports mock-mode/staging-smoke readiness limitations when Supabase evidence is absent.
- Coverage remains useful but not exhaustive, especially around live Supabase integration paths.

## 7. Bugbot Findings
Cursor Bugbotの指摘と対応状況：

- `f5ae483`: Cursor Bugbot reported `Corporate number filter mismatch` (Medium).
- Status: fixed by this Loop 11 pass.
- Fix summary: Supabase and mock filtering now both treat `null`, empty string, and whitespace-only corporate numbers as missing.
- Rerun result for `1df37c8`: `Bugbot reviewed your changes and found no new issues!`
- Pending after this handoff-only commit: rerun Cursor Bugbot only if the PR head changes again.

## 8. Verification Results
実行した確認コマンドと結果：

```bash
npm run typecheck
# success

npm run test
# success: quality guard passed; 82 tests passed

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

- 機能・画面遷移・不具合ゼロ評価: 94 / 100
- リスト生成ツールとしての体験価値評価: 91 / 100

未達理由：

- Live Supabase/staging smoke evidence is still missing.
- Full EDINET enrichment is not complete.
- Coverage on live integration paths remains lower than ideal.
- More high-value list operations could still be added, such as saved-list comparison, bulk exclusion by issue type, or clearer persisted history analytics.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Inspect the Loop 11 diff in `src/lib/data.ts` and `tests/etl.test.ts`.
2. Confirm `npm run quality` locally if time allows.
3. Rerun Cursor Bugbot on the latest pushed head and address any actionable findings.
4. Review whether the PostgREST empty-string filter `corporate_number.eq.` is acceptable for the deployed Supabase/PostgREST version; if staging credentials are available, validate via `npm run smoke:staging`.
5. If continuing implementation, choose one focused improvement toward the standing goal, preferably staging smoke readiness, live Supabase filter coverage, or full EDINET fact application.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- Supabase/PostgREST semantics for empty-string matching in `.or("corporate_number.is.null,corporate_number.eq.")`.
- Whether whitespace-only `corporate_number` values should be prevented/normalized at ingest time as a future hardening task.
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

- This pass did not touch Next.js pages; no additional Next.js docs were needed beyond the standing project instructions.
- The fix is intentionally narrow: it aligns production and mock semantics for the filter added in Loop 10.
- The standing goal remains active; do not mark it complete until all requirements are actually verified, including live/staging concerns.
