# Testing and Quality Gate

This project treats automated checks as the source of truth for completion. A change is not ready unless the full quality gate passes locally and in CI.

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

Repository maintainers should enable branch protection and require the `quality-gate` workflow before merging.

## Rules for New Work

- Add or update tests with every feature, bug fix, API behavior change, ETL rule change, and important UI flow.
- Do not delete tests to make CI pass.
- Do not use focused, skipped, or todo tests.
- Do not loosen assertions or coverage thresholds to hide implementation defects.
- Fix implementation defects when tests fail. Modify tests only when the test specification is clearly wrong, and document the reason in the change.
- Do not use production databases, production APIs, or production user data in tests.

## Debugging Failures

- For Vitest, inspect terminal output and `coverage/`.
- For Playwright, inspect `playwright-report/` and `test-results/`; CI uploads both as artifacts.
- For E2E console or network failures, check the `unexpected-browser-errors` attachment in the Playwright report.
