# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this Codex continuation, so this remains Loop 14.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 10:58 +09:00

## 1. Current Goal
今回の目的：

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Improve list/search usefulness with small, reviewable changes that pass the full quality gate.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed commit before this handoff update: `952b34d` (`Update handoff after search normalization`)
- Latest local implementation commit: `7e29c09` (`Expand company keyword search coverage`)
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Last known good commit with full local `npm run quality`: `7e29c09`

## 3. What Was Done
今回完了したこと：

- Confirmed CodeRabbit is installed/enabled for `kotakase2022-jpg/collector`.
- Confirmed the latest pushed PR head before this continuation had GitHub commit status `CodeRabbit: success`.
- Expanded company keyword search in `getCompanies`:
  - Supabase path now searches `name`, `name_kana`, `corporate_number`, `official_url`, `industry`, `prefecture`, `city`, and `address`.
  - Mock/fallback path now uses the same broader haystack and normalizes it with NFKC before matching.
- Added regression coverage that keyword search can find companies by `name_kana`, `city`, and `industry`, in addition to the existing corporate-number and URL cases.
- Ran targeted tests, full local quality gate, and ETL self-evaluation.
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, or deployment settings.

## 4. Files Changed
主な変更ファイル：

- `src/lib/data.ts`
  - Broadened company keyword search coverage for list generation, company list filtering, exports, and saved-list generation because all use `getCompanies`.
- `tests/etl.test.ts`
  - Added regression assertions for kana/city/industry keyword search through the safe fallback data accessor path.
- `AI_HANDOFF.md`
  - Rewritten to reflect current CodeRabbit status, latest implementation work, verification results, and next actions.

## 5. Current Status
現在の状態：

- Local implementation commit `7e29c09` is ahead of origin and passed `npm run quality`.
- CodeRabbit GitHub App is installed for the repository.
- CodeRabbit status on the latest pushed commit before this continuation (`952b34d`) was `success`.
- This handoff update has not yet been committed at the time of writing.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active; current evidence is still not enough to mark it complete.

## 6. Known Issues
既知の問題：

- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services in this continuation.
- `npm run etl:self-evaluate` still reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.
- The draft PR remains draft, so CodeRabbit behavior should be rechecked after the latest commits are pushed.

## 7. CodeRabbit / Supplemental Review Findings
Cursor Bugbotの指摘と対応状況：

- CodeRabbit:
  - Installed/enabled for `kotakase2022-jpg/collector`.
  - Latest checked pushed commit before this continuation: `952b34d`.
  - GitHub commit status result: `CodeRabbit: success`.
  - No Critical/High CodeRabbit finding is currently known from the available connector evidence.
  - After pushing `7e29c09` and this handoff commit, re-check PR #1 comments/statuses.
- Cursor Bugbot:
  - Not used in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success: clean before this continuation; after implementation commit, branch is ahead of origin by 1 until pushed

GitHub connector: get combined status for 952b34d
# success: statuses included { context: "CodeRabbit", state: "success" }

npm test -- tests/etl.test.ts
# success: 96 tests passed

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

git commit -m "Expand company keyword search coverage"
# success: commit 7e29c09
# pre-commit hook passed check:test-integrity, lint, and typecheck
```

## 9. Current Scores
暫定自己評価：

- Function/screen-transition/no-bug score: 99 / 100
- Daily-use list-generation value score: 99 / 100

100未満の理由：

- Live/staging Supabase and external-service flows are still not verified.
- CodeRabbit should re-run on the latest pushed commits after this handoff.
- Full production-like data coverage cannot be proven from mock data alone.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the small keyword-search change in `src/lib/data.ts` and `tests/etl.test.ts`.
2. Push status should be checked; if the branch has been pushed, re-check PR #1 CodeRabbit comments/status for the latest head.
3. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
4. If no review blocker exists, continue one focused improvement toward list-generation value. Good candidates:
   - stronger visible filter summaries for saved lists
   - clearer empty/recovery messaging for no-result list generation
   - staging smoke evidence workflow once safe staging credentials are available

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- Search/query consistency between Supabase and mock paths:
  - `src/lib/data.ts`
  - `tests/etl.test.ts`
- CodeRabbit evidence after the latest push:
  - PR #1 comments/statuses
- Handoff accuracy:
  - `AI_HANDOFF.md`

## 12. Do Not Touch
触らない方がよい領域：

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
Claude Codeへの補足：

- `npm run quality` is the canonical local gate. `npm run verify` does not exist.
- CodeRabbit is the standard PR reviewer. Cursor Bugbot is optional/reserve only.
- The current change intentionally broadens keyword search without changing UI layout or saved-list data structures.
- Because `getCompanies` powers company listing, list preview, saved-list creation/update, and CSV export, this improvement should increase list-generation usefulness without introducing a new feature surface.
- The standing goal must stay active until live/staging evidence and external-service paths are sufficiently verified.
