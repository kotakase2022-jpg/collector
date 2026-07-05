# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 13 (continued, inferred)
- Loop number inferred from: The previous handoff also marked Loop 13 and Next owner as Claude Code, but Codex continued work directly from the active goal before a Claude Code pass occurred. This keeps the same loop number and records the extra Codex improvement as a Loop 13 continuation.
- Phase: Development / CSV Import Corporate Number Validation / Verification / Handoff
- Last updated: 2026-07-06 02:02 +09:00

## 1. Current Goal
Current development objective:

- Continue improving the app toward the standing two-score goal:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear and dependable for daily work
- This pass focused on making CSV upload preview safer for daily list generation by detecting malformed corporate numbers before users rely on imported rows.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed commit before this pass: `94f792c` (`Record Bugbot usage limit handoff`).
- Current implementation change ready to commit: CSV import preview corporate-number validation.
- Latest Bugbot-clean commit: `46622ee` (`Update handoff after quality fix push`).
- Last known good state: current working tree after `npm run quality` passed.

## 3. What Was Done
Completed in this Codex continuation:

- Re-read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, current git status/log, and relevant CSV/list files.
- Identified a list-generation reliability gap: CSV import preview detected missing required fields, duplicate corporate numbers, and invalid URLs, but did not flag non-empty malformed corporate numbers.
- Added `invalidCorporateNumberCount` to the CSV import preview result.
- Updated CSV readiness issue generation so malformed corporate numbers appear as a visible warning item.
- Updated CSV preview parsing to:
  - treat non-empty values that cannot normalize to a 13-digit corporate number as invalid rows
  - count malformed corporate-number rows separately from missing required fields
  - normalize corporate numbers before duplicate detection, so equivalent formatted values are detected as duplicates
  - continue allowing formatted values that normalize to 13 digits
- Updated the CSV import preview UI to display the new corporate-number-invalid metric.
- Added/updated unit and E2E assertions for the new validation and UI metric.
- Ran the full local quality gate successfully.

## 4. Files Changed
Main files changed:

- `src/lib/csv-import-preview.ts`
  - Added `invalidCorporateNumberCount` to the preview type and readiness issue list.
- `src/lib/list-quality.ts`
  - Validates and normalizes corporate numbers during CSV preview.
  - Uses normalized corporate numbers for duplicate detection.
- `src/components/app/csv-import-preview.tsx`
  - Displays the new malformed-corporate-number metric.
- `tests/etl.test.ts`
  - Covers malformed corporate numbers, normalized duplicate detection, and API response shape.
- `e2e/collector.spec.ts`
  - Confirms the CSV upload preview UI displays the new corporate-number-invalid metric.
- `AI_HANDOFF.md`
  - Updated this handoff.

## 5. Current Status
Current state:

- `npm run quality` is green locally.
- The change is focused and does not alter database schema, saved-list behavior, or production data.
- Cursor Bugbot is clean for `46622ee`.
- Cursor Bugbot did not review the later heads because the most recent attempt hit a Cursor usage/spend limit.
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
  - Cursor message: `Bugbot couldn't run - usage limit reached`.
  - Request ID: `serverGenReqId_46a1e392-7e64-4d9b-9325-a86ec3c37961`.
- Latest CSV import preview validation change: Bugbot not yet rerun.

## 8. Verification Results
Verification commands and results:

```bash
npm run typecheck
# success

npm run test -- --runInBand
# failed: Vitest does not support the Jest-only --runInBand option. This was an agent command error, not an app failure.

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
- Daily-use list-generation value score: 94 / 100

Score movement:

- Daily-use score improved from 93 to 94 because CSV upload preview now catches malformed corporate numbers and equivalent formatted duplicates before users act on imported list data.

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Full EDINET enrichment is not complete.
- Some screens still need text/encoding polish for daily business usability.
- More high-value list operations could still be added, such as saved-list comparison and stronger persisted history analytics.
- Latest implementation commits still need Bugbot review once usage limit allows it.

## 10. Next Recommended Action
Next first action for Claude Code:

1. Review the focused CSV import preview validation diff.
2. Rerun Cursor Bugbot on the latest pushed head once the Cursor usage/spend limit is raised or reset.
3. Confirm `npm run quality` if time allows.
4. Continue with one focused improvement toward the standing goal, preferably staging smoke readiness, EDINET extraction hardening, or another high-impact UI text polish pass.

## 11. Suggested Review Scope for Claude Code
Please review these areas first:

- Confirm that corporate-number validation accepts formatted values that normalize to 13 digits and rejects non-empty malformed values.
- Confirm duplicate detection should use normalized corporate numbers rather than raw CSV cell text.
- Confirm the added `invalidCorporateNumberCount` field is acceptable as a backward-compatible API response extension.
- Confirm the CSV preview metric layout remains readable on desktop.
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

- This pass did not touch Next.js route/page conventions; it changed shared CSV/list logic and one client component.
- The failed `npm run test -- --runInBand` entry is intentionally recorded for transparency. The correct `npm run test` and full `npm run quality` both passed afterward.
- The latest Bugbot run remains blocked by Cursor usage/spend limit, not by a code finding.
- The standing goal remains active; do not mark it complete until live/staging concerns and remaining ETL/UX gaps are actually resolved.
