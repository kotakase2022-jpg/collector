# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this user-requested continuation, so this remains a Loop 14 Codex continuation.
- Phase: Documentation / Review Process Migration / Handoff
- Last updated: 2026-07-06 09:35 +09:00

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

## 5. Current Status
現在の状態：

- CodeRabbit migration is documented in repository guidance.
- Cursor Bugbot is no longer the default/required automated review step in the documented process.
- CodeRabbit GitHub App installation and first PR check-name confirmation are still external/manual steps.
- No application source code, schema, CI workflow, or tests were changed in this documentation pass.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
既知の問題：

- CodeRabbit has not yet been confirmed as installed and running on this repository from this Codex session.
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
```

## 9. Current Scores
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 98 / 100
- Daily-use list-generation value score: 99 / 100

Score movement:

- Function score remains 98. This pass changes review governance only; it does not add live/staging evidence.
- Daily-use list value remains 99. Lower-cost PR review should improve continuity, but the product score still needs live/staging evidence and remaining UX polish.

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Live EDINET/Supabase enrichment smoke evidence is still missing.
- CodeRabbit review has not yet been confirmed on the latest PR/head.
- Some screens still need text/encoding polish for daily business usability.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the CodeRabbit migration documentation changes in `AGENTS.md`, `CLAUDE.md`, `docs/testing.md`, and `.github/pull_request_template.md`.
2. Confirm whether the CodeRabbit GitHub App has been installed for `kotakase2022-jpg/collector`.
3. After the first CodeRabbit PR run, record the exact status-check name and ensure branch protection requires both `quality-gate` and the CodeRabbit check.
4. If CodeRabbit produces findings, address actionable items before relying on the PR as reviewed.
5. If continuing product work, keep one focused sub-task and preserve the CodeRabbit-first review process.

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

- This continuation is documentation/process-only.
- CodeRabbit OSS is now the documented standard automated PR reviewer, but installation/check-name enforcement is outside the local file edits and must be confirmed in GitHub.
- Cursor Bugbot remains available only as optional fallback/supplemental review; it should not be treated as required for normal completion.
- The standing goal remains active; do not mark it complete until live/staging concerns, EDINET completeness, CodeRabbit review evidence, and remaining UX/text polish gaps are actually resolved.
