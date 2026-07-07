# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 19 (inferred, continued Codex improvement)
- Loop number inferred from: Previous handoff was already Loop 19 with `Current owner: Codex`, `Next owner: Claude Code`, and no Claude Code handoff occurred before this continuation. This remains Loop 19.
- Phase: Development / Autonomous Improvement / Handoff
- Last updated: 2026-07-08 03:37 +09:00

## 1. Current Goal
今回の目的:
- Continue the standing autonomous improvement goal toward 100/100 on:
  - function / screen-transition / no-bug confidence,
  - daily-use list-generation tool value.
- Keep this pass narrow and CodeRabbit-friendly.
- Reduce list-generation notice drift by reusing the shared `NoticeBanner` for static/info/status boxes in the list-generation and saved-list flows while preserving roles, text, validation, and transitions.

## 2. Current Branch / Commit / PR
- Branch: `codex/permanent-quality-gate-governance`
- Latest code-bearing commit: `2f2fee1c90e55fe763bbc01f620fe7115f5d5f3a` (`Reuse notice banner for list info states`)
- Handoff refresh commit: this handoff-only commit (see `git log -1` after the final push for the exact SHA).
- Last known good commit: `2f2fee1c90e55fe763bbc01f620fe7115f5d5f3a`, with local `npm.cmd run quality` success, GitHub Actions `quality-gate` success, and CodeRabbit `SUCCESS` / `Review completed`.
- PR: ready-for-review PR #1 - https://github.com/kotakase2022-jpg/collector/pull/1
- CodeRabbit OSS review status: `SUCCESS` / `Review completed` on pushed head `2f2fee1c90e55fe763bbc01f620fe7115f5d5f3a`.

## 3. What Was Done
今回完了したこと:
- Re-read required project context before editing:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `AI_HANDOFF.md`
  - `README.md`
  - `package.json`
  - current diff / recent commits / PR status / CodeRabbit status.
- Confirmed the PR was green before editing:
  - `quality-gate`: pass
  - CodeRabbit: pass / `Review completed`.
- Read local Next.js docs before touching App Router pages/client components:
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
- Extended `NoticeBanner` so callers can pass `role={null}` for static informational boxes that should keep the shared visual style without being announced as alerts/status updates.
- Reused `NoticeBanner` in:
  - generated-list duplicate clear state,
  - generated-list manual-exclusion notice,
  - generated-list truncation and export-limit status notices,
  - saved-list no-change / comparison-help / display-summary / pair-no-change notices,
  - CSV import preview static help panel.
- Preserved all existing user-facing text, list generation behavior, saved-list comparison behavior, CSV import validation, CSV parsing, database schema, crawler behavior, and external API behavior.
- Ran targeted checks, the full local quality gate, mock self-evaluation, pushed the code commit, and confirmed GitHub `quality-gate` plus CodeRabbit on the pushed head.
- Did not change `AGENTS.md` or `CLAUDE.md`; their current guidance already covers the workflow and no new persistent rule was introduced.

## 4. Files Changed
主な変更ファイル:
- `src/components/app/notice-banner.tsx`
  - Allows `role={null}` and renders no ARIA role for non-announced static info boxes.
- `src/app/lists/page.tsx`
  - Reuses `NoticeBanner` for generated-list info/status states.
- `src/app/lists/[id]/page.tsx`
  - Reuses `NoticeBanner` for saved-list info/status states.
- `src/components/app/csv-import-preview.tsx`
  - Reuses `NoticeBanner` for the static CSV import help panel.
- `AI_HANDOFF.md`
  - Refreshes Loop 19 continuation, verification, CodeRabbit status, optional Bugbot status, and residual risk.

## 5. Current Status
現在の状態:
- Local full quality gate is green.
- PR #1 latest pushed code head `2f2fee1c90e55fe763bbc01f620fe7115f5d5f3a` is green:
  - `quality-gate`: pass
  - CodeRabbit: pass / `Review completed`
- List-generation/saved-list informational boxes now use the same shared notice component where they are actually notice-like.
- The remaining direct `rounded-md border p-3 text-sm text-muted-foreground` list-page usage is the saved-list comparison `base vs target` header, not a notice, so it was intentionally left unchanged.
- No production DB/API/deploy actions were performed.
- No secrets were read, printed, or committed.
- App remains locally in mock/fallback mode because isolated staging Supabase credentials are not configured.

## 6. Known Issues
既知の問題:
- Neither `202607070001_queue_crawl_jobs_rpc.sql` nor `202607070002_company_fallback_unique_index.sql` has been applied to a real isolated staging Supabase project from this environment.
- If any database already received the original `202607070001` migration before the ACL revokes were added, the three revoke statements must be applied manually on that database.
- If staging already contains duplicate `(name, address)` company rows, `202607070002_company_fallback_unique_index.sql` intentionally fails with a preflight error; duplicates must be reviewed/merged manually before adding the unique index.
- Live/staging Supabase smoke was not run because isolated staging credentials are absent.
- Live EDINET/gBizINFO/Supabase enrichment paths remain unverified against real staging services.
- `npm run verify` does not exist; `npm run quality` is the canonical full gate.
- `npm.cmd run etl:self-evaluate` remains mock-mode only in this environment and reports score `83` / `releaseReady: false`.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況:
- Review status: `SUCCESS` / `Review completed` on pushed head `2f2fee1c90e55fe763bbc01f620fe7115f5d5f3a`.
- Critical findings: none open on the latest checked head.
- Resolved findings:
  - Current pass: notice-like list-generation, saved-list, and CSV import static/status boxes now reuse `NoticeBanner`, with static info boxes explicitly rendered without alert/status roles.
  - Previous Loop 19: CSV import selected-file status and upload error notices reuse `NoticeBanner`, and E2E assertions are scoped to the CSV import panel.
  - Previous Loop 19: generated-list duplicate corporate-number destructive alert now uses `NoticeBanner`.
  - Previous Loop 19: repeated App Router notice banner shells were moved into `src/components/app/notice-banner.tsx`.
  - Previous Loop 19: repeated App Router `value(input)` query-param helper was moved into `src/lib/search-params.ts` and covered by a focused unit test.
  - Previous Loop 19: EDINET ZIP extraction has fixture coverage for both supported compression methods `0` and `8`.
  - Previous Loop 19: saved-list card E2E locator no longer depends on Tailwind utility classes or ancestor XPath; the app exposes a stable card test id.
  - Previous Loop 19: `src/app/companies/page.tsx` no longer duplicates employee/revenue range labels by index; labels are sourced directly from the validation option arrays, with regression coverage.
  - Previous Loop 19: git hook installer tolerates a missing Git executable and has regression coverage.
  - Previous Loop 19: crawler score denominator derives from the same weight map used by score components; exact regression coverage was added.
  - Previous Loop 18: queue crawl RPC execute privileges are restricted to `service_role`; regression coverage enforces the ACL and pinned `search_path`.
  - Previous Loop 18: fallback company upsert has schema-backed `name,address` uniqueness.
  - Earlier Loop 18 findings remain in place: comparison export limits, EDINET lookup, release gates, coverage queue uniqueness, server route error logging, and CSV import source row numbering.
- Deferred findings:
  - Low-risk maintainability nits may still exist in older CodeRabbit comments, but CodeRabbit status is currently passing on the latest head. Claude Code should review any newly posted comments first.
- False positives / not applicable:
  - The older self-evaluation duplicate-helper nit is already addressed in current code; only `normalizeOptionalText` remains.
  - The older saved-list CSV filename nit is already addressed in current code by `sanitizeDownloadFileName` in `src/app/lists/[id]/page.tsx`.
  - The older `job-actions.ts` duplication nit is already addressed in current code by `updateJobIfStatusIn`.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認:
- Status: Not run.
- Findings: none in this pass.
- Actions taken: none.
- Rationale: CodeRabbit OSS was available and passed on the pushed head. This pass was a narrow presentational maintainability cleanup with no auth, DB writes, permissions, payments, deletion, or production-sensitive changes.

## 9. Verification Results
実行した確認コマンドと結果:

```bash
git status --short --branch
# success before editing: clean on codex/permanent-quality-gate-governance

git log --oneline -8
# success: reviewed recent Loop 19 commits before editing

gh pr checks 1 --repo kotakase2022-jpg/collector
# success before editing: CodeRabbit pass / Review completed; quality-gate pass

gh pr view 1 --repo kotakase2022-jpg/collector --json headRefOid,headRefName,isDraft,reviewDecision,statusCheckRollup
# success before editing: PR #1 open, ready for review, checked head fc121ac

$keys = @('NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','STAGING_SMOKE_CONFIRM'); foreach ($key in $keys) { "$key=$([bool][Environment]::GetEnvironmentVariable($key))" }
# success: all three relevant staging/smoke env vars absent; no secret values printed

npm.cmd run typecheck
# success

npm.cmd run lint
# success

npx.cmd playwright test e2e/collector.spec.ts --grep "list generation"
# success: 1 passed

npm.cmd run quality
# success: typecheck, lint, test (112 passed), coverage (112 passed), E2E (8 passed), build

npm.cmd run etl:self-evaluate
# success command execution; mock-mode score 83, releaseReady false

git diff --check
# success: no whitespace errors

git commit -m "Reuse notice banner for list info states"
# success: commit 2f2fee1; hook passed check:test-integrity, lint, typecheck

git push
# success: pre-push passed check:test-integrity, lint, typecheck, test (112 passed)

gh pr checks 1 --repo kotakase2022-jpg/collector --watch
# success after push: CodeRabbit pass / Review completed; quality-gate pass
```

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと:
1. Review the focused Loop 19 continuation diff:
   - `src/components/app/notice-banner.tsx`
   - `src/app/lists/page.tsx`
   - `src/app/lists/[id]/page.tsx`
   - `src/components/app/csv-import-preview.tsx`
   - `AI_HANDOFF.md`
2. Confirm the new `role={null}` `NoticeBanner` use is appropriate for static informational boxes and that dynamic notices still use `role="status"` or default `role="alert"`.
3. Recheck PR #1 if a new CodeRabbit comment appears after this handoff-only update.
4. If continuing toward 100/100, prefer staging evidence next if credentials are available:
   - apply `202607070001` and `202607070002` to an isolated staging Supabase,
   - handle any duplicate `(name, address)` preflight failure manually,
   - run `npm run smoke:staging`.
5. If staging credentials remain unavailable, continue with one narrow CodeRabbit-friendly improvement; verify current code before trusting stale unresolved-thread listings.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲:
- Notice semantics:
  - static information boxes pass `role={null}`,
  - truncation/export-limit summaries still use `role="status"`,
  - actual error/duplicate destructive notices still use `role="alert"` through the default `NoticeBanner` role.
- Visual consistency:
  - list-generation and saved-list notices keep the same spacing and tone,
  - warning status keeps amber styling,
  - CSV import static help panel remains visually unchanged.
- PR status accuracy:
  - confirm latest pushed code head `2f2fee1c90e55fe763bbc01f620fe7115f5d5f3a` remains green after this handoff-only update.
- Residual staging risk:
  - confirm the handoff is honest that 100/100 cannot be claimed without isolated staging smoke/live evidence.

## 12. Risk Notes
リスク・人間確認が必要な事項:
- This pass touched presentational notification rendering in list-generation/saved-list/CSV-import UI only; it did not change database schema, server actions, auth, permissions, crawler execution, external API behavior, CSV parsing, or persisted data.
- No production or staging database was touched in this pass.
- Migration `202607070001_queue_crawl_jobs_rpc.sql` was edited in a previous pass based on the statement that it has not been applied to any real Supabase project. If it has been applied anywhere, manually run the added revoke statements there.
- Migration `202607070002_company_fallback_unique_index.sql` is intentionally non-destructive; duplicate `(name, address)` rows require human review before the index can be added.
- Remaining reason not to claim 100/100: no isolated staging Supabase migration/smoke evidence and no live external-service validation are available from this environment.

## 13. Do Not Touch
触らない方がよい領域:
- Do not commit `.env`, `.env.local`, API keys, passwords, tokens, or Supabase/OpenAI secrets.
- Do not run tests against production Supabase or production APIs.
- Do not apply migrations to production without maintainer sign-off.
- Do not remove or weaken tests to make checks pass.
- Do not force-push.
- Do not weaken the RPC ACL pattern for new `create function` migrations.
- Do not edit generated/cache outputs (`.next/`, `coverage/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo`).

## 14. Notes for Claude Code
Claude Codeへの補足:
- Before touching Next.js pages, route handlers, or component boundaries, read the relevant local docs under `node_modules/next/dist/docs/`; this pass read the Server/Client Components and `page.tsx` file-convention docs before editing App Router page UI.
- The full quality gate is `npm run quality`; `npm run verify` does not exist.
- CodeRabbit OSS is the standard reviewer; Cursor Bugbot was not run in this pass.
- PowerShell may display Japanese text as mojibake; do not rewrite UTF-8 Japanese UI/docs solely because console output looks garbled.
- Standing self-score after this pass:
  - Function / screen-transition / no-bug confidence: 99 / 100
  - Daily-use list-generation tool value: 99 / 100
- Remaining reason not 100/100: staging Supabase migration/smoke proof and live external-service validation are still missing from this environment.
