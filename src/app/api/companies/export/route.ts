import { createCompaniesCsv } from "@/lib/csv";
import { getExportRows } from "@/lib/data";
import { parseCompanyFilters } from "@/lib/validation";

type CompaniesExportDependencies = {
  createCompaniesCsv: typeof createCompaniesCsv;
  getExportRows: typeof getExportRows;
  logError: (message: string, error: unknown) => void;
};

const defaultDependencies: CompaniesExportDependencies = {
  createCompaniesCsv,
  getExportRows,
  logError: console.error,
};

export async function companiesExportResponse(requestUrl?: string, dependencies: CompaniesExportDependencies = defaultDependencies) {
  const url = requestUrl ? new URL(requestUrl) : null;
  const filters = parseCompanyFilters(Object.fromEntries(url?.searchParams.entries() ?? []));

  try {
    const rows = await dependencies.getExportRows(filters);
    const csv = dependencies.createCompaniesCsv(rows);

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="companies.csv"',
      },
    });
  } catch (error) {
    dependencies.logError("companiesExportResponse failed", error);
    return new Response("CSV export failed", { status: 500 });
  }
}

export async function GET(request?: Request) {
  return companiesExportResponse(request?.url);
}
