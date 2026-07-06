# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 15 (inferred)
- Loop number inferred from: Previous handoff already advanced Claude Code's Loop 14 return into Codex Loop 15; no intervening Claude Code handoff was present, so this is a Loop 15 Codex continuation.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 16:12 +09:00

## 1. Current Goal
Current development objective:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Improve CSV import-check UX evidence:
  - verify file replacement clears the previous import-preview result
  - prevent users from mistaking an old CSV check result for the newly selected file

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed head before this final metadata update: `d4df51a` (`Update handoff after CSV import reset coverage`)
- Current handoff update should be committed after this file update; run `git rev-parse --short HEAD` for the absolute latest head.
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Last known good implementation state with full local `npm run quality`: working tree after `01a83c6`.

## 3. What Was Done
Completed in this continuation:

- Read required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Read the relevant Next.js Server/Client Components guide before inspecting the client CSV import component.
- Rechecked current branch status, recent commit history, and latest pushed GitHub API statuses.
- Confirmed latest previously pushed head `02427f3`:
  - CodeRabbit: `success`, `Review skipped: draft pull request`
  - `quality-gate` was still running at first; previous implementation head `e3efe6f` was already `completed / success`
- Inspected `src/components/app/csv-import-preview.tsx` and confirmed file changes already clear previous result/error state.
- Added E2E coverage for that behavior:
  - after a successful Japanese-header CSV check, the test selects another CSV file
  - before clicking `CSVを検査`, it verifies the old company name `日本語ヘッダー株式会社` is no longer shown
  - then verifies the new file can still be checked successfully
- Ran targeted E2E, full local quality gate, and ETL self-evaluation.
- Did not use Cursor Bugbot for code review.
- Did not touch secrets, production DB, production APIs, deployment settings, persistence logic, parsing logic, API behavior, or external ETL behavior.

## 4. Files Changed
Main changed files in this continuation:

- `e2e/collector.spec.ts`
  - Added a regression assertion that CSV import preview results are cleared immediately when a new file is selected.
- `AI_HANDOFF.md`
  - Updated current loop status, verification results, CodeRabbit/Bugbot status, current scores, and next action.

## 5. Current Status
Current state:

- Implementation commit `01a83c6` and handoff commit `d4df51a` were pushed to `origin/codex/permanent-quality-gate-governance`.
- Full local `npm run quality` passed after the CSV import file-change E2E addition.
- Targeted E2E for the list-generation/saved-list reuse flow passed.
- GitHub Actions `quality-gate` completed successfully for pushed head `d4df51a`.
- CodeRabbit reported `success` with `Review skipped: draft pull request` for pushed head `d4df51a`.
- `npm run etl:self-evaluate` still runs successfully but reports mock/sample score `83` and `releaseReady: false`.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active; current evidence is not enough to mark it complete.

## 6. Known Issues
Known issues:

- This final metadata handoff update should be pushed and then checked if another commit is created from this file update.
- CodeRabbit skipped pushed head `d4df51a` because PR #1 is still Draft. To get standard CodeRabbit review, mark the PR ready for review or trigger review according to the repo's CodeRabbit policy.
- GitHub connector auth was previously invalidated; public GitHub API reads work, but authenticated status/comment management may still need reconnecting.
- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services in this continuation.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit and supplemental review status:

- CodeRabbit:
  - Standard PR reviewer for this public repository.
  - Public GitHub API check for `d4df51a`:
    - commit status `state: success`
    - CodeRabbit context `success`
    - description: `Review skipped: draft pull request`
  - Public GitHub API check-runs for `d4df51a`:
    - `quality-gate`: `completed`, `success`
  - If this final handoff update creates a newer commit, re-check CodeRabbit and `quality-gate` for that newer head.
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
- CodeRabbit must run on a non-draft or otherwise reviewable PR head to provide the standard review evidence.
- PR #1 is Draft, so review/deployment readiness is not fully proven.

## 10. Next Recommended Action
Next recommended action for Claude Code:

1. Review the CSV import file-change E2E addition:
   - `e2e/collector.spec.ts`
2. Confirm the latest commits were pushed and `quality-gate` completed successfully in GitHub Actions.
3. Decide whether PR #1 should be marked ready for review so CodeRabbit reviews the latest head.
4. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
5. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - read-only browser verification of the latest UI if a dev server is already running
   - another small recovery affordance in list export/import edge cases

## 11. Suggested Review Scope for Claude Code
Claude Code should focus review on:

- CSV import file-change result reset coverage:
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
- This continuation changes E2E coverage only; it does not alter application runtime behavior, CSV import implementation, CSV export implementation, API behavior, or Supabase logic.
- The standing goal must stay active until live/staging evidence and external-service paths are sufficiently verified.
