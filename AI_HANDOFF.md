# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this user-requested continuation, so this remains a Loop 14 Codex continuation.
- Phase: Autonomous Improvement / Data Quality / Handoff
- Last updated: 2026-07-06 09:57 +09:00

## 1. Current Goal
今回の目的：

- Migrate the ongoing review process away from default Cursor Bugbot usage because of cost.
- Make CodeRabbit OSS the standard automated PR reviewer for this public repository.
- Keep Cursor Bugbot available only as optional/reserve supplemental review when CodeRabbit is unavailable, inconclusive, or explicitly requested.
- Continue the standing product-quality goal:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear, dependable, and valuable for daily work

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest implementation commit before this documentation pass: `69248f7` (`Normalize corporate numbers before upsert`).
- Latest handoff commit before this documentation pass: `bb2053f` (`Update handoff after upsert normalization`).
- Last historical Bugbot-clean commit: `46622ee`.
- Last known good functional commit: `69248f7`, verified locally by targeted Vitest, full `npm run quality`, and `npm run etl:self-evaluate`.
- Handoff update for this continuation: this file update follows the CodeRabbit migration documentation changes; check `git log --oneline -8` for the final handoff commit after commit/push.
- Latest pushed commit before this continuation: `bd5e0e2` (`Clarify CodeRabbit handoff status`).

## 3. What Was Done
今回完了したこと：

- Re-read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, `docs/testing.md`, `.github/pull_request_template.md`, current git status/log, and review-process references.
- Updated `AGENTS.md`.
  - Codex loop now uses CodeRabbit OSS PR review as the standard automated review step.
  - Cursor Bugbot is explicitly optional/reserve only.
  - Handoff requirement now records CodeRabbit status, with Cursor Bugbot only when used.
- Updated `CLAUDE.md`.
  - Claude Code now starts from CodeRabbit findings, current diff, and `AI_HANDOFF.md`.
  - Cursor Bugbot findings are only read when Bugbot was explicitly used as fallback/supplemental review.
- Updated `docs/testing.md`.
  - Added a `PR Review Standard` section.
  - Documented CodeRabbit OSS as the standard automated PR reviewer.
  - Documented normal Codex -> CodeRabbit -> Claude Code -> CodeRabbit review flow.
  - Documented Cursor Bugbot as optional/reserve only.
  - Updated branch protection guidance to require CodeRabbit's status check after the first successful CodeRabbit PR run reveals the exact GitHub check name.
- Updated `.github/pull_request_template.md`.
  - Added CodeRabbit OSS review confirmation.
  - Added checkbox for resolving actionable CodeRabbit findings.
  - Added checkbox documenting that Cursor Bugbot is not required unless intentionally used as fallback/supplemental review.
- Updated this handoff to use `CodeRabbit / Supplemental Review Findings` for future review status.
- Updated PR #1 through the GitHub connector.
  - PR title is now `[codex] Quality gate, list workflows, and CodeRabbit review process`.
  - PR body now summarizes current scope, validation, E2E flows, CodeRabbit review priorities, remaining risks, and production-safety notes.
  - This makes the existing draft PR more reviewable for CodeRabbit and human reviewers.
- Rechecked PR #1 after the previous push.
  - The PR head observed before this handoff-only commit was `dcaf6f9cc74b6dde477cdb3a88ced8924972e1f8`.
  - PR body validation text now references quality-verified short head `dcaf6f9`; subsequent commits in this continuation are handoff-only.
  - Added the local `npm run etl:self-evaluate` result summary to the PR body.
- Requested the first CodeRabbit review on PR #1.
  - Posted PR comment `@coderabbitai full review` using the official CodeRabbit PR command documented by CodeRabbit.
  - Comment ID: `4888227214`.
  - After a 20 second wait, GitHub comments and commit statuses did not yet show a CodeRabbit response or status check.
- Reran `npm run etl:self-evaluate`.
  - Result stayed in mock mode with score `83` and `releaseReady: false`.
  - Main unresolved evidence gaps remain Supabase/staging smoke and live enrichment verification.
- Reran full local quality gate after updating this handoff.
  - `npm run quality` succeeded.
  - Vitest: 95 tests passed.
  - Playwright: 8 Chromium desktop E2E tests passed.
  - Production build succeeded.
- Continued the standing product-quality goal with one focused data-quality fix.
  - Tightened `hasCorporateNumberValue` so only values that normalize to a 13-digit corporate number count as present.
  - Updated list-quality duplicate detection to group corporate numbers by normalized 13-digit value, so full-width/hyphenated variants are caught as duplicates.
  - Added regression expectations for full-width/hyphenated valid numbers, invalid short/alphanumeric values, missing-corporate-number counts, and normalized duplicate detection.
- Rechecked PR #1 after more time had passed.
  - CodeRabbit still had no visible reply/review/status through the GitHub connector.
  - Latest combined commit status for `bd5e0e2` was still empty.

## 4. Files Changed
主な変更ファイル：

- `AGENTS.md`
  - Replaced default Cursor Bugbot loop with CodeRabbit OSS PR review loop.
- `CLAUDE.md`
  - Replaced default Bugbot-reading instructions with CodeRabbit-first review instructions.
- `docs/testing.md`
  - Added CodeRabbit OSS review standard and branch protection notes.
- `.github/pull_request_template.md`
  - Added automated review checklist for CodeRabbit and optional Bugbot.
- `AI_HANDOFF.md`
  - Updated this handoff for the review-process migration.
- `src/lib/corporate-number.ts`
  - Treats only normalizeable 13-digit corporate numbers as present.
- `src/lib/list-quality.ts`
  - Counts duplicate corporate numbers after normalization.
- `tests/etl.test.ts`
  - Added regression coverage for invalid corporate-number presence and normalized duplicate detection.
- GitHub PR #1
  - Updated title/body for CodeRabbit review readiness.
  - Added a CodeRabbit full-review request comment.

## 5. Current Status
現在の状態：

- CodeRabbit migration is documented in repository guidance.
- Cursor Bugbot is no longer the default/required automated review step in the documented process.
- Draft PR #1 now has a CodeRabbit-oriented title/body and current validation/risk notes.
- Draft PR #1 has an explicit `@coderabbitai full review` request comment.
- CodeRabbit GitHub App installation and first PR check-name confirmation are still external/manual steps.
- CodeRabbit did not respond when rechecked in this continuation.
- Application data-quality logic and regression tests were changed in a small focused diff.
- Full local quality gate is green after the data-quality fix.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
既知の問題：

- CodeRabbit has not yet been confirmed as installed and running on this repository from this Codex session.
- GitHub commit status API returned no statuses for observed PR head `dcaf6f9cc74b6dde477cdb3a88ced8924972e1f8`; CodeRabbit check evidence is still missing.
- The `@coderabbitai full review` request was posted, but no CodeRabbit response was visible after 20 seconds. This may mean the GitHub App is not installed, draft PR auto-review is disabled, or CodeRabbit needs more time.
- Recheck in this continuation still found no CodeRabbit response through the GitHub connector.
- Branch protection still needs a maintainer to add the exact CodeRabbit status check after the first CodeRabbit PR run exposes the check name in GitHub.
- Historical Cursor Bugbot findings remain relevant as past review evidence, but future default review evidence should be CodeRabbit.
- Live EDINET XBRL enrichment remains unverified against staging/prod Supabase and the live EDINET API.
- Real staging Supabase smoke was not run because staging credentials were not provided.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` reports mock-mode/staging-smoke readiness limitations when Supabase evidence is absent.
- Coverage remains useful but not exhaustive, especially around live Supabase integration paths.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbitと任意レビューの指摘状況：

- CodeRabbit: not yet run/confirmed for this migration branch in this Codex session.
- PR #1 body is updated to request CodeRabbit focus on ETL, persistence/data integrity, API error handling, E2E, workflows, and review-process docs.
- CodeRabbit full-review request posted on PR #1:
  - Comment ID: `4888227214`.
  - Command: `@coderabbitai full review`.
  - Source used for command selection: CodeRabbit docs say `@coderabbitai full review` performs a complete review of the entire pull request.
  - Observed result after 20 seconds and again in this continuation: no CodeRabbit reply/status yet.
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
# success:
# - typecheck: success
# - lint: success
# - test: success, 95 passed
# - test:coverage: success, 95 passed
# - test:e2e: success, 8 passed
# - build: success

npm run quality
# success after latest handoff edit:
# - typecheck: success
# - lint: success
# - test: success, 95 passed
# - test:coverage: success, 95 passed
# - test:e2e: success, 8 passed
# - build: success

GitHub PR #1 metadata update
# success: title/body updated through GitHub connector

GitHub commit combined status for 086050b1b5454de8350c38f91b9b7b140abd6f15
# result: no statuses returned; CodeRabbit status/check name is still unconfirmed

GitHub PR #1 metadata update for latest head
# success: PR body validation updated from 086050b to dcaf6f9

GitHub PR #1 CodeRabbit review request
# success: posted @coderabbitai full review comment, id 4888227214
# observed after 20 seconds: no CodeRabbit reply/status yet

GitHub commit combined status for dcaf6f9cc74b6dde477cdb3a88ced8924972e1f8
# result: no statuses returned; CodeRabbit status/check name is still unconfirmed

npm run etl:self-evaluate
# success:
# - dataMode: mock
# - score: 83
# - releaseReady: false
# - releaseGateFailures: Supabase未設定, failedジョブ1件, runningジョブ1件

npm test
# success:
# - check:test-integrity: success
# - vitest: success, 95 passed

npm run typecheck
# success

npm run lint
# success

npm run quality
# success after corporate-number quality fix:
# - typecheck: success
# - lint: success
# - test: success, 95 passed
# - test:coverage: success, 95 passed
# - test:e2e: success, 8 passed
# - build: success

npm run etl:self-evaluate
# success after corporate-number quality fix:
# - dataMode: mock
# - score: 83
# - releaseReady: false
# - releaseGateFailures: Supabase未設定, failedジョブ1件, runningジョブ1件
```

## 9. Current Scores
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 98 / 100
- Daily-use list-generation value score: 99 / 100

Score movement:

- Function score remains 98. Corporate-number presence/duplicate validation is stricter, but live/staging evidence is still missing.
- Daily-use list value remains 99. This continuation improved corporate-number quality validation in generated lists, but the product score still needs live/staging evidence and remaining UX polish.

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Live EDINET/Supabase enrichment smoke evidence is still missing.
- CodeRabbit review has not yet been confirmed on the latest PR/head.
- CodeRabbit review was requested, but no response/status was observed yet.
- Some screens still need text/encoding polish for daily business usability.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the CodeRabbit migration documentation changes in `AGENTS.md`, `CLAUDE.md`, `docs/testing.md`, and `.github/pull_request_template.md`.
2. Inspect PR #1 to see whether the `@coderabbitai full review` comment produced a CodeRabbit reply, review, or status check after more time has passed.
3. If there is still no CodeRabbit response, confirm whether the CodeRabbit GitHub App has been installed for `kotakase2022-jpg/collector` and whether draft PR reviews are enabled.
4. After CodeRabbit runs, record the exact CodeRabbit status-check name.
5. Review the small corporate-number quality diff in `src/lib/corporate-number.ts`, `src/lib/list-quality.ts`, and `tests/etl.test.ts`.
6. Ensure branch protection requires both `quality-gate` and the CodeRabbit check.
7. If CodeRabbit produces findings, address actionable items before relying on the PR as reviewed.
8. If continuing product work, keep one focused sub-task and preserve the CodeRabbit-first review process.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- `AGENTS.md`
  - CodeRabbit-first loop and Bugbot optional/reserve wording
- `CLAUDE.md`
  - CodeRabbit-first review instructions
- `docs/testing.md`
  - PR Review Standard and Branch Protection additions
- `.github/pull_request_template.md`
  - CodeRabbit / supplemental review checklist
- `AI_HANDOFF.md`
  - Review-status terminology and external next actions
- `src/lib/corporate-number.ts`, `src/lib/list-quality.ts`, `tests/etl.test.ts`
  - Whether corporate-number normalization is the right definition of "法人番号あり" across list quality and mock filtering

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

- This continuation includes a small data-quality logic fix after the documentation/process-only CodeRabbit migration work.
- CodeRabbit OSS is now the documented standard automated PR reviewer, but installation/check-name enforcement is outside the local file edits and must be confirmed in GitHub.
- Cursor Bugbot remains available only as optional fallback/supplemental review; it should not be treated as required for normal completion.
- The standing goal remains active; do not mark it complete until live/staging concerns, EDINET completeness, CodeRabbit review evidence, and remaining UX/text polish gaps are actually resolved.
