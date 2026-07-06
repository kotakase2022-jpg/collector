# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (inferred)
- Loop number inferred from: Claude Code's previous handoff was Loop 13 with `Current owner: Claude Code` and `Next owner: Codex`, and it explicitly recommended advancing to Loop 14 when beginning the next Codex development sub-task.
- Phase: Development / Corporate Number Persistence Hardening / Verification / Handoff
- Last updated: 2026-07-06 09:02 +09:00

## 1. Current Goal
今回の目的：

- Continue improving the app toward the standing two-score goal:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear, dependable, and valuable for daily work
- This pass closed the open corporate-number persistence hardening item noted by Claude Code: normalize whitespace-only, invalid, full-width, and hyphenated corporate-number inputs before writing `companies.corporate_number`.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest implementation commit: `69248f7` (`Normalize corporate numbers before upsert`).
- Claude review handoff recorded before this implementation: `c3b5bd7` (`Record Claude review handoff`).
- Previous handoff commit: `800e20c` (`Update handoff after corporate number normalization`).
- Last Bugbot-clean commit: `46622ee`.
- Last known good commit: `69248f7`, verified locally by targeted Vitest, full `npm run quality`, and `npm run etl:self-evaluate`.
- Handoff update for this continuation: this file update follows `69248f7`; check `git log --oneline -8` for the final handoff commit after commit/push.

## 3. What Was Done
今回完了したこと：

- Re-read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, current git status/log, and relevant corporate-number persistence/filtering code/tests.
- Preserved the uncommitted Claude Code review handoff by committing it as `c3b5bd7`.
- Implemented persistence-level corporate-number normalization in `src/lib/etl/store.ts`.
  - `upsertCompany` now builds the row through `buildCompanyUpsertRow`.
  - `buildCompanyUpsertRow` applies `normalizeCorporateNumber` before persistence.
  - Valid full-width or hyphenated values are stored as standard 13-digit corporate numbers.
  - Whitespace-only, invalid, empty, or null values are stored as `null`.
  - The upsert conflict target now uses the normalized row value, so invalid/blank inputs fall back to `name,address` instead of treating raw whitespace as a corporate-number key.
- Added tests in `tests/etl.test.ts`.
  - Covers full-width/hyphenated corporate numbers before persistence.
  - Covers whitespace-only, invalid, and null corporate numbers becoming `null`.
- Ran targeted Vitest, the full quality gate, and the ETL self-evaluation script.
- Committed the implementation as `69248f7`.

## 4. Files Changed
主な変更ファイル：

- `src/lib/etl/store.ts`
  - Added `buildCompanyUpsertRow`.
  - Normalized `corporateNumber` before company upsert persistence and conflict-target selection.
- `tests/etl.test.ts`
  - Added persistence-row tests for corporate-number normalization.
- `AI_HANDOFF.md`
  - Updated this handoff.

## 5. Current Status
現在の状態：

- `npm run quality` is green locally.
- Unit/integration tests: 95 passed.
- Coverage run: 95 passed.
- E2E tests: 8 passed.
- Production build: passed.
- `npm run etl:self-evaluate` succeeded in mock mode with score 83 and `releaseReady: false`; this remains a data coverage/sample readiness signal, not a final production readiness score.
- This change is schema-free and does not alter UI layout, saved-list persistence format, or public API contracts.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
既知の問題：

- Cursor Bugbot has not reviewed heads after `46622ee` because recent attempts hit Cursor usage/spend limits. This includes `7417361`, `b5f1188`, `89c0767`, and `69248f7`.
- Latest known blocked request ID remains `serverGenReqId_2e3d614e-b64e-4dc5-b526-d8693b72104c`.
- Live EDINET XBRL enrichment remains unverified against staging/prod Supabase and the live EDINET API.
- Real staging Supabase smoke was not run because staging credentials were not provided.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` reports mock-mode/staging-smoke readiness limitations when Supabase evidence is absent.
- Coverage remains useful but not exhaustive, especially around live Supabase integration paths.
- Some UI text and mock data in other screens still deserve a language/encoding polish pass.

## 7. Bugbot Findings
Cursor Bugbotの指摘と対応状況：

- `f5ae483`: Corporate number filter mismatch (Medium) - fixed in Loop 11.
- `b89261f`: Whitespace corporate number quality mismatch (Medium) - fixed in Loop 12.
- `46622ee`: Bugbot rerun result: no new issues.
- Later Bugbot reruns were blocked by Cursor usage/spend limits.
- This Loop 14 corporate-number persistence hardening has not been reviewed by Bugbot yet.

## 8. Verification Results
実行した確認コマンドと結果：

```bash
npx vitest run tests/etl.test.ts --testNamePattern "company upsert rows|normalization helpers|corporate numbers"
# success: 3 targeted tests passed, 92 skipped by testNamePattern

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 95 passed
# - test:coverage: success, 95 passed
# - test:e2e: success, 8 passed
# - build: success

npm run etl:self-evaluate
# success: mock-mode score 83, releaseReady false because Supabase/staging evidence is absent and mock jobs include failed/running examples

git commit -m "Record Claude review handoff"
# success: commit c3b5bd7; local hooks ran check:test-integrity, lint, and typecheck successfully

git commit -m "Normalize corporate numbers before upsert"
# success: commit 69248f7; local hooks ran check:test-integrity, lint, and typecheck successfully
```

## 9. Current Scores
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 98 / 100
- Daily-use list-generation value score: 99 / 100

Score movement:

- Function score remains 98. This pass removes another persistence/data-quality edge case and is fully tested locally, but live/staging smoke evidence and latest Bugbot review are still missing.
- Daily-use list value remains 99. Corporate-number filters and CSV/list quality are more dependable, but the overall goal still lacks live/staging evidence and final review.

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Live EDINET/Supabase enrichment smoke evidence is still missing.
- Latest implementation commits still need Bugbot review once the Cursor usage/spend limit allows it.
- Some screens still need text/encoding polish for daily business usability.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：

1. Review `src/lib/etl/store.ts` to confirm `buildCompanyUpsertRow` is the right persistence boundary for corporate-number normalization.
2. Confirm `upsertCompany` conflict-target selection should key off the normalized row value.
3. Rerun Cursor Bugbot on the latest pushed head once Cursor usage/spend limits allow.
4. If credentials are available, run a safe staging Supabase smoke and verify list CSV import/export plus EDINET observation paths.
5. If continuing without live credentials, choose one small UX/text polish or data-quality hardening task and keep the diff focused.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：

- `src/lib/etl/store.ts`
  - `buildCompanyUpsertRow`
  - `upsertCompany` conflict-target selection
- `tests/etl.test.ts`
  - persistence-row corporate-number normalization coverage
- Latest Bugbot findings after the usage limit issue is resolved.

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

- This continuation is schema-free.
- The normalization boundary intentionally uses the existing `normalizeCorporateNumber`, so CSV preview, dedupe, NTA parsing, and persistence now share the same corporate-number semantics.
- Existing records with whitespace-only corporate numbers are not migrated by this code change; it prevents future writes from preserving that bad state. A DB cleanup migration can be considered separately if real staging/prod data contains such rows.
- `README.md` and some PowerShell output can display mojibake in this shell, but Node UTF-8 reads show Japanese strings are present; verify encoding before text-polish edits.
- The standing goal remains active; do not mark it complete until live/staging concerns, EDINET completeness, latest Bugbot review, and remaining UX/text polish gaps are actually resolved.
