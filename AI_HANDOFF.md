# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 13 (continued, inferred)
- Loop number inferred from: The previous handoff marked Loop 13 and Next owner as Claude Code, but Codex continued directly from the active long-running goal before a Claude Code pass occurred. This remains a Loop 13 continuation.
- Phase: Development / CSV Import Row-Level Recovery / Verification / Handoff
- Last updated: 2026-07-06 02:08 +09:00

## 1. Current Goal
Current development objective:

- Continue improving the app toward the standing two-score goal:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear and dependable for daily work
- This pass focused on CSV upload recovery: users can now see which CSV rows need correction, not only aggregate error counts.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed commit before this pass: `dae45f2` (`Record Bugbot limit after CSV validation`).
- Current implementation change in this pass: CSV import preview row-level issue guidance.
- Latest Bugbot-clean commit: `46622ee` (`Update handoff after quality fix push`).
- Last known good state: current working tree after `npm run quality` passed.

## 3. What Was Done
Completed in this Codex continuation:

- Re-read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, current git status/log, and relevant CSV/list files.
- Read the relevant Next.js 16 docs for Server/Client Components and the `use client` directive before editing the client CSV preview component.
- Identified a workflow gap: CSV import preview showed aggregate counts for missing fields, duplicates, malformed corporate numbers, and invalid URLs, but did not show which rows users should fix.
- Added `CsvImportRowIssue` and `rowIssues` to the CSV preview result.
- Updated CSV parsing to attach row-level issues with CSV row numbers, corporate number, company name, and issue labels.
- Limited row-level issue output to the first 10 problem rows to keep the response and UI bounded.
- Updated the CSV preview UI to show a compact "修正が必要な行" section.
- Added/updated unit, API, and E2E assertions for row-level issue output.
- Ran the full local quality gate successfully.

## 4. Files Changed
Main files changed:

- `src/lib/csv-import-preview.ts`
  - Added `CsvImportRowIssue` and `rowIssues`.
- `src/lib/list-quality.ts`
  - Builds row-level CSV issue details while preserving existing aggregate metrics.
- `src/components/app/csv-import-preview.tsx`
  - Displays the first problem rows and their issue labels in the CSV preview result.
- `tests/etl.test.ts`
  - Covers row-level issues for duplicate corporate numbers, invalid URLs, missing required fields, malformed corporate numbers, and API response shape.
- `e2e/collector.spec.ts`
  - Confirms the CSV upload preview UI shows row-level recovery guidance.
- `AI_HANDOFF.md`
  - Updated this handoff.

## 5. Current Status
Current state:

- `npm run quality` is green locally.
- The change is focused and does not alter database schema, saved-list persistence, production data, or crawler behavior.
- Cursor Bugbot is clean for `46622ee`.
- Cursor Bugbot did not review the later heads because the most recent attempts hit a Cursor usage/spend limit.
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
- Current CSV row-level issue change: Bugbot not yet rerun.

## 8. Verification Results
Verification commands and results:

```bash
npm run typecheck
# success

npm run test
# success: quality guard passed; 82 tests passed

npm run lint
# success

npm run test:e2e -- --grep "list generation"
# success: 1 Playwright test passed

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 82 passed
# - test:coverage: success, 82 passed
# - test:e2e: success, 8 passed
# - build: success
```

## 9. Current Scores
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 96 / 100
- Daily-use list-generation value score: 95 / 100

Score movement:

- Daily-use score improved from 94 to 95 because CSV upload errors now provide row-level recovery guidance, reducing spreadsheet back-and-forth and making import cleanup faster.

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Full EDINET enrichment is not complete.
- Some screens still need text/encoding polish for daily business usability.
- More high-value list operations could still be added, such as saved-list comparison and stronger persisted history analytics.
- Latest implementation commits still need Bugbot review once usage limit allows it.

## 10. Next Recommended Action
Next first action for Claude Code:

1. Review the focused CSV row-level issue diff.
2. Rerun Cursor Bugbot on the latest pushed head once the Cursor usage/spend limit is raised or reset.
3. Confirm `npm run quality` if time allows.
4. Continue with one focused improvement toward the standing goal, preferably staging smoke readiness, EDINET extraction hardening, or another high-impact UI text polish pass.

## 11. Suggested Review Scope for Claude Code
Please review these areas first:

- Confirm `rowIssues` is acceptable as a backward-compatible API response extension.
- Confirm row numbers should be CSV-file row numbers with the header counted as row 1.
- Confirm limiting the issue list to the first 10 problem rows is reasonable for UI and response size.
- Confirm the CSV preview row-level section remains readable on desktop.
- Confirm Bugbot findings after the usage limit issue is resolved.

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

- This pass did not touch Next.js pages or route handlers; it changed shared CSV/list logic and one client component.
- The latest Bugbot runs remain blocked by Cursor usage/spend limit, not by a code finding.
- The standing goal remains active; do not mark it complete until live/staging concerns and remaining ETL/UX gaps are actually resolved.
