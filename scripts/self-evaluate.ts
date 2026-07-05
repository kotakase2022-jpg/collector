import { readFile } from "node:fs/promises";
import { buildEvaluationReport } from "@/lib/etl/self-evaluation";
import { getDashboardMetrics } from "@/lib/data";
import { hasSupabaseConfig } from "@/lib/supabase/server";

const defaultSmokeReportPath = "artifacts/staging-smoke/latest.json";

async function main() {
  const metrics = await getDashboardMetrics();
  const report = buildEvaluationReport(metrics, {
    dataMode: hasSupabaseConfig() ? "supabase" : "mock",
    stagingSmokePassedAt: process.env.STAGING_SMOKE_PASSED_AT ?? (await readStagingSmokePassedAt(process.env.STAGING_SMOKE_REPORT_PATH ?? defaultSmokeReportPath)),
  });
  console.log(JSON.stringify(report, null, 2));
}

async function readStagingSmokePassedAt(reportPath: string) {
  try {
    const report = JSON.parse(await readFile(reportPath, "utf8")) as { ok?: unknown; passedAt?: unknown };
    return report.ok === true && typeof report.passedAt === "string" ? report.passedAt : null;
  } catch {
    return null;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
