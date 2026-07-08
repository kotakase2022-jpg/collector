# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 21 (continued / inferred)
- Loop number inferred from: Previous handoff recorded `Current owner: Codex`, `Next owner: Claude Code`, `Loop: 21`, `Phase: Handoff`. The maintainer then asked whether EDINET-down operation can proceed with gBizINFO and OpenAI, so this is a continuation of Loop 21.
- Phase: Handoff
- Last updated: 2026-07-08 15:10 +09:00

## 1. Current Goal
今回の目的：
- Keep the collector operable while EDINET is down/unavailable.
- Use gBizINFO plus known official-site crawling/OpenAI extraction as the active path.
- Re-run OpenAI after the maintainer charged the account.
- Preserve secret hygiene and leave a clear Claude Code handoff.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `5cde0da` (`Allow operation without EDINET`)
- Latest handoff update: `e5d84dc` (`Update EDINET fallback handoff`) before this PR-check status refresh.
- Last known good commit: `5cde0da`, verified locally with `npm.cmd run quality`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `pass` / `Review completed` on pushed handoff head `e5d84dc`; `quality-gate` also passed on that head. If this status-refresh-only handoff edit is committed and pushed afterward, recheck the new head.

## 3. What Was Done
今回完了したこと：
- Read the required repo workflow files and current handoff.
- Confirmed PR #1 was green before this new EDINET-down adjustment.
- Updated coverage planning so EDINET jobs are planned only when EDINET is enabled:
  - Default behavior now checks `EDINET_API_KEY`.
  - Without `EDINET_API_KEY`, `enrich_edinet` jobs are not planned.
  - Tests can still explicitly enable EDINET via `edinetEnabled: true`.
- Updated README to document EDINET-down operation:
  - EDINET jobs are not planned when `EDINET_API_KEY` is unset.
  - gBizINFO and known-URL official-site crawling/OpenAI extraction are the fallback active path.
  - Generic Search remains unused.
- Replaced the GitHub Environment `staging` `OPENAI_API_KEY` with a newly created OpenAI key named `collector-managed-gbiz-openai-2026-07-08`.
- Ran OpenAI smoke after the account charge:
  - `/v1/models` returned HTTP 200 and included the configured default extraction model.
  - Repo `extractCompanyProfileWithLlm()` smoke succeeded through the Responses API.
- Revoked the previous managed OpenAI key `collector-managed-staging-2026-07-08` after the new secret was stored and verified.
- Cleared transient OpenAI key material and clipboard after storing/testing.

## 4. Files Changed
主な変更ファイル：
- `src/lib/etl/job-planner.ts`
- `tests/etl.test.ts`
- `README.md`
- `AI_HANDOFF.md`

## 5. Current Status
現在の状態：
- Local full quality gate is green.
- gBizINFO remains the active public-data enrichment path; GitHub Environment `staging` still contains `GBIZINFO_API_TOKEN`.
- OpenAI is now active again; repo-level LLM extraction smoke succeeded after replacing `OPENAI_API_KEY`.
- EDINET is treated as temporarily unavailable. `EDINET_API_KEY` is not set in GitHub Environment `staging`, so new coverage planning will not enqueue EDINET jobs by default.
- Search remains disabled / unused.
- Worktree should be clean after committing this status refresh.

## 6. Known Issues
既知の問題：
- EDINET is down/unavailable from the current workflow. Do not block operation on EDINET.
- Existing already-queued `enrich_edinet` jobs, if any exist in a Supabase database, are not automatically removed by this code change. Stop/retry/requeue them manually as needed before running workers.
- EDINET official revenue coverage is unavailable until EDINET recovers and `EDINET_API_KEY` is configured.
- gBizINFO token was not re-read from GitHub Secret this turn because GitHub Secrets are intentionally write-only; prior live repo smoke succeeded and the secret name is present.
- `npm run verify` does not exist; use `npm run quality`.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：
- Review status: `pass` / `Review completed` on pushed handoff head `e5d84dc`; `quality-gate` passed on the same head.
- Critical findings: none known locally.
- Resolved findings:
  - EDINET-down operation no longer plans new EDINET jobs when `EDINET_API_KEY` is absent.
  - OpenAI quota issue was resolved by the maintainer charge plus new key replacement; repo smoke now succeeds.
- Deferred findings:
  - Recheck CodeRabbit and `quality-gate` if a later status-refresh-only commit becomes the final pushed head.
  - EDINET key acquisition/use remains deferred until EDINET service/MFA flow is available.
- False positives / not applicable:
  - None in this pass.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：
- Status: Not run
- Findings: none
- Actions taken: none
- Rationale: CodeRabbit OSS is available as the standard reviewer. This pass is focused on operational fallback planning and OpenAI/gBizINFO readiness, not high-risk auth/DB/destructive data changes.

## 9. Verification Results
実行した確認コマンドと結果：

```bash
gh pr checks 1 --repo kotakase2022-jpg/collector
# before new work: CodeRabbit pass / Review completed; quality-gate pass on fce04bd.
# after pushing e5d84dc: CodeRabbit pass / Review completed; quality-gate pass (2m6s).
```

```bash
gh secret list --repo kotakase2022-jpg/collector --env staging
# success: GBIZINFO_API_TOKEN and OPENAI_API_KEY are present by name only.
```

External live smoke checks:
- OpenAI `/v1/models`: success, HTTP 200, default extraction model visible.
- OpenAI repo `extractCompanyProfileWithLlm()`: success through Responses API.
- gBizINFO: not re-read from GitHub Secret this turn; previous repo live smoke succeeded and the secret remains present by name.
- EDINET: intentionally deferred; service/MFA flow is unavailable.

```bash
npm.cmd run test -- tests/etl.test.ts -t "coverage job planning"
# success: 6 passed, 117 skipped
```

```bash
npm.cmd run quality
# success:
# typecheck passed
# lint passed
# test passed: 123 tests
# coverage passed
# e2e passed: 8 tests
# build passed
```

Commit hooks:
```bash
git commit -m "Allow operation without EDINET"
# success: quality guard, lint, and typecheck passed.
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：
1. Recheck final PR #1 status if a later status-refresh-only commit is pushed after `e5d84dc`:
   - `gh pr checks 1 --repo kotakase2022-jpg/collector`
   - Confirm CodeRabbit OSS status/comments.
2. Review `src/lib/etl/job-planner.ts` for EDINET-disabled planning correctness.
3. Confirm no secrets or key values were committed.
4. If staging Supabase has pending `enrich_edinet` jobs, decide whether to stop them before worker operation.
5. If EDINET recovers later, set `EDINET_API_KEY`, run a repo EDINET smoke, and confirm `enrich_edinet` planning resumes.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：
- `src/lib/etl/job-planner.ts`: `EDINET_API_KEY` default gating and explicit `edinetEnabled` override.
- `tests/etl.test.ts`: EDINET-disabled default coverage planning and EDINET-enabled override coverage.
- `README.md`: operational wording for EDINET-down fallback and Search-disabled policy.
- Secret hygiene around OpenAI/gBizINFO/EDINET references.

## 12. Risk Notes
リスク・人間確認が必要な事項：
- EDINET-down operation means official revenue coverage may remain unknown unless official-site/OpenAI extraction finds explicit evidence.
- OpenAI extraction can infer structure from text but must not invent values; existing prompt/schema still enforces null/estimated handling.
- Existing DB jobs are not migrated or deleted by this change.
- `collector-production` remains approved only as an isolated pre-real-data environment.

## 13. Do Not Touch
触らない方がよい領域：
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, Supabase service-role keys, or OpenAI/EDINET/gBizINFO secrets.
- Do not run destructive Supabase writes or import real data into `collector-production` without a separate explicit instruction.
- Do not re-enable generic Search API integration unless the maintainer reverses the "Search is unused" decision.
- Do not force-push.
- Do not weaken tests, RLS/RPC ACL rules, or error surfacing.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 14. Notes for Claude Code
Claude Codeへの補足：
- EDINET can be bypassed for now by leaving `EDINET_API_KEY` unset.
- gBizINFO and OpenAI are the viable external services for the current operation.
- The OpenAI key value was stored in GitHub Environment `staging`, then transient key material and clipboard were cleared.
- The previous managed OpenAI key was revoked after replacement.
- CodeRabbit OSS remains the standard reviewer; Cursor Bugbot was not run.
