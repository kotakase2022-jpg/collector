# AI_HANDOFF

## 0. Current Loop Phase
- Current owner: Codex
- Next owner: Claude Code
- Loop: 21 (production data correction / inferred)
- Loop number inferred from: Previous handoff was Loop 21 and still had Codex as current owner with Claude Code as next owner. The maintainer asked Codex for a small production data correction before Claude Code review, so this remains a Loop 21 production follow-up rather than a new feature loop.
- Phase: Production Data Correction / Handoff
- Last updated: 2026-07-08 22:19 +09:00

## 1. Current Goal
今回の目的：
- Change the company list demo/smoke company name from `Codex Smoke Test Company` to `Test Company`.
- Redeploy the Vercel production URL so both dynamic company list and statically prerendered home content show the updated name.
- Leave the repo and handoff ready for Claude Code.

## 2. Current Branch / Commit / PR
- Branch: `main`
- Latest commit: current local `HEAD` after this handoff-only update; confirm with `git rev-parse --short HEAD`.
- Last known good code-bearing commit: `6dd0c23` (`Record production deployment handoff`)
- Previous handoff commits: `54d2472`, `b9621f5`
- PR: No new PR for this production data-only correction.
- CodeRabbit OSS review status: No new CodeRabbit run in this pass because the functional change was a Supabase production data update, not a PR/code diff. Previous PR #1 review was `pass` / `Review completed` on `f0f4170`.
- Vercel project: `collector`
- Vercel production URL: https://collector-drab.vercel.app
- Vercel production deployment used for data refresh: `dpl_E1yXBfVJ4f1cH5LjxU9BDscpPRER` / READY. A later handoff-only push can create a newer docs-only deployment; inspect the URL alias for the current target.

## 3. What Was Done
今回完了したこと：
- Confirmed `Codex Smoke Test Company` was not present in the repository, so the requested change was production Supabase data rather than static/demo code.
- Queried `collector-production` Supabase with the already-authorized service-role context without printing or saving secrets.
- Confirmed exactly one `companies` row matched `Codex Smoke Test Company`.
- Confirmed no existing `companies` row was named `Test Company`.
- Updated the single target row:
  - Table: `companies`
  - Row id: `3a646571-c230-49b8-9cdd-2a7d3a9f636f`
  - `name`: `Codex Smoke Test Company` -> `Test Company`
- Verified `/companies` immediately showed `Test Company` and no longer included the old name.
- Verified `/` still contained the old name before redeploy because the home page is statically prerendered.
- Redeployed Vercel Production with `npx.cmd vercel deploy --prod --yes --logs`.
- Verified both `/` and `/companies` returned HTTP 200, contained `Test Company`, and did not contain `Codex Smoke Test Company`.

## 4. Files Changed
主な変更ファイル：
- `AI_HANDOFF.md`: refreshed with the production data correction and deploy status.

Non-repository change:
- Supabase `collector-production.public.companies` row `3a646571-c230-49b8-9cdd-2a7d3a9f636f` was updated as requested.

`AGENTS.md` and `CLAUDE.md` were reviewed and did not require updates.

## 5. Current Status
現在の状態：
- `main` was clean and synced before the handoff edit.
- Production Supabase now has `Test Company` instead of `Codex Smoke Test Company` for the target company row.
- Vercel Production redeploy succeeded and is aliased to https://collector-drab.vercel.app.
- Verification after deploy:
  - `/`: HTTP 200, contains `Test Company`, does not contain `Codex Smoke Test Company`.
  - `/companies`: HTTP 200, contains `Test Company`, does not contain `Codex Smoke Test Company`.

## 6. Known Issues
既知の問題：
- EDINET remains unavailable/down and is intentionally not configured in Vercel.
- Search integration remains intentionally unused/unconfigured per maintainer instruction.
- Vercel env vars are configured for `Production` only, not `Preview` or `Development`.
- Supabase project `collector-production` is approved as an isolated pre-real-data environment, but destructive writes/imports still need separate explicit instruction.

## 7. CodeRabbit Review
CodeRabbit OSSの指摘と対応状況：
- Review status: Not run for this pass; no new PR/code diff was created for CodeRabbit review.
- Critical findings: none open from the last reviewed PR head.
- Resolved findings: none newly addressed in this pass.
- Deferred findings: Previous non-blocking nitpick about consolidating `markJobForRetry` / `markJobStopped` remains deferred.
- False positives / not applicable: none.

## 8. Optional Bugbot Findings
Cursor Bugbotの任意確認：
- Status: Not run.
- Findings: None.
- Actions taken: None.

## 9. Verification Results
実行した確認コマンドと結果：
```bash
rg -n "Codex Smoke Test Company|Test Company|Smoke Test" -g "!node_modules" -g "!.next" -g "!.git" .
# success: no repository occurrence of the target company name

# Supabase REST via authorized in-memory service-role context
# success: targetCount=1 for Codex Smoke Test Company; nextCount=0 for Test Company
# success: PATCH companies?id=eq.3a646571-c230-49b8-9cdd-2a7d3a9f636f returned 200 and updatedCount=1

Invoke-WebRequest https://collector-drab.vercel.app/companies
# before redeploy: HTTP 200, Test Company present, Codex Smoke Test Company absent

Invoke-WebRequest https://collector-drab.vercel.app
# before redeploy: HTTP 200, both Test Company and Codex Smoke Test Company present due prerendered home content

npx.cmd vercel deploy --prod --yes --logs
# success: dpl_E1yXBfVJ4f1cH5LjxU9BDscpPRER READY
# alias: https://collector-drab.vercel.app

Invoke-WebRequest https://collector-drab.vercel.app
# success: HTTP 200, Test Company present, Codex Smoke Test Company absent

Invoke-WebRequest https://collector-drab.vercel.app/companies
# success: HTTP 200, Test Company present, Codex Smoke Test Company absent
```

The Vercel build ran `npm run build` remotely and succeeded. Local full `npm run quality` was not rerun because no application code changed; the git hooks for the handoff commit run the repo's integrity/lint/typecheck checks.

## 10. Next Recommended Action
次にClaude Codeが最初にやるべきこと：
1. Open https://collector-drab.vercel.app and confirm the company name appears as `Test Company`.
2. Optionally check the company detail page for row `3a646571-c230-49b8-9cdd-2a7d3a9f636f`.
3. If any code changes are needed later, use a normal PR and CodeRabbit OSS review.

## 11. Suggested Review Scope for Claude Code
Claude Codeに重点レビューしてほしい範囲：
- Production UI visibility of the renamed company.
- Whether any saved list snapshots or exported files should also be updated if they contain historical snapshots of the old name.
- Confirm no secrets or local Vercel/Supabase metadata were committed.

## 12. Risk Notes
リスク・人間確認が必要な事項：
- This pass performed a production Supabase write, but only to the explicitly requested isolated `collector-production` smoke/demo row.
- The row `updated_at` changed as expected through the database trigger.
- Saved list snapshots may retain historical company names if any snapshot was created before the rename; this pass did not rewrite saved list JSON snapshots.
- The service-role key was used only in memory and was not printed, saved, or committed.

## 13. Do Not Touch
触らない方がよい領域：
- Do not commit `.vercel/`, `.env`, `.env.local`, API keys, passwords, tokens, Supabase service-role keys, or OpenAI/EDINET/gBizINFO secrets.
- Do not force-push.
- Do not disable branch protection without restoring it.
- Do not run destructive Supabase writes or import real data into `collector-production` without separate explicit instruction.
- Do not re-enable generic Search API integration unless the maintainer reverses the "Search is unused" decision.

## 14. Notes for Claude Code
Claude Codeへの補足：
- CodeRabbit OSS remains the standard reviewer; Cursor Bugbot is optional/reserve only.
- This was a targeted production data correction, not an app behavior change.
- The old name disappeared from both tested production routes after redeploy.
