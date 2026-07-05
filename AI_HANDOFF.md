# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 13 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 13 with Codex as current owner and Claude Code as next owner. No Claude Code pass occurred before this continuation, so this remains a Loop 13 Codex continuation.
- Phase: Development / Saved List Pair Comparison UI / Verification / Handoff
- Last updated: 2026-07-06 03:04 +09:00

## 1. Current Goal
Current development objective:

- Continue improving the app toward the standing two-score goal:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear, dependable, and valuable for daily work
- This pass connected the previously added saved-list pair comparison foundation to the saved list detail screen so users can compare one saved list against another saved list without changing DB schema or saved-list storage.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed commit before this pass: `a93ea30` (`Add saved list pair comparison`).
- Current implementation change in this pass: saved list detail page now has a "Saved list comparison" form that compares the current saved list with another saved list and displays base/target counts, changed companies, added companies, and removed companies.
- Latest Bugbot-clean commit: `46622ee` (`Update handoff after quality fix push`).
- Last known good state: current working tree after `npm run quality` passed.
- Implementation/handoff commit for this pass: pending at the time this file was edited; check `git log --oneline -5` after commit.

## 3. What Was Done
Completed in this Codex continuation:

- Re-read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, current git status/log, and relevant Next.js docs under `node_modules/next/dist/docs/`.
- Added `getSavedCompanyListPairComparison(baseId, targetId)` to load two saved list snapshots and compare them safely.
- Added a saved-list-to-saved-list comparison panel on `/lists/[id]`.
- The panel:
  - lists other saved lists as comparison targets
  - rejects same-list/self comparison with a clear error
  - shows base/target counts plus changed/added/removed counts
  - reuses existing changed/added/removed preview components
- Added unit coverage for loading saved list pair comparisons in mock/Supabase-unconfigured mode.
- Added E2E coverage for selecting another saved list, submitting the comparison form, seeing comparison results, and recovering from same-list comparison.
- Ran the full quality gate successfully.

## 4. Files Changed
Main files changed:

- `src/lib/lists.ts`
  - Added async saved-list pair comparison loader.
- `src/app/lists/[id]/page.tsx`
  - Added saved-list comparison UI and result rendering.
- `tests/etl.test.ts`
  - Added mock-mode saved-list pair comparison test.
- `e2e/collector.spec.ts`
  - Added saved-list comparison workflow coverage.
- `AI_HANDOFF.md`
  - Updated this handoff.

## 5. Current Status
Current state:

- `npm run quality` is green locally.
- Unit/integration tests: 87 passed.
- E2E tests: 8 passed.
- Production build: passed.
- The change is focused and does not alter DB schema, saved-list persistence format, crawler behavior, or production data.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.
- Cursor Bugbot has not reviewed the latest heads after `46622ee` because recent attempts hit a Cursor usage/spend limit.

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
- Latest blocked request ID: `serverGenReqId_bbe47ffd-cf8b-43e3-9dc9-18925fabb9ce`.
- This pass has not been reviewed by Bugbot yet.

## 8. Verification Results
Verification commands and results:

```bash
npm run typecheck
# success

npm run lint
# success

npm run test
# success: quality guard passed; 87 tests passed

npm run test:e2e
# success: 8 passed

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 87 passed
# - test:coverage: success, 87 passed
# - test:e2e: success, 8 passed
# - build: success
```

Note: an initial local attempt used `npm run typecheck && npm run lint && npm run test` directly in this PowerShell session and failed before running checks because this shell version did not accept `&&`. The checks were then run individually and via `npm run quality` successfully.

## 9. Current Scores
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 97 / 100
- Daily-use list-generation value score: 98 / 100

Score movement:

- Function score increased from 96 to 97 because the new saved-list comparison screen path is implemented and covered by unit + E2E + full quality gate.
- Daily-use list value increased from 97 to 98 because users can now compare saved lists directly, making saved-list reuse and change review more useful in daily list operations.

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Full EDINET enrichment is not complete.
- Some screens still need text/encoding polish for daily business usability.
- Latest implementation commits still need Bugbot review once usage limit allows it.
- Saved-list comparison is now user-facing, but there is not yet a dedicated export/API artifact for pair-comparison reports.

## 10. Next Recommended Action
Next first action for Claude Code:

1. Review the saved-list comparison UI on `/lists/[id]`, especially the self-comparison handling and whether the English labels should be localized/polished alongside the broader text pass.
2. Rerun Cursor Bugbot on the latest pushed head once the Cursor usage/spend limit is raised or reset.
3. Confirm `npm run quality` if time allows.
4. If continuing implementation, either:
   - add a small export/API surface for saved-list comparison results, or
   - continue staging smoke readiness / EDINET extraction hardening / UI text polish.

## 11. Suggested Review Scope for Claude Code
Please review these areas first:

- `getSavedCompanyListPairComparison` null behavior and snapshot-loading semantics.
- `/lists/[id]` comparison form behavior, including invalid/self comparison and no-target state.
- E2E coverage around saved-list comparison and whether it is strict enough without being brittle.
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

- This pass intentionally kept the feature server-rendered and schema-free.
- `README.md` still displays mojibake in this PowerShell session and should be handled as a separate, careful text polish task.
- The saved-list pair comparison helper remains pure/composable; the new async loader only fetches snapshots and delegates to the existing helper.
- The standing goal remains active; do not mark it complete until live/staging concerns, EDINET completeness, latest Bugbot review, and remaining UX/text polish gaps are actually resolved.
