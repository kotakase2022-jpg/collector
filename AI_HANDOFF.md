# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this continuation, so this remains Loop 14.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 11:50 +09:00

## 1. Current Goal
Current development objective:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Improve saved-list detail recovery when a saved list has zero companies.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed implementation head: `3f1731b` (`Improve empty saved list recovery`)
- Current handoff update should be committed after this file update; run `git rev-parse --short HEAD` for the absolute latest head.
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Last known good implementation state with full local `npm run quality`: working tree after `3f1731b`.

## 3. What Was Done
Completed in this continuation:

- Read required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Read the relevant Next.js App Router page guide before touching `src/app/lists/[id]/page.tsx`:
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- Added a mock saved list that intentionally resolves to zero rows:
  - `cccccccc-cccc-4ccc-8ccc-cccccccccccc`
  - name: `0件復旧確認リスト`
  - filters: `{ q: "存在しない企業" }`
- Improved the saved-list detail empty state:
  - shows that the saved list has no companies
  - explains that saved conditions produced zero rows
  - offers direct recovery links to broaden/edit conditions or return to list generation
- Added E2E coverage for the empty saved-list detail recovery flow.
- Fixed the new E2E flow after the first targeted run showed that navigation back to `/lists` broke the following existing saved-list-detail assertions.
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
- Raised the Cursor dashboard On-Demand/Bugbot-related spending limit from 110 USD to 120 USD at the user's request.

## 4. Files Changed
Main changed files in this continuation:

- `src/app/lists/[id]/page.tsx`
  - Replaced the zero-row table message with a guided recovery empty state.
- `src/lib/lists.ts`
  - Added a zero-row mock saved list for deterministic local/E2E coverage.
- `e2e/collector.spec.ts`
  - Added assertions for the zero-row saved-list detail and its recovery links.
- `AI_HANDOFF.md`
  - Updated current status, verification results, residual risks, and next action.

## 5. Current Status
Current state:

- Implementation commit `3f1731b` was created locally.
- Full local `npm run quality` passed after the empty saved-list recovery change.
- Targeted E2E for the list-generation/saved-list reuse flow passed after fixing the test navigation sequence.
- The branch is expected to be pushed after this handoff update.
- Latest CodeRabbit status before this continuation was `success` on `115a81f`; re-check after pushing the latest head.
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
  - Latest checked status before this continuation: `115a81f` had `CodeRabbit: success`.
  - Re-check CodeRabbit status/comments after pushing `3f1731b` and this handoff update.
- Cursor Bugbot:
  - Not used for code review in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
Commands run and results:

```bash
npm run test:e2e -- --grep "list generation supports"
# failed on first run:
# - The new empty-list recovery flow ended at /lists.
# - The following existing assertion expected the original saved-list detail page.
# - Fixed by navigating back to /lists/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa before continuing.

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

1. Review the zero-row saved-list detail recovery UX:
   - `src/app/lists/[id]/page.tsx`
   - `src/lib/lists.ts`
   - `e2e/collector.spec.ts`
2. Re-check CodeRabbit status/comments for the latest pushed head.
3. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
4. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - README encoding/readability cleanup
   - additional small recovery affordance for CSV import failures or saved-list comparison edge cases

## 11. Suggested Review Scope for Claude Code
Claude Code should focus review on:

- Empty saved-list detail behavior:
  - `src/app/lists/[id]/page.tsx`
- Mock saved-list data shape and side effects:
  - `src/lib/lists.ts`
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
- This continuation improves only the zero-row saved-list detail recovery path and deterministic E2E coverage.
- The standing goal must stay active until live/staging evidence and external-service paths are sufficiently verified.
