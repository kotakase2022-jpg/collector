# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 19 (inferred, continued Codex improvement)
- Loop number inferred from: Previous handoff was already Loop 19 with `Current owner: Codex`, `Next owner: Claude Code`, and no Claude Code handoff occurred before this continuation. This remains Loop 19.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-08 01:58 +09:00

## 1. Current Goal
今回の目的：

- Continue the standing autonomous improvement goal toward 100/100 on:
  - function / screen-transition / no-bug confidence,
  - daily-use list-generation tool value.
- Keep the diff small and CodeRabbit-friendly.
- Improve local quality-gate reliability so `npm install` / `prepare` does not fail merely because the host lacks a `git` binary, while still configuring hooks when Git is available.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `7b51b13` (`Make git hook installer tolerate missing git`)
- Last known good commit: `7b51b13`, with local `npm.cmd run quality` success and PR checks green (`quality-gate` pass, CodeRabbit `SUCCESS` / `Review completed`).
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on pushed head `7b51b13`.

## 3. What Was Done
今回完了したこと：

- Read the required project context before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
  - current diff / recent commits / PR status / CodeRabbit status.
- Confirmed the working tree was clean and PR #1 was green before editing.
- Checked current CodeRabbit review-thread state; no open unresolved current-code findings were found.
- Verified a still-relevant local workflow reliability risk in `scripts/install-git-hooks.ts`:
  - the script already chmods tracked hooks on non-Windows,
  - but `execFileSync("git", ...)` could still abort `npm install` / `prepare` when Git is absent.
- Refactored `install-git-hooks.ts` into a testable `installGitHooks` function.
- Preserved behavior when Git is available:
  - non-Windows hook files are chmodded to `0755`,
  - `git config core.hooksPath .githooks` still runs.
- Added a missing-Git fallback:
  - only `ENOENT` from the Git executable is converted into a warning and safe skip,
  - other Git/config failures still throw so real setup problems remain visible.
- Added regression coverage for both normal hook setup and missing-Git fallback behavior.
- Ran focused checks, the real `npm.cmd run prepare`, the full local quality gate, mock self-evaluation, pushed the code, and confirmed PR checks.
- Updated PR #1 body with latest head `7b51b13`, validation, review scope, and remaining risks.
- Did not touch Next.js page/route/component code in this pass, so no local Next.js docs were required beyond the required project reading.

## 4. Files Changed
主な変更ファイル：

- `scripts/install-git-hooks.ts`
  - Exports testable `installGitHooks`.
  - Keeps hook chmod/config behavior when Git is available.
  - Safely skips only the missing-Git (`ENOENT`) case.
- `tests/etl.test.ts`
  - Adds regression coverage for hook setup and missing-Git fallback.
- `AI_HANDOFF.md`
  - Refreshes Loop 19 continuation, verification, CodeRabbit status, and residual risk.
- PR #1 body
  - Updated outside the git tree with latest head `7b51b13`, validation, review notes, and risks.

## 5. Current Status
現在の状態：

- Local full quality gate is green.
- PR #1 latest pushed code head `7b51b13` is green:
  - `quality-gate`: pass
  - CodeRabbit: pass / `Review completed`
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.
- App remains locally in mock/fallback mode because isolated staging Supabase credentials are not configured.

## 6. Known Issues
既知の問題：

- Neither `202607070001_queue_crawl_jobs_rpc.sql` nor `202607070002_company_fallback_unique_index.sql` has been applied to a real isolated staging Supabase project from this environment.
- If any database already received the original `202607070001` migration before the ACL revokes were added, the three revoke statements must be applied manually on that database.
- If staging already contains duplicate `(name, address)` company rows, `202607070002_company_fallback_unique_index.sql` intentionally fails with a preflight error; duplicates must be reviewed/merged manually before adding the unique index.
- Live/staging Supabase smoke was not run because isolated staging credentials are absent.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run verify` does not exist; `npm run quality` is the canonical full gate.
- `npm.cmd run etl:self-evaluate` remains mock-mode only in this environment and reports score `83` / `releaseReady: false`.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：

- Review status: `SUCCESS` / `Review completed` on pushed head `7b51b13`.
- Critical findings: none open.
- Resolved findings:
  - Current pass: git hook installer now tolerates a missing Git executable and has regression coverage.
  - Previous Loop 19: crawler score denominator derives from the same weight map used by score components; exact regression coverage was added.
  - Previous Loop 18: queue crawl RPC execute privileges are restricted to `service_role`; regression coverage enforces the ACL and pinned `search_path`.
  - Previous Loop 18: fallback company upsert has schema-backed `name,address` uniqueness.
  - Earlier Loop 18 findings remain in place: comparison export limits, EDINET lookup, release gates, coverage queue uniqueness, server route error logging, and CSV import source row numbering.
- Deferred findings: none for this pass.
- False positives / not applicable: none for this pass.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：

- Status: Not run.
- Findings: none.
- Actions taken: none.
- Rationale: CodeRabbit OSS was available and passed on the pushed head. This pass was a narrow local workflow reliability fix with regression coverage and did not require the reserve reviewer.

## 9. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success: clean before editing; later clean after the code commit before this handoff update

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before editing: CodeRabbit pass / Review completed; quality-gate pass

npm.cmd run test -- tests/etl.test.ts -t "git hook installer"
# success: 1 passed, 110 skipped

npm.cmd run typecheck
# success

npm.cmd run lint
# success

npm.cmd run prepare
# success: current environment installs .githooks path

git diff --check
# success: no whitespace errors

npm.cmd run quality
# success: typecheck, lint, test (111 passed), coverage (111 passed), E2E (8 passed), build

npm.cmd run etl:self-evaluate
# success command execution; mock-mode score 83, releaseReady false

git commit -m "Make git hook installer tolerate missing git"
# success: commit 7b51b13; hook passed check:test-integrity, lint, typecheck

git push origin codex/permanent-quality-gate-governance
# success: pre-push passed check:test-integrity, lint, typecheck, test (111 passed)

gh pr checks 1 --repo kotakase2022-jpg/collector --watch --interval 10
# success: CodeRabbit pass / Review completed; quality-gate pass on head 7b51b13
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the focused Loop 19 continuation diff:
   - `scripts/install-git-hooks.ts`
   - `tests/etl.test.ts`
   - `AI_HANDOFF.md`
2. Confirm the missing-Git fallback is narrow enough:
   - `ENOENT` should warn and skip,
   - other `git config` failures should still throw.
3. Recheck PR #1 if a new CodeRabbit comment appears after this handoff-only update.
4. If continuing toward 100/100, prefer staging evidence next if credentials are available:
   - apply `202607070001` and `202607070002` to an isolated staging Supabase,
   - handle any duplicate `(name, address)` preflight failure manually,
   - run `npm run smoke:staging`.
5. If staging credentials remain unavailable, continue with one narrow CodeRabbit-friendly improvement; good candidates are still-valid low-risk nits only after confirming current code.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- Hook installer behavior: normal Git path still configures hooks; missing Git does not abort install; non-ENOENT failures remain visible.
- Regression strength: test covers chmod/config and missing-Git fallback without touching the real repository config.
- PR body accuracy: confirm latest head and validation are correct after this handoff commit.
- Residual staging risk: confirm the handoff is honest that 100/100 cannot be claimed without isolated staging smoke/live evidence.

## 12. Risk Notes
リスク・人間確認が必要な事項：

- The hook installer change affects local developer setup only; no runtime app behavior or production data path changed.
- No production or staging database was touched in this pass.
- Migration `202607070001_queue_crawl_jobs_rpc.sql` was edited in a previous pass based on the statement that it has not been applied to any real Supabase project. If it has been applied anywhere, manually run the added revoke statements there.
- Migration `202607070002_company_fallback_unique_index.sql` is intentionally non-destructive; duplicate `(name, address)` rows require human review before the index can be added.
- Remaining reason not to claim 100/100: no isolated staging Supabase migration/smoke evidence and no live external-service validation are available from this environment.

## 13. Do Not Touch
触らない方がよい領域：

- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not apply migrations to production without maintainer sign-off.
- Do not remove or weaken tests to make checks pass.
- Do not force-push.
- Do not weaken the RPC ACL pattern for new `create function` migrations.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 14. Notes for Claude Code
Claude Codeへの補足：

- This pass did not touch Next.js code. Before touching Next.js pages, route handlers, or component boundaries in a future pass, read the relevant local docs under `node_modules/next/dist/docs/`.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- Standing self-score after this pass:
  - Function / screen-transition / no-bug confidence: 99 / 100
  - Daily-use list-generation tool value: 99 / 100
- Remaining reason not 100/100: staging Supabase migration/smoke proof and live external-service validation are still missing from this environment.
