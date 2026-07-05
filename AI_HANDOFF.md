# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 7 (inferred)
- Loop number inferred from: Claude Code's earlier handoff treated review of commit `7523545` as Loop 6 and recommended advancing the next fresh Codex development sub-task to Loop 7. Recent Codex passes have continued Loop 7 with focused list-generation UX, CSV import, saved-list reliability, route-safety, validation-hardening, workflow-polish, form-state-preservation, error-specificity, backend-failure recovery, route-level failure-regression coverage, delete-failure recovery, and Bugbot spending-cap handoff updates.
- Phase: Handoff
- Last updated: 2026-07-05 22:39:38 +09:00

## 1. Current Goal
Current development purpose:
- Continue improving the existing Japan Company DB Collector toward:
  - all functions and screen transitions behaving as intended with no bugs or runtime errors
  - the list-generation workflow feeling fast, clear, and strong enough for daily business use
- Latest completed code pass tightened saved-list delete failure safety:
  - delete route handling is now testable via dependency injection
  - persistence failures redirect with `error=operation-failed`
  - failed deletes do not revalidate list paths as though deletion had succeeded
- This handoff-only pass was started because Codex credit was close to exhaustion. No new implementation work was started after commit `5ba1000`.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit: `5ba1000` (`Cover saved list delete failure recovery`)
- Last known good commit: `5ba1000`, verified locally and by GitHub Actions `quality-gate`

## 3. What Was Done
Completed in the latest code pass:
- Re-read required project files (`AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `README.md`, `package.json`) and the Next.js route-handler docs before touching route handlers.
- Added `deleteListRedirect` in `src/app/api/lists/delete/route.ts`, matching the route-helper pattern used by create/update and run-next route tests.
- Kept the public `POST` route handler behavior unchanged; `POST` delegates to the helper with default dependencies.
- Added a route-level regression test that injects a failing delete persistence function and verifies:
  - delete response is `303`
  - redirect returns to `/lists`
  - `error=operation-failed` is set
  - `revalidateAppPath` is not called after delete failure
- Updated `/lists` operation-failed copy from save-only wording to list-operation wording so delete failures do not display an inaccurate save-only message.
- Updated the E2E assertion for the operation-failed alert to match the more general list-operation copy.
- Preserved schema, Supabase RPC payloads, crawler behavior, and external API behavior.

Completed in this handoff pass:
- Confirmed the branch is clean and synced with origin at `5ba1000`.
- Re-read `AGENTS.md`, `CLAUDE.md`, and `AI_HANDOFF.md`.
- Left `AGENTS.md` and `CLAUDE.md` unchanged because their alternating Codex / Claude Code loop instructions are current.
- Updated this `AI_HANDOFF.md` so Claude Code can resume without rediscovering context.

## 4. Files Changed
Main changed files in latest code pass:
- `src/app/api/lists/delete/route.ts`
- `src/app/lists/page.tsx`
- `tests/etl.test.ts`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

Files changed in this handoff-only pass:
- `AI_HANDOFF.md`

## 5. Current Status
Current state:
- Branch is `codex/permanent-quality-gate-governance`.
- Latest pushed implementation commit is `5ba1000`.
- Local full quality gate passed after the delete failure recovery regression test.
- GitHub Actions `quality-gate` passed for commit `5ba1000`.
- Unit/integration tests are at 78 tests and all pass.
- E2E remains 8 tests and all pass.
- Coverage after the latest code pass:
  - statements 72.8%
  - branches 63.56%
  - functions 87.2%
  - lines 76.94%
- `src/app/api/lists/delete/route.ts` is covered at 100% statements/functions/lines, with 80% branches.
- `npm run etl:self-evaluate` still reports the development mock score as `83` and `releaseReady: false` because Supabase is unset and mock jobs include one failed and one running job.
- No database schema, Supabase permissions, external API behavior, crawler behavior, deployment setting, or secret handling was changed.
- No secrets were read, printed, or committed. No production DB/API/deploy action was performed.
- Current self-assessment after the latest code pass:
  - Function / screen transition / no-bug score: 99.6 / 100
  - Daily-use list-generation UX value score: 99.7 / 100
  - Not 100 because Cursor Bugbot and real staging Supabase smoke remain unverified in this environment.

## 6. Known Issues
Known issues:
- Cursor Bugbot has not been run on the latest implementation diff. The Bugbot/on-demand usage cap was raised to 110 USD in Cursor's spending settings.
- Real staging Supabase smoke verification has not been run locally because staging credentials are absent.
- `npm run verify` does not exist; `npm run quality` is the canonical local quality gate.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode because Supabase is unset and mock jobs include one failed and one running job.
- Coverage is useful but not exhaustive; `src/lib/store.ts`, Supabase integration paths, and live staging save/update/delete behavior remain lower-confidence areas.
- The next small UX gap is that `/lists?error=operation-failed` now uses a general list-operation message. It is accurate for create/update/delete, but not as specific as a delete-only recovery message would be.

## 7. Bugbot Findings
Cursor Bugbot findings and handling:
- Not run for the latest diff.
- No actionable Bugbot finding text exists in the repo.
- User update/action: Cursor Bugbot/on-demand usage cap has been raised to 110 USD in Cursor's spending settings. Verified on the page as `$71.33 / $110`.
- Recommended next tool step: run Cursor Bugbot on the pushed branch/PR diff using the 110 USD usage cap. If findings appear, prioritize security/auth/data-integrity/runtime/build/test issues first.

## 8. Verification Results
Latest implementation verification:

```bash
git status --short --branch
# success: branch codex/permanent-quality-gate-governance, synced with origin before this handoff-only update

npm run typecheck
# success

npm run lint
# success

npx vitest run tests/etl.test.ts -t "delete route"
# success: 3 passed, 75 skipped by name filter

npx playwright test e2e/collector.spec.ts -g "list generation supports"
# success: 1 passed

npm run quality
# success: typecheck, lint, test integrity, unit/integration tests, coverage, E2E, and build all passed
# tests: 78 passed
# E2E: 8 passed
# coverage: statements 72.8%, branches 63.56%, functions 87.2%, lines 76.94%

npm run etl:self-evaluate
# success: mock data score 83; releaseReady false because Supabase/staging smoke is not configured and mock jobs include failed/running states

git diff --check
# success
```

Handoff-only verification:

```bash
git status --short --branch
# success before editing: branch codex/permanent-quality-gate-governance, synced with origin
```

## 9. Next Recommended Action
Next first action for Claude Code:
1. Review commit `5ba1000`, especially `deleteListRedirect`, generalized operation-failed copy, and the delete failure regression test.
2. Run Cursor Bugbot on the pushed branch/PR diff using the 110 USD cap.
3. If Bugbot is clean, continue the next quality/UX loop. Best small next candidate:
   - Add an `action=delete` or similar query param on delete operation failure.
   - Show a delete-specific `/lists` recovery message such as "リスト削除に失敗しました..." while keeping create/update messages accurate.
   - Add route-level and E2E coverage for that delete-specific recovery message.
4. If staging Supabase credentials are available, run `npm run smoke:staging` with isolated staging credentials before declaring production-readiness.

## 10. Suggested Review Scope for Claude Code
Areas to review closely:
- `src/app/api/lists/delete/route.ts`: `deleteListRedirect` helper and unchanged `POST` behavior.
- `src/app/lists/page.tsx`: generalized `operation-failed` copy and whether it should become action-specific.
- `tests/etl.test.ts`: delete failure regression test and assertion that stale revalidation does not occur.
- `e2e/collector.spec.ts`: operation-failed alert assertion.
- Confirm no unrelated list filter, saved-list create/update, CSV import, crawler, Supabase schema, or external API behavior changed.

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
- `AGENTS.md` and `CLAUDE.md` were reviewed during this handoff-only pass and did not need changes.
- Latest verified commit `5ba1000` covered saved-list delete failure recovery.
- Previous verified commit `7c5b458` recorded the Cursor Bugbot/on-demand spending cap increase to 110 USD.
- Previous verified commit `a227efe` covered saved-list create/update persistence failure redirects.
- Previous verified commit `6c590f6` clarified saved-list operation failure recovery copy and E2E coverage.
- Previous verified commit `1146790` clarified saved-list validation errors.
- Previous verified commit `c301115` preserved current list form state across quality actions, row exclusion, and exclusion reset.
- This handoff-only pass did not add code behavior. It exists to make the next Claude Code/Codex continuation crisp before Codex credit exhaustion.
