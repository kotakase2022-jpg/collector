# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 15 (inferred)
- Loop number inferred from: Previous handoff already advanced Claude Code's Loop 14 return into Codex Loop 15; no intervening Claude Code handoff was present, so this remains a Loop 15 Codex continuation.
- Phase: Handoff / Paused by user request
- Last updated: 2026-07-06 16:26 +09:00

## 1. Current Goal
Current development objective:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Current pause reason:
  - The user asked Codex to stop at a good handoff point because of remaining credit consumption.
  - The goal has no tool-level "pause" status available; do not mark it complete or blocked. Treat this handoff as an operational pause until the user or Claude Code resumes.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest local implementation commit: `1ad4305` (`Require CSV file before import preview`)
- Latest pushed head before this handoff update: `c56b1ae` (`Refresh handoff with CSV import pending check status`)
- This handoff update should be committed and pushed after this file update; run `git rev-parse --short HEAD` for the absolute latest head.
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Last full local `npm run quality` evidence before the latest CSV-file-required change: working tree after the CSV import pending-file UI addition (`71b3eb6` implementation plus later handoff commits).
- Latest local targeted evidence for current code: `1ad4305` passed targeted list-generation E2E, typecheck, lint, and commit-hook quality guard/lint/typecheck.

## 3. What Was Done
Completed in this continuation:

- Read required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Read the relevant Next.js Server/Client Components guide before editing the client CSV import component.
- Confirmed local branch was clean and synced with origin before starting.
- Rechecked latest pushed head `c56b1ae` through the public GitHub API:
  - CodeRabbit status: `success`, `Review skipped: draft pull request`
  - `quality-gate` check-run: still `in_progress` at the time it was checked in this continuation
- Improved CSV import-check UX with a small focused change:
  - The CSV file input is now browser-required before submitting `CSVを検査`.
  - Empty-file submission no longer calls the preview API from normal browser use.
  - API-side validation remains in place for direct/non-browser callers.
- Updated E2E coverage:
  - Confirms the CSV file input has `required=true`.
  - Confirms clicking `CSVを検査` without a file trips browser `valueMissing`.
  - Confirms no app-level API error alert is shown for that client-side validation path.
- Created implementation commit:
  - `1ad4305 Require CSV file before import preview`
- Stopped further autonomous improvement because the user requested handoff due credit consumption.
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, deployment settings, persistence logic, parsing logic, or external ETL behavior.

## 4. Files Changed
Main changed files in this continuation:

- `src/components/app/csv-import-preview.tsx`
  - Added `required` to the CSV file input.
- `e2e/collector.spec.ts`
  - Updated list-generation E2E to verify browser-side required-file validation.
- `AI_HANDOFF.md`
  - Updated current loop status, pause reason, verification results, CodeRabbit/Bugbot status, current scores, and next action.

## 5. Current Status
Current state:

- Local branch is ahead of origin by implementation commit `1ad4305` plus this handoff update once committed.
- The current implementation has targeted verification:
  - list-generation E2E passed
  - typecheck passed
  - lint passed
  - commit hook quality guard/lint/typecheck passed while creating `1ad4305`
- Full `npm run quality` was not rerun after `1ad4305` because the user requested stopping at a good handoff point.
- CodeRabbit will still skip review while PR #1 remains Draft.
- `npm run etl:self-evaluate` was not rerun in this final pause step; previous known result remains mock/sample score `83` and `releaseReady: false`.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active but operationally paused by user request; current evidence is not enough to mark it complete.

## 6. Known Issues
Known issues:

- This handoff update still needs to be committed and pushed after editing this file.
- Latest pushed head `c56b1ae` had `quality-gate` still `in_progress` when checked in this continuation. Recheck the newest pushed head after this handoff commit.
- CodeRabbit skipped pushed head `c56b1ae` because PR #1 is still Draft. To get standard CodeRabbit review, mark the PR ready for review or trigger review according to the repo's CodeRabbit policy.
- GitHub connector auth was previously invalidated; public GitHub API reads work, but authenticated status/comment management may still need reconnecting.
- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit and supplemental review status:

- CodeRabbit:
  - Standard PR reviewer for this public repository.
  - Public GitHub API check for `c56b1ae`:
    - commit status `state: success`
    - CodeRabbit context `success`
    - description: `Review skipped: draft pull request`
  - Public GitHub API check-runs for `c56b1ae`:
    - `quality-gate`: `in_progress` when checked in this continuation
  - After pushing the handoff commit, re-check CodeRabbit and `quality-gate` for the latest head.
- Cursor Bugbot:
  - Not used for code review in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
Commands run and results:

```bash
npm run test:e2e -- --grep "list generation supports"
# success: 1 passed

npm run typecheck
# success

npm run lint
# success

git commit -m "Require CSV file before import preview"
# success:
# - scripts/check:test-integrity hook: success
# - lint hook: success
# - typecheck hook: success
```

Non-code failure / command syntax note:

```powershell
npm run typecheck && npm run lint
# failed before execution because this PowerShell does not support && as a statement separator.
# The same checks were rerun individually and passed.
```

Not run after `1ad4305` because the user requested pausing for handoff:

```bash
npm run test
npm run test:coverage
npm run quality
npm run build
npm run etl:self-evaluate
```

## 9. Current Scores
Provisional self-evaluation:

- Function/screen-transition/no-bug score: 99 / 100
- Daily-use list-generation value score: 99 / 100

Why this is not 100 yet:

- Full `npm run quality` has not been rerun after the latest `required` CSV file input change.
- Live/staging Supabase and external-service flows are still not verified.
- Full production-like data coverage cannot be proven from mock data alone.
- CodeRabbit must run on a non-draft or otherwise reviewable PR head to provide the standard review evidence.
- PR #1 is Draft, so review/deployment readiness is not fully proven.

## 10. Next Recommended Action
Next recommended action for Claude Code:

1. Review the latest CSV import required-file change:
   - `src/components/app/csv-import-preview.tsx`
   - `e2e/collector.spec.ts`
2. Recheck latest pushed GitHub Actions and CodeRabbit status after the final handoff commit is pushed.
3. Run the full gate when time/credits allow:
   - `npm run quality`
4. Decide whether PR #1 should be marked ready for review so CodeRabbit reviews the latest head.
5. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
6. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - read-only browser verification of the latest UI if a dev server is already running
   - another small recovery affordance in list export/import edge cases

## 11. Suggested Review Scope for Claude Code
Claude Code should focus review on:

- CSV import required-file behavior:
  - `src/components/app/csv-import-preview.tsx`
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
- This continuation changes only browser-side CSV import submit validation and E2E coverage; it does not alter CSV parsing, CSV export, API behavior, persistence, or Supabase logic.
- The API route still returns a 400 for no-file requests, which remains useful defense for direct API calls.
- The standing goal must stay active until live/staging evidence and external-service paths are sufficiently verified.
