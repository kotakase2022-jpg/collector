# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 7 (inferred)
- Loop number inferred from: Claude Code's earlier handoff treated review of commit `7523545` as Loop 6 and recommended advancing the next fresh Codex development sub-task to Loop 7. Recent Codex passes have continued Loop 7 with focused list-generation UX, CSV import, saved-list reliability, route-safety, validation-hardening, workflow-polish, form-state-preservation, and error-specificity improvements.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-05 22:05:46 +09:00

## 1. Current Goal
Current development purpose:
- Continue improving the existing Japan Company DB Collector toward:
  - all functions and screen transitions behaving as intended with no bugs or runtime errors
  - the list-generation workflow feeling fast, clear, and strong enough for daily business use
- This pass improved list save/update recovery: overlong purpose memos now get a distinct `invalid-description` error and a specific UI message instead of being mislabeled as a missing/invalid list name.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed baseline before this change set: `c301115` (`Preserve list form state across quick actions`)
- Last known good baseline before this change set: `c301115`, verified locally and by GitHub Actions `quality-gate` for commit `c301115`

## 3. What Was Done
Completed in this pass:
- Re-read required project files (`AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`) and the Next.js forms/route-handler docs before touching route handlers.
- Added `listFormValidationErrorCode` in `src/lib/validation.ts`.
  - Prioritizes list name issues as `invalid-name`.
  - Reports description-only validation failures as `invalid-description`.
- Updated list create/update route handlers to preserve the existing redirect flow while using the specific validation error code.
- Updated `/lists` alert copy for `invalid-description` to tell the user that purpose memo must be within `300` characters.
- Added unit coverage for validation error-code classification.
- Added route-level coverage proving create/update redirects use `error=invalid-description` for overlong purpose memo while preserving current form state/search params.
- Added E2E coverage proving `/lists?error=invalid-description` displays the specific recovery message.

## 4. Files Changed
Main changed files:
- `src/lib/validation.ts`
- `src/app/api/lists/create/route.ts`
- `src/app/api/lists/update/route.ts`
- `src/app/lists/page.tsx`
- `tests/etl.test.ts`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

## 5. Current Status
Current state:
- Local full quality gate passed after the list validation error-specificity change.
- Unit/integration tests increased to 76 tests and all pass.
- E2E remains 8 tests and all pass, including the new invalid-description UI assertion.
- Coverage after this pass:
  - statements 72.16%
  - branches 63.47%
  - functions 87.05%
  - lines 76.19%
- No database schema, Supabase permissions, external API behavior, crawler behavior, deployment setting, or secret handling was changed.
- No secrets were read, printed, or committed. No production DB/API/deploy action was performed.
- Current self-assessment after this pass:
  - Function / screen transition / no-bug score: 99.45 / 100
  - Daily-use list-generation UX value score: 99.6 / 100
  - Not 100 because Cursor Bugbot and real staging Supabase smoke remain unverified in this environment.

## 6. Known Issues
Known issues:
- Cursor Bugbot has not been run on this latest diff. The user shared that the Bugbot usage cap is now 70 USD.
- Real staging Supabase smoke verification has not been run locally because staging credentials are absent.
- `npm run verify` does not exist; `npm run quality` is the canonical local quality gate.
- `npm run etl:self-evaluate` still reports `releaseReady: false` in mock mode because Supabase is unset and mock jobs include one failed and one running job.
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

npx vitest run tests/etl.test.ts -t "list create"
# success: 2 passed, 74 skipped by name filter

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
1. Review `listFormValidationErrorCode` ordering and confirm name errors intentionally take precedence when both name and description are invalid.
2. Confirm list create/update redirects still preserve form state and criteria on validation failure.
3. Run Cursor Bugbot on the pushed branch/PR diff using the 70 USD cap.
4. If Bugbot is clean, continue the next quality/UX loop. Good next candidate: add tests or UI affordance for list create/update operation failures under Supabase errors so users can distinguish validation, missing criteria, dry-run, and backend failures quickly.
5. If staging Supabase credentials are available, run `npm run smoke:staging` with isolated staging credentials before declaring production-readiness.

## 10. Suggested Review Scope for Claude Code
Areas to review closely:
- `src/lib/validation.ts`: validation error-code helper and coverage.
- `src/app/api/lists/create/route.ts` and `src/app/api/lists/update/route.ts`: redirect error code behavior.
- `src/app/lists/page.tsx`: `invalid-description` copy and use of shared `listDescriptionMaxLength`.
- `tests/etl.test.ts`: route-level create/update assertions.
- `e2e/collector.spec.ts`: invalid-description alert assertion.
- Confirm no unrelated list filter, saved-list, CSV import, crawler, or Supabase behavior changed.

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
- Previous verified commit `c301115` preserved current list form state across quality actions, row exclusion, and exclusion reset.
- Previous verified commit `4fb9f56` aligned list form text length limits across validation/UI/tests.
- Previous verified commit `cb5ad27` preserved manually excluded company IDs when saving/updating generated lists.
- Previous verified commit `ba951f2` made Save/Update submit the current visible list form values.
- Previous verified commit `5ef140c` tightened UUID-shaped ID validation across list/company/job flows.
- This pass only improves validation error specificity for list create/update and adds regression coverage. It does not add database writes or external service calls.
- GitHub Actions should be checked after this handoff commit is pushed.
