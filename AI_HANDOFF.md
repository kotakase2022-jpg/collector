# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 15 (inferred)
- Loop number inferred from: Previous handoff already advanced Claude Code's Loop 14 return into Codex Loop 15; no intervening Claude Code handoff was present, so this remains a Loop 15 Codex continuation.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 16:36 +09:00

## 1. Current Goal
Current development objective:

- Continue the standing autonomous improvement goal:
  - Function/screen-transition/no-bug score reaches 100/100.
  - Daily-use list-generation value score reaches 100/100.
- Preserve the review-cost policy:
  - CodeRabbit OSS is the standard PR reviewer for this public repository.
  - Cursor Bugbot is optional/reserve only.
- Current focus:
  - Remove real screen-transition/state bugs in the list-generation workflow.
  - Keep diffs small and CodeRabbit-reviewable.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest local implementation commit before this handoff update: `32f456b` (`Reset list form state on saved edit navigation`)
- This handoff update should be committed and pushed after this file update; run `git rev-parse --short HEAD` for the absolute latest head.
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1
- Latest full local `npm run quality` evidence before the new saved-list-edit fix: `d54fd17` working tree, success.
- Latest targeted/local verification for current code:
  - `npm run test:e2e -- --grep "list generation supports"` success
  - `npm run typecheck` success
  - `npm run lint` success
  - `npm run test` success, 96 passed
  - `npm run build` success

## 3. What Was Done
Completed in this continuation:

- Read required project files before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
- Read the relevant Next.js Server/Client Components guide before touching Next.js code.
- Confirmed local branch was clean and synced with origin at start.
- Rechecked public GitHub API status for pushed head `d54fd17`:
  - CodeRabbit status: `success`, `Review skipped: draft pull request`
  - `quality-gate`: `completed`, `success`
- Added an E2E check for a daily-use saved-list workflow:
  - Click `編集` on the saved list card for `高信頼URLあり営業リスト`.
  - Verify the list-generation form restores `listId`, name, description, `hasUrl=yes`, `minConfidence=80`, and `sort=confidence_desc`.
- The new E2E first failed and exposed a real bug:
  - URL/query state had the correct saved-list description.
  - The uncontrolled `用途メモ` textarea still displayed the previous value from an earlier client-side navigation.
  - This could cause users to update/save a saved list with stale form values.
- Fixed the bug:
  - Added a `formStateKey` to `src/app/lists/page.tsx`.
  - The list-generation form now remounts when list id, name, description, or filter query changes.
  - This preserves normal form editing while ensuring saved-list edit navigation shows the intended values.
- Created implementation commit:
  - `32f456b Reset list form state on saved edit navigation`
- Did not use Cursor Bugbot.
- Did not touch secrets, production DB, production APIs, deployment settings, persistence logic, parsing logic, or external ETL behavior.

## 4. Files Changed
Main changed files in this continuation:

- `src/app/lists/page.tsx`
  - Added `formStateKey`.
  - Applied it as the `key` for the list-generation form to avoid stale uncontrolled input state across client navigations.
- `e2e/collector.spec.ts`
  - Added saved-list card `編集` flow coverage verifying restored form values.
- `AI_HANDOFF.md`
  - Updated loop status, bug summary, verification results, CodeRabbit/GitHub Actions status, current scores, and next action.

## 5. Current Status
Current state:

- Local branch is ahead of origin by implementation commit `32f456b` plus this handoff update once committed.
- The saved-list edit stale-form-value bug is fixed and covered by E2E.
- Verification performed after the fix:
  - targeted list-generation E2E passed
  - typecheck passed
  - lint passed
  - unit/integration tests passed, 96 tests
  - production build passed
  - full `npm run quality` passed:
    - typecheck passed
    - lint passed
    - unit/integration tests passed, 96 tests
    - coverage passed, 96 tests
    - Playwright E2E passed, 8 tests
    - production build passed
  - commit hook quality guard/lint/typecheck passed while creating `32f456b`
- Pushed head `d54fd17` has GitHub Actions `quality-gate` completed successfully.
- CodeRabbit will still skip review while PR #1 remains Draft.
- The app remains in mock/fallback mode locally because Supabase credentials are not configured.
- The standing 100/100 goal remains active; current evidence is not enough to mark it complete.

## 6. Known Issues
Known issues:

- This handoff update still needs to be committed and pushed after editing this file.
- After pushing the latest handoff commit, recheck GitHub Actions `quality-gate` and CodeRabbit status for the newest head.
- CodeRabbit skipped pushed head `d54fd17` because PR #1 is still Draft. To get standard CodeRabbit review, mark the PR ready for review or trigger review according to the repo's CodeRabbit policy.
- GitHub connector auth was previously invalidated; public GitHub API reads work, but authenticated status/comment management may still need reconnecting.
- Live/staging Supabase smoke has not been run because isolated staging credentials are not available in this environment.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run etl:self-evaluate` reports `releaseReady: false` in mock mode.
- Mock job data intentionally includes 1 failed job and 1 running job, which keeps the self-evaluation score below release-ready.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit and supplemental review status:

- CodeRabbit:
  - Standard PR reviewer for this public repository.
  - Public GitHub API check for `d54fd17`:
    - commit status `state: success`
    - CodeRabbit context `success`
    - description: `Review skipped: draft pull request`
  - Public GitHub API check-runs for `d54fd17`:
    - `quality-gate`: `completed`, `success`
  - After pushing this handoff update, re-check CodeRabbit and `quality-gate` for the latest head.
- Cursor Bugbot:
  - Not used for code review in this continuation.
  - Remains optional/reserve because of cost.

## 8. Verification Results
Commands run and results:

```bash
npm run test:e2e -- --grep "list generation supports"
# first run after adding the saved-list edit assertion: failed
# failure exposed stale uncontrolled textarea value after client navigation

npm run test:e2e -- --grep "list generation supports"
# after formStateKey fix: success, 1 passed

npm run typecheck
# success

npm run lint
# success

npm run test
# success:
# - check:test-integrity: success
# - vitest: 96 passed

npm run build
# success

git commit -m "Reset list form state on saved edit navigation"
# success:
# - scripts/check:test-integrity hook: success
# - lint hook: success
# - typecheck hook: success

npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 96 passed
# - test:coverage: success, 96 passed
# - test:e2e: success, 8 passed
# - build: success
```

Previously verified on `d54fd17`:

```bash
npm run quality
# success:
# - typecheck: success
# - lint: success
# - test: success, 96 passed
# - test:coverage: success, 96 passed
# - test:e2e: success, 8 passed
# - build: success

npm run etl:self-evaluate
# success:
# - dataMode: mock
# - score: 83
# - releaseReady: false
```

## 9. Current Scores
Provisional self-evaluation:

- Function/screen-transition/no-bug score: 99 / 100
- Daily-use list-generation value score: 99 / 100

Why this is not 100 yet:

- Live/staging Supabase and external-service flows are still not verified.
- Full production-like data coverage cannot be proven from mock data alone.
- CodeRabbit must run on a non-draft or otherwise reviewable PR head to provide the standard review evidence.
- PR #1 is Draft, so review/deployment readiness is not fully proven.

## 10. Next Recommended Action
Next recommended action for Claude Code:

1. Review the saved-list edit navigation fix:
   - `src/app/lists/page.tsx`
   - `e2e/collector.spec.ts`
2. Recheck latest pushed GitHub Actions and CodeRabbit status after the final handoff commit is pushed.
3. Decide whether PR #1 should be marked ready for review so CodeRabbit reviews the latest head.
4. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address correctness/security/data-integrity findings first.
5. If no review blocker exists, continue one focused improvement toward 100/100. Good candidates:
   - staging smoke evidence workflow once safe staging credentials are available
   - read-only browser verification of the latest UI if a dev server is already running
   - another small screen-transition/state preservation edge case in list workflows

## 11. Suggested Review Scope for Claude Code
Claude Code should focus review on:

- Saved-list edit navigation and stale form state:
  - `src/app/lists/page.tsx`
- E2E coverage:
  - `e2e/collector.spec.ts`
- Handoff accuracy:
  - `AI_HANDOFF.md`
- CodeRabbit / GitHub Actions evidence after the latest push:
  - PR #1 checks/statuses

## 12. Do Not Touch
Do not touch:

- `.env`, `.env.local`, API keys, passwords, tokens, Supabase/OpenAI secrets.
- Production Supabase, production APIs, or production user data.
- Production deployment settings.
- Generated/cache outputs:
  - `.next/`
  - `coverage/`
  - `playwright-report/`
  - `test-results/`
  - `tsconfig.tsbuildinfo`

Also:

- Do not force-push.
- Do not delete, skip, or weaken tests to make checks pass.
- Do not run Cursor Bugbot for normal review unless a maintainer explicitly requests supplemental review.

## 13. Notes for Claude Code
Notes:

- `npm run quality` is the canonical local gate. `npm run verify` does not exist.
- CodeRabbit is the standard PR reviewer. Cursor Bugbot is optional/reserve only.
- The stale-form bug was caused by uncontrolled inputs using `defaultValue` across Next.js client navigations. The `key` on the form is intentionally tied to server-derived form state.
- This continuation does not alter CSV parsing, CSV export, API behavior, persistence, Supabase logic, or ETL behavior.
- The standing goal must stay active until live/staging evidence, external-service paths, full latest-head quality gate, and standard CodeRabbit review are sufficiently verified.
