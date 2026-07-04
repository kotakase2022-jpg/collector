import { createCompaniesCsv } from "@/lib/csv";
import { getExportRows } from "@/lib/data";

export async function GET() {
  const rows = await getExportRows();
  const csv = createCompaniesCsv(rows);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="companies.csv"',
    },
  });
}
