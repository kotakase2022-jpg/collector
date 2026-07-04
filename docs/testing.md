# Testing and Quality Gate

This project treats automated checks as the source of truth for completion. A change is not ready unless the full quality gate passes locally and in CI.

## Required Development Flow

All future changes from Codex, Cursor, and human contributors must go through a pull request before merging to `main`. Direct pushes to `main` are for repository bootstrapping or emergency owner recovery only; normal feature work, bug fixes, refactors, dependency updates, and documentation changes must use a branch and PR.

Do not mark work complete unless `npm run quality` passes locally or an equivalent GitHub Actions `quality-gate` run passes on the PR. The PR template requires the author to list changed behavior, affected areas, added or updated tests, commands run, E2E flows checked, and safety confirmations.

## Local Commands

- `npm run typecheck`: TypeScript type checking.
- `npm run lint`: ESLint checks.
- `npm run check:test-integrity`: rejects focused, skipped, todo, assertion-less, or suspiciously commented tests.
- `npm test`: unit and integration tests with Vitest.
- `npm run test:coverage`: Vitest coverage with non-zero thresholds for lines, branches, functions, and statements.
- `npm run test:e2e`: Playwright Chromium desktop E2E tests.
- `npm run build`: production Next.js build.
- `npm run quality`: runs typecheck, lint, unit tests, coverage, E2E, and build in order. Any failure fails the command.

## Fixtures

Fixtures live under `tests/fixtures/`:

- `tests/fixtures/csv/normal-nta.csv`
- `tests/fixtures/csv/empty.csv`
- `tests/fixtures/csv/invalid-nta.csv`
- `tests/fixtures/csv/boundary-nta.csv`
- `tests/fixtures/api/gbizinfo-success.json`
- `tests/fixtures/api/error-response.json`
- `tests/fixtures/db/companies.json`

Fixtures must not contain real personal data, production user data, API keys, or confidential company data.

## E2E Policy

Playwright tests run against Chromium desktop and start a local Next.js dev server on `localhost:4211`. Tests verify navigation, search, detail pages, CSV export, API failure handling, and job form behavior.

The E2E error guard fails tests on unexpected:

- `console.error`
- `pageerror`
- failed network requests
- HTTP 4xx/5xx responses

When a test intentionally exercises an API failure, the allowed failure must be declared in the test with a narrow URL/status allow-list.

## Environment Variables

Local and CI tests use mock/fallback data unless Supabase credentials are explicitly configured. Do not point CI tests at production Supabase projects or production OpenAI/search API keys.

Required production variables are documented in `.env.example`; test runs should keep secrets unset or use isolated staging credentials.

## CI

`.github/workflows/quality-gate.yml` runs on pull requests and pushes to `main` or `master`. It installs dependencies, installs Playwright Chromium, runs all quality checks, and uploads Playwright traces/screenshots/reports plus coverage artifacts.

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
