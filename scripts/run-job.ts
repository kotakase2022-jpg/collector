import { runNextCrawlJob } from "@/lib/etl/job-runner";

async function main() {
  const result = await runNextCrawlJob();
  console.log(JSON.stringify({ ran: Boolean(result), jobId: result?.id ?? null }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

