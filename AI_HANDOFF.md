# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this user-requested continuation, so this remains a Loop 14 Codex continuation.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 10:42 +09:00

## 1. Current Goal
Current objective:

- Complete the migration from Cursor Bugbot as the default reviewer to CodeRabbit OSS as the standard PR reviewer for this public repository.
- Confirm CodeRabbit is installed/enabled for `kotakase2022-jpg/collector`.
- Keep Cursor Bugbot optional/reserve only because of usage cost.
- Preserve the standing product-quality goal:
  - all functions and screen transitions work correctly without bugs
  - list generation and company search feel clear, dependable, and valuable for daily work

## 2. Current Branch / Commit
- Branch: `codex/permanent-quality-gate-governance`
- Latest pushed commit at start of this continuation: `0c8fde9` (`Harden URL normalization for external inputs`)
- Last known good implementation commit: `0ca7a54` (`Normalize corporate numbers in ETL jobs`), verified with `npm run quality` and `npm run etl:self-evaluate`.
- Historical Cursor Bugbot-clean commit: `46622ee`
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1

## 3. What Was Done
Completed in this continuation:

- Improved shared URL normalization so external API, CSV, and official-site candidate values tolerate surrounding whitespace, full-width ASCII/domain text, and uppercase `HTTP://` / `HTTPS://` schemes.
- Added regression assertions for uppercase-scheme URLs and full-width domain URLs in the normalization helper test.
- Ran the full local quality gate successfully: typecheck, lint, unit/integration tests, coverage, E2E, and production build all passed.
- Re-ran `npm run etl:self-evaluate`; it completed in mock mode with score 83 and releaseReady false because Supabase/staging evidence and live data coverage are absent.
- Re-fetched draft PR #1 through the GitHub connector to confirm the current CodeRabbit state.
- Confirmed CodeRabbit is documented and recorded as installed/enabled for `kotakase2022-jpg/collector`, with post-install review request comment `4888344795` still visible.
- Confirmed no CodeRabbit review comment or status check is visible yet on PR #1 after the post-install request.
- Opened `https://app.coderabbit.ai/` in the logged-in Chrome session to diagnose why PR #1 still has no CodeRabbit output.
- CodeRabbit redirected to GitHub OAuth for `coderabbitai`; requested scopes were `user:email` and `read:org`.
- GitHub OAuth showed organization-access decisions for `Sustainable-Lab` (`Request approval from owners`) and `slhrs2026` (`Grant`), and the final `Authorize coderabbitai` button was disabled while those organization policy choices remained unresolved.
- Did not click `Request approval from owners`, `Grant`, `Revoke`, or submit the disabled authorization form because those are external account/organization access changes outside the personal-repository install confirmation.
- Re-ran the targeted unit/integration suite for ETL/list/CSV behavior; it passed with 96 tests.
- Used the logged-in Chrome/GitHub session to inspect CodeRabbit GitHub App installation.
- Confirmed CodeRabbit was already installed for account `kotakase2022-jpg`, but repository access was only enabled for `kotakase2022-jpg/ai-jimukyoku`.
- Added `kotakase2022-jpg/collector` to the existing CodeRabbit installation without removing the existing `ai-jimukyoku` access.
- Verified GitHub Installed Apps settings now show:
  - Repository access: `Only select repositories`
  - Selected repositories: `kotakase2022-jpg/ai-jimukyoku`, `kotakase2022-jpg/collector`
  - Permissions: read access to actions/discussions/metadata; read/write access to checks, code, commit statuses, issues, and pull requests.
- Added a new PR #1 comment to retrigger CodeRabbit after enabling repository access:
  - Comment id: `4888344795`
  - Body starts with: `@coderabbitai full review`
- Rechecked PR #1 comments through the GitHub connector. The new CodeRabbit request comment is visible, but no CodeRabbit review reply/status was visible immediately after posting.
- Rechecked CodeRabbit GitHub App repository access again after the user asked whether CodeRabbit was installed.
- Found that CodeRabbit was installed, but `kotakase2022-jpg/collector` was not actually in the selected repositories at that moment. Selected repositories were `kotakase2022-jpg/ai-jimukyoku` and `kotakase2022-jpg/SalesForm`.
- Added `kotakase2022-jpg/collector` to the existing CodeRabbit GitHub App installation without removing the existing selected repositories.
- Verified GitHub Installed Apps settings now show selected repositories:
  - `kotakase2022-jpg/ai-jimukyoku`
  - `kotakase2022-jpg/collector`
  - `kotakase2022-jpg/SalesForm`
- Posted a fresh PR #1 CodeRabbit full-review trigger after repository access was corrected:
  - Comment id: `4888422399`
  - Body starts with: `@coderabbitai full review`
- Confirmed CodeRabbit bot replied:
  - Comment id: `4888423200`
  - Body indicates the full review was triggered.
- Did not use Cursor Bugbot in this continuation.
- Did not change application code, tests, DB schema, deployment settings, or secrets.

Previously completed in Loop 14:

- Documented CodeRabbit OSS as the standard PR reviewer in `README.md`, `docs/testing.md`, `AGENTS.md`, `CLAUDE.md`, and `.github/pull_request_template.md`.
- Downgraded Cursor Bugbot to optional/reserve review.
- Tightened corporate-number quality checks in list quality and ETL flow.
- Normalized corporate numbers before scheduling/running gBizINFO and EDINET enrichment jobs.
- Preserved full local quality-gate success after the latest implementation change.

## 4. Files Changed
Changed in this continuation:

- `src/lib/etl/normalize.ts`
  - `normalizeUrl` now trims input, normalizes full-width ASCII via NFKC, and detects HTTP(S) schemes case-insensitively before adding a default `https://`.
- `tests/etl.test.ts`
  - Added regression coverage for uppercase `HTTP://` input and full-width domain input.
- `AI_HANDOFF.md`
  - Updated CodeRabbit installation status and current verification results.
  - Recorded the corrected selected-repository state and PR #1 CodeRabbit trigger/acknowledgement comment ids.
  - Cleaned up the prior mojibake sections so the next AI can read the handoff without guessing.
- `README.md`
  - Recorded the confirmed CodeRabbit status-check name: `CodeRabbit`.
- `docs/testing.md`
  - Updated branch-protection guidance to require `CodeRabbit` with `quality-gate` after CodeRabbit completes successfully once.

Important same-loop files already changed before this continuation:

- `README.md`
- `docs/testing.md`
- `AGENTS.md`
- `CLAUDE.md`
- `.github/pull_request_template.md`
- `src/lib/corporate-number.ts`
- `src/lib/list-quality.ts`
- `src/lib/etl/job-planner.ts`
- `src/lib/etl/job-runner.ts`
- `tests/etl.test.ts`

## 5. Current Status
Current state:

- CodeRabbit GitHub App is installed for `kotakase2022-jpg/collector`.
- CodeRabbit is still configured with selected-repository access, not all repositories.
- Selected repositories are `kotakase2022-jpg/ai-jimukyoku`, `kotakase2022-jpg/collector`, and `kotakase2022-jpg/SalesForm`.
- PR #1 has a fresh post-access-fix CodeRabbit full-review request.
- CodeRabbit bot acknowledged the request and reported that a full review was triggered.
- Detailed CodeRabbit findings are still pending/not visible at the time of this handoff.
- PR head status now includes `CodeRabbit` with state `pending`; this is the status-check name to add to branch protection after it completes successfully once.
- CodeRabbit dashboard web-login/onboarding is not complete in Chrome, but the GitHub App PR review path is now working enough for CodeRabbit bot to acknowledge the PR command.
- Shared URL normalization is improved and covered by tests for common spreadsheet/API input variants.
- Cursor Bugbot remains optional/reserve only.
- Local git working tree was clean before this handoff update.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
Known issues:

- CodeRabbit has acknowledged the PR review command, but detailed findings and/or a final status check are not visible yet.
- CodeRabbit dashboard diagnosis previously reached GitHub OAuth, but `Authorize coderabbitai` was disabled because GitHub required organization-access choices for `Sustainable-Lab` and `slhrs2026`.
- No organization access was granted, revoked, or requested by Codex. The corrected GitHub App selected-repository installation was sufficient to trigger the PR review bot.
- The CodeRabbit GitHub status-check name is now visible as `CodeRabbit`, currently pending. Branch protection should require it after it completes successfully once.
- `gh api repos/kotakase2022-jpg/collector/installation` could not be used locally because GitHub CLI is not authenticated in this environment.
- Real staging Supabase smoke was not run because staging credentials were not provided.
- Live EDINET/Supabase enrichment remains unverified against staging/prod Supabase and the live EDINET API.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` still reports mock-mode/staging-smoke readiness limitations when Supabase evidence is absent.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit and optional supplemental review status:

- CodeRabbit:
  - Installed/enabled for `kotakase2022-jpg/collector` on 2026-07-06.
  - Confirmed selected repositories now include:
    - `kotakase2022-jpg/ai-jimukyoku`
    - `kotakase2022-jpg/collector`
    - `kotakase2022-jpg/SalesForm`
  - Latest PR #1 full-review request after correcting repository access:
    - https://github.com/kotakase2022-jpg/collector/pull/1#issuecomment-4888422399
  - CodeRabbit acknowledgement:
    - https://github.com/kotakase2022-jpg/collector/pull/1#issuecomment-4888423200
  - Detailed review findings are still pending.
  - GitHub status check is visible as `CodeRabbit` with state `pending`.
  - CodeRabbit app login was attempted in Chrome earlier, but GitHub OAuth authorization was disabled until organization-access choices are resolved. Codex did not grant/request/revoke org access.
- Cursor Bugbot:
  - Not used in this continuation.
  - Downgraded to optional/reserve because of usage cost.
  - Historical clean result remains `46622ee`.
  - Later Bugbot rerun attempts were blocked by usage/spend limits.

## 8. Verification Results
Commands/checks run in this continuation:

```bash
git status --short --branch
# success: branch codex/permanent-quality-gate-governance aligned with origin before handoff edit

GitHub connector: fetch PR #1 comments and metadata
# success: PR #1 is open/draft/mergeable; @coderabbitai request comment 4888344795 is visible; no CodeRabbit review/status is visible yet

GitHub connector: fetch combined status for PR head
# success: returned no commit statuses; no CodeRabbit status/check was visible through this connector

git rev-parse HEAD
# success before this handoff edit: f621970cffd1af1f4b189bd26276856760ba1f19

npm test -- tests/etl.test.ts
# success: 96 passed

npm run typecheck
# success

npm run lint
# success

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
# - releaseGateFailures: Supabase未設定, failed job 1件, running job 1件

Chrome: CodeRabbit app login check
# reached GitHub OAuth for coderabbitai; requested user:email and read:org; final authorization button disabled until org access decisions for Sustainable-Lab/slhrs2026 are resolved; no Grant/Revoke/Request/Authorize action was submitted

gh api repos/kotakase2022-jpg/collector/installation
# failed: local GitHub CLI is not authenticated; used Chrome/GitHub settings instead

GitHub Installed Apps settings via logged-in Chrome session
# success before latest correction had become stale; latest re-check showed collector missing, so Codex added it

GitHub connector: fetch PR #1 comments
# success: fresh @coderabbitai full review request comment id 4888344795 is visible

Chrome: GitHub Installed Apps settings via logged-in Chrome session
# success: CodeRabbit selected repositories now include ai-jimukyoku, collector, and SalesForm

GitHub connector: add PR #1 CodeRabbit trigger comment
# success: posted @coderabbitai full review as comment 4888422399 after collector was added to selected repositories

GitHub connector: fetch PR #1 comments after latest trigger
# success: CodeRabbit bot replied in comment 4888423200 and stated that a full review was triggered

GitHub connector: fetch combined status for PR head 0c8fde9c123e9f03de910369031096e88ea10b10
# success: latest response includes context CodeRabbit with state pending
```

Latest relevant implementation verification from the previous same-loop pass:

```bash
npm test -- tests/etl.test.ts
# success: 96 passed

npm run typecheck
# success

npm run lint
# success

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
Temporary self-evaluation toward the standing 100-point goals:

- Function/screen-transition/no-bug score: 99 / 100
- Daily-use list-generation value score: 99 / 100

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Live EDINET/Supabase enrichment smoke evidence is still missing.
- CodeRabbit review has been triggered and acknowledged, and the `CodeRabbit` status check is pending; detailed findings/final success evidence is still pending.
- Some live/staging and external-service paths remain unverified against real credentials/services.

## 10. Next Recommended Action
Next AI should first:

1. Re-fetch PR #1 comments/statuses and confirm whether CodeRabbit posted detailed findings after acknowledgement comment `4888423200`.
2. If CodeRabbit posts findings, address actionable correctness/security/data-integrity issues first.
3. Once the `CodeRabbit` status completes successfully once, update branch-protection guidance/settings to require `CodeRabbit` alongside `quality-gate`.
4. If CodeRabbit stalls after the acknowledgement, inspect CodeRabbit PR/dashboard state. Do not grant/request/revoke GitHub organization access unless the maintainer explicitly approves that exact organization action.
5. Review the same-loop corporate-number and URL-normalization fixes in `src/lib/corporate-number.ts`, `src/lib/list-quality.ts`, `src/lib/etl/normalize.ts`, `src/lib/etl/job-planner.ts`, `src/lib/etl/job-runner.ts`, and `tests/etl.test.ts`.
6. Keep Cursor Bugbot optional/reserve only unless a maintainer explicitly asks for supplemental review.

## 11. Suggested Review Scope for Claude Code
Suggested review scope:

- CodeRabbit setup and review evidence:
  - PR #1 comments/status checks
  - CodeRabbit OAuth/onboarding state if the maintainer resolves the GitHub organization-access choices
- Review-process docs:
  - `README.md`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `docs/testing.md`
  - `.github/pull_request_template.md`
- Handoff accuracy:
  - `AI_HANDOFF.md`
- Earlier same-loop data-quality fix:
  - `src/lib/corporate-number.ts`
  - `src/lib/list-quality.ts`
  - `src/lib/etl/normalize.ts`
  - `src/lib/etl/job-planner.ts`
  - `src/lib/etl/job-runner.ts`
  - `tests/etl.test.ts`

## 12. Do Not Touch
Do not touch:

- `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Production Supabase, production APIs, or production user data.
- Production deployment settings from this branch.
- Generated/cache outputs such as `.next/`, `coverage/`, `playwright-report/`, `test-results/`, and `tsconfig.tsbuildinfo`.

Also:

- Do not force-push.
- Do not delete, skip, or weaken tests to make checks pass.
- Do not make unrelated broad refactors while waiting for CodeRabbit.

## 13. Notes for Claude Code
Notes:

- CodeRabbit is now installed for `collector`, so the previous blocker "confirm the app is enabled for this repo" is resolved.
- The remaining CodeRabbit blocker is review evidence plus dashboard onboarding. Chrome diagnosis shows GitHub OAuth authorization is disabled until organization-access choices are resolved.
- Do not click `Grant`, `Revoke`, or `Request approval from owners` for GitHub organizations unless the maintainer explicitly approves that exact organization access change.
- The CodeRabbit GitHub settings page redirected to CodeRabbit login immediately after saving, but returning to GitHub settings confirmed the repository selection was saved.
- `gh` is not authenticated locally; use the GitHub connector or Chrome session for GitHub API-like work unless `gh auth login` is intentionally performed by the maintainer.
- The standing goal remains active; do not mark it complete until live/staging concerns, EDINET completeness, and CodeRabbit review evidence are resolved.
