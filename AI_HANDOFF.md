# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 7 (inferred)
- Loop number inferred from: Claude Code's previous handoff treated review of commit `7523545` as Loop 6 and recommended advancing the next fresh Codex development sub-task to Loop 7. Recent Codex passes have continued Loop 7 with focused list-generation UX, CSV import, saved-list reliability, and route-safety improvements. Historical handoffs did not originally contain explicit loop numbers, so this remains inferred.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-05 21:14:38 +09:00

## 1. Current Goal
今回の目的:
- Continue improving the existing Japan Company DB Collector toward:
  - all functions and screen transitions behaving as intended with no bugs or runtime errors
  - the list-generation workflow feeling fast, clear, and strong enough for daily business use
- This pass hardened the company detail route so malformed company IDs safely render the recovery 404 UI before any Supabase lookup.

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest committed baseline before this change set: `a0f34f7` (`Validate saved list route ids`)
- Last known good baseline before this change set: `a0f34f7`, verified locally and by GitHub Actions `quality-gate #65`

## 3. What Was Done
今回完了したこと:
- Reviewed required project files, current handoff, repo status, package scripts, README, Next.js route handler docs, the company detail page, `getCompanyDetail`, and existing 404 recovery E2E coverage.
- Fixed a production-safety gap in `/companies/[id]`:
  - the page now validates `id` with `uuidLikeSchema` before calling `getCompanyDetail`
  - malformed URLs such as `/companies/not-a-uuid` now go straight to `notFound()`
  - this avoids possible Supabase/Postgres UUID comparison errors when the app is connected to a real database
- Extended the 404 recovery E2E flow to cover malformed company IDs in addition to valid-but-missing UUIDs.
- Verified the malformed company ID path shows the existing recovery UI and navigates back to `/companies` without console/page errors.

## 4. Files Changed
主な変更ファイル:
- `src/app/companies/[id]/page.tsx`
- `e2e/collector.spec.ts`
- `AI_HANDOFF.md`

## 5. Current Status
現在の状態:
- Local full quality gate passed after the company route hardening.
- Unit/integration tests remain 75 tests and all pass.
- E2E remains 8 tests and all pass.
- Coverage after this pass:
  - statements 71.81%
  - branches 63.37%
  - functions 87.05%
  - lines 75.85%
- No database schema, Supabase permissions, external API behavior, crawler behavior, or deployment settings were changed.
- No secrets were read, printed, or committed. No production DB/API/deploy action was performed.
- Current self-assessment after this pass:
  - Function / screen transition / no-bug score: 98.9 / 100
  - Daily-use list-generation UX value score: 99.15 / 100
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
# success: branch codex/permanent-quality-gate-governance, local changes limited to company route ID validation/E2E plus this handoff

npm run typecheck
# success

npx playwright test e2e/collector.spec.ts -g "missing company and list pages"
# success: 1 passed; valid missing IDs and malformed company/list IDs show recovery navigation

npm run test
# success: 75 tests passed; quality guard passed

npm run lint
# success

npm run quality
# success: typecheck, lint, test, coverage, E2E (8 passed), and build all passed
# coverage: statements 71.81%, branches 63.37%, functions 87.05%, lines 75.85%

npm run etl:self-evaluate
# success: mock data score 83; releaseReady false because Supabase/staging smoke is not configured and mock jobs include failed/running states
```

## 9. Next Recommended Action
次にClaude Codeが最初にやるべきこと:
1. Review the company detail ID validation for placement and consistency with other route/form ID validation.
2. Run Cursor Bugbot on the pushed branch/PR diff. The user has shared that Bugbot usage cap is now 70 USD.
3. If Bugbot is clean, continue the next quality/UX loop. Recommended candidate remains staging Supabase smoke coverage or saved-list/list-generation success/error behavior under real isolated Supabase credentials.
4. If staging credentials are unavailable, continue with mock/fixture-backed workflow improvements and record the credential blocker honestly.

## 10. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:
- Confirm malformed `/companies/[id]` values cannot reach Supabase UUID comparisons.
- Confirm the E2E allowlist for intentional 404 responses is narrow enough.
- Confirm no behavior outside company not-found/recovery changed unintentionally.
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
- This pass only adds company detail route validation and E2E coverage. It does not add database writes or external service calls.
- GitHub Actions should be checked after this handoff commit is pushed.
