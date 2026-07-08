# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 21 (inferred)
- Loop number inferred from: Previous handoff recorded `Current owner: Claude Code`, `Next owner: Codex`, `Loop: 20`, and instructed Codex to advance to Loop 21 when starting a fresh development sub-task. This turn began that fresh Codex sub-task after preserving Claude Code's Loop 20 review handoff.
- Phase: Handoff
- Last updated: 2026-07-08 13:22 +09:00

## 1. Current Goal
今回の目的:
- Resume from Claude Code's Loop 20 review handoff.
- Surface the two human-confirmation items before any further external-service or production-like work:
  - Decide whether to revoke or formally provision the OpenAI smoke key `collector-live-smoke-2026-07-08`.
  - Confirm `collector-production` is an isolated environment before any real data import.
- Avoid further external-service/DB operations until those confirmations are resolved.
- Check PR/CodeRabbit state and make one small local improvement toward fail-loud external adapter behavior.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `16d8890` (`Cover EDINET statusCode error bodies`)
- Previous handoff preservation commit: `ad4c070` (`Record Claude external validation review`)
- Last known good commit: `16d8890`, verified locally with `npm.cmd run quality`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `pass` / `Review completed` after pushing the Loop 21 test/handoff changes; `quality-gate` also passed. If a later handoff-only metadata commit reruns checks, recheck the current head with `gh pr checks`.

## 3. What Was Done
今回完了したこと:
- Read the attached loop instructions plus the required local context:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
  - recent commits / current diff / PR checks / review-thread state.
- Preserved Claude Code's Loop 20 review handoff in commit `ad4c070`.
- Confirmed current PR state before the new Codex test commit:
  - `CodeRabbit`: pass / Review completed
  - `quality-gate`: pass
  - GraphQL review threads: no unresolved current review threads.
- Surfaced the two human-confirmation items in the Codex status stream and avoided further external-service or DB work.
- Checked old CodeRabbit/Bugbot-style findings against current code:
  - retry/stop/run-next/plan-coverage/job-priority error logging is already present.
  - `job-actions` guarded update helper is already consolidated.
  - scoring/self-evaluation/hook installer related prior findings are already addressed.
- Added one focused regression assertion for the recent EDINET fail-loud fix:
  - `listEdinetDocuments()` now has test coverage for a lowercase `statusCode` string body-level error such as `{ statusCode: "503", message: "EDINET maintenance" }`.

## 4. Files Changed
主な変更ファイル:
- `tests/etl.test.ts`
  - Added the EDINET lowercase/string `statusCode` body-level error regression assertion.
- `AI_HANDOFF.md`
  - Updated for this Codex Loop 21 handoff.

## 5. Current Status
現在の状態:
- Local quality gate is green.
- No external services or production-like DB/API paths were touched in this Codex pass.
- The EDINET adapter's body-level error behavior is better regression-locked.
- PR #1 was green after the Loop 21 test/handoff push: CodeRabbit pass and `quality-gate` pass. Recheck the current head if another handoff-only metadata commit reruns checks.
- Working branch is expected to contain:
  - `ad4c070` handoff preservation commit
  - `16d8890` EDINET test commit
  - this handoff update commit

## 6. Known Issues
既知の問題:
- OpenAI smoke key `collector-live-smoke-2026-07-08` is still active in the OpenAI Platform project `news-title-rewrite` / org `suslab`. Its value is not stored locally. Human decision needed: revoke it or provision it through approved secret management outside the repo.
- Supabase project `collector-production` currently has smoke seed data only. Human confirmation needed before treating it as an isolated target for real data import.
- gBizINFO live retrieval remains blocked until `GBIZINFO_API_TOKEN` is provided.
- EDINET live retrieval remains blocked until `EDINET_API_KEY` is provided.
- Search discovery remains blocked until `SEARCH_API_ENDPOINT` / `SEARCH_API_KEY` are provided.
- `npm run verify` does not exist; use `npm run quality`.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況:
- Review status: `pass` / `Review completed` after the Loop 21 test/handoff push.
- Critical findings: none open in current review threads.
- Resolved findings:
  - Prior EDINET body-level 401 mismatch was fixed in `820279b`.
  - This pass added extra coverage for lowercase/string `statusCode` EDINET error bodies.
  - Prior retry/stop swallowed-error comments are already resolved in current code.
  - Prior `job-actions` duplicate guarded-update comment is already resolved in current code.
- Deferred findings:
  - Recheck PR #1 if a later handoff-only metadata commit causes checks to rerun.
  - Credential-backed gBizINFO/EDINET/search validation and real NTA import remain pending.
- False positives / not applicable:
  - None in this pass.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認:
- Status: Not run
- Findings: none
- Actions taken: none
- Rationale: CodeRabbit is the standard reviewer and is currently available. This pass changed only a deterministic test and handoff metadata. Older Bugbot comments on the PR are resolved or outdated; repeated Bugbot attempts also previously hit usage limits.

## 9. Verification Results
実行した確認コマンドと結果:

```bash
git status --short --branch
# Before preserving Claude handoff: AI_HANDOFF.md modified.
# After code commit: branch ahead locally; handoff update pending.
```

```bash
gh pr checks 1 --repo kotakase2022-jpg/collector
# success before new local commits:
# CodeRabbit pass / Review completed
# quality-gate pass
```

```bash
gh api graphql ... reviewThreads
# success: current reviewThreads list contained no unresolved review threads.
```

```bash
npm.cmd run test -- tests/etl.test.ts -t "EDINET list client"
# success:
# Quality guard passed
# Test Files 1 passed
# Tests 1 passed | 121 skipped
```

```bash
npm.cmd run test
# success:
# Quality guard passed
# Test Files 1 passed
# Tests 122 passed
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

Commit hooks:
```bash
git commit ...
# success during commits:
# quality guard passed
# lint passed
# typecheck passed
```

PR checks after pushing the Loop 21 test/handoff changes:
```bash
gh pr checks 1 --repo kotakase2022-jpg/collector
# success:
# CodeRabbit pass / Review completed
# quality-gate pass (2m24s)
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと:
1. Confirm PR #1 remains green after any final handoff-only metadata commit:
   - `gh pr checks 1 --repo kotakase2022-jpg/collector`
   - CodeRabbit OSS status/comments
2. Review the very small `tests/etl.test.ts` addition for EDINET body-level `statusCode` string errors.
3. Confirm no secrets were introduced.
4. Keep external-service/DB work paused until the maintainer decides:
   - revoke vs formally provision the OpenAI smoke key
   - whether `collector-production` is an isolated import target
5. If confirmations and credentials arrive later, validate gBizINFO/EDINET/search live paths and plan the real NTA import.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:
- `tests/etl.test.ts` around the EDINET list client test.
- `AI_HANDOFF.md` accuracy for Loop 21 and the two human-confirmation blockers.
- PR #1 CodeRabbit/quality-gate status after this push.
- Secret hygiene around the OpenAI smoke key references; the key value must not exist in repo files.

## 12. Risk Notes
リスク・人間確認が必要な事項:
- No new external API, browser, Supabase, production DB, or secret-management operation was performed in this pass.
- The active OpenAI smoke key remains a human lifecycle decision.
- The `collector-production` Supabase project name is production-like but currently has smoke seed data only; confirm isolation before real import.
- The new test is intentionally small and does not alter runtime code.

## 13. Do Not Touch
触らない方がよい領域:
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not store the smoke-test OpenAI key in the repo.
- Do not run tests against production Supabase or production APIs without explicit maintainer sign-off.
- Do not import real data into `collector-production` until its isolation is confirmed.
- Do not force-push.
- Do not weaken tests, RLS/RPC ACL rules, or error surfacing.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 14. Notes for Claude Code
Claude Codeへの補足:
- The attached prompt text displayed as mojibake in PowerShell, but it was the standard alternating Codex/Claude loop instruction set.
- `AGENTS.md` and `CLAUDE.md` did not need updates in this pass.
- Next.js docs were searched/read enough to confirm no new Next.js route-handler change was needed; the final code change is test-only.
- Full quality gate remains `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run.
