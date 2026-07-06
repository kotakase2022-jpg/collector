# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 16 (inferred)
- Loop number inferred from: The incoming handoff content had `Current owner: Claude Code`, `Next owner: Codex`, and `Loop: 15 (inferred)`, with a note to advance to Loop 16 when beginning the next Codex development sub-task. This Codex pass therefore starts and hands off Loop 16.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 17:54 +09:00

## 1. Current Goal
今回の目的：

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Current focused improvement:
  - Strengthen saved-list CSV failure recovery coverage so a failed CSV export alert cannot remain visible after navigating to another saved list.
- Review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest implementation commit before this handoff update: `b3c083f` (`Cover saved list CSV error reset`)
- Previous pushed handoff commit before this continuation: `892a265` (`Update handoff after CSV failure regression`)
- This handoff update should be committed and pushed after editing this file; run `git rev-parse --short HEAD` for the absolute latest head.
- PR: draft PR #1 — https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: latest pushed head before this continuation (`892a265`) had CodeRabbit `success` with `Review skipped: draft pull request`. Recheck after the latest push.

## 3. What Was Done
今回完了したこと：

- Read the attached request and required project files:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Reconciled the incoming Claude Code handoff state:
  - It returned Loop 15 to Codex and recommended advancing to Loop 16 for a fresh Codex sub-task.
  - It confirmed the previous CSV failure regression was sound and did not require source changes.
- Checked latest pushed GitHub status for `892a265`:
  - `quality-gate`: completed / success.
  - `CodeRabbit`: success, `Review skipped: draft pull request`.
- Added one focused E2E assertion to the saved-list CSV export failure flow:
  - Trigger a 500 from `/api/lists/export`.
  - Confirm the CSV alert appears.
  - Navigate to another saved list.
  - Confirm stale `p[role="alert"]` feedback is gone before validating the empty-list state.
- Ran targeted E2E, full local quality gate, and ETL self-evaluation.
- Created implementation commit:
  - `b3c083f Cover saved list CSV error reset`
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, deployment settings, persistence logic, parsing logic, or external ETL behavior.

## 4. Files Changed
主な変更ファイル：

- `e2e/collector.spec.ts`
  - Added regression coverage that stale saved-list CSV export failure feedback disappears after navigating to another saved list.
- `AI_HANDOFF.md`
  - Updated loop status, latest work, verification results, CodeRabbit/GitHub Actions status, and next action for Claude Code.

## 5. Current Status
現在の状態：

- Local implementation commit `b3c083f` exists and should be followed by this handoff commit.
- `npm run quality` passes after the E2E regression addition.
- `npm run etl:self-evaluate` still runs successfully but reports:
  - `dataMode: mock`
  - `score: 83`
  - `releaseReady: false`
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active and incomplete.

## 6. Known Issues
既知の問題：

- After this handoff update is committed and pushed, recheck GitHub Actions `quality-gate` and CodeRabbit status for the newest head.
- PR #1 is Draft, so CodeRabbit will continue to skip standard review until the PR is marked ready or review is otherwise triggered.
- GitHub connector auth was previously invalidated; public GitHub API reads work, but authenticated status/comment management may still need reconnecting.
- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：

- Review status:
  - Standard reviewer for this repo.
  - Latest checked pushed head before this continuation (`892a265`) had CodeRabbit status `success` with description `Review skipped: draft pull request`.
  - Latest continuation commits need status recheck after push.
- Critical findings: none known.
- Resolved findings: none pending.
- Deferred findings: PR remains Draft, so standard CodeRabbit review has not run.
- False positives / not applicable: none.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：

- Status: Not run.
- Rationale: Per policy, Bugbot is optional/reserve only. This continuation is a test-only E2E assertion with no auth/permission/DB/payment/data-deletion surface.
- Findings: none.
- Actions taken: none.

## 9. Verification Results
実行した確認コマンドと結果：

```bash
npm run test:e2e -- --grep "list generation supports conditions"
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

git commit -m "Cover saved list CSV error reset"
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
次にClaude Codeが最初にやるべきこと：

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

## 12. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- Saved-list CSV failure recovery E2E:
  - `e2e/collector.spec.ts`
- Related implementation contract:
  - `src/components/app/csv-export-button.tsx`
- Handoff accuracy:
  - `AI_HANDOFF.md`
- CodeRabbit / GitHub Actions evidence after the latest push:
  - PR #1 checks/statuses

## 13. Risk Notes
リスク・人間確認が必要な事項：

- No high-risk operations performed.
- No production DB/API access, no migrations applied, no force-push/reset, no secret exposure.
- Pending human/tool actions:
  - decide whether to mark PR #1 ready so CodeRabbit reviews the latest head
  - confirm CodeRabbit/GitHub Actions status on PR #1
  - run `npm run smoke:staging` with isolated staging Supabase credentials before production-readiness claims

## 14. Do Not Touch
触らない方がよい領域：

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
Claude Codeへの補足：

- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- `npm run quality` is the canonical local gate. `npm run verify` does not exist.
- CodeRabbit is the standard PR reviewer. Cursor Bugbot is optional/reserve only.
- The CSV export feedback is intentionally keyed by endpoint/query/fileName instead of cleared in `useEffect`, because React lint rejects synchronous setState in effect bodies.
- The new saved-list assertion covers the same user expectation as the company CSV regressions: feedback belongs only to the current export/list context.
- Do not mark the standing goal complete until live/staging evidence, external-service paths, latest-head CI, and standard CodeRabbit review are sufficiently verified.
