import type { CompanyExportRow, SavedListComparisonExportRow } from "@/lib/csv";
import { exportRowLimit, getCompanies, getSourceUrlsByCompanyIds } from "@/lib/data";
import { buildListQualitySummary } from "@/lib/list-quality";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import type { Company, CompanyFilters, ListQualitySummary, SavedCompanyList } from "@/lib/types";

export type SavedCompanyListDetail = {
  list: SavedCompanyList;
  companies: Company[];
  quality: ListQualitySummary;
  comparison: SavedCompanyListComparison;
};

export type SavedCompanyListSnapshot = {
  list: SavedCompanyList;
  companies: Company[];
};

export type SavedCompanyListComparison = {
  savedCount: number;
  currentCount: number;
  unchangedCount: number;
  changedCount: number;
  addedCount: number;
  removedCount: number;
  hasChanges: boolean;
  changedCompanies: SavedCompanyListChangedCompany[];
  addedCompanies: SavedCompanyListComparisonCompany[];
  removedCompanies: SavedCompanyListComparisonCompany[];
};

export type SavedCompanyListPairComparison = SavedCompanyListComparison & {
  baseList: Pick<SavedCompanyList, "id" | "name" | "row_count" | "updated_at">;
  targetList: Pick<SavedCompanyList, "id" | "name" | "row_count" | "updated_at">;
};

export type SavedCompanyListComparisonCompany = Pick<Company, "id" | "name" | "corporate_number">;

export type SavedCompanyListComparableField =
  | "official_url"
  | "industry"
  | "employee_count"
  | "employee_count_type"
  | "annual_revenue"
  | "annual_revenue_type"
  | "data_confidence_score";

export type SavedCompanyListFieldChange = {
  field: SavedCompanyListComparableField;
  before: string | number | null;
  after: string | number | null;
};

export type SavedCompanyListChangedCompany = SavedCompanyListComparisonCompany & {
  changes: SavedCompanyListFieldChange[];
};

export type SaveCompanyListRpcItem = {
  company_id: string;
  position: number;
  snapshot: Company;
};

export type SaveCompanyListRpcArgs = {
  p_id: string | null;
  p_name: string;
  p_description: string | null;
  p_filters: CompanyFilters;
  p_items: SaveCompanyListRpcItem[];
};

type SavedListRpcClient = {
  rpc: (fn: "save_company_list", args: SaveCompanyListRpcArgs) => PromiseLike<{ data: unknown; error: Error | { message: string } | null }>;
};

const now = new Date("2026-07-03T09:00:00+09:00").toISOString();
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

export async function getSavedCompanyListSnapshot(id: string): Promise<SavedCompanyListSnapshot | null> {
  if (!hasSupabaseConfig()) {
    const list = (await getSavedCompanyLists()).find((item) => item.id === id);
    if (!list) return null;
    const companies = await getCompanies(list.filters);
    return {
      list: { ...list, row_count: companies.length },
      companies,
    };
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

  return {
    list: { ...list, row_count: companies.length },
    companies,
  };
}

export async function getSavedCompanyListDetail(id: string): Promise<SavedCompanyListDetail | null> {
  const snapshot = await getSavedCompanyListSnapshot(id);
  if (!snapshot) return null;
  const currentCompanies = await getCompanies(snapshot.list.filters, { limit: exportRowLimit });

  return {
    ...snapshot,
    quality: buildListQualitySummary(snapshot.companies),
    comparison: buildSavedCompanyListComparison(snapshot.companies, currentCompanies),
  };
}

export async function getSavedCompanyListPairComparison(baseId: string, targetId: string, previewLimit = 5): Promise<SavedCompanyListPairComparison | null> {
  const [baseSnapshot, targetSnapshot] = await Promise.all([getSavedCompanyListSnapshot(baseId), getSavedCompanyListSnapshot(targetId)]);
  if (!baseSnapshot || !targetSnapshot) return null;
  return buildSavedCompanyListPairComparison(baseSnapshot, targetSnapshot, previewLimit);
}

export async function getSavedListComparisonExportRows(baseId: string, targetId: string): Promise<SavedListComparisonExportRow[] | null> {
  const comparison = await getSavedCompanyListPairComparison(baseId, targetId, Number.MAX_SAFE_INTEGER);
  return comparison ? buildSavedListComparisonExportRows(comparison) : null;
}

export async function createSavedCompanyList(input: { name: string; description?: string; filters: CompanyFilters }) {
  const companies = await getCompanies(input.filters, { limit: exportRowLimit });
  if (!hasSupabaseConfig()) {
    return { dryRun: true, rowCount: companies.length, id: null };
  }

  const supabase = getSupabaseAdmin();
  const id = await saveCompanyListWithRpc(supabase, { ...input, id: null, companies });

  return { dryRun: false, rowCount: companies.length, id };
}

export async function updateSavedCompanyList(input: { id: string; name: string; description?: string; filters: CompanyFilters }) {
  const companies = await getCompanies(input.filters, { limit: exportRowLimit });
  if (!hasSupabaseConfig()) {
    return { dryRun: true, rowCount: companies.length, id: input.id };
  }

  const supabase = getSupabaseAdmin();
  const id = await saveCompanyListWithRpc(supabase, { ...input, companies });
  if (!id) return { dryRun: false, rowCount: 0, id: null };

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
  const snapshot = await getSavedCompanyListSnapshot(id);
  if (!snapshot) return null;
  const sourceUrls = await getSourceUrlsByCompanyIds(snapshot.companies.map((company) => company.id));
  return snapshot.companies.map((company) => ({
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
    source_urls: sourceUrls.get(company.id)?.join(" | ") ?? "",
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

export async function saveCompanyListWithRpc(
  supabase: SavedListRpcClient,
  input: { id?: string | null; name: string; description?: string; filters: CompanyFilters; companies: Company[] },
) {
  const { data, error } = await supabase.rpc("save_company_list", buildSaveCompanyListRpcArgs(input));
  if (error) throw error;
  return data ? String(data) : null;
}

export function buildSaveCompanyListRpcArgs(input: { id?: string | null; name: string; description?: string; filters: CompanyFilters; companies: Company[] }): SaveCompanyListRpcArgs {
  return {
    p_id: input.id ?? null,
    p_name: input.name,
    p_description: input.description || null,
    p_filters: input.filters,
    p_items: buildSavedCompanyListRpcItems(input.companies),
  };
}

export function buildSavedCompanyListRpcItems(companies: Company[]) {
  return companies.map((company, index): SaveCompanyListRpcItem => ({
    company_id: company.id,
    position: index + 1,
    snapshot: company,
  }));
}

export function buildSavedCompanyListComparison(savedCompanies: Company[], currentCompanies: Company[], previewLimit = 5): SavedCompanyListComparison {
  const savedById = new Map(savedCompanies.map((company) => [company.id, company]));
  const currentById = new Map(currentCompanies.map((company) => [company.id, company]));
  const addedCompanies = currentCompanies.filter((company) => !savedById.has(company.id)).map(toComparisonCompany);
  const removedCompanies = savedCompanies.filter((company) => !currentById.has(company.id)).map(toComparisonCompany);
  const retainedComparisons = savedCompanies.flatMap((savedCompany) => {
    const currentCompany = currentById.get(savedCompany.id);
    if (!currentCompany) return [];
    const changes = buildSavedCompanyListFieldChanges(savedCompany, currentCompany);
    return [{ company: savedCompany, changes }];
  });
  const changedCompanies = retainedComparisons.flatMap(({ company, changes }) => (changes.length ? [{ ...toComparisonCompany(company), changes }] : []));
  const unchangedCount = retainedComparisons.filter(({ changes }) => changes.length === 0).length;
  const safePreviewLimit = Math.max(0, previewLimit);

  return {
    savedCount: savedCompanies.length,
    currentCount: currentCompanies.length,
    unchangedCount,
    changedCount: changedCompanies.length,
    addedCount: addedCompanies.length,
    removedCount: removedCompanies.length,
    hasChanges: addedCompanies.length > 0 || removedCompanies.length > 0 || changedCompanies.length > 0,
    changedCompanies: changedCompanies.slice(0, safePreviewLimit),
    addedCompanies: addedCompanies.slice(0, safePreviewLimit),
    removedCompanies: removedCompanies.slice(0, safePreviewLimit),
  };
}

export function buildSavedCompanyListPairComparison(
  baseSnapshot: SavedCompanyListSnapshot,
  targetSnapshot: SavedCompanyListSnapshot,
  previewLimit = 5,
): SavedCompanyListPairComparison {
  const comparison = buildSavedCompanyListComparison(baseSnapshot.companies, targetSnapshot.companies, previewLimit);

  return {
    ...comparison,
    baseList: toComparisonListSummary(baseSnapshot.list),
    targetList: toComparisonListSummary(targetSnapshot.list),
  };
}

export function buildSavedListComparisonExportRows(comparison: SavedCompanyListPairComparison): SavedListComparisonExportRow[] {
  const baseListName = comparison.baseList.name;
  const targetListName = comparison.targetList.name;
  const changedRows = comparison.changedCompanies.map((company) => ({
    change_type: "changed" as const,
    base_list_name: baseListName,
    target_list_name: targetListName,
    corporate_number: company.corporate_number ?? "",
    company_name: company.name,
    changed_fields: company.changes.map((change) => change.field).join(" | "),
  }));
  const addedRows = comparison.addedCompanies.map((company) => ({
    change_type: "added" as const,
    base_list_name: baseListName,
    target_list_name: targetListName,
    corporate_number: company.corporate_number ?? "",
    company_name: company.name,
    changed_fields: "",
  }));
  const removedRows = comparison.removedCompanies.map((company) => ({
    change_type: "removed" as const,
    base_list_name: baseListName,
    target_list_name: targetListName,
    corporate_number: company.corporate_number ?? "",
    company_name: company.name,
    changed_fields: "",
  }));

  return [...changedRows, ...addedRows, ...removedRows];
}

export function buildSavedCompanyListFieldChanges(savedCompany: Company, currentCompany: Company): SavedCompanyListFieldChange[] {
  const fields: SavedCompanyListComparableField[] = [
    "official_url",
    "industry",
    "employee_count",
    "employee_count_type",
    "annual_revenue",
    "annual_revenue_type",
    "data_confidence_score",
  ];

  return fields.flatMap((field) => {
    const before = companyComparableValue(savedCompany, field);
    const after = companyComparableValue(currentCompany, field);
    return Object.is(before, after) ? [] : [{ field, before, after }];
  });
}

function toComparisonCompany(company: Company): SavedCompanyListComparisonCompany {
  return {
    id: company.id,
    name: company.name,
    corporate_number: company.corporate_number,
  };
}

function companyComparableValue(company: Company, field: SavedCompanyListComparableField) {
  return company[field];
}

function toComparisonListSummary(list: SavedCompanyList): SavedCompanyListPairComparison["baseList"] {
  return {
    id: list.id,
    name: list.name,
    row_count: list.row_count,
    updated_at: list.updated_at,
  };
}
