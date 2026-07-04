import { createCompaniesCsv } from "@/lib/csv";
import { getExportRows } from "@/lib/data";
import { parseCompanyFilters } from "@/lib/validation";

export async function GET(request?: Request) {
  const url = request ? new URL(request.url) : null;
  const filters = parseCompanyFilters(Object.fromEntries(url?.searchParams.entries() ?? []));
  const rows = await getExportRows(filters);
  const csv = createCompaniesCsv(rows);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="companies.csv"',
    },
  });
}
