# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 14 (continued, inferred)
- Loop number inferred from: Previous handoff was Loop 14 with `Current owner: Codex` and `Next owner: Claude Code`. No Claude Code pass occurred before this user-requested continuation, so this remains a Loop 14 Codex continuation.
- Phase: Handoff / Review Tool Setup
- Last updated: 2026-07-06 10:20 +09:00

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
- Latest commit: `f21c7e8` (`Update handoff after ETL normalization fix`)
- Last known good implementation commit: `0ca7a54` (`Normalize corporate numbers in ETL jobs`), verified with `npm run quality` and `npm run etl:self-evaluate`.
- Historical Cursor Bugbot-clean commit: `46622ee`
- Draft PR: https://github.com/kotakase2022-jpg/collector/pull/1

## 3. What Was Done
Completed in this continuation:

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

- `AI_HANDOFF.md`
  - Updated CodeRabbit installation status.
  - Recorded PR #1 review request comment id.
  - Cleaned up the prior mojibake sections so the next AI can read the handoff without guessing.

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
- PR #1 has a fresh post-install CodeRabbit full-review request.
- CodeRabbit review output is still pending/not visible at the time of this handoff.
- Cursor Bugbot remains optional/reserve only.
- Local git working tree was clean before this handoff update.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.

## 6. Known Issues
Known issues:

- CodeRabbit has not yet produced a visible review comment/status on PR #1 after the post-install request.
- The exact CodeRabbit GitHub status-check name is still unknown. Branch protection cannot require it until CodeRabbit runs successfully once.
- `gh api repos/kotakase2022-jpg/collector/installation` could not be used locally because GitHub CLI is not authenticated in this environment.
- Real staging Supabase smoke was not run because staging credentials were not provided.
- Live EDINET/Supabase enrichment remains unverified against staging/prod Supabase and the live EDINET API.
- `npm run verify` does not exist; `npm run quality` is the canonical gate.
- `npm run etl:self-evaluate` still reports mock-mode/staging-smoke readiness limitations when Supabase evidence is absent.

## 7. CodeRabbit / Supplemental Review Findings
CodeRabbit and optional supplemental review status:

- CodeRabbit:
  - Installed/enabled for `kotakase2022-jpg/collector` on 2026-07-06.
  - PR #1 full-review request posted after installation:
    - https://github.com/kotakase2022-jpg/collector/pull/1#issuecomment-4888344795
  - No visible CodeRabbit review output yet in the immediately re-fetched PR comments.
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

gh api repos/kotakase2022-jpg/collector/installation
# failed: local GitHub CLI is not authenticated; used Chrome/GitHub settings instead

GitHub Installed Apps settings via logged-in Chrome session
# success: CodeRabbit selected repositories include ai-jimukyoku and collector

GitHub connector: fetch PR #1 comments
# success: fresh @coderabbitai full review request comment id 4888344795 is visible
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

- Function/screen-transition/no-bug score: 98 / 100
- Daily-use list-generation value score: 99 / 100

Remaining reasons below 100:

- Live Supabase/staging smoke evidence is still missing.
- Live EDINET/Supabase enrichment smoke evidence is still missing.
- CodeRabbit review has been requested after installation but has not yet produced visible review evidence.
- Some screens still need text/encoding polish for daily business usability.

## 10. Next Recommended Action
Next AI should first:

1. Re-fetch PR #1 comments/statuses and confirm whether CodeRabbit responded to comment `4888344795`.
2. If CodeRabbit responds with findings, address actionable correctness/security/data-integrity issues first.
3. If CodeRabbit still does not respond, open CodeRabbit dashboard/login state and confirm whether the GitHub App installation also completed CodeRabbit-side onboarding for the public OSS repo.
4. Once CodeRabbit runs, record the exact GitHub check/status name and update branch-protection guidance to require it with `quality-gate`.
5. Review the same-loop corporate-number quality fixes in `src/lib/corporate-number.ts`, `src/lib/list-quality.ts`, `src/lib/etl/job-planner.ts`, `src/lib/etl/job-runner.ts`, and `tests/etl.test.ts`.
6. Keep Cursor Bugbot optional/reserve only unless a maintainer explicitly asks for supplemental review.

## 11. Suggested Review Scope for Claude Code
Suggested review scope:

- CodeRabbit setup and review evidence:
  - PR #1 comments/status checks
  - CodeRabbit installation settings if needed
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
- The remaining CodeRabbit blocker is review evidence: wait for or diagnose why the app has not replied to PR #1.
- The CodeRabbit GitHub settings page redirected to CodeRabbit login immediately after saving, but returning to GitHub settings confirmed the repository selection was saved.
- `gh` is not authenticated locally; use the GitHub connector or Chrome session for GitHub API-like work unless `gh auth login` is intentionally performed by the maintainer.
- The standing goal remains active; do not mark it complete until live/staging concerns, EDINET completeness, CodeRabbit review evidence, and remaining UX/text polish gaps are resolved.
