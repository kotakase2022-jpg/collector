# Testing and Quality Gate

This project treats automated checks as the source of truth for completion. A change is not ready unless the full quality gate passes locally and in CI.

## Required Development Flow

All future changes from Codex, Claude Code, and human contributors must go through a pull request before merging to `main`. Direct pushes to `main` are for repository bootstrapping or emergency owner recovery only; normal feature work, bug fixes, refactors, dependency updates, and documentation changes must use a branch and PR.

Do not mark work complete unless `npm run quality` passes locally or an equivalent GitHub Actions `quality-gate` run passes on the PR. The PR template requires the author to list changed behavior, affected areas, added or updated tests, commands run, E2E flows checked, and safety confirmations.

## PR Review Standard

CodeRabbit OSS is the standard automated PR reviewer for this public repository. Maintainers should install the CodeRabbit GitHub App for `kotakase2022-jpg/collector` and confirm the repository is reviewed under CodeRabbit's open-source/public repository plan before relying on it as a required reviewer.

Useful official references:

- CodeRabbit plans: https://docs.coderabbit.ai/management/plans
- CodeRabbit pricing/FAQ: https://coderabbit.ai/pricing and https://coderabbit.ai/faq

As of 2026-07-06, CodeRabbit documents an `Open source` plan for public repositories with a separate OSS review rate-limit tier. Treat this as an external service policy: confirm it in CodeRabbit/GitHub during setup, and update this document if CodeRabbit changes its OSS terms.

Normal review flow:

- Codex implements a focused change on a branch and opens or updates a PR.
- `quality-gate` must pass on the PR.
- CodeRabbit reviews the PR diff. Actionable findings must be fixed or explicitly resolved with a reason.
- Claude Code reviews the CodeRabbit findings, the diff, and the verification results.
- CodeRabbit may review the updated PR again when code changes are pushed after Claude Code feedback.

Initial setup checklist:

- Install or enable the CodeRabbit GitHub App for this public repository.
- Confirm CodeRabbit recognizes the repository as OSS/public and that PR review is enabled.
- Open or update a PR and request a review if needed, for example with `@coderabbitai full review`.
- The CodeRabbit GitHub status-check name is `CodeRabbit`.
- Add the `CodeRabbit` check to branch protection together with `quality-gate` after it has completed successfully at least once.

Cursor Bugbot is optional/reserve only. Use it when CodeRabbit is unavailable, inconclusive, or a maintainer explicitly requests an additional review. Do not spend Bugbot usage for the default PR loop when CodeRabbit OSS is available.

`AI_HANDOFF.md` should record CodeRabbit findings and response status. If Cursor Bugbot was also used, record it separately as supplemental review context.

## Local Commands

- `npm run typecheck`: TypeScript type checking.
- `npm run lint`: ESLint checks.
- `npm run check:test-integrity`: rejects focused, skipped, todo, assertion-less, or suspiciously commented tests.
- `npm test`: unit and integration tests with Vitest.
- `npm run test:coverage`: Vitest coverage with non-zero thresholds for lines, branches, functions, and statements.
- `npm run test:e2e`: Playwright Chromium desktop E2E tests.
- `npm run build`: production Next.js build.
- `npm run quality`: runs typecheck, lint, unit tests, coverage, E2E, and build in order. Any failure fails the command.
- `npm run smoke:staging`: read-only Supabase staging smoke test. Run only with isolated staging credentials and `STAGING_SMOKE_CONFIRM=read-only`.
- `npm run etl:self-evaluate`: prints crawler coverage, release gate status, staging smoke evidence status, and operational risks.

## Fixtures

Fixtures live under `tests/fixtures/`:

- `tests/fixtures/csv/normal-nta.csv`
- `tests/fixtures/csv/empty.csv`
- `tests/fixtures/csv/invalid-nta.csv`
- `tests/fixtures/csv/boundary-nta.csv`
- `tests/fixtures/csv/list-upload.csv`
- `tests/fixtures/api/gbizinfo-success.json`
- `tests/fixtures/api/error-response.json`
- `tests/fixtures/db/companies.json`

Fixtures must not contain real personal data, production user data, API keys, or confidential company data.

## E2E Policy

Playwright tests run against Chromium desktop and start a production-like Next.js server on `localhost:4211` by running `npm run build && npm run start -- --port 4211`. Tests verify navigation, list generation, saved-list reuse, saved-list edit/delete dry-runs, CSV upload preview, search, detail pages, CSV export, API failure handling, and job form behavior.

The E2E error guard fails tests on unexpected:

- `console.error`
- `pageerror`
- failed network requests
- HTTP 4xx/5xx responses

When a test intentionally exercises an API failure, the allowed failure must be declared in the test with a narrow URL/status allow-list.

## Environment Variables

Local and CI tests use mock/fallback data unless Supabase credentials are explicitly configured. Do not point CI tests at production Supabase projects or production external API keys.

Required production variables are documented in `.env.example`; test runs should keep secrets unset or use isolated staging credentials.

## Staging Smoke Test

`npm run smoke:staging` is the required final check before treating a Supabase-connected release candidate as production-ready. It does not write data, schedule jobs, crawl websites, call OpenAI, or touch production APIs. It verifies:

- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present.
- The service role can read the core Data API tables: `companies`, `company_sources`, `company_observations`, `crawl_jobs`, `saved_company_lists`, and `saved_company_list_items`.
- Dashboard metrics, company list reads, saved-list reads, and CSV generation work with a small sample.
- `companies` has at least one row, so the application is not merely migrated but unseeded.

Run it only against an isolated staging Supabase project:

```bash
STAGING_SMOKE_CONFIRM=read-only npm run smoke:staging
```

GitHub also provides a manual `staging-smoke` workflow. Configure a protected `staging` Environment with these secrets before using it:

- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`

Then open `Actions` -> `staging-smoke` -> `Run workflow`. The workflow intentionally fails when either secret is missing or when the staging database is migrated but has no `companies` rows.

Never run staging smoke against production unless a maintainer explicitly declares a read-only production verification window. The script is read-only, but it still uses privileged server credentials.

On success, the smoke script writes `artifacts/staging-smoke/latest.json` by default. The report includes the current commit SHA from `GITHUB_SHA`, `VERCEL_GIT_COMMIT_SHA`, or local `git rev-parse HEAD`. The manual GitHub workflow uploads the same directory as the `staging-smoke-report` artifact. `npm run etl:self-evaluate` reads that report, or the `STAGING_SMOKE_PASSED_AT` / `STAGING_SMOKE_COMMIT_SHA` overrides, and keeps `releaseReady: false` when Supabase mode lacks smoke evidence or when the smoke report commit does not match `STAGING_SMOKE_EXPECTED_SHA`, `GITHUB_SHA`, or `VERCEL_GIT_COMMIT_SHA`. This makes stale staging evidence visible without relying on memory or a PR comment.

## CI

`.github/workflows/quality-gate.yml` runs on pull requests and pushes to `main` or `master`. It installs dependencies, installs Playwright Chromium, runs all quality checks, and uploads Playwright traces/screenshots/reports plus coverage artifacts.

`.github/workflows/staging-smoke.yml` is manual-only through `workflow_dispatch`. It is not part of the default PR gate because it requires isolated staging Supabase credentials, but it must pass before a Supabase-connected release candidate is considered production-ready.
The workflow uploads `staging-smoke-report` when a report file exists, including on failed runs where partial evidence was produced.

The workflow is intentionally all-or-nothing. A failure in any of the following fails the entire CI run:

- `npm run typecheck`
- `npm run lint`
- `npm run check:test-integrity`
- `npm test`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run build`
- Playwright artifact upload runs with `if: always()` so traces, screenshots, videos, and reports remain available after failures.

## Branch Protection

Repository maintainers must protect `main` in GitHub settings:

- Go to `Settings` -> `Branches` -> `Add branch protection rule`.
- Set branch name pattern to `main`.
- Enable `Require a pull request before merging`.
- Enable `Require status checks to pass before merging`.
- Select the `quality-gate` status check as required.
- After CodeRabbit has completed successfully at least once, add the `CodeRabbit` status check as required too.
- Enable `Require branches to be up to date before merging`.
- Restrict direct pushes to `main`.
- Do not allow bypassing these settings when the repository plan and permissions support that option.

If GitHub API permissions are available, the same policy may be applied through the Branch Protection API. Until that is configured, this document is the required manual operating procedure.

## Vercel Deployment

Production Vercel deployments must be sourced from `main` only. A change should reach production only after it has entered `main` through a PR with a passing `quality-gate` run.

## Rules for New Work

- Add or update tests with every feature, bug fix, API behavior change, ETL rule change, and important UI flow.
- Add a corresponding Playwright E2E test for every new screen.
- Add success and failure tests for every new form.
- Add success, failure, and authorization/error-path tests for every new API route.
- Add or update fixtures for CSV, PDF, image, file export, and file upload behavior changes.
- Add data integrity tests for Supabase table, RLS, migration, or persistence changes.
- For bug fixes, first add a reproduction test and confirm it fails before fixing the implementation whenever practical.
- Do not delete tests to make CI pass.
- Do not use focused, skipped, or todo tests.
- Do not loosen assertions or coverage thresholds to hide implementation defects.
- Fix implementation defects when tests fail. Modify tests only when the test specification is clearly wrong, and document the reason in the change.
- Do not use production databases, production APIs, or production user data in tests.

## Local Git Hooks

This repository includes tracked hooks under `.githooks/`. `npm install` runs `npm run prepare`, which points Git at that hooks directory.

- `pre-commit` runs test integrity checks, lint, and typecheck.
- `pre-push` runs test integrity checks, lint, typecheck, and Vitest unit/integration tests.

E2E and production build remain enforced by GitHub Actions because they are heavier and need consistent CI artifacts. Run `npm run quality` before opening or updating a PR.

## Debugging Failures

- For Vitest, inspect terminal output and `coverage/`.
- For Playwright, inspect `playwright-report/` and `test-results/`; CI uploads both as artifacts.
- For E2E console or network failures, check the `unexpected-browser-errors` attachment in the Playwright report.
