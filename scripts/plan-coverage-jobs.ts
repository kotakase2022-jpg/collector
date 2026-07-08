import { queueCoverageJobs } from "@/lib/etl/job-planner";

async function main() {
  const args = new Set(process.argv.slice(2));
  const limit = parseLimit(process.argv.find((arg) => arg.startsWith("--limit=")));
  const result = await queueCoverageJobs({ dryRun: args.has("--dry-run"), limit });
  console.log(JSON.stringify(result, null, 2));
}

function parseLimit(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value.split("=")[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
