# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 15 (inferred)
- Loop number inferred from: Previous handoff advanced Claude Code's Loop 14 return into Codex Loop 15. No intervening Claude Code handoff was present, so this remains Loop 15.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 16:55 +09:00

## 1. Current Goal
Current development objective:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Current focused improvement:
  - Strengthen CSV export failure recovery coverage so stale error feedback cannot survive a query/filter change.
- Review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest implementation commit before this handoff update: `72d3314` (`Cover CSV export failure feedback reset`)
- Previous pushed handoff commit before this continuation: `f24c327` (`Pause goal and update handoff for Claude`)
- This handoff update should be committed and pushed after editing this file; run `git rev-parse --short HEAD` for the absolute latest head.
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1

## 3. What Was Done
Completed in this continuation:

- Read required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Confirmed branch state:
  - Started from pushed head `f24c327`.
  - Added one focused E2E regression test commit: `72d3314`.
- Extended the existing CSV export API failure E2E:
  - Injects a 500 response from `/api/companies/export`.
  - Confirms the CSV error alert appears without crashing the page.
  - Changes the company search query to `kitahama-logi`.
  - Confirms the previous CSV error alert disappears after the query changes.
- Ran targeted E2E, full local quality gate, and ETL self-evaluation.
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, deployment settings, persistence logic, parsing logic, or external ETL behavior.

## 4. Files Changed
Main changed files in this continuation:

- `e2e/collector.spec.ts`
  - Added regression coverage that stale CSV export failure feedback disappears when company search query changes.
- `AI_HANDOFF.md`
  - Updated loop status, latest work, verification results, CodeRabbit status expectation, and next action.

## 5. Current Status
Current state:

- Local implementation commit `72d3314` exists and should be followed by this handoff commit.
- `npm run quality` passes after the E2E regression addition.
- `npm run etl:self-evaluate` still runs successfully but reports:
  - `dataMode: mock`
  - `score: 83`
  - `releaseReady: false`
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active and incomplete.

## 6. Known Issues
Known issues:

- After this handoff update is committed and pushed, recheck GitHub Actions `quality-gate` and CodeRabbit status for the newest head.
- CodeRabbit will continue to skip standard review while PR #1 remains Draft.
- To get standard CodeRabbit OSS review, mark PR #1 ready for review or otherwise trigger CodeRabbit according to repository policy.
- GitHub connector auth was previously invalidated; public GitHub API reads work, but authenticated status/comment management may still need reconnecting.
- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit and supplemental review status:

- CodeRabbit:
  - Standard PR reviewer for this public repository.
  - Last checked pushed head before this continuation was `f24c327`; latest continuation commits need status recheck after push.
  - PR #1 is Draft, so CodeRabbit is expected to continue reporting `Review skipped: draft pull request` until the PR is marked ready or review is otherwise triggered.
- GitHub Actions:
  - Recheck `quality-gate` after pushing the latest handoff commit.
- Cursor Bugbot:
  - Not used for code review in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
Commands run and results:

```bash
npm run test:e2e -- --grep "CSV export API failure"
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

git commit -m "Cover CSV export failure feedback reset"
# success:
# - scripts/check:test-integrity hook: success
# - lint hook: success
# - typecheck hook: success
```

## 9. Current Scores
Provisional self-evaluation:

- Function/screen-transition/no-bug score: 99 / 100
- Daily-use list-generation value score: 99 / 100

Why this is not 100 yet:

- Live/staging Supabase and external-service flows are still not verified.
- Full production-like data coverage cannot be proven from mock data alone.
- Standard CodeRabbit review has not run on the latest head because PR #1 is Draft.
- `npm run etl:self-evaluate` still reports mock score `83` and `releaseReady: false`.

## 10. Next Recommended Action
Next recommended action for Claude Code:

1. Confirm the latest handoff commit is present and pushed.
2. Review the focused E2E addition:
   - `e2e/collector.spec.ts`
3. Recheck latest GitHub Actions and CodeRabbit status.
4. Decide whether PR #1 should be marked ready for review so CodeRabbit performs the standard PR review.
5. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
6. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - read-only browser verification of the latest UI if a dev server is already running
   - another small state preservation or recovery edge case in list/CSV workflows

## 11. Suggested Review Scope for Claude Code
Claude Code should focus review on:

- CSV export failure recovery E2E:
  - `e2e/collector.spec.ts`
- Previously related implementation:
  - `src/components/app/csv-export-button.tsx`
- Handoff accuracy:
  - `AI_HANDOFF.md`
- CodeRabbit / GitHub Actions evidence after the latest push:
  - PR #1 checks/statuses

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
- The CSV export feedback is intentionally keyed by endpoint/query/fileName instead of cleared in `useEffect`, because React lint rejects synchronous setState in effect bodies.
- The new failure regression covers the same user expectation as the prior success regression: feedback belongs only to the current export query.
- Do not mark the standing goal complete until live/staging evidence, external-service paths, latest-head CI, and standard CodeRabbit review are sufficiently verified.
