## Summary

- 

## Impact

- 

## Tests Added or Updated

- 

## Commands Run

- [ ] `npm run quality`
- [ ] `npm run smoke:staging` or manual `staging-smoke` workflow, when this change affects Supabase persistence, ETL, release readiness, or staging data access.
- 

## Automated Review

- [ ] CodeRabbit OSS reviewed this PR, or CodeRabbit is not yet installed/available and the reason is documented below.
- [ ] Actionable CodeRabbit findings were fixed or explicitly resolved with a reason.
- [ ] Cursor Bugbot was not required for the default flow, or it was intentionally used as supplemental/fallback review and the reason is documented below.
- CodeRabbit / supplemental review notes:

## E2E Flows Checked

- 

## Quality Gate Checklist

- [ ] `npm run quality` completed successfully.
- [ ] Typecheck, lint, unit/integration tests, coverage, E2E, and production build all pass.
- [ ] I did not delete, skip, focus, comment out, or weaken existing tests to make this pass.
- [ ] I did not weaken coverage, E2E, console error, pageerror, network error, or API failure checks.
- [ ] This change does not mutate production DBs, production APIs, or production user data.
- [ ] Any new screen has corresponding E2E coverage.
- [ ] Any new form has success and failure tests.
- [ ] Any new API has success, failure, and authorization/error-path tests.
- [ ] Any CSV/PDF/image/upload behavior has fixtures added or updated.
- [ ] Any Supabase schema, RLS, or persistence change has data integrity tests.
- [ ] Supabase-connected release candidates have a passing read-only staging smoke check.
