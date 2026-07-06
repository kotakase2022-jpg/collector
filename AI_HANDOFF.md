# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 15 (inferred)
- Loop number inferred from: Previous handoff already advanced Claude Code's Loop 14 return into Codex Loop 15. No intervening Claude Code handoff was present, so this remains Loop 15 and is being paused at a clean handoff point.
- Phase: Handoff / Paused by user request
- Last updated: 2026-07-06 16:51 +09:00

## 1. Current Goal
Current development objective:

- Standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- User requested stopping at a clean point because Codex credit consumption is a concern.
- Goal handling note:
  - The Codex Goal tool currently exposes `active`, `complete`, and `blocked`; it does not expose a true pause state.
  - The goal is therefore documented as paused in this handoff, but the tool-backed goal remains active and should not be marked complete or blocked unless the actual completion/blocking rules are satisfied.
- Review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest local commit: `0b9c2aa` (`Update handoff after CSV export feedback fix`)
- Latest remote commit: `0b9c2aa` on `origin/codex/permanent-quality-gate-governance`
- Last known good commit: `0b9c2aa`
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1

## 3. What Was Done
Completed before this pause:

- Kept the latest implementation work focused on screen-transition/state bugs and stale feedback.
- Fixed saved-list edit navigation state reset in `/lists`.
- Fixed company and job filter form reset behavior after clear navigation.
- Fixed stale CSV export success/error feedback so messages are scoped to the current export endpoint/query/fileName.
- Added Playwright regression coverage for the above workflows.
- Confirmed latest pushed head `0b9c2aa` is in sync with origin.
- Rechecked public GitHub status for `0b9c2aa`:
  - `quality-gate`: completed successfully.
  - `CodeRabbit`: success status, but review skipped because PR #1 is Draft.
- Did not run Cursor Bugbot in this continuation.
- Did not touch secrets, production DB, production APIs, deployment settings, persistence logic, parsing logic, or external ETL behavior.
- Updated this handoff file to stop at a clean point for Claude Code.

## 4. Files Changed
Main changed files in the latest pushed work:

- `src/app/lists/page.tsx`
  - Reset saved-list form state when navigating between saved edit URLs.
- `src/app/companies/page.tsx`
  - Reset filter form state when clearing filters.
- `src/app/jobs/page.tsx`
  - Reset job filter form state when clearing filters.
- `src/components/app/csv-export-button.tsx`
  - Scope CSV export feedback to the current endpoint/query/fileName.
- `e2e/collector.spec.ts`
  - Added regression coverage for saved-list edit restore, filter clear resets, and CSV export feedback clearing.
- `AI_HANDOFF.md`
  - Updated latest status and pause handoff.

This handoff update itself changes only:

- `AI_HANDOFF.md`

## 5. Current Status
Current state:

- Working tree was clean before this handoff edit.
- Branch is aligned with origin at `0b9c2aa` before this handoff edit.
- Latest GitHub Actions evidence for `0b9c2aa`:
  - `quality-gate`: `completed`, `success`.
- Latest CodeRabbit evidence for `0b9c2aa`:
  - status context `CodeRabbit`: `success`
  - description: `Review skipped: draft pull request`
- Local full verification from the latest implementation cycle:
  - `npm run quality` passed after the CSV export feedback fix.
  - `npm run etl:self-evaluate` executed successfully but remained in mock mode with score `83` and `releaseReady: false`.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal is not complete.

## 6. Known Issues
Known issues:

- This handoff edit should be committed and pushed before handing fully to Claude Code.
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
  - Public GitHub API check for `0b9c2aa`:
    - commit status `state: success`
    - CodeRabbit context `success`
    - description: `Review skipped: draft pull request`
  - CodeRabbit has not produced actionable review findings on the latest head because PR #1 is Draft.
- GitHub Actions:
  - Public GitHub API check-runs for `0b9c2aa`:
    - `quality-gate`: `completed`, `success`
- Cursor Bugbot:
  - Not used for code review in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
Latest relevant commands and results:

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

git status --short --branch
# success before this handoff edit:
# ## codex/permanent-quality-gate-governance...origin/codex/permanent-quality-gate-governance

# Public GitHub API check for 0b9c2aa
# quality-gate: completed / success
# CodeRabbit: success, Review skipped: draft pull request
```

No full quality gate was rerun for this documentation-only pause update.

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

1. Confirm this handoff commit is present and pushed.
2. Review the latest focused changes:
   - `src/app/lists/page.tsx`
   - `src/app/companies/page.tsx`
   - `src/app/jobs/page.tsx`
   - `src/components/app/csv-export-button.tsx`
   - `e2e/collector.spec.ts`
3. Decide whether PR #1 should be marked ready for review so CodeRabbit performs the standard PR review.
4. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
5. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - read-only browser verification of the latest UI if a dev server is already running
   - another small stale-feedback/state preservation edge case in CSV/list workflows

## 11. Suggested Review Scope for Claude Code
Claude Code should focus review on:

- Screen-transition and form-state reset fixes:
  - `src/app/lists/page.tsx`
  - `src/app/companies/page.tsx`
  - `src/app/jobs/page.tsx`
- CSV export feedback scoping:
  - `src/components/app/csv-export-button.tsx`
- E2E regression coverage:
  - `e2e/collector.spec.ts`
- Handoff accuracy:
  - `AI_HANDOFF.md`
- CodeRabbit / GitHub Actions evidence after the latest handoff commit:
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
- This pause was requested for Codex credit conservation. Resume from this handoff rather than rediscovering context.
- Do not mark the standing goal complete until live/staging evidence, external-service paths, latest-head CI, and standard CodeRabbit review are sufficiently verified.
