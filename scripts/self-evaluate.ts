import { buildEvaluationReport } from "@/lib/etl/self-evaluation";
import { getDashboardMetrics } from "@/lib/data";
import { hasSupabaseConfig } from "@/lib/supabase/server";

async function main() {
  const metrics = await getDashboardMetrics();
  const report = buildEvaluationReport(metrics, { dataMode: hasSupabaseConfig() ? "supabase" : "mock" });
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
