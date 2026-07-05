# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 13 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 13 with Codex as current owner and Claude Code as next owner. No Claude Code pass occurred before this continuation, so this remains a Loop 13 Codex continuation.
- Phase: Development / EDINET Numeric Fact Hardening / Verification / Handoff
- Last updated: 2026-07-06 03:41 +09:00

## 1. Current Goal
Current development objective:

- Continue improving the app toward the standing two-score goal:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear, dependable, and valuable for daily work
- This pass hardened EDINET XBRL extraction so raw numeric monetary facts such as `12,000,000` are treated as yen amounts instead of being dropped as unnormalized revenue.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed commit before this continuation: `c2ec398` (`Record Bugbot limit after EDINET extraction`).
- Latest implementation commit in this continuation: `774c19e` (`Handle numeric EDINET revenue facts`).
- Current implementation change in this continuation: EDINET revenue fact normalization now supports both existing Japanese unit strings and raw numeric XBRL monetary facts.
- Latest Bugbot-clean commit: `46622ee` (`Update handoff after quality fix push`).
- Last known good implementation state: `774c19e` after `npm run quality` passed.
- Handoff update for this continuation: this file update follows `774c19e`; check `git log --oneline -5` for the final handoff commit after commit/push.

## 3. What Was Done
Completed in this Codex continuation:

- Re-read `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`, current git status/log, and relevant EDINET extraction code/tests.
- Confirmed the repo was clean at the start of this continuation and already contained the previous EDINET ZIP/XBRL extraction work.
- Identified a remaining EDINET correctness gap:
  - `extractEdinetFactsFromXbrl` used `normalizeRevenueToJpy`, which handles unit strings such as `50億円`, but raw XBRL facts like `12,000,000` could normalize to `null`.
- Added `normalizeEdinetRevenueFact` in `src/lib/etl/edinet.ts`.
  - First preserves existing unit-string revenue normalization.
  - Falls back to treating comma-separated/plain numeric EDINET monetary facts as raw JPY.
  - Rejects non-numeric/non-finite values rather than inventing revenue.
- Added a deterministic unit test for raw numeric `OperatingRevenue` facts.
- Ran targeted EDINET tests, the full `npm run quality` gate, and `npm run etl:self-evaluate`.
- Committed the implementation as `774c19e`.

## 4. Files Changed
Main files changed:

- `src/lib/etl/edinet.ts`
  - Added EDINET-specific revenue fact normalization for raw numeric JPY values.
- `tests/etl.test.ts`
  - Added coverage for raw numeric `OperatingRevenue` extraction and revenue type selection.
- `AI_HANDOFF.md`
  - Updated this handoff.

## 5. Current Status
Current state:

- `npm run quality` is green locally.
- Unit/integration tests: 90 passed.
- E2E tests: 8 passed.
- Production build: passed.
- `npm run etl:self-evaluate` succeeded in mock mode with score 83 and `releaseReady: false`; this remains a data coverage/sample readiness signal, not a final production readiness score.
- This change is small, schema-free, and does not alter UI routes, saved-list persistence format, production data, or API contracts.
- The EDINET extraction path now handles the common XBRL case where monetary facts are already represented as raw yen numbers.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.
- Cursor Bugbot has not reviewed the latest heads after `46622ee` because recent attempts hit a Cursor usage/spend limit. Latest known blocked request ID remains `serverGenReqId_2e3d614e-b64e-4dc5-b526-d8693b72104c`.

## 6. Known Issues
Known issues:

- Cursor Bugbot review is pending for the latest pushed heads after `46622ee` until the Cursor usage/spend limit allows another run.
- Full live EDINET XBRL enrichment remains unverified against staging/prod Supabase and the live EDINET API; local deterministic extraction and numeric fact handling are implemented and tested.
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
- Latest blocked request ID: `serverGenReqId_2e3d614e-b64e-4dc5-b526-d8693b72104c`.
- This numeric EDINET continuation has not been reviewed by Bugbot yet because the user requested stopping at a good checkpoint and updating handoff documentation.

## 8. Verification Results
Verification commands and results:

```bash
npx vitest run tests/etl.test.ts --testNamePattern "EDINET"
# success: 6 EDINET-related tests passed, 84 skipped by testNamePattern

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 90 passed
# - test:coverage: success, 90 passed
# - test:e2e: success, 8 passed
# - build: success

npm run etl:self-evaluate
# success: mock-mode score 83, releaseReady false because Supabase/staging evidence is absent and mock jobs include failed/running examples

git commit -m "Handle numeric EDINET revenue facts"
# success: commit 774c19e; pre-commit/pre-push-style local hooks ran check:test-integrity, lint, and typecheck successfully
```

## 9. Current Scores
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 98 / 100
- Daily-use list-generation value score: 99 / 100

Score movement:

- Function score remains 98. This pass fixes a concrete EDINET extraction bug class, but live EDINET/Supabase smoke evidence and latest Bugbot review are still missing.
- Daily-use list value remains 99. This pass improves backend enrichment reliability more than direct list-generation UX.

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Live EDINET/Supabase enrichment smoke evidence is still missing.
- Some screens still need text/encoding polish for daily business usability.
- Latest implementation commits still need Bugbot review once the Cursor usage/spend limit allows it.

## 10. Next Recommended Action
Next first action for Claude Code:

1. Review `normalizeEdinetRevenueFact` and confirm treating raw numeric EDINET monetary facts as JPY is correct for the supported XBRL extraction path.
2. Rerun Cursor Bugbot on the latest pushed head once the Cursor usage/spend limit allows it.
3. If credentials are available, run a safe staging Supabase smoke with a real EDINET document/company and verify the observation is saved.
4. Confirm `npm run quality` if time allows.
5. If continuing without live credentials, harden EDINET fact extraction further around context/period selection or continue UI/README text polish.

## 11. Suggested Review Scope for Claude Code
Please review these areas first:

- `src/lib/etl/edinet.ts`
  - `normalizeEdinetRevenueFact`
  - `extractEdinetFactsFromXbrl`
  - whether raw numeric XBRL values require any future scaling/context handling beyond this current safe fallback
- `tests/etl.test.ts`
  - raw numeric `OperatingRevenue` coverage
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

- This continuation is schema-free.
- The new fallback is intentionally narrow: only comma-stripped plain numeric values are treated as raw JPY. Non-numeric text still returns `null`.
- EDINET XBRL attributes such as context and decimals are not yet modeled by `flattenFacts`; if live data reveals scaling/context ambiguity, add a targeted parser improvement and tests rather than weakening this normalization.
- `applyEdinetFacts` still writes through the existing store helpers, so live staging verification requires Supabase credentials and safe non-production data.
- `README.md` and some test output can display mojibake in this PowerShell session, but previous Node UTF-8 reads showed Japanese strings are present; any text polish should verify actual file encoding before editing.
- The standing goal remains active; do not mark it complete until live/staging concerns, EDINET completeness, latest Bugbot review, and remaining UX/text polish gaps are actually resolved.
