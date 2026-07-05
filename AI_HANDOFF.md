# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 7 (inferred)
- Loop number inferred from: Claude Code's earlier handoff treated review of commit `7523545` as Loop 6 and recommended advancing the next fresh Codex development sub-task to Loop 7. Recent Codex passes have continued Loop 7 with focused list-generation UX, CSV import, saved-list reliability, route-safety, validation-hardening, workflow-polish, form-state-preservation, error-specificity, and backend-failure recovery improvements.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-05 22:13:35 +09:00

## 1. Current Goal
Current development purpose:
- Continue improving the existing Japan Company DB Collector toward:
  - all functions and screen transitions behaving as intended with no bugs or runtime errors
  - the list-generation workflow feeling fast, clear, and strong enough for daily business use
- This pass improved list save/update failure recovery copy: backend operation failures now explicitly tell the user that input conditions are preserved and point to Supabase/RPC/saved-list permission checks before retrying.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed baseline before this change set: `1146790` (`Clarify saved list validation errors`)
- Last known good baseline before this change set: `1146790`, verified locally and by GitHub Actions `quality-gate`

## 3. What Was Done
Completed in this pass:
- Re-read the current repository state and the relevant list page/E2E files before editing.
- Updated `/lists` operation-failed alert copy so save/update backend failures are distinguishable from validation errors, missing criteria, and dry-run behavior.
- Added E2E coverage for `/lists?error=operation-failed` that verifies:
  - the backend-failure alert is visible
  - the alert says input conditions are preserved
  - Supabase configuration is named as a recovery area
  - the list name remains populated
  - the all-company preview still renders 4 rows
- Preserved the existing route flow, form structure, schema, Supabase behavior, crawler behavior, and external API behavior.

## 4. Files Changed
Main changed files:
- `src/app/lists/page.tsx`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

## 5. Current Status
Current state:
- Local full quality gate passed after the backend-failure recovery copy/E2E change.
- Unit/integration tests remain 76 tests and all pass.
- E2E remains 8 tests and all pass, including the new operation-failed recovery assertion.
- Coverage after this pass:
  - statements 72.16%
  - branches 63.47%
  - functions 87.05%
  - lines 76.19%
- `npm run etl:self-evaluate` still reports the development mock score as `83` and `releaseReady: false` because Supabase is unset and mock jobs include one failed and one running job.
- No database schema, Supabase permissions, external API behavior, crawler behavior, deployment setting, or secret handling was changed.
- No secrets were read, printed, or committed. No production DB/API/deploy action was performed.
- Current self-assessment after this pass:
  - Function / screen transition / no-bug score: 99.5 / 100
  - Daily-use list-generation UX value score: 99.65 / 100
  - Not 100 because Cursor Bugbot and real staging Supabase smoke remain unverified in this environment.

## 6. Known Issues
Known issues:
- Cursor Bugbot has not been run on this latest diff. The user shared that the Bugbot usage cap is now 70 USD.
- Real staging Supabase smoke verification has not been run locally because staging credentials are absent.
- `npm run verify` does not exist; `npm run quality` is the canonical local quality gate.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode because Supabase is unset and mock jobs include one failed and one running job.
- Coverage is useful but not exhaustive; `src/lib/store.ts`, Supabase integration paths, and live staging save/update/delete behavior remain lower-confidence areas.

## 7. Bugbot Findings
Cursor Bugbot findings and handling:
- Not run for this latest diff.
- No actionable Bugbot finding text exists in the repo.
- User update: Cursor Bugbot usage cap has been raised to 70 USD.
- Recommended next tool step: run Cursor Bugbot on the pushed branch/PR diff using the 70 USD usage cap. If findings appear, prioritize security/auth/data-integrity/runtime/build/test issues first.

## 8. Verification Results
Commands run and results:

```bash
git status --short --branch
# success: branch codex/permanent-quality-gate-governance, worktree initially clean

npm run typecheck
# success

npm run lint
# success

npx playwright test e2e/collector.spec.ts -g "list generation supports"
# success: 1 passed

npm run quality
# success: typecheck, lint, test integrity, unit/integration tests, coverage, E2E, and build all passed
# tests: 76 passed
# E2E: 8 passed
# coverage: statements 72.16%, branches 63.47%, functions 87.05%, lines 76.19%

npm run etl:self-evaluate
# success: mock data score 83; releaseReady false because Supabase/staging smoke is not configured and mock jobs include failed/running states

git diff --check
# success
```

## 9. Next Recommended Action
Next first action for Claude Code:
1. Review the new operation-failed `/lists` copy and E2E assertion for clarity and over-specificity.
2. Run Cursor Bugbot on the pushed branch/PR diff using the 70 USD cap.
3. If Bugbot is clean, continue the next quality/UX loop. Good next candidate: add route-level tests around create/update Supabase operation failures, using mocks that fail the persistence layer without touching production/staging data.
4. If staging Supabase credentials are available, run `npm run smoke:staging` with isolated staging credentials before declaring production-readiness.

## 10. Suggested Review Scope for Claude Code
Areas to review closely:
- `src/app/lists/page.tsx`: `operation-failed` copy in `ListNotice`.
- `e2e/collector.spec.ts`: operation-failed recovery assertion inside the list-generation flow.
- Confirm no unrelated list filter, saved-list, CSV import, crawler, Supabase, or schema behavior changed.

## 11. Do Not Touch
Do not touch:
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not delete, skip, weaken, or comment out tests to make checks pass.
- Do not rewrite the UI, routes, or data model broadly without an explicit product request.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`) unless intentionally regenerating local artifacts and keeping them uncommitted.
- Do not force-push or deploy to production from this branch.

## 12. Notes for Claude Code
Additional notes:
- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- The full quality gate is `npm run quality`.
- `npm run verify` is absent by design right now.
- Previous verified commit `1146790` clarified saved-list validation errors.
- Previous verified commit `c301115` preserved current list form state across quality actions, row exclusion, and exclusion reset.
- Previous verified commit `4fb9f56` aligned list form text length limits across validation/UI/tests.
- Previous verified commit `cb5ad27` preserved manually excluded company IDs when saving/updating generated lists.
- Previous verified commit `ba951f2` made Save/Update submit the current visible list form values.
- Previous verified commit `5ef140c` tightened UUID-shaped ID validation across list/company/job flows.
- This pass only improves backend-failure recovery copy for saved-list operations and adds regression coverage. It does not add database writes or external service calls.
- GitHub Actions should be checked after this handoff commit is pushed.
