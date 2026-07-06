# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 17 (inferred)
- Loop number inferred from: The previous handoff was Claude Code -> Codex on Loop 16 and explicitly instructed Codex to advance to Loop 17 when beginning the next focused development sub-task.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-07 00:55 +09:00

## 1. Current Goal
今回の目的:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score toward 100/100.
  - Daily-use list-generation tool value score toward 100/100.
- This Loop 17 Codex sub-task:
  - Make the CSV import preview's dangerous spreadsheet formula/control-prefix detection easier to notice in daily use by surfacing the dangerous-value count as a first-class metric.
  - Keep Cursor Bugbot optional/reserve only; CodeRabbit OSS remains the standard PR reviewer.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest implementation commit before this handoff update: `9fb4ffe` (`Show dangerous CSV import metric`)
- Previous pushed handoff before this continuation: `a5b79b3` (`Update handoff after CSV import E2E coverage`)
- Last known good local implementation commit: `9fb4ffe`, verified by targeted E2E, full `npm run quality`, and ETL self-evaluation command completion.
- PR: draft PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status before this push: latest checked pushed head `a5b79b3` had CodeRabbit `success` with `Review skipped: draft pull request`. Recheck after the newest push. Standard CodeRabbit review will remain skipped while PR #1 is Draft.

## 3. What Was Done
今回完了したこと:

- Read required project files:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Read the relevant Next.js 16.2.10 guide before touching the React client component:
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- Preserved the uncommitted Claude Code handoff content and used it as the basis for this Loop 17 continuation.
- Confirmed the previous handoff was Claude Code -> Codex and advanced the inferred loop to 17.
- Added a scan-friendly `危険値` metric to the CSV import preview result grid.
- Updated the list-generation E2E flow to assert that the dangerous-value metric label appears after uploading a dangerous CSV.
- Ran the targeted E2E scenario, full quality gate, and ETL self-evaluation.
- Created implementation commit:
  - `9fb4ffe Show dangerous CSV import metric`
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, deployment settings, migrations, external ETL behavior, or broad UI structure.

## 4. Files Changed
主な変更ファイル:

- `src/components/app/csv-import-preview.tsx`
  - Added `dangerousValueCount` as a visible `危険値` result metric and adjusted the desktop metric grid from 7 to 8 columns.
- `e2e/collector.spec.ts`
  - Added browser-level assertion that the CSV import preview shows the new dangerous-value metric during the list-generation flow.
- `AI_HANDOFF.md`
  - Updated loop status, latest work, verification results, review status, known issues, and next recommended action for Claude Code.

## 5. Current Status
現在の状態:

- Local implementation commit `9fb4ffe` exists; this handoff update should be committed immediately after it.
- `npm run quality` passes after the UI/E2E update.
- `npm run etl:self-evaluate` completes successfully but still reports:
  - `dataMode: mock`
  - `score: 83`
  - `releaseReady: false`
- App remains in mock/fallback mode locally because Supabase credentials are not configured.
- Standing 100/100 goal remains active and incomplete.
- Provisional scores:
  - Function/screen-transition/no-bug score: 99/100
  - Daily-use list-generation value score: 99/100

## 6. Known Issues
既知の問題:

- After this handoff update is committed and pushed, recheck GitHub Actions `quality-gate` and CodeRabbit status for the newest head.
- PR #1 is Draft, so CodeRabbit will continue to skip standard review until the PR is marked ready or review is otherwise triggered.
- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` reports mock score 83 / `releaseReady: false` because Supabase is unset and mock jobs include one failed job and one running job.
- Coverage is useful but not exhaustive around live Supabase integration paths.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況:

- Review status:
  - Standard reviewer for this public repo.
  - Latest checked pushed head before this continuation (`a5b79b3`) had CodeRabbit status `success` with description `Review skipped: draft pull request`.
  - Latest continuation commits need status recheck after push.
- Critical findings: none known.
- Resolved findings: none pending.
- Deferred findings: standard review deferred while PR #1 is Draft.
- False positives / not applicable: none.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認:

- Status: Not run.
- Rationale: Per project policy, Cursor Bugbot is optional/reserve only because of usage cost. This continuation is a focused UI/E2E visibility improvement for an existing validation result.
- Findings: none.
- Actions taken: none.

## 9. Verification Results
実行した確認コマンドと結果:

```bash
npm run test:e2e -- --grep "list generation supports conditions"
# success: 1 passed

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 97 passed
# - test:coverage: success, 97 passed
# - test:e2e: success, 8 passed
# - build: success

npm run etl:self-evaluate
# command success:
# - dataMode: mock
# - score: 83
# - releaseReady: false
# - releaseGateFailures:
#   - Supabase not configured / mock sample scope
#   - 1 failed mock job
#   - 1 running mock job

git commit -m "Show dangerous CSV import metric"
# success:
# - scripts/check:test-integrity hook: success
# - lint hook: success
# - typecheck hook: success
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと:

1. Confirm this handoff commit is present and pushed after `9fb4ffe`.
2. Review the focused UI/E2E change:
   - `src/components/app/csv-import-preview.tsx`
   - `e2e/collector.spec.ts`
3. Recheck latest GitHub Actions and CodeRabbit status for the newest pushed head.
4. Decide whether PR #1 should be marked ready for review so CodeRabbit performs the standard PR review.
5. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
6. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - stronger live/staging read-only proof for Supabase-backed list and ETL flows
   - another small state preservation, recovery, CSV/list workflow, or validation edge case

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:

- CSV import preview metric layout and readability:
  - `src/components/app/csv-import-preview.tsx`
- E2E assertion strength:
  - `e2e/collector.spec.ts`
- Handoff accuracy:
  - `AI_HANDOFF.md`
- CodeRabbit / GitHub Actions evidence after the latest push:
  - PR #1 checks/statuses

## 12. Do Not Touch
触らない方がよい領域:

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
Claude Codeへの補足:

- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- `npm run quality` is the canonical local gate. `npm run verify` does not exist.
- CodeRabbit OSS is the standard PR reviewer. Cursor Bugbot is optional/reserve only.
- CSV upload dangerous-value detection is implemented in `src/lib/list-quality.ts`; this continuation only made the already computed count visible as a metric and covered that in E2E.
- Do not mark the standing goal complete until live/staging evidence, external-service paths, latest-head CI, and standard CodeRabbit review are sufficiently verified.
