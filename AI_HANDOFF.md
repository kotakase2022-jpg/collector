# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 21 (continued / inferred)
- Loop number inferred from: Previous handoff recorded `Current owner: Codex`, `Next owner: Claude Code`, `Loop: 21`, `Phase: Handoff`. The maintainer then resolved the Loop 21 blockers and asked Codex to proceed before Claude Code took over, so this is a continuation of Loop 21 rather than a new loop.
- Phase: Handoff
- Last updated: 2026-07-08 14:08 +09:00

## 1. Current Goal
今回の目的：
- Move the OpenAI smoke-key path into formal secret management without committing or printing secrets.
- Treat `collector-production` as an isolated pre-real-data environment, per maintainer confirmation.
- Store the provided gBizINFO credential in formal secret management and run a live integration smoke.
- Obtain/store EDINET API credentials if possible, using the existing Chrome session.
- Implement the maintainer decision that generic Search is not used.
- Leave a clean, verified handoff for Claude Code.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `a862c24` (`Disable external search planning`)
- Latest handoff update: `f99a06a` (`Update Loop 21 external secret handoff`) before this PR-check status refresh.
- Last known good commit: `a862c24`, verified locally with `npm.cmd run quality`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `pass` / `Review completed` on pushed handoff head `f99a06a`; `quality-gate` also passed on that head. If this status-refresh-only handoff edit is committed and pushed afterward, recheck the new head with `gh pr checks 1 --repo kotakase2022-jpg/collector`.

## 3. What Was Done
今回完了したこと：
- Read required workflow files and current repo/PR state.
- Confirmed PR #1 was open, ready for review, and green before this new work.
- Created GitHub Environment `staging` because it did not exist.
- Stored `GBIZINFO_API_TOKEN` in GitHub Environment `staging`.
- Created a new OpenAI API key named `collector-managed-staging-2026-07-08` in the existing OpenAI Platform project and stored it as GitHub Environment `staging` secret `OPENAI_API_KEY`.
- Revoked the old unmanaged OpenAI smoke key `collector-live-smoke-2026-07-08` after the replacement secret was stored.
- Ran a gBizINFO live smoke through the repo implementation; it succeeded with a real corporate-number lookup.
- Ran OpenAI smoke checks:
  - `GET /v1/models` succeeded with the new key.
  - The repo `extractCompanyProfileWithLlm` path reached OpenAI but failed with quota/billing `429`, so no additional paid action was taken.
- Attempted EDINET portal login through Chrome using the provided credentials. Login reached multi-factor authentication and is waiting on the user's registered phone verification.
- Confirmed EDINET API without an API key returns `401`, so `EDINET_API_KEY` is still required.
- Removed generic external Search API wiring:
  - Deleted `SEARCH_API_ENDPOINT` / `SEARCH_API_KEY` docs and CI placeholder env.
  - Disabled env-based HTTP Search provider creation.
  - Stopped auto-planning `discover_official_url` jobs from coverage planning.
  - Updated tests for Search-disabled planning behavior.

## 4. Files Changed
主な変更ファイル：
- `.env.example`
- `.github/workflows/quality-gate.yml`
- `.github/workflows/staging-smoke.yml`
- `README.md`
- `docs/testing.md`
- `src/lib/etl/job-planner.ts`
- `src/lib/etl/search.ts`
- `tests/etl.test.ts`
- `AI_HANDOFF.md`

## 5. Current Status
現在の状態：
- Local full quality gate is green.
- Search is no longer configured or used as an external service path.
- GitHub Environment `staging` currently has these secret names set:
  - `GBIZINFO_API_TOKEN`
  - `OPENAI_API_KEY`
- `EDINET_API_KEY` is not yet set because EDINET portal MFA is incomplete.
- OpenAI replacement key is active and formally stored; the old unmanaged smoke key was revoked.
- `collector-production` may be treated as an isolated pre-real-data environment per maintainer confirmation. Do not treat it as real production data.

## 6. Known Issues
既知の問題：
- EDINET API key acquisition is blocked on multi-factor authentication in Chrome. The EDINET tab is left as a browser handoff for the user/next agent to complete.
- EDINET API without a key failed with `401 Access denied due to invalid subscription key`.
- OpenAI repo-level Responses smoke failed with `429` quota/billing after the new key was created and stored. Do not add credits or change billing without explicit maintainer approval.
- GitHub PR checks passed on handoff head `f99a06a`; recheck if an additional status-refresh handoff commit is pushed.
- `npm run verify` does not exist; use `npm run quality`.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：
- Review status: `pass` / `Review completed` on pushed handoff head `f99a06a`; `quality-gate` passed on the same head.
- Critical findings: none known in current local diff.
- Resolved findings:
  - Search is no longer an external provider or planned default job path, matching the maintainer's "Search is unused" instruction.
  - OpenAI unmanaged smoke key lifecycle issue was resolved by creating a managed replacement secret and revoking the old key.
- Deferred findings:
  - EDINET credential-backed validation remains blocked by MFA.
  - OpenAI LLM extraction smoke remains blocked by account quota/billing.
  - Recheck CodeRabbit and `quality-gate` if a later handoff/status-only commit becomes the final pushed head.
- False positives / not applicable:
  - None in this pass.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：
- Status: Not run
- Findings: none
- Actions taken: none
- Rationale: CodeRabbit OSS is available as the standard reviewer. This pass did not change auth, DB schema, payments, or destructive data paths; external secret handling was performed through GitHub/OpenAI/EDINET UI/CLI and recorded here without secret values.

## 9. Verification Results
実行した確認コマンドと結果：

```bash
gh pr view 1 --repo kotakase2022-jpg/collector --json number,title,state,isDraft,headRefName,baseRefName,url,statusCheckRollup
# success before new code push: PR #1 open, non-draft; CodeRabbit and quality-gate were green on previous head.
```

```bash
gh pr checks 1 --repo kotakase2022-jpg/collector
# before new work: CodeRabbit pass / Review completed; quality-gate pass.
# after pushing f99a06a: CodeRabbit pass / Review completed; quality-gate pass (2m18s).
```

```bash
gh api -X PUT repos/kotakase2022-jpg/collector/environments/staging -F wait_timer=0
# success: GitHub Environment staging created.
```

```bash
gh secret list --repo kotakase2022-jpg/collector --env staging
# success: GBIZINFO_API_TOKEN and OPENAI_API_KEY are present by name only.
```

External live smoke checks:
- gBizINFO repo smoke: success; real lookup returned a JSON object with one `hojin-infos` row.
- OpenAI models smoke: success; `/v1/models` returned HTTP 200 and included the configured default extraction model.
- OpenAI repo LLM smoke: failed with HTTP/API `429` quota/billing.
- EDINET public/no-key repo smoke: failed with `401`, confirming `EDINET_API_KEY` is required.
- EDINET portal Chrome flow: reached MFA; not completed.

```bash
npm.cmd run test -- tests/etl.test.ts -t "coverage job planning|official URL discovery"
# success: 7 passed, 115 skipped
```

```bash
npm.cmd run quality
# success:
# typecheck passed
# lint passed
# test passed: 122 tests
# coverage passed
# e2e passed: 8 tests
# build passed
```

Push hooks:
```bash
git push origin codex/permanent-quality-gate-governance
# success for code commit a862c24 and handoff commit f99a06a; pre-push quality guard, lint, typecheck, and tests passed.
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：
1. Recheck PR #1 status if a later status-refresh-only commit is pushed after `f99a06a`:
   - `gh pr checks 1 --repo kotakase2022-jpg/collector`
   - Confirm CodeRabbit OSS review status/comments on the current head.
2. Complete EDINET MFA in the kept Chrome tab, obtain/copy the EDINET API key, store it as GitHub Environment `staging` secret `EDINET_API_KEY`, then run a repo `listEdinetDocuments()` smoke with the key.
3. Decide whether to add OpenAI credits or use another approved OpenAI project/key; current managed key is valid but Responses API returned quota/billing `429`.
4. Review the Search-disabled implementation and tests for product correctness.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：
- `src/lib/etl/job-planner.ts`: verify removing default `discover_official_url` planning is the intended Search-unused behavior.
- `src/lib/etl/search.ts`: verify leaving only injected-provider behavior is acceptable for legacy/manual tests and old queued jobs.
- `tests/etl.test.ts`: review updated coverage-planning expectations and Search-disabled adapter test.
- `.env.example`, workflows, `README.md`, and `docs/testing.md`: confirm Search env references are removed without weakening quality gates.
- Secret hygiene: ensure no API keys/passwords/tokens were committed or printed in files.

## 12. Risk Notes
リスク・人間確認が必要な事項：
- EDINET MFA requires user action on the registered phone. Do not store EDINET login password in repo or GitHub secrets as a substitute for `EDINET_API_KEY`.
- OpenAI Responses API is blocked by quota/billing. Do not add credits or change billing without explicit maintainer approval.
- `collector-production` is approved only as an isolated pre-real-data environment; avoid production-user-data assumptions.
- Search-backed official URL discovery is intentionally disabled. Companies without corporate numbers and without `official_url` may not receive automatic URL-discovery jobs.
- No `.env`, full secret values, API keys, passwords, or service-role keys should be committed.

## 13. Do Not Touch
触らない方がよい領域：
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, Supabase service-role keys, or OpenAI/EDINET/gBizINFO secrets.
- Do not add OpenAI credits, change billing, or make purchases without explicit maintainer approval.
- Do not run destructive Supabase writes or import real data into `collector-production` without a separate explicit instruction.
- Do not re-enable generic Search API integration unless the maintainer reverses the "Search is unused" decision.
- Do not force-push.
- Do not weaken tests, RLS/RPC ACL rules, or error surfacing.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 14. Notes for Claude Code
Claude Codeへの補足：
- Chrome tabs: EDINET MFA tab should be kept for handoff; OpenAI tab can be closed/released.
- The EDINET credentials provided by the maintainer were used only for portal login and are not written here.
- The provided gBizINFO token was stored in GitHub Environment `staging`; do not print it.
- The new OpenAI key value was stored in GitHub Environment `staging`, then transient key material and clipboard were cleared.
- The old OpenAI smoke key was revoked in the OpenAI Platform UI after the managed replacement was stored.
- CodeRabbit OSS remains the standard reviewer; Cursor Bugbot was not run.
