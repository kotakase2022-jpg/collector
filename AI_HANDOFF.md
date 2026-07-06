# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this continuation, so this remains Loop 14.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 11:40 +09:00

## 1. Current Goal
Current development objective:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Close the current Codex work unit by adding focused boundary coverage for saved-list display row limiting.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed head before this continuation: `4b770c7` (`Clarify saved list display scope`)
- Current continuation changes are intended to be committed after this handoff update; run `git rev-parse --short HEAD` for the absolute latest head.
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Last known good implementation state with full local `npm run quality`: working tree after the saved-list display boundary unit tests.

## 3. What Was Done
Completed in this continuation:

- Read required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Added focused unit-test boundary coverage for `buildListDisplayRows`:
  - empty rows with a normal display limit
  - display limit `0`
  - negative display limit
- Confirmed the row-limiting logic keeps saved/exportable row count separate from the on-screen row cap.
- Ran targeted Vitest, full local quality gate, and ETL self-evaluation.
- Did not use Cursor Bugbot for code review.
- Did not touch secrets, production DB, production APIs, deployment settings, persistence, data queries, or UI behavior.

Previously completed in Loop 14:

- Confirmed CodeRabbit is installed/enabled for `kotakase2022-jpg/collector`.
- Broadened `getCompanies` keyword matching to search `name`, `name_kana`, `corporate_number`, `official_url`, `industry`, `prefecture`, `city`, and `address` in both Supabase and mock paths.
- Updated search input placeholders on `/companies` and `/lists` to communicate the broader keyword scope.
- Added saved-list filter badges to each saved-list card on `/lists`.
- Added saved-list detail action affordances.
- Added a saved-list display summary clarifying on-screen rows versus full CSV export scope.
- Added E2E coverage for broader keyword search copy, saved-list filter badges, saved-list detail actions, saved-list display summary, and list-generation no-result recovery actions.

## 4. Files Changed
Main changed files in this continuation:

- `tests/etl.test.ts`
  - Added boundary assertions for `buildListDisplayRows`.
- `AI_HANDOFF.md`
  - Updated current status, verification results, residual risks, and next action.

## 5. Current Status
Current state:

- Full local `npm run quality` passed after the saved-list display boundary unit tests.
- Targeted Vitest for `リスト画面表示` passed after correcting the unsupported `--runInBand` flag.
- CodeRabbit GitHub App/status check is active for the repository.
- Latest checked pushed head before this continuation: `4b770c7`.
- Latest checked CodeRabbit status before this continuation: `success`.
- Cursor Bugbot remains optional/reserve only because of usage cost.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active; current evidence is not enough to mark it complete.

## 6. Known Issues
Known issues:

- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services in this continuation.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.
- CodeRabbit should be rechecked after every push.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit and supplemental review status:

- CodeRabbit:
  - Installed/enabled for `kotakase2022-jpg/collector`.
  - Latest checked pushed head before this continuation: `4b770c7`.
  - GitHub commit status result: `CodeRabbit: success`.
  - Re-check CodeRabbit status/comments after pushing this boundary test change.
- Cursor Bugbot:
  - Not used for code review in this continuation.
  - Remains optional/reserve because of cost.
  - User requested raising the Cursor Bugbot usage cap to 120 USD after a clean stopping point; complete or record that operational action separately from the code review gate.

## 8. Verification Results
Commands run and results:

```bash
npm run test -- --runInBand -t "リスト画面表示"
# failed: Vitest does not support Jest's --runInBand flag. This was a command selection error, not an implementation failure.

npm run test -- -t "リスト画面表示"
# success: 1 passed, 95 skipped

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

GitHub connector: get combined status for 4b770c7
# success: statuses included { context: "CodeRabbit", state: "success" }
```

## 9. Current Scores
Provisional self-evaluation:

- Function/screen-transition/no-bug score: 99 / 100
- Daily-use list-generation value score: 99 / 100

Why this is not 100 yet:

- Live/staging Supabase and external-service flows are still not verified.
- Full production-like data coverage cannot be proven from mock data alone.
- CodeRabbit must be rechecked after the final pushed head for this continuation.

## 10. Next Recommended Action
Next recommended action for Claude Code:

1. Review the saved-list display boundary test additions:
   - `tests/etl.test.ts`
2. Re-check CodeRabbit status/comments for the latest pushed head.
3. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
4. If no review blocker exists, continue one focused improvement toward list-generation value. Good candidates:
   - richer saved-list detail empty/recovery messaging
   - staging smoke evidence workflow once safe staging credentials are available
   - a README encoding cleanup pass if documentation readability becomes a priority

## 11. Suggested Review Scope for Claude Code
Claude Code should focus review on:

- Unit-test coverage:
  - `tests/etl.test.ts`
- Saved-list display scope behavior previously changed:
  - `src/app/lists/[id]/page.tsx`
  - `e2e/collector.spec.ts`
- CodeRabbit evidence after the latest push:
  - PR #1 comments/statuses
- Handoff accuracy:
  - `AI_HANDOFF.md`

## 12. Do Not Touch
Do not touch:

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
- Do not run Cursor Bugbot for normal review unless a maintainer explicitly requests supplemental review.

## 13. Notes for Claude Code
Notes:

- `npm run quality` is the canonical local gate. `npm run verify` does not exist.
- CodeRabbit is the standard PR reviewer. Cursor Bugbot is optional/reserve only.
- This continuation only adds unit-test boundaries for saved-list display row limiting; it does not change runtime behavior.
- The standing goal must stay active until live/staging evidence and external-service paths are sufficiently verified.
