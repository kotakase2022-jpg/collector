# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this user-requested continuation, so this remains a Loop 14 Codex continuation.
- Phase: Autonomous Improvement / Data Quality / Handoff
- Last updated: 2026-07-06 10:12 +09:00

## 1. Current Goal
今回の目的：

- Downgrade Cursor Bugbot from the default review step to optional/reserve review because of usage cost.
- Make CodeRabbit OSS the standard automated PR reviewer for this public repository.
- Reflect the process migration in Codex/Claude/handoff/testing/PR documentation.
- Improve corporate-number data quality in ETL job planning and execution.
- Keep the standing product-quality goal active:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear, dependable, and valuable for daily work

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed implementation commit: `0ca7a54` (`Normalize corporate numbers in ETL jobs`)
- Last known good implementation commit: `0ca7a54`, verified locally with `npm run quality`, `npm run etl:self-evaluate`, and by commit/push hooks.
- Final handoff-only sync commit: expected to be the next commit on this branch; check `git log --oneline -5` for the exact commit hash after commit/push.
- Historical Cursor Bugbot-clean commit: `46622ee`

## 3. What Was Done
今回完了したこと：

- Re-read required project files: `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, and `package.json`.
- Rechecked local git status and recent commit history.
- Verified CodeRabbit OSS/public-repository plan information from official CodeRabbit pages:
  - https://docs.coderabbit.ai/management/plans
  - https://coderabbit.ai/pricing
  - https://coderabbit.ai/faq
- Updated `README.md`.
  - Added a visible `PRレビュー運用` section.
  - Documented CodeRabbit OSS as the standard AI PR reviewer.
  - Documented Cursor Bugbot as optional/reserve only.
  - Documented the normal Codex -> quality-gate -> CodeRabbit -> Claude Code -> CodeRabbit loop.
  - Documented that the exact CodeRabbit check name must be added to branch protection after the first successful CodeRabbit run.
- Updated `docs/testing.md`.
  - Added official CodeRabbit reference links.
  - Documented the 2026-07-06 assumption that CodeRabbit has an OSS/public repository plan, while requiring maintainers to confirm the external service policy during setup.
  - Added an initial CodeRabbit setup checklist.
- Updated `AGENTS.md`.
  - Clarified that CodeRabbit failures/unavailability should be recorded in `AI_HANDOFF.md` instead of substituting Cursor Bugbot by default.
- Updated `CLAUDE.md`.
  - Clarified that Claude Code should record a CodeRabbit setup blocker and next action when CodeRabbit has not run.
- Preserved the earlier CodeRabbit migration docs already present in:
  - `.github/pull_request_template.md`
  - branch protection guidance in `docs/testing.md`
- Preserved the earlier data-quality fix from `b77a6d4`:
  - `hasCorporateNumberValue` now requires a normalizeable 13-digit corporate number.
  - list-quality duplicate detection groups corporate numbers after normalization.
  - regression tests cover invalid and full-width/hyphenated corporate numbers.
- Ran the full local quality gate after this documentation update; it passed.
- Pushed review-process migration commit `705e5b0`.
- Updated PR #1 body through the GitHub connector after the push.
  - PR body now mentions the README-level review guidance, CodeRabbit official references, corporate-number quality fix, and latest validation results.
  - PR head observed from the connector after the update: `705e5b028b343460c0ec168aa6eda4ce55b29783`.
- Rechecked PR #1 through the GitHub connector.
  - PR head observed: `1f3276bce0d8099ef33e9c58bf51aebce366bdb1`.
  - CodeRabbit still had no visible reply/status in the returned PR comments/reviews.
- Continued the standing product-quality goal with a focused ETL data-quality improvement.
  - `buildCoverageJobPlans` now schedules gBizINFO/EDINET enrichment only when `corporate_number` normalizes to a 13-digit法人番号.
  - `runNextCrawlJob` now normalizes company corporate numbers before gBizINFO requests and EDINET document matching.
  - Official URL candidate scoring now receives the normalized corporate number when available.
  - Added regression coverage for invalid corporate numbers, full-width/hyphenated corporate numbers, and normalized job execution.
- Verification after this improvement:
  - `npm test -- tests/etl.test.ts`: passed, 96 tests.
  - `npm run typecheck`: passed.
  - `npm run lint`: passed.
  - `npm run quality`: passed, 96 tests and 8 E2E tests.
  - `npm run etl:self-evaluate`: passed, mock score still 83 and `releaseReady: false`.
- Pushed implementation commit `0ca7a54`.
- Updated PR #1 body through the GitHub connector after the push.
  - PR body now mentions ETL job planning/execution normalization and the 96-test validation result.
  - PR head observed from the connector after the update: `0ca7a5422b7db503ae0ec313bce6214eee7d1c37`.

## 4. Files Changed
主な変更ファイル：

- `README.md`
  - Added CodeRabbit-first PR review process and Bugbot optional/reserve guidance.
- `docs/testing.md`
  - Added CodeRabbit official references, OSS setup checklist, and branch-protection implications.
- `AGENTS.md`
  - Clarified no default Bugbot substitution when CodeRabbit has not run.
- `CLAUDE.md`
  - Clarified CodeRabbit blocker recording for Claude Code.
- `AI_HANDOFF.md`
  - Rewrote the handoff to reflect the current CodeRabbit migration state.
- `src/lib/etl/job-planner.ts`
  - Uses normalized corporate-number validation before planning gBizINFO/EDINET jobs.
- `src/lib/etl/job-runner.ts`
  - Normalizes corporate numbers before gBizINFO fetches, EDINET matching, and official URL scoring.
- `tests/etl.test.ts`
  - Added/updated regression coverage for normalized job planning/execution.

Earlier same-loop files to keep in Claude review scope:

- `.github/pull_request_template.md`
- `src/lib/corporate-number.ts`
- `src/lib/list-quality.ts`
- `tests/etl.test.ts`

## 5. Current Status
現在の状態：

- CodeRabbit OSS is now the documented standard automated PR reviewer.
- Cursor Bugbot is now documented as optional/reserve only.
- PR template already requires CodeRabbit review status or a documented reason why CodeRabbit is not installed/available.
- Draft PR #1 body has been refreshed for the pushed CodeRabbit migration docs commit.
- Branch protection docs require `quality-gate` and, after the first successful CodeRabbit run exposes the exact check name, the CodeRabbit check.
- Local quality gate is green.
- ETL job planning/execution now avoids public-data enrichment jobs for invalid corporate-number strings and tolerates full-width/hyphenated corporate numbers.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
既知の問題：

- CodeRabbit has not yet been confirmed as installed/running on this repository from this Codex session.
- A previous `@coderabbitai full review` request was posted on draft PR #1, but no CodeRabbit reply/status was visible when checked.
- GitHub commit status checks for the observed PR heads did not show a CodeRabbit check name yet.
- Branch protection still needs a maintainer to add the exact CodeRabbit check name after CodeRabbit runs successfully once.
- Real staging Supabase smoke was not run because staging credentials were not provided.
- Live EDINET/Supabase enrichment remains unverified against staging/prod Supabase and the live EDINET API.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` still reports mock-mode/staging-smoke readiness limitations when Supabase evidence is absent.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbitと任意レビューの指摘状況：

- CodeRabbit: requested earlier on PR #1 with `@coderabbitai full review`, but no visible reply/status was observed in this Codex session.
- CodeRabbit setup action still needed:
  - Confirm the CodeRabbit GitHub App is installed/enabled for `kotakase2022-jpg/collector`.
  - Confirm the public repository is covered by CodeRabbit OSS/open-source review.
  - Re-run or wait for CodeRabbit review on PR #1.
  - Record the exact CodeRabbit GitHub check/status name.
- Cursor Bugbot: downgraded to optional/reserve supplemental review.
- Historical Cursor Bugbot record:
  - `f5ae483`: Corporate number filter mismatch (Medium) - fixed in Loop 11.
  - `b89261f`: Whitespace corporate number quality mismatch (Medium) - fixed in Loop 12.
  - `46622ee`: Cursor Bugbot rerun result: no new issues.
  - Later Cursor Bugbot reruns were blocked by usage/spend limits.

## 8. Verification Results
実行した確認コマンドと結果：

```bash
npm run quality
# success after this documentation update:
# - typecheck: success
# - lint: success
# - test: success, 95 passed
# - test:coverage: success, 95 passed
# - test:e2e: success, 8 passed
# - build: success

GitHub PR #1 metadata update
# success: PR body updated after pushing 705e5b0
# observed PR head after update: 705e5b028b343460c0ec168aa6eda4ce55b29783

GitHub PR #1 recheck
# success: PR fetched through GitHub connector
# observed PR head: 1f3276bce0d8099ef33e9c58bf51aebce366bdb1
# CodeRabbit reply/status: not visible in returned PR data

npm test -- tests/etl.test.ts
# success:
# - check:test-integrity: success
# - vitest: success, 96 passed

npm run typecheck
# success

npm run lint
# success

npm run quality
# success after ETL corporate-number job fix:
# - typecheck: success
# - lint: success
# - test: success, 96 passed
# - test:coverage: success, 96 passed
# - test:e2e: success, 8 passed
# - build: success

GitHub PR #1 metadata update
# success: PR body updated after pushing 0ca7a54
# observed PR head after update: 0ca7a5422b7db503ae0ec313bce6214eee7d1c37
```

Relevant earlier same-loop verification:

```bash
npm run etl:self-evaluate
# success:
# - dataMode: mock
# - score: 83
# - releaseReady: false
# - releaseGateFailures: Supabase未設定, failedジョブ1件, runningジョブ1件
```

## 9. Current Scores
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 98 / 100
- Daily-use list-generation value score: 99 / 100

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Live EDINET/Supabase enrichment smoke evidence is still missing.
- CodeRabbit review has not yet been confirmed on the latest PR/head.
- Some screens still need text/encoding polish for daily business usability.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the CodeRabbit migration docs in `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/testing.md`, and `.github/pull_request_template.md`.
2. Inspect PR #1 and confirm whether CodeRabbit has responded to the earlier `@coderabbitai full review` request.
3. If CodeRabbit still has no response/status, verify CodeRabbit GitHub App installation and OSS/public repository coverage.
4. After CodeRabbit runs, record the exact CodeRabbit status-check name and make it required in branch protection together with `quality-gate`.
5. Review the same-loop corporate-number quality fixes in `src/lib/corporate-number.ts`, `src/lib/list-quality.ts`, `src/lib/etl/job-planner.ts`, `src/lib/etl/job-runner.ts`, and `tests/etl.test.ts`.
6. Keep Bugbot optional/reserve only unless a maintainer explicitly asks for supplemental review.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- CodeRabbit-first wording:
  - `README.md`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `docs/testing.md`
  - `.github/pull_request_template.md`
- Handoff accuracy:
  - `AI_HANDOFF.md`
- Earlier same-loop data-quality fix:
  - `src/lib/corporate-number.ts`
  - `src/lib/list-quality.ts`
  - `src/lib/etl/job-planner.ts`
  - `src/lib/etl/job-runner.ts`
  - `tests/etl.test.ts`

## 12. Do Not Touch
触らない方がよい領域：

- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not deploy to production from this branch.
- Do not force-push.
- Do not delete or weaken tests to make checks pass.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`) unless intentionally regenerating local artifacts and keeping them uncommitted.

## 13. Notes for Claude Code
Claude Codeへの補足：

- This loop includes both the cost-control migration from Cursor Bugbot to CodeRabbit OSS and focused corporate-number ETL data-quality fixes.
- CodeRabbit OSS is now the documented standard, but installation/check-name enforcement is still external to local file edits.
- Cursor Bugbot remains available only as optional fallback/supplemental review.
- The standing goal remains active; do not mark it complete until live/staging concerns, EDINET completeness, CodeRabbit review evidence, and remaining UX/text polish gaps are actually resolved.
