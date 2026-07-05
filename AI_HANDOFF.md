# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 7 (inferred)
- Loop number inferred from: Claude Code's previous handoff treated review of commit `7523545` as Loop 6 and recommended advancing the next fresh Codex development sub-task to Loop 7. Recent Codex passes have continued Loop 7 with focused list-generation UX, CSV import, saved-list reliability, route-safety, validation-hardening, and workflow-polish improvements. Historical handoffs did not originally contain explicit loop numbers, so this remains inferred.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-05 21:38:26 +09:00

## 1. Current Goal
今回の目的:
- Continue improving the existing Japan Company DB Collector toward:
  - all functions and screen transitions behaving as intended with no bugs or runtime errors
  - the list-generation workflow feeling fast, clear, and strong enough for daily business use
- This pass fixed a follow-up list-generation workflow gap: manually excluded company IDs are now preserved when the visible condition form is submitted to save/update/regenerate a list.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed baseline before this change set: `ba951f2` (`Submit current list form values when saving`)
- Last known good baseline before this change set: `ba951f2`, verified locally and by GitHub Actions `quality-gate #68`

## 3. What Was Done
今回完了したこと:
- Reviewed required project files, current handoff, repo status, package scripts, README, Next.js forms docs, saved-list detail page, list create/update routes, validation helpers, and list-generation E2E coverage.
- Found a realistic follow-up bug from the current-form Save/Update improvement:
  - `excludedCompanyIds` is not a visible input field in the condition form.
  - After excluding a company, submitting the current form for Save/Update/Generate could drop the manual exclusion unless it was preserved separately.
- Added a hidden `excludedCompanyIds` field to the list-generation form whenever exclusions are active.
- Added E2E coverage proving that saving a list with a manually excluded company preserves:
  - `excludedCompanyIds` in the redirect URL
  - reduced `rowCount`
  - the excluded company remaining absent from the result table

## 4. Files Changed
主な変更ファイル:
- `src/app/lists/page.tsx`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

## 5. Current Status
現在の状態:
- Local full quality gate passed after the exclusion-preservation fix.
- Unit/integration tests remain 75 tests and all pass.
- E2E remains 8 tests and all pass, including the new manually-excluded-list save regression.
- Coverage after this pass:
  - statements 71.83%
  - branches 63.36%
  - functions 86.95%
  - lines 75.88%
- No database schema, Supabase permissions, external API behavior, crawler behavior, or deployment settings were changed.
- No secrets were read, printed, or committed. No production DB/API/deploy action was performed.
- Current self-assessment after this pass:
  - Function / screen transition / no-bug score: 99.2 / 100
  - Daily-use list-generation UX value score: 99.35 / 100
  - Not 100 because Cursor Bugbot and real staging Supabase smoke remain unverified in this environment.

## 6. Known Issues
既知の問題:
- Cursor Bugbot has not been run on this latest diff. The user shared that the Bugbot usage cap is now 70 USD.
- Real staging Supabase smoke verification has not been run locally because staging credentials are absent.
- `npm run verify` does not exist; `npm run quality` is the canonical local quality gate.
- `npm run etl:self-evaluate` still reports `releaseReady: false` in mock mode because Supabase is unset and mock jobs include one failed and one running job.
- Coverage is useful but not exhaustive; `src/lib/store.ts`, Supabase integration paths, and live staging save/update/delete behavior remain lower-confidence areas.

## 7. Bugbot Findings
Cursor Bugbotの指摘と対応状況:
- Not run for this latest diff.
- No actionable Bugbot finding text exists in the repo.
- User update: Cursor Bugbot usage cap has been raised to 70 USD.
- Recommended next tool step: run Cursor Bugbot on the pushed branch/PR diff using the 70 USD usage cap. If findings appear, prioritize security/auth/data-integrity/runtime/build/test issues first.

## 8. Verification Results
実行した確認コマンドと結果:

```bash
git status --short --branch
# success: branch codex/permanent-quality-gate-governance, local changes limited to list exclusion hidden field, E2E, and this handoff

npm run typecheck
# success

npm run lint
# success

npx playwright test e2e/collector.spec.ts -g "list generation supports"
# success: 1 passed, including manually excluded list save preservation

npm run quality
# success: typecheck, lint, test, coverage, E2E (8 passed), and build all passed
# coverage: statements 71.83%, branches 63.36%, functions 86.95%, lines 75.88%

npm run etl:self-evaluate
# success: mock data score 83; releaseReady false because Supabase/staging smoke is not configured and mock jobs include failed/running states

git diff --check
# success
```

## 9. Next Recommended Action
次にClaude Codeが最初にやるべきこと:
1. Review the hidden `excludedCompanyIds` field and confirm it is only emitted when exclusions are active.
2. Confirm create/update/list preview form submissions now preserve manual exclusions while reset links still remove them.
3. Run Cursor Bugbot on the pushed branch/PR diff. The user has shared that Bugbot usage cap is now 70 USD.
4. If Bugbot is clean, continue the next quality/UX loop. Recommended candidate remains staging Supabase smoke coverage or saved-list/list-generation success/error behavior under real isolated Supabase credentials.
5. If staging credentials are unavailable, continue with mock/fixture-backed workflow improvements and record the credential blocker honestly.

## 10. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:
- Confirm manual exclusions are preserved on Save/Update/Generate after the current-form submission refactor.
- Confirm the reset-exclusions link still removes `excludedCompanyIds`.
- Confirm no unrelated list filter behavior changed.
- Confirm the new E2E assertion covers the real workflow and does not mask console/network errors.
- Confirm `npm run quality` result and GitHub Actions result after push.

## 11. Do Not Touch
触らない方がよい領域:
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not delete, skip, weaken, or comment out tests to make checks pass.
- Do not rewrite the UI, routes, or data model broadly without an explicit product request.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`) unless intentionally regenerating local artifacts and keeping them uncommitted.
- Do not force-push or deploy to production from this branch.

## 12. Notes for Claude Code
Claude Codeへの補足:
- This project uses Next.js 16.2.10. Before touching Next.js pages, route handlers, or client/server component boundaries, read the relevant docs under `node_modules/next/dist/docs/`.
- The full quality gate is `npm run quality`.
- `npm run verify` is absent by design right now; do not assume it exists.
- Previous verified commit `7523545` added CSV import preview detection for missing required header columns.
- Previous verified commit `a260bec` added Japanese CSV header support for corporate number, company name, official URL, and industry.
- Previous verified commit `6b6584c` broadened CSV header alias matching.
- Previous verified commit `9225c97` added a local sample CSV download.
- Previous verified commit `a31de31` added accepted-column-name guidance to the CSV import panel.
- Previous verified commit `2a6dd77` made that guidance use the parser alias source directly.
- Previous verified commit `50211c6` stabilized CSV alias display labels.
- Previous verified commit `b59dec2` prevented CSV alias help overflow.
- Previous verified commit `ee2209f` shared CSV upload limit metadata and added oversized-file checks.
- Previous verified commit `b074d4a` separated CSV import preview metadata/readiness from server-side CSV parsing.
- Previous verified commit `a3356a1` added readiness recommendations in the list-generation quality panel.
- Previous verified commit `a0f34f7` validated saved-list detail route IDs before Supabase lookup.
- Previous verified commit `8986f79` validated company detail route IDs before Supabase lookup.
- Previous verified commit `5ef140c` tightened UUID-shaped ID validation across list/company/job flows.
- Previous verified commit `ba951f2` made Save/Update submit the current visible list form values.
- This pass only preserves manual exclusion IDs in the list form and adds E2E coverage. It does not add database writes or external service calls.
- GitHub Actions should be checked after this handoff commit is pushed.
