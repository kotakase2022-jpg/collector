# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 15 (inferred)
- Loop number inferred from: Previous handoff was Claude Code returning Loop 14 to Codex and explicitly said to advance to Loop 15 when beginning the next Codex development sub-task.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 13:31 +09:00

## 1. Current Goal
Current development objective:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Address Claude Code's minor UX observation for CSV import-check result wording:
  - avoid saying `先頭4 / 4行` when all preview rows fit on screen.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed implementation head: `74ba065` (`Refine CSV preview scope wording`)
- Current handoff update should be committed after this file update; run `git rev-parse --short HEAD` for the absolute latest head.
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Last known good implementation state with full local `npm run quality`: working tree after `74ba065`.

## 3. What Was Done
Completed in this continuation:

- Read required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Read the relevant Next.js Server/Client Components guide before touching the client component:
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- Rechecked the latest Claude Code handoff.
- Attempted to re-check CodeRabbit via the GitHub connector, but the connector token is currently invalidated (`HTTP 401 token_invalidated`).
- Refined CSV import-check result wording:
  - If the preview is truncated, show `先頭N / 全行`.
  - If all rows fit, show `N / N行すべて`.
- Updated the E2E assertion for the main list-generation/CSV import workflow.
- Ran targeted E2E, full local quality gate, and ETL self-evaluation.
- Did not use Cursor Bugbot for code review.
- Did not touch secrets, production DB, production APIs, deployment settings, persistence, parsing logic, API behavior, or external ETL behavior.

## 4. Files Changed
Main changed files in this continuation:

- `src/components/app/csv-import-preview.tsx`
  - Added a display-only `previewScope` string so all-rows-visible and truncated previews use clearer wording.
- `e2e/collector.spec.ts`
  - Updated the CSV import-check assertion from `先頭4 / 4行` to `4 / 4行すべて`.
- `AI_HANDOFF.md`
  - Updated current status, verification results, residual risks, and next action.

## 5. Current Status
Current state:

- Implementation commit `74ba065` was created locally.
- Full local `npm run quality` passed after the CSV preview wording refinement.
- Targeted E2E for the list-generation/saved-list reuse flow passed.
- The branch is expected to be pushed after this handoff update.
- GitHub connector authentication is currently invalidated, so CodeRabbit status for the latest head could not be checked from Codex.
- Cursor Bugbot remains optional/reserve only because of usage cost.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active; current evidence is not enough to mark it complete.

## 6. Known Issues
Known issues:

- GitHub connector returned `HTTP 401 token_invalidated`; reconnect GitHub or check CodeRabbit directly in GitHub PR #1 after the final push.
- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services in this continuation.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit and supplemental review status:

- CodeRabbit:
  - Installed/enabled for `kotakase2022-jpg/collector`.
  - Latest checked status before this continuation: Claude handoff reported the last known confirmed success was on `80b688f`.
  - Codex attempted to re-check `526049a` via GitHub connector, but the connector token was invalidated.
  - Re-check CodeRabbit status/comments after pushing `74ba065` and this handoff update.
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

GitHub connector: get combined status for 526049a
# failed: HTTP 401 token_invalidated
```

## 9. Current Scores
Provisional self-evaluation:

- Function/screen-transition/no-bug score: 99 / 100
- Daily-use list-generation value score: 99 / 100

Why this is not 100 yet:

- Live/staging Supabase and external-service flows are still not verified.
- Full production-like data coverage cannot be proven from mock data alone.
- CodeRabbit must be rechecked after the final pushed head for this continuation.
- GitHub connector authentication needs repair for direct Codex-side CodeRabbit verification.

## 10. Next Recommended Action
Next recommended action for Claude Code:

1. Review the CSV import preview wording refinement:
   - `src/components/app/csv-import-preview.tsx`
   - `e2e/collector.spec.ts`
2. Re-check CodeRabbit status/comments for the latest pushed head, either via GitHub UI or after reconnecting the GitHub connector.
3. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
4. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - additional small recovery affordance for saved-list comparison edge cases
   - read-only browser verification of the latest UI if a dev server is already running

## 11. Suggested Review Scope for Claude Code
Claude Code should focus review on:

- CSV import-check result wording:
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
- This continuation changes only CSV import-check result wording and E2E coverage; it does not alter parsing, validation, persistence, API behavior, or CSV export.
- The standing goal must stay active until live/staging evidence and external-service paths are sufficiently verified.
