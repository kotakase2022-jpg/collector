# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 13 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 13 with Codex as current owner and Claude Code as next owner. No Claude Code pass occurred before this continuation, so this remains a Loop 13 Codex continuation.
- Phase: Development / Saved List Comparison CSV Export / Verification / Handoff
- Last updated: 2026-07-06 03:21 +09:00

## 1. Current Goal
Current development objective:

- Continue improving the app toward the standing two-score goal:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear, dependable, and valuable for daily work
- This pass made saved-list comparison results portable by adding a dedicated CSV export API and a download button in the saved-list comparison UI.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed commit before this pass: `3ebffe1` (`Localize saved list comparison labels`).
- Latest implementation commit in this pass: `d6c3bd0` (`Add saved list comparison CSV export`).
- Current implementation change in this pass: added `/api/lists/compare-export`, CSV row generation for saved-list comparison diffs, a comparison CSV button on `/lists/[id]`, and unit/E2E coverage.
- Latest Bugbot-clean commit: `46622ee` (`Update handoff after quality fix push`).
- Last known good implementation state: `d6c3bd0` after `npm run quality` passed.
- Handoff update for this pass: documentation-only update after `d6c3bd0`; check `git log --oneline -5` for the final handoff commit.

## 3. What Was Done
Completed in this Codex continuation:

- Re-read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, current git status/log, and relevant Next.js Route Handler docs under `node_modules/next/dist/docs/`.
- Added saved-list comparison CSV support:
  - `SavedListComparisonExportRow`
  - `createSavedListComparisonCsv`
  - `buildSavedListComparisonExportRows`
  - `getSavedListComparisonExportRows`
- Added `GET /api/lists/compare-export`.
  - Validates `baseListId` and `targetListId`.
  - Rejects missing, invalid, or same-list IDs.
  - Returns UTF-8 CSV with comparison diff rows.
- Added a comparison CSV download button to `/lists/[id]` when a saved-list comparison result is visible.
- Added unit/integration coverage for comparison CSV row generation and API response behavior.
- Added E2E coverage for downloading the comparison CSV from the saved-list detail workflow and checking CSV contents.
- Ran the full quality gate successfully.

## 4. Files Changed
Main files changed:

- `src/lib/csv.ts`
  - Added saved-list comparison CSV row type and CSV creation helper.
- `src/lib/lists.ts`
  - Added comparison export row builder and async export row loader.
  - Allowed pair comparison preview limit to be passed through so export can include all diff rows.
- `src/app/api/lists/compare-export/route.ts`
  - Added dedicated comparison CSV export route.
- `src/app/lists/[id]/page.tsx`
  - Added comparison CSV export button.
- `tests/etl.test.ts`
  - Added comparison CSV row/API coverage.
- `e2e/collector.spec.ts`
  - Added comparison CSV download coverage.
- `AI_HANDOFF.md`
  - Updated this handoff.

## 5. Current Status
Current state:

- `npm run quality` is green locally.
- Unit/integration tests: 88 passed.
- E2E tests: 8 passed.
- Production build: passed and includes `/api/lists/compare-export`.
- The change is focused and does not alter DB schema, saved-list persistence format, crawler behavior, or production data.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.
- Cursor Bugbot has not reviewed the latest heads after `46622ee` because recent attempts hit a Cursor usage/spend limit. Latest blocked request ID remains `serverGenReqId_baf3e4cd-55d4-41b2-a934-1554696d0027`.

## 6. Known Issues
Known issues:

- Cursor Bugbot review is pending for the latest pushed heads after `46622ee` until the Cursor usage/spend limit is raised or resets.
- Full EDINET XBRL download/extraction remains unimplemented; current behavior intentionally fails EDINET jobs when no facts are applied.
- Real staging Supabase smoke verification was not run because staging credentials were not provided.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` reports mock-mode/staging-smoke readiness limitations when Supabase evidence is absent.
- Coverage remains useful but not exhaustive, especially around live Supabase integration paths.
- Some UI text and mock data in other screens still deserve a language/encoding polish pass.
- Supabase cannot natively trim whitespace in the simple `hasCorporateNumber=no` PostgREST filter; ingestion should ideally normalize whitespace-only corporate numbers to `null` or reject them in a future hardening task.

## 7. Bugbot Findings
Cursor Bugbot findings and status:

- `f5ae483`: `Corporate number filter mismatch` (Medium) - fixed in Loop 11.
- `b89261f`: `Whitespace corporate number quality mismatch` (Medium) - fixed in Loop 12.
- `46622ee`: Bugbot rerun result: no new issues.
- Several later Bugbot reruns were attempted after pushes but Cursor returned usage/spend limit failures instead of reviews.
- Latest blocked request ID after `f225efc`: `serverGenReqId_baf3e4cd-55d4-41b2-a934-1554696d0027`.
- This pass has not been reviewed by Bugbot yet because recent reruns were blocked by the Cursor usage/spend limit.

## 8. Verification Results
Verification commands and results:

```bash
npm run typecheck
# success

npm run lint
# success

npm run test
# success: quality guard passed; 88 tests passed

npm run test:e2e
# success: 8 passed

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 88 passed
# - test:coverage: success, 88 passed
# - test:e2e: success, 8 passed
# - build: success
```

## 9. Current Scores
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 97 / 100
- Daily-use list-generation value score: 99 / 100

Score movement:

- Function score remains 97 because live/staging verification, EDINET completeness, and latest Bugbot review are still unresolved despite local quality being green.
- Daily-use list value increases from 98 to 99 because saved-list comparison results can now be exported as CSV and used outside the app in spreadsheet/business workflows.

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Full EDINET enrichment is not complete.
- Some screens still need text/encoding polish for daily business usability.
- Latest implementation commits still need Bugbot review once usage limit allows it; latest blocked request ID is `serverGenReqId_baf3e4cd-55d4-41b2-a934-1554696d0027`.

## 10. Next Recommended Action
Next first action for Claude Code:

1. Review `/api/lists/compare-export` validation and CSV columns.
2. Review the E2E selector for comparison CSV download to ensure it is strong enough without being brittle.
3. Rerun Cursor Bugbot on the latest pushed head once the Cursor usage/spend limit is raised or reset.
4. Confirm `npm run quality` if time allows.
5. If continuing implementation, prioritize staging smoke readiness, EDINET extraction hardening, or broader UI/README text polish.

## 11. Suggested Review Scope for Claude Code
Please review these areas first:

- `createSavedListComparisonCsv` and CSV formula-injection sanitization reuse.
- `buildSavedListComparisonExportRows` ordering and field coverage.
- `/api/lists/compare-export` error behavior for missing, invalid, same-list, and not-found IDs.
- `/lists/[id]` comparison CSV button placement.
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

- This pass is schema-free and read-only.
- The comparison export uses the full diff by calling pair comparison with `Number.MAX_SAFE_INTEGER` as the preview limit.
- `README.md` still displays mojibake in this PowerShell session and should be handled as a separate, careful text polish task.
- The standing goal remains active; do not mark it complete until live/staging concerns, EDINET completeness, latest Bugbot review, and remaining UX/text polish gaps are actually resolved.
