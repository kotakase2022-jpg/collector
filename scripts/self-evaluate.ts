import { readFile } from "node:fs/promises";
import { buildEvaluationReport } from "@/lib/etl/self-evaluation";
import { getDashboardMetrics } from "@/lib/data";
import { hasSupabaseConfig } from "@/lib/supabase/server";

const defaultSmokeReportPath = "artifacts/staging-smoke/latest.json";

async function main() {
  const metrics = await getDashboardMetrics();
  const smokeEvidence = await readStagingSmokeEvidence(process.env.STAGING_SMOKE_REPORT_PATH ?? defaultSmokeReportPath);
  const report = buildEvaluationReport(metrics, {
    dataMode: hasSupabaseConfig() ? "supabase" : "mock",
    stagingSmokePassedAt: process.env.STAGING_SMOKE_PASSED_AT ?? smokeEvidence.passedAt,
    stagingSmokeCommitSha: process.env.STAGING_SMOKE_COMMIT_SHA ?? smokeEvidence.commitSha,
    expectedCommitSha: process.env.STAGING_SMOKE_EXPECTED_SHA ?? process.env.GITHUB_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA,
  });
  console.log(JSON.stringify(report, null, 2));
}

async function readStagingSmokeEvidence(reportPath: string) {
  try {
    const report = JSON.parse(await readFile(reportPath, "utf8")) as { ok?: unknown; passedAt?: unknown; commitSha?: unknown };
    return {
      passedAt: report.ok === true && typeof report.passedAt === "string" ? report.passedAt : null,
      commitSha: report.ok === true && typeof report.commitSha === "string" ? report.commitSha : null,
    };
  } catch {
    return { passedAt: null, commitSha: null };
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
