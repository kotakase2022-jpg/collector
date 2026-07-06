# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this user-requested continuation, so this remains a Loop 14 Codex continuation.
- Phase: Autonomous Improvement / Handoff
- Last updated: 2026-07-06 10:51 +09:00

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
- Latest pushed commit: `cd7b330` (`Normalize corporate number search queries`)
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
- Confirmed CodeRabbit then skipped the automatic full review because PR #1 is still draft. The status check still completed successfully for that skipped run.
- Posted an explicit draft-compatible CodeRabbit review request:
  - Comment id: `4888440080`
  - Body starts with: `@coderabbitai review`
- Confirmed CodeRabbit acknowledged the explicit review request:
  - Comment id: `4888440749`
  - Body indicates the review was triggered.
- CodeRabbit processing comment `4888424498` currently says it is processing changed files for the PR, and the latest `CodeRabbit` status is pending.
- Improved company search so a hyphenated corporate-number query such as `323-4567890123` matches a stored normalized corporate number such as `3234567890123`.
- Added regression coverage for hyphenated corporate-number search in the safe fallback data accessor test.
- Ran targeted tests, typecheck, lint, full `npm run quality`, and ETL self-evaluation after the search improvement.
- Did not use Cursor Bugbot in this continuation.
- Did not change DB schema, deployment settings, or secrets.

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
- `src/lib/data.ts`
  - Normalizes corporate-number search queries and adds an exact corporate-number match condition when the query can be parsed as a valid 13-digit corporate number.
  - Applies the same normalized corporate-number match in mock/fallback data filtering.
- `tests/etl.test.ts`
  - Added a regression assertion that `getCompanies({ q: "323-4567890123" })` finds the company stored as `3234567890123`.

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
- PR #1 has both a post-access-fix `@coderabbitai full review` request and a draft-compatible `@coderabbitai review` request.
- CodeRabbit bot acknowledged the explicit `@coderabbitai review` request.
- CodeRabbit automatic review skipped once because the PR is draft, then the explicit review request moved the review into processing.
- Detailed CodeRabbit findings are still pending/not visible at the time of this handoff.
- PR head status now includes `CodeRabbit` with state `pending` on commit `cd7b330`.
- CodeRabbit dashboard web-login/onboarding is not complete in Chrome, but the GitHub App PR review path is now working enough for CodeRabbit bot to acknowledge the PR command.
- Shared URL normalization is improved and covered by tests for common spreadsheet/API input variants.
- Cursor Bugbot remains optional/reserve only.
- Local git working tree was clean before this handoff update.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
Known issues:

- CodeRabbit has acknowledged the explicit PR review command, but detailed findings and/or a final status check are not visible yet.
- CodeRabbit dashboard diagnosis previously reached GitHub OAuth, but `Authorize coderabbitai` was disabled because GitHub required organization-access choices for `Sustainable-Lab` and `slhrs2026`.
- No organization access was granted, revoked, or requested by Codex. The corrected GitHub App selected-repository installation was sufficient to trigger the PR review bot.
- The CodeRabbit GitHub status-check name is visible as `CodeRabbit`, currently pending on `cd7b330`. Branch protection should require it after it completes successfully once on the final PR head.
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
  - Automatic review status comment:
    - https://github.com/kotakase2022-jpg/collector/pull/1#issuecomment-4888424498
    - Initially skipped because PR #1 is draft; after `@coderabbitai review`, it changed to processing.
  - Explicit draft-compatible review request:
    - https://github.com/kotakase2022-jpg/collector/pull/1#issuecomment-4888440080
  - Explicit review acknowledgement:
    - https://github.com/kotakase2022-jpg/collector/pull/1#issuecomment-4888440749
  - Detailed review findings are still pending.
  - GitHub status check is visible as `CodeRabbit` with state `pending` on latest pushed commit `cd7b330`.
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
# success: response included context CodeRabbit with state pending

git commit -m "Confirm CodeRabbit repository access"
# success: commit 5351812; commit hook passed check:test-integrity, lint, and typecheck

git push origin codex/permanent-quality-gate-governance
# success: pushed 5351812; pre-push hook passed check:test-integrity, lint, typecheck, and 96 Vitest tests

GitHub connector: fetch combined status for PR head 5351812050bb8ede0102022da1fe3e04f76bed40
# success: latest response includes context CodeRabbit with state pending

GitHub connector: fetch PR #1 comments after CodeRabbit ran on draft PR
# success: CodeRabbit comment 4888424498 reported "Review skipped" because the PR is draft, and advised using @coderabbitai review

GitHub connector: add PR #1 CodeRabbit explicit review comment
# success: posted @coderabbitai review as comment 4888440080

GitHub connector: fetch PR #1 comments after explicit review request
# success: CodeRabbit bot replied in comment 4888440749 and stated that review was triggered

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

git commit -m "Normalize corporate number search queries"
# success: commit cd7b330; commit hook passed check:test-integrity, lint, and typecheck

git push origin codex/permanent-quality-gate-governance
# success: pushed cd7b330; pre-push hook passed check:test-integrity, lint, typecheck, and 96 Vitest tests

GitHub connector: fetch combined status for PR head cd7b330489d8a62c74448b715d15e49768aa8d51
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
- CodeRabbit explicit review has been triggered and acknowledged, and the `CodeRabbit` status check is pending on `cd7b330`; detailed findings/final success evidence is still pending.
- Some live/staging and external-service paths remain unverified against real credentials/services.

## 10. Next Recommended Action
Next AI should first:

1. Re-fetch PR #1 comments/statuses and confirm whether CodeRabbit finished the explicit review requested in comment `4888440080` and acknowledged in `4888440749`.
2. If CodeRabbit posts findings, classify them Critical / High / Medium / Low and address actionable correctness/security/data-integrity issues first.
3. Once the `CodeRabbit` status completes successfully on the final PR head, update branch-protection guidance/settings if needed to require `CodeRabbit` alongside `quality-gate`.
4. Review the same-loop corporate-number and URL-normalization fixes in `src/lib/corporate-number.ts`, `src/lib/list-quality.ts`, `src/lib/etl/normalize.ts`, `src/lib/etl/job-planner.ts`, `src/lib/etl/job-runner.ts`, `src/lib/data.ts`, and `tests/etl.test.ts`.
5. Continue improving list-generation UX with small, reviewable changes. A good next candidate is stronger search/filter behavior in the UI or clearer recovery messaging around draft/staging limitations.
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
