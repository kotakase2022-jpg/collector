# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this Codex continuation, so this remains Loop 14.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 11:31 +09:00

## 1. Current Goal
今回の目的:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Improve saved-list detail reuse clarity with a small, CodeRabbit-reviewable UX change.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed head before this continuation: `f463745` (`Update handoff after saved list summary`)
- Current continuation changes are intended to be committed after this handoff update; run `git rev-parse --short HEAD` for the absolute latest head.
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Last known good implementation state with full local `npm run quality`: current working tree after the saved-list next-action panel change.

## 3. What Was Done
今回完了したこと:

- Read required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Read the relevant Next.js App Router page guide before touching `src/app/lists/[id]/page.tsx`:
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- Added a compact "次のアクション" region to saved-list detail pages.
  - Shows saved snapshot CSV use (`保存CSV`).
  - Shows current-condition regeneration count (`条件再編集`).
  - Shows comparison/export path (`差分比較`).
- Added E2E coverage that verifies the saved-list detail page exposes these next actions.
- Ran targeted E2E, full local quality gate, and ETL self-evaluation.
- Confirmed CodeRabbit status was `success` on the previous final head `f463745` before this continuation.
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, or deployment settings.

Previously completed in Loop 14:

- Confirmed CodeRabbit is installed/enabled for `kotakase2022-jpg/collector`.
- Broadened `getCompanies` keyword matching to search `name`, `name_kana`, `corporate_number`, `official_url`, `industry`, `prefecture`, `city`, and `address` in both Supabase and mock paths.
- Updated search input placeholders on `/companies` and `/lists` to communicate the broader keyword scope.
- Added saved-list filter badges to each saved-list card on `/lists`.
- Added E2E coverage for broader keyword search copy, saved-list filter badges, and list-generation no-result recovery actions.

## 4. Files Changed
主な変更ファイル:

- `src/app/lists/[id]/page.tsx`
  - Added `SavedListNextActions` and rendered it below the saved-list readiness panel.
- `e2e/collector.spec.ts`
  - Added assertions for the saved-list detail next-action region.
- `AI_HANDOFF.md`
  - Updated current status, verification results, residual risks, and next action.

## 5. Current Status
現在の状態:

- Full local `npm run quality` passed after the saved-list detail next-action panel change.
- Targeted E2E for the list-generation/saved-list reuse flow passed.
- CodeRabbit GitHub App/status check is active for the repository.
- Latest checked pushed head before this continuation: `f463745`
- Latest checked CodeRabbit status before this continuation: `success`
- Cursor Bugbot remains optional/reserve only because of usage cost.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active; current evidence is not enough to mark it complete.

## 6. Known Issues
既知の問題:

- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services in this continuation.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.
- CodeRabbit should be rechecked after every push.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit と補助レビューの状況:

- CodeRabbit:
  - Installed/enabled for `kotakase2022-jpg/collector`.
  - Latest checked pushed head before this continuation: `f463745`.
  - GitHub commit status result: `CodeRabbit: success`.
  - Re-check CodeRabbit status/comments after pushing this saved-list detail next-action change.
- Cursor Bugbot:
  - Not used in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
実行した確認コマンドと結果:

```bash
npm run test:e2e -- --grep "list generation supports"
# success: 1 passed

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 96 passed
# - test:coverage: success, 96 passed
# - test:e2e: success, 8 passed
# - build: success

npm run etl:self-evaluate
# success:
# - dataMode: mock
# - score: 83
# - releaseReady: false
# - releaseGateFailures:
#   - Supabase not configured / mock sample scope
#   - 1 failed mock job
#   - 1 running mock job

GitHub connector: get combined status for f463745
# success: statuses included { context: "CodeRabbit", state: "success" }
```

## 9. Current Scores
暫定自己評価:

- Function/screen-transition/no-bug score: 99 / 100
- Daily-use list-generation value score: 99 / 100

100未満の理由:

- Live/staging Supabase and external-service flows are still not verified.
- Full production-like data coverage cannot be proven from mock data alone.
- CodeRabbit must be rechecked after the final pushed head for this continuation.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと:

1. Review the saved-list detail next-action panel:
   - `src/app/lists/[id]/page.tsx`
   - `e2e/collector.spec.ts`
2. Re-check CodeRabbit status/comments for the latest pushed head.
3. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
4. If no review blocker exists, continue one focused improvement toward list-generation value. Good candidates:
   - richer empty/recovery messaging for saved-list detail pages
   - clearer large-list/truncated-list handling on saved-list detail
   - staging smoke evidence workflow once safe staging credentials are available

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:

- Saved-list detail reuse UX:
  - `src/app/lists/[id]/page.tsx`
- E2E coverage:
  - `e2e/collector.spec.ts`
- CodeRabbit evidence after the latest push:
  - PR #1 comments/statuses
- Handoff accuracy:
  - `AI_HANDOFF.md`

## 12. Do Not Touch
触らない方がよい領域:

- `.env`, `.env.local`, API keys, passwords, tokens, Supabase/OpenAI secrets.
- Production Supabase, production APIs, or production user data.
- Production deployment settings.
- Generated/cache outputs:
  - `.next/`
  - `coverage/`
  - `playwright-report/`
  - `test-results/`
  - `tsconfig.tsbuildinfo`

Also:

- Do not force-push.
- Do not delete, skip, or weaken tests to make checks pass.
- Do not run Cursor Bugbot unless a maintainer explicitly requests supplemental review.

## 13. Notes for Claude Code
Claude Codeへの補足:

- `npm run quality` is the canonical local gate. `npm run verify` does not exist.
- CodeRabbit is the standard PR reviewer. Cursor Bugbot is optional/reserve only.
- This continuation only adds saved-list detail guidance and E2E coverage; it does not change list generation, saved-list persistence, CSV export semantics, or data queries.
- The standing goal must stay active until live/staging evidence and external-service paths are sufficiently verified.
