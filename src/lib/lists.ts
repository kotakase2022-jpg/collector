import type { CompanyExportRow } from "@/lib/csv";
import { exportRowLimit, getCompanies } from "@/lib/data";
import { buildListQualitySummary } from "@/lib/list-quality";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import type { Company, CompanyFilters, ListQualitySummary, SavedCompanyList } from "@/lib/types";

export type SavedCompanyListDetail = {
  list: SavedCompanyList;
  companies: Company[];
  quality: ListQualitySummary;
};

const now = new Date("2026-07-03T09:00:00+09:00").toISOString();
const savedListItemInsertBatchSize = 500;
const mockSavedListDefinitions: SavedCompanyList[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "高信頼URLあり営業リスト",
    description: "公式URLと高信頼スコアが揃った企業を優先して確認するリスト",
    filters: { hasUrl: "yes", minConfidence: 80, sort: "confidence_desc" },
    row_count: 0,
    created_at: now,
    updated_at: now,
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    name: "補完が必要な企業リスト",
    description: "年商や従業員数の不足を補完する対象",
    filters: { hasRevenue: "no", sort: "employee_desc" },
    row_count: 0,
    created_at: now,
    updated_at: now,
  },
];

export async function getSavedCompanyLists(): Promise<SavedCompanyList[]> {
  if (!hasSupabaseConfig()) {
    return Promise.all(
      mockSavedListDefinitions.map(async (list) => ({
        ...list,
        row_count: (await getCompanies(list.filters)).length,
      })),
    );
  }

  const { data, error } = await getSupabaseAdmin().from("saved_company_lists").select("*").order("updated_at", { ascending: false }).limit(50);
  if (error) throw error;
  return ((data ?? []) as SavedCompanyList[]).map(normalizeSavedList);
}

export async function getSavedCompanyListDetail(id: string): Promise<SavedCompanyListDetail | null> {
  if (!hasSupabaseConfig()) {
    const list = (await getSavedCompanyLists()).find((item) => item.id === id);
    if (!list) return null;
    const companies = await getCompanies(list.filters);
    return { list: { ...list, row_count: companies.length }, companies, quality: buildListQualitySummary(companies) };
  }

  const supabase = getSupabaseAdmin();
  const [listResult, itemResult] = await Promise.all([
    supabase.from("saved_company_lists").select("*").eq("id", id).maybeSingle(),
    supabase.from("saved_company_list_items").select("snapshot").eq("list_id", id).order("position", { ascending: true }),
  ]);

  if (listResult.error) throw listResult.error;
  if (itemResult.error) throw itemResult.error;
  if (!listResult.data) return null;

  const companies = ((itemResult.data ?? []) as { snapshot: Company }[]).map((item) => item.snapshot).filter((company) => company?.id);
  const list = normalizeSavedList(listResult.data as SavedCompanyList);
  return { list: { ...list, row_count: companies.length }, companies, quality: buildListQualitySummary(companies) };
}

export async function createSavedCompanyList(input: { name: string; description?: string; filters: CompanyFilters }) {
  const companies = await getCompanies(input.filters, { limit: exportRowLimit });
  if (!hasSupabaseConfig()) {
    return { dryRun: true, rowCount: companies.length, id: null };
  }

  const supabase = getSupabaseAdmin();
  const { data: list, error: listError } = await supabase
    .from("saved_company_lists")
    .insert({
      name: input.name,
      description: input.description || null,
      filters: input.filters,
      row_count: companies.length,
    })
    .select("*")
    .single();

  if (listError) throw listError;

  await insertSavedCompanyListItems(supabase, String(list.id), companies);

  return { dryRun: false, rowCount: companies.length, id: String(list.id) };
}

export async function updateSavedCompanyList(input: { id: string; name: string; description?: string; filters: CompanyFilters }) {
  const companies = await getCompanies(input.filters, { limit: exportRowLimit });
  if (!hasSupabaseConfig()) {
    return { dryRun: true, rowCount: companies.length, id: input.id };
  }

  const supabase = getSupabaseAdmin();
  const { data: list, error: listError } = await supabase
    .from("saved_company_lists")
    .update({
      name: input.name,
      description: input.description || null,
      filters: input.filters,
      row_count: companies.length,
    })
    .eq("id", input.id)
    .select("id")
    .maybeSingle();

  if (listError) throw listError;
  if (!list) return { dryRun: false, rowCount: 0, id: null };

  const { error: deleteError } = await supabase.from("saved_company_list_items").delete().eq("list_id", input.id);
  if (deleteError) throw deleteError;

  await insertSavedCompanyListItems(supabase, input.id, companies);

  return { dryRun: false, rowCount: companies.length, id: input.id };
}

export async function deleteSavedCompanyList(id: string) {
  if (!hasSupabaseConfig()) {
    return { dryRun: true, id };
  }

  const { error } = await getSupabaseAdmin().from("saved_company_lists").delete().eq("id", id);
  if (error) throw error;
  return { dryRun: false, id };
}

export async function getSavedListExportRows(id: string): Promise<CompanyExportRow[] | null> {
  const detail = await getSavedCompanyListDetail(id);
  if (!detail) return null;
  return detail.companies.map((company) => ({
    corporate_number: company.corporate_number ?? "",
    company_name: company.name,
    official_url: company.official_url ?? "",
    industry: company.industry ?? "",
    employee_count: company.employee_count == null ? "" : company.employee_count,
    employee_count_type: company.employee_count_type,
    annual_revenue: company.annual_revenue == null ? "" : company.annual_revenue,
    annual_revenue_type: company.annual_revenue_type,
    revenue_range: company.revenue_range ?? "",
    confidence_score: company.data_confidence_score,
    source_urls: "",
    updated_at: company.updated_at,
  }));
}

function normalizeSavedList(list: SavedCompanyList): SavedCompanyList {
  return {
    ...list,
    filters: (list.filters ?? {}) as CompanyFilters,
    description: list.description ?? null,
  };
}

async function insertSavedCompanyListItems(supabase: ReturnType<typeof getSupabaseAdmin>, listId: string, companies: Company[]) {
  for (let index = 0; index < companies.length; index += savedListItemInsertBatchSize) {
    const batch = companies.slice(index, index + savedListItemInsertBatchSize);
    if (!batch.length) continue;
    const { error } = await supabase.from("saved_company_list_items").insert(buildSavedCompanyListItemRows(listId, batch, index));
    if (error) throw error;
  }
}

export function buildSavedCompanyListItemRows(listId: string, companies: Company[], offset = 0) {
  return companies.map((company, index) => ({
    list_id: listId,
    company_id: company.id,
    position: offset + index + 1,
    snapshot: company,
  }));
}
