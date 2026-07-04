import { createCompaniesCsv } from "@/lib/csv";
import { getCompanies, getDashboardMetrics, getExportRows } from "@/lib/data";
import { getSavedCompanyLists } from "@/lib/lists";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

const confirmValue = "read-only";
const maxSampleRows = 25;

type TableCheck = {
  table: string;
  count: number | null;
  sampleRows: number;
};

const requiredTables = [
  { table: "companies", columns: "id, corporate_number, name, updated_at" },
  { table: "company_sources", columns: "id, company_id, source_url" },
  { table: "company_observations", columns: "id, company_id, field_name" },
  { table: "crawl_jobs", columns: "id, company_id, status" },
  { table: "saved_company_lists", columns: "id, name, filters" },
  { table: "saved_company_list_items", columns: "list_id, company_id, position" },
] as const;

async function main() {
  if (process.env.STAGING_SMOKE_CONFIRM !== confirmValue) {
    throw new Error(`Set STAGING_SMOKE_CONFIRM=${confirmValue} to confirm this read-only staging smoke test.`);
  }
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase env is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for an isolated staging project.");
  }

  const supabase = getSupabaseAdmin();
  const tableChecks = await Promise.all(requiredTables.map(({ table, columns }) => checkTableAccess(supabase, table, columns)));
  const [metrics, companies, exportRows, savedLists] = await Promise.all([
    getDashboardMetrics(),
    getCompanies({}, { limit: maxSampleRows }),
    getExportRows({}, { limit: maxSampleRows }),
    getSavedCompanyLists(),
  ]);

  if (!companies.length) {
    throw new Error("Staging Supabase is reachable, but companies has no rows. Import NTA seed data before smoke-testing workflows.");
  }
  if (!exportRows.length) {
    throw new Error("CSV export smoke failed because no export rows were produced.");
  }

  const csv = createCompaniesCsv(exportRows);
  if (!csv.startsWith("\uFEFF") || !csv.includes("corporate_number,company_name,official_url,industry")) {
    throw new Error("CSV export smoke failed because the generated CSV is missing BOM or required headers.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "read-only",
        supabaseHost: maskSupabaseHost(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
        tableChecks,
        metrics,
        sampledCompanies: companies.length,
        sampledExportRows: exportRows.length,
        savedLists: savedLists.length,
      },
      null,
      2,
    ),
  );
}

async function checkTableAccess(supabase: ReturnType<typeof getSupabaseAdmin>, table: string, columns: string): Promise<TableCheck> {
  const { count, data, error } = await supabase.from(table).select(columns, { count: "exact" }).limit(1);
  if (error) {
    throw new Error(`Supabase Data API access failed for ${table}: ${error.message}`);
  }
  return {
    table,
    count: count ?? null,
    sampleRows: data?.length ?? 0,
  };
}

function maskSupabaseHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return "(invalid-url)";
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
