# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 20 (inferred, continued)
- Loop number inferred from: Previous `AI_HANDOFF.md` already recorded Loop 20 as the active Codex phase after the Loop 19 Claude Code handoff. This turn continued the same Codex phase for external-service/OpenAI validation and a small EDINET adapter fix.
- Phase: Handoff
- Last updated: 2026-07-08 12:46 +09:00

## 1. Current Goal
Current purpose:
- Immediately test the free/no-key external integrations and OpenAI integration requested by the user.
- If OpenAI API credentials were missing locally, create a key through the logged-in Chrome OpenAI Platform session and use it only transiently for smoke tests.
- Record alternatives/status for external services that still require credentials.
- Fix any concrete mismatch found during the live checks without broad refactoring.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest commit: this commit (`Validate external integrations`; exact hash should be confirmed with `git log -1` after checkout)
- Previous commit before this pass: `86674f6` (`Record Supabase staging smoke success`)
- Last known good commit: this commit, with `npm.cmd run quality` passing locally after the EDINET fix.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: Latest known status before this new commit was `pass` / `Review completed`; recheck after push.

## 3. What Was Done
Completed in this Codex pass:
- Re-read/used the local loop context and prior handoff state for this continuation.
- Confirmed local env was missing:
  - `OPENAI_API_KEY`
  - `GBIZINFO_API_TOKEN`
  - `EDINET_API_KEY`
  - `SEARCH_API_ENDPOINT`
  - `SEARCH_API_KEY`
- Ran free/no-key live checks:
  - NTA corporate-number download page: HTTP 200, HTML received, CSV/download text present.
  - robots policy helper: `https://example.com/robots.txt` allowed crawling the home URL with the default crawl delay.
  - official crawler: crawled `https://example.com/`, captured 1 page, title `Example Domain`, HTML content type.
  - search provider: correctly reported not configured when `SEARCH_API_ENDPOINT`/`SEARCH_API_KEY` were absent.
- Checked credential-required external services:
  - gBizINFO module correctly failed fast because `GBIZINFO_API_TOKEN` was not configured.
  - EDINET documents API without `EDINET_API_KEY` returned HTTP 200 with a body-level 401 error from the upstream API.
- Used the logged-in Chrome OpenAI Platform session as explicitly requested:
  - Project shown in UI: `news-title-rewrite`
  - Organization shown in UI: `suslab`
  - Created key name: `collector-live-smoke-2026-07-08`
  - The key value was copied only through Chrome UI into memory for the smoke tests.
  - The key value was not printed, written to `.env`, committed, or stored in repo files.
  - Chrome clipboard was cleared after the smoke tests.
  - In-memory key variable was cleared after the smoke tests.
- Ran OpenAI live smoke tests:
  - Direct Responses API smoke with `gpt-5.4-mini` returned exactly `collector-openai-smoke-ok`.
  - Repo LLM extraction path `extractCompanyProfileWithLlm` succeeded using the transient key and `OPENAI_EXTRACTION_MODEL=gpt-5.4-mini`.
- Fixed the EDINET adapter mismatch found by the live check:
  - `listEdinetDocuments()` now treats EDINET body-level `StatusCode >= 400` responses as errors instead of silently returning an empty list.
  - Added a regression test for the observed 200/401 body-level error shape.

## 4. Files Changed
Main changed files:
- `src/lib/etl/edinet.ts`
  - Detects EDINET JSON error bodies such as `{ StatusCode: 401, message: "..." }`.
- `tests/etl.test.ts`
  - Adds coverage for EDINET body-level upstream errors.
- `AI_HANDOFF.md`
  - Updated this handoff with live external-service/OpenAI results, verification, risks, and next actions.

Files intentionally not changed:
- `AGENTS.md`
- `CLAUDE.md`

## 5. Current Status
Current state:
- OpenAI integration was tested live and passed through both direct API and the repo extraction module.
- The newly created OpenAI key remains active in the OpenAI Platform project, but its secret value is not available locally because it was not stored.
- Free/no-key checks for NTA, robots handling, and the official crawler passed.
- EDINET now surfaces missing/invalid subscription-key errors correctly.
- gBizINFO and EDINET live data retrieval still require their official free/subscription API keys before real production data enrichment can run.
- Generic web search remains disabled until a search endpoint/key is configured.
- `npm run verify` does not exist; `npm run quality` is the canonical full local gate.

## 6. Known Issues
Known issues:
- `collector-production` still has only the smoke seed data from the prior Supabase smoke pass; real NTA/company data has not been imported.
- The OpenAI key created for this smoke exists in OpenAI Platform but was not saved to a local env file. A maintainer should either revoke it if it was only for this test, or intentionally store/configure a production-safe secret outside the repo.
- gBizINFO live API was not executed because `GBIZINFO_API_TOKEN` is missing.
- EDINET live document retrieval was not executed successfully because `EDINET_API_KEY` is missing; the upstream API returned a body-level 401.
- Search API live discovery was not executed because `SEARCH_API_ENDPOINT`/`SEARCH_API_KEY` are missing.

## 7. CodeRabbit Review
CodeRabbit OSS findings/status:
- Review status: `pass` / `Review completed` before this new local commit; needs recheck after push.
- Critical findings: none known open.
- Resolved findings:
  - EDINET body-level 401 mismatch found during live testing was fixed locally and covered by a regression test.
  - Supabase schema mismatch blocker was already resolved in the previous pass by using `collector-production`.
  - `smoke:staging` blocker was already resolved in the previous pass.
- Deferred findings:
  - Recheck PR #1 after the new commit/push.
  - Real data import and credential-backed gBizINFO/EDINET/search enrichment remain future work.
- False positives / not applicable:
  - None in this pass.

## 8. Optional Bugbot Findings
Cursor Bugbot optional check:
- Status: Not run
- Findings: none
- Actions taken: none
- Rationale: CodeRabbit OSS is available as the standard reviewer. This pass did not change auth, DB schema, payment, destructive data flows, or production deploy logic. OpenAI key handling was bounded to Chrome UI plus transient local memory and documented here.

## 9. Verification Results
Commands and results:

```bash
git status --short --branch
# success before edits: clean on codex/permanent-quality-gate-governance
```

Local env presence check:
```text
OPENAI_API_KEY=missing
GBIZINFO_API_TOKEN=missing
EDINET_API_KEY=missing
SEARCH_API_ENDPOINT=missing
SEARCH_API_KEY=missing
```

Free/no-key live checks:
```text
NTA download page:
  url: https://www.houjin-bangou.nta.go.jp/download/
  ok: true
  status: 200
  content-type: text/html; charset=UTF-8
  bytes: 22134
  csv/download text present: true

robots helper:
  robotsUrl: https://example.com/robots.txt
  canFetchHome: true
  crawlDelayMs: 3000

official crawler:
  url: https://example.com/
  ok: true
  pages: 1
  title: Example Domain
  textBytes: 125
  contentType: text/html

search provider:
  configured: false
  name: null
```

Credential-required live checks:
```text
gBizINFO without token:
  ok: false
  error: GBIZINFO_API_TOKEN is not configured.

Raw EDINET without key:
  HTTP status: 200
  body-level status: 401
  body-level message: Access denied due to invalid subscription key.
```

EDINET after local fix:
```bash
@'
import { listEdinetDocuments } from './src/lib/etl/edinet.ts';
try {
  const docs = await listEdinetDocuments('2025-06-30');
  console.log(JSON.stringify({ ok: true, documents: docs.length }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ ok: false, message: String(error instanceof Error ? error.message : error).slice(0, 220) }, null, 2));
}
'@ | npx.cmd tsx -
# success command execution:
# ok: false
# message: EDINET documents request failed: 401 Access denied due to invalid subscription key...
```

OpenAI live checks:
```text
Chrome OpenAI Platform project: news-title-rewrite
Chrome OpenAI Platform organization: suslab
Created key name: collector-live-smoke-2026-07-08
Secret handling: transient memory only; not printed; not stored; Chrome clipboard cleared.

Direct Responses API:
  model: gpt-5.4-mini
  ok: true
  output: collector-openai-smoke-ok

Repo LLM extraction path:
  function: extractCompanyProfileWithLlm
  transient env: OPENAI_API_KEY and OPENAI_EXTRACTION_MODEL=gpt-5.4-mini
  ok: true
  isOfficial: true
  matchScore: 100
  industry: software testing
  employeeCount: 12
  annualRevenueType: sales
  annualRevenueValue: 12000000
```

Focused regression test:
```bash
npm.cmd run test -- tests/etl.test.ts -t "EDINET list client"
# success:
# Quality guard passed
# Test Files 1 passed
# Tests 1 passed | 121 skipped
```

Full local gate:
```bash
npm.cmd run quality
# success:
# typecheck passed
# lint passed
# unit tests passed: 122 passed
# coverage run passed
# e2e passed: 8 passed
# build passed
```

## 10. Next Recommended Action
Next thing Claude Code should do first:
1. Recheck PR #1 after this commit is pushed:
   - `gh pr checks 1 --repo kotakase2022-jpg/collector`
   - CodeRabbit OSS status/comments
2. Review the small EDINET adapter fix and regression test.
3. Decide key lifecycle for `collector-live-smoke-2026-07-08`:
   - revoke it if it was only for this smoke, or
   - store/configure it through the approved secret manager/env path outside the repo.
4. For free/low-cost alternatives to missing external services:
   - Use NTA official CSV/download data as the no-key baseline source.
   - Use official company website crawling with robots compliance for public facts.
   - Use EDINET only after an official subscription key is configured.
   - Use gBizINFO only after the official token is configured; until then, do not treat it as available.
   - Keep generic search optional/configurable; if unavailable, prefer official URLs from NTA/imported data, gBizINFO UI/API when token exists, EDINET filings, or manually approved official sources.
5. Import approved real data into `collector-production`, then rerun `npm run smoke:staging`.

## 11. Suggested Review Scope for Claude Code
Focus review on:
- `src/lib/etl/edinet.ts` body-level error handling for EDINET documents list responses.
- `tests/etl.test.ts` regression coverage for upstream error-body handling.
- Whether the OpenAI smoke key should be revoked or promoted to managed secret storage.
- Whether any additional external-service docs should be added after actual EDINET/gBizINFO/search credentials are available.
- Confirm no secrets were written to files, logs, handoff docs, or commits.

## 12. Risk Notes
Risks / human confirmation:
- A real OpenAI API key was created in the logged-in OpenAI Platform account as explicitly requested. It remains active unless a maintainer revokes it.
- The OpenAI key secret was visible only once in Chrome and was not persisted by Codex. If the user needs future use, create/configure a managed secret separately.
- The OpenAI smoke made two low-volume live API calls.
- EDINET currently requires a valid subscription key; without it, live document-list requests should fail loudly, as now implemented.
- gBizINFO requires an official token; live calls are blocked until configured.
- `collector-production` still contains only smoke seed data.

## 13. Do Not Touch
Avoid:
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not print or persist OpenAI or Supabase service-role keys.
- Do not delete the Supabase smoke seed row without a maintainer decision.
- Do not use `supabase-erin-envelope` as collector production unless a maintainer explicitly reclassifies it.
- Do not force-push.
- Do not weaken RLS/RPC ACL patterns.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 14. Notes for Claude Code
Notes:
- PowerShell may display Japanese text as mojibake; avoid rewriting UTF-8 docs just because console output looks garbled.
- Full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run.
- Chrome clipboard was cleared after copying the OpenAI key.
- The in-memory OpenAI key variable used by the browser automation was cleared after testing.
- Standing reason not to claim production data readiness: only smoke seed data exists; real data import and credential-backed enrichment remain pending.
