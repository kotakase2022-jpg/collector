# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this continuation, so this remains Loop 14.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 11:55 +09:00

## 1. Current Goal
Current development objective:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Improve CSV import-check clarity for daily list-generation workflows.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed implementation head: `391f25e` (`Clarify CSV import preview scope`)
- Current handoff update should be committed after this file update; run `git rev-parse --short HEAD` for the absolute latest head.
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Last known good implementation state with full local `npm run quality`: working tree after `391f25e`.

## 3. What Was Done
Completed in this continuation:

- Read required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Inspected CSV import-check UI and parsing logic:
  - `src/components/app/csv-import-preview.tsx`
  - `src/lib/csv-import-preview.ts`
  - `src/lib/list-quality.ts`
  - `src/app/api/lists/import-preview/route.ts`
- Added a clear CSV import preview-scope note to the result panel:
  - shows `先頭N / 全行` preview scope
  - reiterates that CSV import check does not save to DB
  - clarifies that only columns, missing values, duplicates, and URL format are checked
- Added E2E coverage asserting the preview scope note appears during the main list-generation/CSV import workflow.
- Ran targeted E2E, full local quality gate, and ETL self-evaluation.
- Did not use Cursor Bugbot for code review.
- Did not touch secrets, production DB, production APIs, deployment settings, persistence, or external ETL behavior.

Previously completed in Loop 14:

- Confirmed CodeRabbit is installed/enabled for `kotakase2022-jpg/collector`.
- Broadened `getCompanies` keyword matching to search `name`, `name_kana`, `corporate_number`, `official_url`, `industry`, `prefecture`, `city`, and `address` in both Supabase and mock paths.
- Updated search input placeholders on `/companies` and `/lists` to communicate the broader keyword scope.
- Added saved-list filter badges to each saved-list card on `/lists`.
- Added saved-list detail action affordances.
- Added a saved-list display summary clarifying on-screen rows versus full CSV export scope.
- Added unit-test boundary coverage for saved-list display row limiting.
- Improved zero-row saved-list detail recovery with direct edit/list-generation links.
- Raised the Cursor dashboard On-Demand/Bugbot-related spending limit from 110 USD to 120 USD at the user's request.

## 4. Files Changed
Main changed files in this continuation:

- `src/components/app/csv-import-preview.tsx`
  - Added a preview-scope and no-DB-save note to CSV import-check results.
- `e2e/collector.spec.ts`
  - Added an assertion for the CSV import preview-scope note in the primary list workflow.
- `AI_HANDOFF.md`
  - Updated current status, verification results, residual risks, and next action.

## 5. Current Status
Current state:

- Implementation commit `391f25e` was created locally.
- Full local `npm run quality` passed after the CSV preview-scope change.
- Targeted E2E for the list-generation/saved-list reuse flow passed.
- The branch is expected to be pushed after this handoff update.
- Latest CodeRabbit status before this continuation was `success` on `80b688f`; re-check after pushing the latest head.
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
  - Latest checked status before this continuation: `80b688f` had `CodeRabbit: success`.
  - Re-check CodeRabbit status/comments after pushing `391f25e` and this handoff update.
- Cursor Bugbot:
  - Not used for code review in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
Commands run and results:

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

1. Review the CSV import preview-scope note:
   - `src/components/app/csv-import-preview.tsx`
   - `e2e/collector.spec.ts`
2. Re-check CodeRabbit status/comments for the latest pushed head.
3. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
4. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - additional small recovery affordance for saved-list comparison edge cases
   - read-only manual browser verification of the latest pushed UI if a dev server is already running

## 11. Suggested Review Scope for Claude Code
Claude Code should focus review on:

- CSV import-check result clarity:
  - `src/components/app/csv-import-preview.tsx`
- E2E coverage:
  - `e2e/collector.spec.ts`
- Handoff accuracy:
  - `AI_HANDOFF.md`
- CodeRabbit evidence after the latest push:
  - PR #1 comments/statuses

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
- This continuation changes only CSV import-check result text and E2E coverage; it does not alter parsing, validation, persistence, API behavior, or CSV export.
- The standing goal must stay active until live/staging evidence and external-service paths are sufficiently verified.
