# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 13 (continued, inferred)
- Loop number inferred from: The previous handoff marked Loop 13 and Codex continued directly from the active long-running goal before a Claude Code pass occurred. This remains a Loop 13 continuation.
- Phase: Development / Saved List Export Performance Guard / Verification / Handoff
- Last updated: 2026-07-06 02:27 +09:00

## 1. Current Goal
Current development objective:

- Continue improving the app toward the standing two-score goal:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear, dependable, and valuable for daily work
- This pass tightened the saved-list export path so CSV export does not run regeneration comparison work that is only needed by the saved-list detail screen.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed commit before this pass: `feb1445` (`Record Bugbot limit after saved list comparison`).
- Current implementation change in this pass: saved-list CSV export skips the regeneration comparison query.
- Latest Bugbot-clean commit: `46622ee` (`Update handoff after quality fix push`).
- Last known good state: current working tree after `npm run quality` passed.
- Implementation/handoff commit for this pass: pending at the time this file was edited; check `git log --oneline -5` after commit.

## 3. What Was Done
Completed in this Codex continuation:

- Re-read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, current git status/log, and the relevant Next.js docs before touching App Router-adjacent code.
- Reviewed the saved-list detail/export data path after the regeneration comparison feature.
- Added `SavedCompanyListDetailOptions` with `includeComparison`.
- Kept saved-list detail behavior unchanged while letting CSV export call `getSavedCompanyListDetail(id, { includeComparison: false })`.
- Added an unchanged comparison fallback for callers that intentionally skip regeneration comparison.
- Added test coverage for the comparison-skip option and the export call contract.
- Ran the full local quality gate successfully.

## 4. Files Changed
Main files changed:

- `src/lib/lists.ts`
  - Added `SavedCompanyListDetailOptions`.
  - CSV export now skips the regeneration comparison query.
- `tests/etl.test.ts`
  - Added coverage for the comparison-skip option and export call contract.
- `AI_HANDOFF.md`
  - Updated this handoff.

## 5. Current Status
Current state:

- `npm run quality` is green locally.
- The change is focused and does not alter DB schema, saved-list persistence format, crawler behavior, or production data.
- Cursor Bugbot is clean for `46622ee`.
- Cursor Bugbot has not reviewed the latest heads after `46622ee` because recent attempts hit a Cursor usage/spend limit.
- Latest pushed commit is still `feb1445`; this pass is ready to commit and push after this handoff update.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
Known issues:

- Cursor Bugbot review is pending for the latest pushed heads after `46622ee` until the Cursor usage/spend limit is raised or resets.
- Full EDINET XBRL download/extraction remains unimplemented; current behavior intentionally fails EDINET jobs when no facts are applied.
- Real staging Supabase smoke verification was not run because staging credentials were not provided.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` still reports mock-mode/staging-smoke readiness limitations when Supabase evidence is absent.
- Coverage remains useful but not exhaustive, especially around live Supabase integration paths.
- Some UI text and mock data in other screens still deserve a language/encoding polish pass.
- Supabase cannot natively trim whitespace in the simple `hasCorporateNumber=no` PostgREST filter; ingestion should ideally normalize whitespace-only corporate numbers to `null` or reject them in a future hardening task.

## 7. Bugbot Findings
Cursor Bugbot findings and status:

- `f5ae483`: `Corporate number filter mismatch` (Medium) - fixed in Loop 11.
- `b89261f`: `Whitespace corporate number quality mismatch` (Medium) - fixed in Loop 12.
- `46622ee`: Bugbot rerun result: no new issues.
- `0b87dde`: Bugbot rerun attempted after push, but Cursor returned a usage/spend limit failure instead of a review.
  - Request ID: `serverGenReqId_46a1e392-7e64-4d9b-9325-a86ec3c37961`.
- `723cc39`: Bugbot rerun attempted after push, but Cursor again returned a usage/spend limit failure instead of a review.
  - Request ID: `serverGenReqId_96696049-2c66-4c14-a479-5d80ce12402c`.
- `aede7c1`: Bugbot rerun attempted after push, but Cursor again returned a usage/spend limit failure instead of a review.
  - Request ID: `serverGenReqId_599f788e-0a44-4cce-be19-ebc5f0617eae`.
- `5b9fe69`: Bugbot rerun attempted after push, but Cursor again returned a usage/spend limit failure instead of a review.
  - Request ID: `serverGenReqId_3750e11a-2e8c-405c-a19b-f3a9aaf44142`.
- `1f24fc0`: Bugbot rerun attempted after push, but Cursor again returned a usage/spend limit failure instead of a review.
  - Request ID: `serverGenReqId_027c9cf0-e1af-4830-b37f-a31ec78b9fd5`.
- Current saved-list export optimization: Bugbot not yet rerun.

## 8. Verification Results
Verification commands and results:

```bash
npm run typecheck
# success

npm run test
# success: quality guard passed; 84 tests passed

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 84 passed
# - test:coverage: success, 84 passed
# - test:e2e: success, 8 passed
# - build: success
```

## 9. Current Scores
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 96 / 100
- Daily-use list-generation value score: 96 / 100

Score movement:

- This pass keeps both scores unchanged but reduces export-path performance risk introduced by the saved-list comparison feature.
- Function score remains 96 because live staging Supabase evidence, EDINET completeness, and latest Bugbot review remain unresolved.

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Full EDINET enrichment is not complete.
- Some screens still need text/encoding polish for daily business usability.
- More high-value list operations could still be added, such as list-to-list comparison and stronger persisted history analytics.
- Latest implementation commits still need Bugbot review once usage limit allows it.

## 10. Next Recommended Action
Next first action for Claude Code:

1. Review the saved-list export optimization and confirm the detail screen still includes comparison data.
2. Confirm `getSavedListExportRows` intentionally calls `getSavedCompanyListDetail` with `includeComparison: false`.
3. Rerun Cursor Bugbot on the latest pushed head once the Cursor usage/spend limit is raised or reset.
4. Confirm `npm run quality` if time allows.
5. Continue with one focused improvement toward the standing goal, preferably staging smoke readiness, EDINET extraction hardening, UI text polish, or list-to-list comparison.

## 11. Suggested Review Scope for Claude Code
Please review these areas first:

- `getSavedCompanyListDetail` option behavior for detail view vs CSV export.
- `buildUnchangedSavedCompanyListComparison` semantics when comparison is intentionally skipped.
- Whether the source-level assertion in `tests/etl.test.ts` is acceptable or should be replaced with a dependency-injection style test later.
- Bugbot findings after the usage limit issue is resolved.

## 12. Do Not Touch
Avoid these areas unless explicitly required:

- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not deploy to production from this branch.
- Do not force-push.
- Do not delete or weaken tests to make checks pass.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`) unless intentionally regenerating local artifacts and keeping them uncommitted.

## 13. Notes for Claude Code
Additional notes:

- This pass touched only shared saved-list logic and tests.
- The comparison remains read-only and compares company IDs, not individual field-level snapshot drift.
- The latest Bugbot runs remain blocked by Cursor usage/spend limit, not by a code finding.
- The standing goal remains active; do not mark it complete until live/staging concerns and remaining ETL/UX gaps are actually resolved.
