# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 15 (inferred)
- Loop number inferred from: Previous handoff already advanced Claude Code's Loop 14 return into Codex Loop 15; no intervening Claude Code handoff was present, so this remains a Loop 15 Codex continuation.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 16:47 +09:00

## 1. Current Goal
Current development objective:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Current focus:
  - Remove real screen-transition/state bugs and stale feedback in list, company, job, and CSV workflows.
  - Keep diffs small and CodeRabbit-reviewable.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest local implementation commit before this handoff update: `a010787` (`Scope CSV export feedback to current query`)
- This handoff update should be committed and pushed after this file update; run `git rev-parse --short HEAD` for the absolute latest head.
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Latest full local `npm run quality` evidence: working tree after `a010787`, success.
- Latest `npm run etl:self-evaluate`: command success, `dataMode: mock`, score `83`, `releaseReady: false`.

## 3. What Was Done
Completed in this continuation:

- Read required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Rechecked public GitHub API status for pushed head `243be8e`:
  - CodeRabbit status: `success`, `Review skipped: draft pull request`
  - `quality-gate`: still `in_progress` when checked
- Audited CSV export feedback state after filter/query changes.
- Fixed stale CSV export feedback:
  - `CsvExportButton` now stores success/error messages with the endpoint/query/fileName key they belong to.
  - The component only renders feedback for the current export key.
  - This avoids showing "CSVを作成しました。" after the user changes/clears the current filters.
  - The implementation avoids `useEffect` state resets because lint correctly rejected synchronous setState in effects.
- Added E2E coverage:
  - export filtered company CSV
  - confirm success state appears
  - clear company filters
  - confirm the old success status is gone
- Created implementation commit:
  - `a010787 Scope CSV export feedback to current query`
- Ran targeted E2E, full local `npm run quality`, and ETL self-evaluation.
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, deployment settings, persistence logic, parsing logic, or external ETL behavior.

## 4. Files Changed
Main changed files in this continuation:

- `src/components/app/csv-export-button.tsx`
  - Scoped export success/error feedback to the current endpoint/query/fileName.
- `e2e/collector.spec.ts`
  - Added regression coverage for clearing company filters after CSV export.
- `AI_HANDOFF.md`
  - Updated loop status, bug-risk summary, verification results, CodeRabbit/GitHub Actions status, current scores, and next action.

## 5. Current Status
Current state:

- Local branch is ahead of origin by implementation commit `a010787` plus this handoff update once committed.
- CSV export feedback is now tied to the current export query, so stale success/error messages do not survive filter changes.
- Full local verification after `a010787`:
  - `npm run quality` passed:
    - typecheck passed
    - lint passed
    - unit/integration tests passed, 96 tests
    - coverage passed, 96 tests
    - Playwright E2E passed, 8 tests
    - production build passed
  - `npm run etl:self-evaluate` command passed but still reports mock score `83` and `releaseReady: false`.
  - commit hook quality guard/lint/typecheck passed while creating `a010787`.
- Pushed head `243be8e` was still running GitHub Actions `quality-gate` when checked.
- CodeRabbit will still skip review while PR #1 remains Draft.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active; current evidence is not enough to mark it complete.

## 6. Known Issues
Known issues:

- This handoff update still needs to be committed and pushed after editing this file.
- After pushing the latest handoff commit, recheck GitHub Actions `quality-gate` and CodeRabbit status for the newest head.
- CodeRabbit skipped pushed head `243be8e` because PR #1 is still Draft. To get standard CodeRabbit review, mark the PR ready for review or trigger review according to the repo's CodeRabbit policy.
- GitHub connector auth was previously invalidated; public GitHub API reads work, but authenticated status/comment management may still need reconnecting.
- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit and supplemental review status:

- CodeRabbit:
  - Standard PR reviewer for this public repository.
  - Public GitHub API check for `243be8e`:
    - commit status `state: success`
    - CodeRabbit context `success`
    - description: `Review skipped: draft pull request`
  - Public GitHub API check-runs for `243be8e`:
    - `quality-gate`: `in_progress` when checked
  - After pushing this handoff update, re-check CodeRabbit and `quality-gate` for the latest head.
- Cursor Bugbot:
  - Not used for code review in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
Commands run and results:

```bash
npm run test:e2e -- --grep "CSV export calls"
# success: 1 passed

npm run quality
# first run failed at lint because useEffect synchronously called setState
# implementation was revised to key-scoped feedback without useEffect

npm run test:e2e -- --grep "CSV export calls"
# success after revision: 1 passed

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

git commit -m "Scope CSV export feedback to current query"
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
- CodeRabbit must run on a non-draft or otherwise reviewable PR head to provide the standard review evidence.
- PR #1 is Draft, so review/deployment readiness is not fully proven.

## 10. Next Recommended Action
Next recommended action for Claude Code:

1. Review the CSV export feedback scoping change:
   - `src/components/app/csv-export-button.tsx`
   - `e2e/collector.spec.ts`
2. Recheck latest pushed GitHub Actions and CodeRabbit status after the final handoff commit is pushed.
3. Decide whether PR #1 should be marked ready for review so CodeRabbit reviews the latest head.
4. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
5. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - read-only browser verification of the latest UI if a dev server is already running
   - another small stale-feedback/state preservation edge case in CSV/list workflows

## 11. Suggested Review Scope for Claude Code
Claude Code should focus review on:

- CSV export success/error feedback scoping:
  - `src/components/app/csv-export-button.tsx`
- E2E coverage:
  - `e2e/collector.spec.ts`
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
- This continuation does not alter CSV contents, CSV export API behavior, persistence, Supabase logic, or ETL behavior.
- The standing goal must stay active until live/staging evidence, external-service paths, latest-head CI, and standard CodeRabbit review are sufficiently verified.
