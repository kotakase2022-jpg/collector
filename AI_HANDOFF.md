# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this Codex continuation, so this remains Loop 14.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 11:12 +09:00

## 1. Current Goal
今回の目的：

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Keep improving list generation/search UX with small, reviewable changes that pass the full quality gate.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest implementation commit: `1e20e48` (`Clarify company keyword search scope`)
- Latest pushed head before this handoff edit: `7b0509d` (`Refresh handoff with no-result recovery status`)
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Last known good implementation commit with full local `npm run quality`: `1e20e48`
- For the absolute latest head, run `git rev-parse --short HEAD` because handoff-only commits may follow implementation commits.

## 3. What Was Done
今回完了したこと：

- Confirmed local branch was clean and aligned with origin before starting.
- Confirmed CodeRabbit status on pushed head `7b0509d` was `success`.
- Read the required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Read the relevant Next.js 16 docs before touching App Router pages:
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
  - `node_modules/next/dist/docs/01-app/02-guides/forms.md`
- Updated search input placeholders on both company list and list generation pages from:
  - `企業名・法人番号・URL`
  - to `企業名・法人番号・URL・業種・所在地`
- Added E2E assertions that both `/companies` and `/lists` expose the broader keyword search scope to users.
- Ran targeted E2E, full local quality gate, and ETL self-evaluation.
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, or deployment settings.

Previously completed in the same loop:

- Broadened `getCompanies` keyword matching to search `name`, `name_kana`, `corporate_number`, `official_url`, `industry`, `prefecture`, `city`, and `address` in both Supabase and mock paths.
- Added list-generation no-result recovery actions that preserve list name/description while removing overly strict filters or regenerating from all companies.
- Added E2E coverage for the no-result recovery flow.

## 4. Files Changed
主な変更ファイル：

- `src/app/companies/page.tsx`
  - Updated the search input placeholder to describe the actual broader keyword search fields.
- `src/app/lists/page.tsx`
  - Updated the list-generation search input placeholder to match the broader search behavior.
- `e2e/collector.spec.ts`
  - Added/updated assertions that the company search and list-generation search placeholders mention industry and location.
- `AI_HANDOFF.md`
  - Updated current status, verification results, and next actions for Claude Code.

## 5. Current Status
現在の状態：

- Implementation commit `1e20e48` passed `npm run quality` locally.
- Local branch is ahead of origin until this handoff update is committed and pushed.
- CodeRabbit GitHub App is installed for the repository.
- CodeRabbit status on the latest pushed head before this continuation (`7b0509d`) was `success`.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active; current evidence is still not enough to mark it complete.

## 6. Known Issues
既知の問題：

- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services in this continuation.
- `npm run etl:self-evaluate` still reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.
- The draft PR remains draft; CodeRabbit status should be rechecked after every push.

## 7. CodeRabbit / Supplemental Review Findings
Cursor Bugbotの指摘と対応状況：

- CodeRabbit:
  - Installed/enabled for `kotakase2022-jpg/collector`.
  - Latest checked pushed commit before this handoff edit: `7b0509d`.
  - GitHub commit status result: `CodeRabbit: success`.
  - No Critical/High CodeRabbit finding is currently known from the available connector evidence.
  - Re-check CodeRabbit after pushing the new implementation and handoff commits.
- Cursor Bugbot:
  - Not used in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
実行した確認コマンドと結果：

```bash
git status --short --branch
# success: branch was clean and aligned with origin before implementation; after implementation commit it is ahead until pushed

GitHub connector: get combined status for 7b0509d
# success: statuses included { context: "CodeRabbit", state: "success" }

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
# - releaseGateFailures:
#   - Supabase not configured / mock sample scope
#   - 1 failed mock job
#   - 1 running mock job

git commit -m "Clarify company keyword search scope"
# success: commit 1e20e48
# pre-commit hook passed check:test-integrity, lint, and typecheck
```

## 9. Current Scores
暫定自己評価：

- Function/screen-transition/no-bug score: 99 / 100
- Daily-use list-generation value score: 99 / 100

100未満の理由：

- Live/staging Supabase and external-service flows are still not verified.
- CodeRabbit must be rechecked after the final pushed head for this continuation.
- Full production-like data coverage cannot be proven from mock data alone.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review the placeholder wording change in:
   - `src/app/companies/page.tsx`
   - `src/app/lists/page.tsx`
   - `e2e/collector.spec.ts`
2. Re-check CodeRabbit status/comments for the latest pushed head after this handoff.
3. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
4. If no review blocker exists, continue one focused improvement toward list-generation value. Good candidates:
   - stronger saved-list filter summaries
   - richer empty/recovery messaging for saved-list detail pages
   - staging smoke evidence workflow once safe staging credentials are available

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- Search UX consistency:
  - `src/app/companies/page.tsx`
  - `src/app/lists/page.tsx`
  - `src/lib/data.ts`
- E2E coverage:
  - `e2e/collector.spec.ts`
- CodeRabbit evidence after the latest push:
  - PR #1 comments/statuses
- Handoff accuracy:
  - `AI_HANDOFF.md`

## 12. Do Not Touch
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
- Do not run Cursor Bugbot unless a maintainer explicitly requests supplemental review.

## 13. Notes for Claude Code
Claude Codeへの補足：

- `npm run quality` is the canonical local gate. `npm run verify` does not exist.
- CodeRabbit is the standard PR reviewer. Cursor Bugbot is optional/reserve only.
- This continuation only aligns UI help text with existing broadened search behavior; it does not change data queries or storage.
- The standing goal must stay active until live/staging evidence and external-service paths are sufficiently verified.
