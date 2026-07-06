# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 15 (inferred)
- Loop number inferred from: Previous handoff already advanced Claude Code's Loop 14 return into Codex Loop 15; no intervening Claude Code handoff was present, so this remains a Loop 15 Codex continuation.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 16:42 +09:00

## 1. Current Goal
Current development objective:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Current focus:
  - Remove real screen-transition/state bugs in list, company, and job workflows.
  - Keep diffs small and CodeRabbit-reviewable.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest local implementation commit before this handoff update: `ff79dba` (`Reset filter forms on clear navigation`)
- This handoff update should be committed and pushed after this file update; run `git rev-parse --short HEAD` for the absolute latest head.
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Latest full local `npm run quality` evidence: working tree after `ff79dba`, success.
- Latest `npm run etl:self-evaluate`: command success, `dataMode: mock`, score `83`, `releaseReady: false`.

## 3. What Was Done
Completed in this continuation:

- Read required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Read the relevant Next.js Server/Client Components guide before touching Next.js code.
- Confirmed local branch was clean and synced with origin at start.
- Rechecked public GitHub API status for pushed head `022c7a5`:
  - CodeRabbit status: `success`, `Review skipped: draft pull request`
  - `quality-gate`: `completed`, `success`
- Audited for the same uncontrolled-form stale state class as the saved-list edit fix.
- Added form-state keys to:
  - `src/app/companies/page.tsx`
  - `src/app/jobs/page.tsx`
- Added E2E assertions that:
  - clearing company filters resets the visible query input, employee range, revenue presence, and sort controls
  - clearing job filters resets the visible query input and status select
- Created implementation commit:
  - `ff79dba Reset filter forms on clear navigation`
- Ran targeted E2E, full local `npm run quality`, and ETL self-evaluation.
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, deployment settings, persistence logic, parsing logic, or external ETL behavior.

## 4. Files Changed
Main changed files in this continuation:

- `src/app/companies/page.tsx`
  - Added `filterFormKey` derived from the current company filter query.
  - Applied it as the `key` for the company filter form so clear/navigation resets uncontrolled inputs.
- `src/app/jobs/page.tsx`
  - Added `filterFormKey` derived from job search/status filters.
  - Applied it as the `key` for the job filter form so clear/navigation resets uncontrolled inputs.
- `e2e/collector.spec.ts`
  - Added company filter clear UI-state assertions.
  - Added job filter clear UI-state assertions.
- `AI_HANDOFF.md`
  - Updated loop status, bug-risk summary, verification results, CodeRabbit/GitHub Actions status, current scores, and next action.

## 5. Current Status
Current state:

- Local branch is ahead of origin by implementation commit `ff79dba` plus this handoff update once committed.
- The known stale uncontrolled-form state class is now covered for:
  - saved-list edit navigation
  - company filter clear navigation
  - job filter clear navigation
- Full local verification after `ff79dba`:
  - `npm run quality` passed:
    - typecheck passed
    - lint passed
    - unit/integration tests passed, 96 tests
    - coverage passed, 96 tests
    - Playwright E2E passed, 8 tests
    - production build passed
  - `npm run etl:self-evaluate` command passed but still reports mock score `83` and `releaseReady: false`.
  - commit hook quality guard/lint/typecheck passed while creating `ff79dba`.
- Pushed head `022c7a5` has GitHub Actions `quality-gate` completed successfully.
- CodeRabbit will still skip review while PR #1 remains Draft.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active; current evidence is not enough to mark it complete.

## 6. Known Issues
Known issues:

- This handoff update still needs to be committed and pushed after editing this file.
- After pushing the latest handoff commit, recheck GitHub Actions `quality-gate` and CodeRabbit status for the newest head.
- CodeRabbit skipped pushed head `022c7a5` because PR #1 is still Draft. To get standard CodeRabbit review, mark the PR ready for review or trigger review according to the repo's CodeRabbit policy.
- GitHub connector auth was previously invalidated; public GitHub API reads work, but authenticated status/comment management may still need reconnecting.
- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit and supplemental review status:

- CodeRabbit:
  - Standard PR reviewer for this public repository.
  - Public GitHub API check for `022c7a5`:
    - commit status `state: success`
    - CodeRabbit context `success`
    - description: `Review skipped: draft pull request`
  - Public GitHub API check-runs for `022c7a5`:
    - `quality-gate`: `completed`, `success`
  - After pushing this handoff update, re-check CodeRabbit and `quality-gate` for the latest head.
- Cursor Bugbot:
  - Not used for code review in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
Commands run and results:

```bash
npm run test:e2e -- --grep "company filters|job management"
# success: 2 passed

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

git commit -m "Reset filter forms on clear navigation"
# success:
# - scripts/check:test-integrity hook: success
# - lint hook: success
# - typecheck hook: success
```

Previously verified on `022c7a5`:

```bash
# GitHub Actions quality-gate
# completed / success

# CodeRabbit status context
# success: Review skipped: draft pull request
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

1. Review the filter-form reset changes:
   - `src/app/companies/page.tsx`
   - `src/app/jobs/page.tsx`
   - `e2e/collector.spec.ts`
2. Recheck latest pushed GitHub Actions and CodeRabbit status after the final handoff commit is pushed.
3. Decide whether PR #1 should be marked ready for review so CodeRabbit reviews the latest head.
4. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
5. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - read-only browser verification of the latest UI if a dev server is already running
   - another small screen-transition/state preservation edge case in list workflows

## 11. Suggested Review Scope for Claude Code
Claude Code should focus review on:

- Uncontrolled filter-form reset behavior:
  - `src/app/companies/page.tsx`
  - `src/app/jobs/page.tsx`
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
- The filter form keys intentionally mirror the saved-list edit fix: uncontrolled inputs use `defaultValue`, so form remounting is required when server-derived query state changes through client navigation.
- This continuation does not alter CSV parsing, CSV export, API behavior, persistence, Supabase logic, or ETL behavior.
- The standing goal must stay active until live/staging evidence, external-service paths, latest-head CI, and standard CodeRabbit review are sufficiently verified.
