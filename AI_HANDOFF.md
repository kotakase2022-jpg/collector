# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this Codex continuation, so this remains Loop 14.
- Phase: Handoff
- Last updated: 2026-07-06 11:18 +09:00

## 1. Current Goal
今回の目的:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Confirm whether CodeRabbit is installed/enabled for the repository, and record the result.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit at handoff update time: `ad745ef` (`Update handoff after search scope copy`)
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Last known good implementation commit with full local `npm run quality`: `1e20e48` (`Clarify company keyword search scope`)

## 3. What Was Done
今回完了したこと:

- Checked local git status; the branch was clean and aligned with `origin/codex/permanent-quality-gate-governance`.
- Confirmed GitHub commit status for latest commit `ad745ef`.
- Verified CodeRabbit is installed/enabled for `kotakase2022-jpg/collector` because the latest pushed commit reports:
  - `CodeRabbit: success`
- Confirmed no CodeRabbit installation action is currently needed.
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, deployment settings, or application code in this continuation.

Previously completed in Loop 14:

- Broadened `getCompanies` keyword matching to search `name`, `name_kana`, `corporate_number`, `official_url`, `industry`, `prefecture`, `city`, and `address` in both Supabase and mock paths.
- Updated search input placeholders on `/companies` and `/lists` to communicate the broader keyword scope.
- Added E2E coverage for broader keyword search copy and list-generation no-result recovery actions.

## 4. Files Changed
主な変更ファイル:

- `AI_HANDOFF.md`
  - Recorded that CodeRabbit is installed/enabled and currently reports success on the latest pushed commit.

## 5. Current Status
現在の状態:

- CodeRabbit GitHub App/status check is active for the repository.
- Latest checked commit: `ad745ef`
- Latest checked CodeRabbit status: `success`
- Cursor Bugbot remains optional/reserve only because of usage cost.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active; current evidence is not enough to mark it complete.

## 6. Known Issues
既知の問題:

- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services in this continuation.
- `npm run etl:self-evaluate` previously reported `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.
- CodeRabbit should be rechecked after every push.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit と補助レビューの状況:

- CodeRabbit:
  - Installed/enabled for `kotakase2022-jpg/collector`.
  - Latest checked commit: `ad745ef`.
  - GitHub commit status result: `CodeRabbit: success`.
  - No Critical/High CodeRabbit finding is currently known from the available connector evidence.
- Cursor Bugbot:
  - Not used in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
実行した確認コマンドと結果:

```bash
git status --short --branch
# success: branch was clean and aligned with origin before this handoff-only update

git log --oneline -5
# success: latest commit was ad745ef (Update handoff after search scope copy)

GitHub connector: get combined status for ad745ef
# success: statuses included { context: "CodeRabbit", state: "success" }
```

Previously in Loop 14:

```bash
npm run test:e2e -- --grep "list generation supports|company search filters"
# success: 2 passed

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
```

## 9. Current Scores
暫定自己評価:

- Function/screen-transition/no-bug score: 99 / 100
- Daily-use list-generation value score: 99 / 100

100未満の理由:

- Live/staging Supabase and external-service flows are still not verified.
- Full production-like data coverage cannot be proven from mock data alone.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと:

1. Review this handoff update and confirm that CodeRabbit is still the standard PR reviewer.
2. Re-check CodeRabbit status/comments for the latest pushed head after any new push.
3. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
4. If no review blocker exists, continue one focused improvement toward list-generation value. Good candidates:
   - stronger saved-list filter summaries
   - richer empty/recovery messaging for saved-list detail pages
   - staging smoke evidence workflow once safe staging credentials are available

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:

- Review operation docs:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
- CodeRabbit evidence after the latest push:
  - PR #1 comments/statuses
- Search UX consistency from previous implementation:
  - `src/app/companies/page.tsx`
  - `src/app/lists/page.tsx`
  - `src/lib/data.ts`
  - `e2e/collector.spec.ts`

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
- Do not run Cursor Bugbot unless a maintainer explicitly requests supplemental review.

## 13. Notes for Claude Code
Claude Codeへの補足:

- `npm run quality` is the canonical local gate. `npm run verify` does not exist.
- CodeRabbit is already installed/enabled and is the standard PR reviewer.
- Cursor Bugbot is optional/reserve only.
- This continuation was documentation/status verification only; no application code was changed.
- The standing goal must stay active until live/staging evidence and external-service paths are sufficiently verified.
