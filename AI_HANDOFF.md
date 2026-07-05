# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 7 (inferred)
- Loop number inferred from: Claude Code's earlier handoff treated review of commit `7523545` as Loop 6 and recommended advancing the next fresh Codex development sub-task to Loop 7. Recent Codex passes have continued Loop 7 with focused list-generation UX, CSV import, saved-list reliability, route-safety, validation-hardening, workflow-polish, and form-state-preservation improvements.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-05 21:57:47 +09:00

## 1. Current Goal
Current development purpose:
- Continue improving the existing Japan Company DB Collector toward:
  - all functions and screen transitions behaving as intended with no bugs or runtime errors
  - the list-generation workflow feeling fast, clear, and strong enough for daily business use
- This pass fixed a daily-use list-generation UX gap: after a preview is shown, link-based actions such as row exclusion, exclusion reset, and quality action filters now preserve the currently typed list name, purpose memo, and other visible form values instead of falling back to older URL/search-param state.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed baseline before this change set: `4fb9f56` (`Align list form length limits`)
- Last known good baseline before this change set: `4fb9f56`, verified locally and by GitHub Actions `quality-gate #70`

## 3. What Was Done
Completed in this pass:
- Re-read required project files (`AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`) and the Next.js forms guide before touching the list form workflow.
- Added `ListFormStateLink`, a small client-side progressive enhancement around `next/link`.
  - Normal link href remains as the no-JavaScript/fallback URL.
  - On ordinary left-click, it reads the current `/lists` form values, applies explicit patch/remove operations, and navigates with the current state preserved.
  - Modified-clicks, new-tab behavior, and non-`_self` targets are left to the browser/link default.
- Updated `/lists` quality action links to preserve current form values before applying the action filter.
- Updated row-level `除外` links to preserve current form values while appending the excluded company ID.
- Updated `除外をリセット` to preserve current form values while removing `excludedCompanyIds`.
- Added E2E assertions proving unsaved list name and purpose memo survive:
  - row exclusion
  - quality action filter application
- Kept reset/clear behavior otherwise unchanged.

## 4. Files Changed
Main changed files:
- `src/components/app/list-form-state-link.tsx`
- `src/app/lists/page.tsx`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

## 5. Current Status
Current state:
- Local full quality gate passed after the link-form-state preservation change.
- Unit/integration tests remain 75 tests and all pass.
- E2E remains 8 tests and all pass, including the new current-form-value preservation assertions.
- Coverage after this pass:
  - statements 71.87%
  - branches 63.36%
  - functions 86.95%
  - lines 75.92%
- No database schema, Supabase permissions, external API behavior, crawler behavior, deployment setting, or secret handling was changed.
- No secrets were read, printed, or committed. No production DB/API/deploy action was performed.
- Current self-assessment after this pass:
  - Function / screen transition / no-bug score: 99.35 / 100
  - Daily-use list-generation UX value score: 99.55 / 100
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

npx playwright test e2e/collector.spec.ts -g "list generation supports"
# success: 1 passed

npm run quality
# success: typecheck, lint, test integrity, unit/integration tests, coverage, E2E, and build all passed
# tests: 75 passed
# E2E: 8 passed
# coverage: statements 71.87%, branches 63.36%, functions 86.95%, lines 75.92%

npm run etl:self-evaluate
# success: mock data score 83; releaseReady false because Supabase/staging smoke is not configured and mock jobs include failed/running states

git diff --check
# success
```

## 9. Next Recommended Action
Next first action for Claude Code:
1. Review `ListFormStateLink` for link semantics, form-state handling, and accessibility.
2. Confirm quality action, row exclusion, and exclusion reset preserve current unsaved form values without changing no-JavaScript fallback URLs.
3. Run Cursor Bugbot on the pushed branch/PR diff using the 70 USD cap.
4. If Bugbot is clean, continue the next quality/UX loop. Best next candidate: add stronger validation/error specificity for list create/update failures so overlong/invalid description and invalid name are distinguishable in the UI.
5. If staging Supabase credentials are available, run `npm run smoke:staging` with isolated staging credentials before declaring production-readiness.

## 10. Suggested Review Scope for Claude Code
Areas to review closely:
- `src/components/app/list-form-state-link.tsx`: current form value preservation, modified-click fallback, patch/remove ordering.
- `src/app/lists/page.tsx`: usage for quality actions, row exclusion, exclusion reset.
- `e2e/collector.spec.ts`: regression assertions for unsaved list name and purpose memo preservation.
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
- Previous verified commit `4fb9f56` aligned list form text length limits across validation/UI/tests.
- Previous verified commit `cb5ad27` preserved manually excluded company IDs when saving/updating generated lists.
- Previous verified commit `ba951f2` made Save/Update submit the current visible list form values.
- Previous verified commit `5ef140c` tightened UUID-shaped ID validation across list/company/job flows.
- Previous verified commit `8986f79` validated company detail route IDs before Supabase lookup.
- Previous verified commit `a0f34f7` validated saved-list detail route IDs before Supabase lookup.
- This pass only preserves current form state for link-based list actions and adds E2E coverage. It does not add database writes or external service calls.
- GitHub Actions should be checked after this handoff commit is pushed.
