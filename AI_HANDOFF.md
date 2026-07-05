# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 13 (continued, inferred)
- Loop number inferred from: The previous handoff marked Loop 13 and Codex continued directly from the active long-running goal before a Claude Code pass occurred. This remains a Loop 13 continuation.
- Phase: Development / Saved List Comparison Count Correction / Verification / Handoff
- Last updated: 2026-07-06 02:49 +09:00

## 1. Current Goal
Current development objective:

- Continue improving the app toward the standing two-score goal:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear, dependable, and valuable for daily work
- This pass corrected saved-list comparison semantics so `unchangedCount` means retained companies with no selected field changes, after the prior pass added retained-company field-change detection.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed commit before this pass: `aabc5ee` (`Record Bugbot limit after field comparison`).
- Current implementation change in this pass: saved-list comparison now counts unchanged retained companies separately from retained companies with selected field changes.
- Latest Bugbot-clean commit: `46622ee` (`Update handoff after quality fix push`).
- Last known good state: current working tree after `npm run quality` passed.
- Implementation/handoff commit for this pass: pending at the time this file was edited; check `git log --oneline -5` after commit.

## 3. What Was Done
Completed in this Codex continuation:

- Re-read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, and current git status/log.
- Reviewed the saved-list comparison count semantics after field-change comparison was added.
- Fixed `buildSavedCompanyListComparison` so `unchangedCount` excludes retained companies whose selected fields changed.
- Updated the regression test so a retained company with URL/revenue/confidence changes has `changedCount: 1` and `unchangedCount: 0`.
- Ran `npm run typecheck`, `npm run test`, and `npm run quality` successfully.

## 4. Files Changed
Main files changed:

- `src/lib/lists.ts`
  - Corrected `unchangedCount` to count only retained companies without selected field changes.
- `tests/etl.test.ts`
  - Updated saved-list field-change regression expectations.
- `AI_HANDOFF.md`
  - Updated this handoff.

## 5. Current Status
Current state:

- `npm run quality` is green locally.
- The change is focused and does not alter DB schema, saved-list persistence format, crawler behavior, or production data.
- Cursor Bugbot is clean for `46622ee`.
- Cursor Bugbot has not reviewed the latest heads after `46622ee` because recent attempts hit a Cursor usage/spend limit.
- Latest pushed commit before this pass is `aabc5ee`; this pass is ready to commit and push after this handoff update.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

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
- Latest blocked request ID: `serverGenReqId_e561574e-edbb-430b-b12e-5c3d282c1f72`.

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
```

## 9. Current Scores
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 96 / 100
- Daily-use list-generation value score: 97 / 100

Score movement:

- Function score remains unchanged because live/staging verification, EDINET completeness, and latest Bugbot review are still unresolved.
- Daily-use list value remains 97. This pass prevents misleading saved-list comparison counts but does not add a new user-facing workflow.

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Full EDINET enrichment is not complete.
- Some screens still need text/encoding polish for daily business usability.
- More high-value list operations could still be added, such as true list-to-list comparison and stronger persisted history analytics.
- Latest implementation commits still need Bugbot review once usage limit allows it; latest blocked request ID is `serverGenReqId_e561574e-edbb-430b-b12e-5c3d282c1f72`.

## 10. Next Recommended Action
Next first action for Claude Code:

1. Review the saved-list comparison count semantics, especially `unchangedCount` versus `changedCount`.
2. Rerun Cursor Bugbot on the latest pushed head once the Cursor usage/spend limit is raised or reset.
3. Confirm `npm run quality` if time allows.
4. Continue with one focused improvement toward the standing goal, preferably staging smoke readiness, EDINET extraction hardening, UI text polish, or true list-to-list comparison.

## 11. Suggested Review Scope for Claude Code
Please review these areas first:

- `buildSavedCompanyListComparison` retained-company count semantics.
- `buildSavedCompanyListFieldChanges` and its selected comparison fields.
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

- This pass touched only saved-list comparison logic, unit expectations, and this handoff.
- The comparison remains read-only and includes both ID-level drift and selected field-level snapshot drift.
- The latest Bugbot runs remain blocked by Cursor usage/spend limit, not by a code finding.
- The standing goal remains active; do not mark it complete until live/staging concerns and remaining ETL/UX gaps are actually resolved.
