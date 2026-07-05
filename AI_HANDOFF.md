# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 13 (continued, inferred)
- Loop number inferred from: The previous handoff marked Loop 13 and Codex continued directly from the active long-running goal before a Claude Code pass occurred. This remains a Loop 13 continuation.
- Phase: Handoff / Saved List Field Change Comparison / Bugbot Limit Recorded
- Last updated: 2026-07-06 02:46 +09:00

## 1. Current Goal
Current development objective:

- Continue improving the app toward the standing two-score goal:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear, dependable, and valuable for daily work
- This pass improved saved-list reuse by showing retained-company field changes in the saved-list regeneration comparison, not only added/removed company IDs.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed implementation commit: `ec6ceb2` (`Show saved list field changes`).
- Current implementation change in this pass: saved-list detail comparison now reports field-level value changes for retained companies.
- Latest Bugbot-clean commit: `46622ee` (`Update handoff after quality fix push`).
- Last known good state: current working tree after `npm run quality` passed.
- Handoff-only commit for the latest Bugbot-limit note: pending at the time this file was edited; check `git log --oneline -5` after commit.

## 3. What Was Done
Completed in this Codex continuation:

- Re-read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, and current git status/log.
- Reviewed saved-list comparison as the next external-state-free improvement toward the standing UX/functionality goal.
- Added retained-company field-change detection to saved-list comparison for `official_url`, `industry`, `employee_count`, `employee_count_type`, `annual_revenue`, `annual_revenue_type`, and `data_confidence_score`.
- Added `changedCount` and `changedCompanies` to the saved-list comparison result.
- Updated the saved-list detail page to show a `値変更` metric and a short field-change preview alongside added/removed candidates.
- Added unit coverage for field-change detection and comparison output.
- Updated E2E coverage to assert the saved-list detail regeneration check exposes the new `値変更` signal.
- Ran `npm run typecheck`, `npm run test`, `npm run quality`, and `npm run etl:self-evaluate`.
- Committed and pushed `ec6ceb2` (`Show saved list field changes`).
- Reran Cursor Bugbot after `ec6ceb2`; Cursor returned a usage/spend limit failure instead of a review.

## 4. Files Changed
Main files changed:

- `src/lib/lists.ts`
  - Added field-change comparison types and logic for retained companies.
- `src/app/lists/[id]/page.tsx`
  - Shows `値変更` count and a compact field-change preview in the regeneration check.
- `tests/etl.test.ts`
  - Added behavior-level coverage for retained-company field changes.
- `e2e/collector.spec.ts`
  - Checks that saved-list detail exposes the `値変更` comparison signal.
- `AI_HANDOFF.md`
  - Updated this handoff.

## 5. Current Status
Current state:

- `npm run quality` is green locally.
- The change is focused and does not alter DB schema, saved-list persistence format, crawler behavior, or production data.
- `npm run etl:self-evaluate` runs successfully in mock mode, with release readiness still false due missing Supabase/staging evidence and mock failed/running jobs.
- Cursor Bugbot is clean for `46622ee`.
- Cursor Bugbot has not reviewed the latest heads after `46622ee` because recent attempts hit a Cursor usage/spend limit.
- Latest pushed implementation commit is `ec6ceb2`; this handoff update records the post-push Bugbot limit result.
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
- `c4c62fe`: Bugbot rerun attempted after push, but Cursor again returned a usage/spend limit failure instead of a review.
  - Request ID: `serverGenReqId_fccaecbd-df6f-4a87-9f6f-d6b7e4cda8e7`.
- `a5d16c6`: Bugbot rerun attempted after push, but Cursor again returned a usage/spend limit failure instead of a review.
  - Request ID: `serverGenReqId_a41348c2-549d-485b-a9b5-dee2b476bd3d`.
- `ec6ceb2`: Bugbot rerun attempted after push, but Cursor again returned a usage/spend limit failure instead of a review.
  - Request ID: `serverGenReqId_e561574e-edbb-430b-b12e-5c3d282c1f72`.

## 8. Verification Results
Verification commands and results:

```bash
npm run typecheck
# success

npm run test
# success: quality guard passed; 85 tests passed

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 85 passed
# - test:coverage: success, 85 passed
# - test:e2e: success, 8 passed
# - build: success

npm run etl:self-evaluate
# success: dataMode=mock, score=83, releaseReady=false because Supabase/staging evidence is absent and mock jobs include running/failed states

git push origin codex/permanent-quality-gate-governance
# success: pushed `ec6ceb2` (`Show saved list field changes`)
```

## 9. Current Scores
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 96 / 100
- Daily-use list-generation value score: 97 / 100

Score movement:

- Function score remains unchanged because live/staging verification, EDINET completeness, and latest Bugbot review are still unresolved.
- Daily-use list value increases from 96 to 97 because saved-list reuse is now more trustworthy: users can see retained-company field changes, not only added/removed rows.

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Full EDINET enrichment is not complete.
- Some screens still need text/encoding polish for daily business usability.
- More high-value list operations could still be added, such as true list-to-list comparison and stronger persisted history analytics.
- Latest implementation commits still need Bugbot review once usage limit allows it; latest blocked request ID is `serverGenReqId_e561574e-edbb-430b-b12e-5c3d282c1f72`.

## 10. Next Recommended Action
Next first action for Claude Code:

1. Review the saved-list field-change comparison and confirm the UI preview remains clear on desktop.
2. Rerun Cursor Bugbot on the latest pushed head once the Cursor usage/spend limit is raised or reset.
3. Confirm `npm run quality` if time allows.
4. Continue with one focused improvement toward the standing goal, preferably staging smoke readiness, EDINET extraction hardening, UI text polish, or true list-to-list comparison.

## 11. Suggested Review Scope for Claude Code
Please review these areas first:

- `buildSavedCompanyListFieldChanges` and its selected comparison fields.
- Saved-list detail `値変更` display for readability and truncation.
- Regression risk around existing saved-list comparison counts.
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

- This pass touched saved-list comparison logic, saved-list detail UI, unit tests, E2E tests, and this handoff.
- The comparison remains read-only and now includes both ID-level drift and selected field-level snapshot drift.
- The latest Bugbot runs remain blocked by Cursor usage/spend limit, not by a code finding.
- The standing goal remains active; do not mark it complete until live/staging concerns and remaining ETL/UX gaps are actually resolved.
