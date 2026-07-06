# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 16 (inferred)
- Loop number inferred from: The previous pushed handoff (`34880a4`) was a Loop 16 Codex continuation, and no intervening Claude Code handoff is present. This remains the same Loop 16 Codex continuation and is now ready for Claude Code review.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 18:29 +09:00

## 1. Current Goal
Current goal:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Current focused improvement:
  - Strengthen CSV upload preview so imported list files flag spreadsheet formula/control-prefixed values before the user relies on them for list generation.
- Review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest implementation commit before this handoff update: `116f8a1` (`Flag dangerous values in CSV import preview`)
- Previous pushed handoff commit before this continuation: `34880a4` (`Update handoff after comparison CSV coverage`)
- After this file is committed, the handoff commit should be the latest local head; run `git rev-parse --short HEAD` for the absolute latest head.
- PR: draft PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: latest checked pushed head before this continuation (`34880a4`) had CodeRabbit `success` with `Review skipped: draft pull request`. Recheck after the latest push.
- GitHub Actions status: latest checked pushed head before this continuation (`34880a4`) had `quality-gate` completed successfully. Recheck after the latest push.

## 3. What Was Done
What was done in this continuation:

- Read required project files:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Rechecked the latest pushed state and confirmed the worktree was clean at `34880a4`.
- Rechecked GitHub public status for `34880a4`:
  - `CodeRabbit`: success, `Review skipped: draft pull request`.
  - `quality-gate`: completed successfully.
- Audited CSV upload preview behavior for input-side spreadsheet safety.
- Added `dangerousValueCount` to `CsvImportPreview`.
- Updated CSV upload preview parsing to flag rows whose standard columns begin with:
  - a formula-triggering character after leading whitespace: `=`, `+`, `-`, `@`
  - or a tab/newline/carriage-return control prefix, including ordinary spaces before it
- Dangerous values are detected from raw imported CSV cell values before URL normalization, so an official URL with leading tab/newline still produces a row issue even if its preview URL can be normalized.
- Added readiness summary output such as `危険な値 3行`.
- Added regression coverage for formula/control-prefixed values in `company_name`, `official_url`, and `industry`.
- Verified targeted tests, full local quality gate, and ETL self-evaluation.
- Created implementation commit:
  - `116f8a1 Flag dangerous values in CSV import preview`
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, deployment settings, migrations, or external ETL behavior.

## 4. Files Changed
Main changed files:

- `src/lib/csv-import-preview.ts`
  - Added `dangerousValueCount` to preview output and readiness issues.
- `src/lib/list-quality.ts`
  - Added raw-cell dangerous value detection for CSV upload preview.
- `tests/etl.test.ts`
  - Added CSV upload preview regression coverage for spreadsheet formula and control-prefixed values.
- `AI_HANDOFF.md`
  - Updated loop status, latest work, verification results, review status, known risks, and next action for Claude Code.

## 5. Current Status
Current status:

- Local implementation commit `116f8a1` exists; this handoff commit should immediately follow it.
- `npm run quality` passes after the CSV upload preview dangerous-value detection.
- `npm run etl:self-evaluate` still runs successfully but reports:
  - `dataMode: mock`
  - `score: 83`
  - `releaseReady: false`
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active and incomplete.

## 6. Known Issues
Known issues:

- After this handoff update is committed and pushed, recheck GitHub Actions `quality-gate` and CodeRabbit status for the newest head.
- PR #1 is Draft, so CodeRabbit will continue to skip standard review until the PR is marked ready or review is otherwise triggered.
- GitHub connector auth was previously invalidated; public GitHub API reads work, but authenticated status/comment management may still need reconnecting.
- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.

## 7. CodeRabbit Review
CodeRabbit OSS review status:

- Review status:
  - Standard reviewer for this repo.
  - Latest checked pushed head before this continuation (`34880a4`) had CodeRabbit status `success` with description `Review skipped: draft pull request`.
  - Latest continuation commits need status recheck after push.
- Critical findings: none known.
- Resolved findings: none pending.
- Deferred findings: PR remains Draft, so standard CodeRabbit review has not run.
- False positives / not applicable: none.

## 8. Optional Bugbot Findings
Cursor Bugbot optional review:

- Status: Not run.
- Rationale: Per policy, Bugbot is optional/reserve only. This continuation is a focused CSV upload validation improvement plus tests, with no auth/permission/DB/payment/data-deletion surface.
- Findings: none.
- Actions taken: none.

## 9. Verification Results
Verification commands and results:

```bash
npm run test -- -t "CSV upload preview flags spreadsheet"
# success: 1 passed, 96 skipped

npm run test -- -t "CSVアップロードプレビュー"
# success: 4 passed, 93 skipped

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 97 passed
# - test:coverage: success, 97 passed
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

git commit -m "Flag dangerous values in CSV import preview"
# success:
# - scripts/check:test-integrity hook: success
# - lint hook: success
# - typecheck hook: success
```

## 10. Current Scores
Provisional self-evaluation:

- Function/screen-transition/no-bug score: 99 / 100
- Daily-use list-generation value score: 99 / 100

Why this is not 100 yet:

- Live/staging Supabase and external-service flows are still not verified.
- Full production-like data coverage cannot be proven from mock data alone.
- Standard CodeRabbit review has not run on the latest head because PR #1 is Draft.
- `npm run etl:self-evaluate` still reports mock score `83` and `releaseReady: false`.

## 11. Next Recommended Action
First recommended action for Claude Code:

1. Confirm the latest handoff commit is present and pushed.
2. Review the focused CSV upload validation change:
   - `src/lib/csv-import-preview.ts`
   - `src/lib/list-quality.ts`
   - `tests/etl.test.ts`
3. Recheck latest GitHub Actions and CodeRabbit status.
4. Decide whether PR #1 should be marked ready for review so CodeRabbit performs the standard PR review.
5. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
6. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - read-only browser verification of the latest UI if a dev server is already running
   - another small state preservation, recovery, CSV/list workflow, or validation edge case

## 12. Suggested Review Scope for Claude Code
Suggested review scope:

- CSV upload preview type and readiness output:
  - `src/lib/csv-import-preview.ts`
- Raw-cell dangerous value detection:
  - `src/lib/list-quality.ts`
- Regression coverage:
  - `tests/etl.test.ts`
- Handoff accuracy:
  - `AI_HANDOFF.md`
- CodeRabbit / GitHub Actions evidence after the latest push:
  - PR #1 checks/statuses

## 13. Risk Notes
Risk notes:

- No high-risk operations performed.
- No production DB/API access, no migrations applied, no force-push/reset, no secret exposure.
- The upload preview now treats formula/control-prefixed imported cells as invalid rows. This is intentionally conservative for business-list safety and spreadsheet interoperability.
- Pending human/tool actions:
  - decide whether to mark PR #1 ready so CodeRabbit reviews the latest head
  - confirm CodeRabbit/GitHub Actions status on PR #1
  - run `npm run smoke:staging` with isolated staging Supabase credentials before production-readiness claims

## 14. Do Not Touch
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

## 15. Notes for Claude Code
Notes for Claude Code:

- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- `npm run quality` is the canonical local gate. `npm run verify` does not exist.
- CodeRabbit is the standard PR reviewer. Cursor Bugbot is optional/reserve only.
- CSV export safety is handled in `src/lib/csv.ts`; this continuation added input-side CSV upload preview detection in `src/lib/list-quality.ts`.
- Do not mark the standing goal complete until live/staging evidence, external-service paths, latest-head CI, and standard CodeRabbit review are sufficiently verified.
