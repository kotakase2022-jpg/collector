import { evaluateCurrentImplementation } from "@/lib/etl/self-evaluation";
import { getDashboardMetrics } from "@/lib/data";

async function main() {
  const metrics = await getDashboardMetrics();
  const result = evaluateCurrentImplementation(metrics);
  console.log(JSON.stringify({ metrics, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

