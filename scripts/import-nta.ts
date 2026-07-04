import { readFile } from "node:fs/promises";
import { importNtaCsv } from "@/lib/etl/nta";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: npm run etl:import-nta -- path/to/nta.csv");
  const csv = await readFile(file, "utf8");
  const result = await importNtaCsv(csv);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

