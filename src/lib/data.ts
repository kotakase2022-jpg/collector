import { differenceInCalendarDays } from "date-fns";
import { hasCorporateNumberValue } from "@/lib/corporate-number";
import type { CompanyExportRow } from "@/lib/csv";
import { employeeRange as toEmployeeRange, normalizeCorporateNumber, revenueRange as toRevenueRange } from "@/lib/etl/normalize";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { mockCompanies, mockDashboardMetrics, mockJobs, mockObservations, mockSources } from "@/lib/mock/data";
import type { Company, CompanyFilters, CompanyObservation, CompanySort, CompanySource, CrawlJob, DashboardMetrics, SourceKind } from "@/lib/types";

export type CompanyListRow = Company & { source_types?: SourceKind[] };
export type JobRow = CrawlJob & { company_name?: string | null };
export type CompanyQueryOptions = { limit?: number };

const companyListRowLimit = 100;
export const exportRowLimit = 5000;
export const officialRevenueTypeSupabaseFilter = "annual_revenue_type.is.null,annual_revenue_type.not.in.(estimated,unknown)";
export const missingCorporateNumberSupabaseFilter = "corporate_number.is.null,corporate_number.eq.";
const sourceUrlLookupBatchSize = 500;
const sourceTypeLookupBatchSize = 500;

export { hasCorporateNumberValue } from "@/lib/corporate-number";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (!hasSupabaseConfig()) return mockDashboardMetrics;
  const supabase = getSupabaseAdmin();

  const [total, withUrl, withIndustry, withEmployee, withRevenue, running, failed, latest, selected] = await Promise.all([
    countCompanies(),
    countCompanies("official_url", "not.is", null),
    countCompanies("industry", "not.is", null),
    countCompanies("employee_count", "not.is", null),
    countCompanies("annual_revenue", "not.is", null),
    supabase.from("crawl_jobs").select("id", { count: "exact", head: true }).eq("status", "running"),
    supabase.from("crawl_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("companies").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("company_observations").select("source_type").eq("is_selected", true),
  ]);

  const selectedRows = (selected.data ?? []) as { source_type: string }[];
  const official = selectedRows.filter((row) => row.source_type === "official").length;
  const estimated = selectedRows.filter((row) => row.source_type === "estimated").length;
  const selectedTotal = Math.max(1, selectedRows.length);

  return {
    totalCompanies: total,
    withUrl,
    withIndustry,
    withEmployeeCount: withEmployee,
    withAnnualRevenue: withRevenue,
    officialRatio: Math.round((official / selectedTotal) * 100),
    estimatedRatio: Math.round((estimated / selectedTotal) * 100),
    runningJobs: running.count ?? 0,
    errorJobs: failed.count ?? 0,
    freshnessDays: latest.data?.updated_at ? differenceInCalendarDays(new Date(), new Date(latest.data.updated_at)) : null,
  };
}

export async function getCompanies(filters: CompanyFilters = {}, options: CompanyQueryOptions = {}): Promise<CompanyListRow[]> {
  const limit = normalizeQueryLimit(options.limit ?? companyListRowLimit);
  if (!hasSupabaseConfig()) return filterMockCompanies(filters).slice(0, limit);
  const supabase = getSupabaseAdmin();
  let query = supabase.from("companies").select("*").limit(limit);

  if (filters.q) {
    const q = normalizeCompanySearchTerm(filters.q);
    if (!q) return [];
    const corporateNumberQuery = normalizeCorporateNumber(filters.q);
    const searchParts = [
      `name.ilike.%${q}%`,
      `name_kana.ilike.%${q}%`,
      `corporate_number.ilike.%${q}%`,
      `official_url.ilike.%${q}%`,
      `industry.ilike.%${q}%`,
      `prefecture.ilike.%${q}%`,
      `city.ilike.%${q}%`,
      `address.ilike.%${q}%`,
    ];
    if (corporateNumberQuery) searchParts.push(`corporate_number.eq.${corporateNumberQuery}`);
    query = query.or(searchParts.join(","));
  }
  if (filters.prefecture) query = query.eq("prefecture", filters.prefecture);
  if (filters.industry) query = query.ilike("industry", `%${filters.industry}%`);
  if (filters.hasUrl === "yes") query = query.not("official_url", "is", null);
  if (filters.hasUrl === "no") query = query.is("official_url", null);
  if (filters.hasCorporateNumber === "yes") query = query.not("corporate_number", "is", null).neq("corporate_number", "");
  if (filters.hasCorporateNumber === "no") query = query.or(missingCorporateNumberSupabaseFilter);
  if (filters.hasRevenue === "yes") query = query.not("annual_revenue", "is", null);
  if (filters.hasRevenue === "no") query = query.is("annual_revenue", null);
  if (filters.hasEmployeeCount === "yes") query = query.not("employee_count", "is", null);
  if (filters.hasEmployeeCount === "no") query = query.is("employee_count", null);
  if (filters.valueKind === "estimated") query = query.eq("annual_revenue_type", "estimated");
  if (filters.valueKind === "official") {
    query = query.not("annual_revenue", "is", null).or(officialRevenueTypeSupabaseFilter);
  }
  if (filters.minConfidence != null) query = query.gte("data_confidence_score", filters.minConfidence);
  if (filters.excludedCompanyIds?.length) query = query.not("id", "in", formatPostgrestInList(filters.excludedCompanyIds));
  if (filters.employeeRange === "1-9名") query = query.gte("employee_count", 1).lt("employee_count", 10);
  if (filters.employeeRange === "10-49名") query = query.gte("employee_count", 10).lt("employee_count", 50);
  if (filters.employeeRange === "50-299名") query = query.gte("employee_count", 50).lt("employee_count", 300);
  if (filters.employeeRange === "300-999名") query = query.gte("employee_count", 300).lt("employee_count", 1000);
  if (filters.employeeRange === "1000名以上") query = query.gte("employee_count", 1000);
  if (filters.revenueRange === "1億円未満") query = query.gte("annual_revenue", 1).lt("annual_revenue", 100_000_000);
  if (filters.revenueRange === "1億-10億円") query = query.gte("annual_revenue", 100_000_000).lt("annual_revenue", 1_000_000_000);
  if (filters.revenueRange === "10億-100億円") query = query.gte("annual_revenue", 1_000_000_000).lt("annual_revenue", 10_000_000_000);
  if (filters.revenueRange === "100億-1000億円") query = query.gte("annual_revenue", 10_000_000_000).lt("annual_revenue", 100_000_000_000);
  if (filters.revenueRange === "1000億円以上") query = query.gte("annual_revenue", 100_000_000_000);
  query = applySupabaseSort(query, filters.sort);

  const { data, error } = await query;
  if (error) throw error;
  return attachSourceTypes((data ?? []) as CompanyListRow[]);
}

export async function getCompanyDetail(id: string) {
  if (!hasSupabaseConfig()) {
    const company = mockCompanies.find((item) => item.id === id);
    return company
      ? {
          company,
          observations: mockObservations.filter((item) => item.company_id === id),
          sources: mockSources.filter((item) => item.company_id === id),
        }
      : null;
  }

  const supabase = getSupabaseAdmin();
  const [company, observations, sources] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).maybeSingle(),
    supabase.from("company_observations").select("*").eq("company_id", id).order("confidence_score", { ascending: false }),
    supabase.from("company_sources").select("*").eq("company_id", id).order("fetched_at", { ascending: false }),
  ]);

  if (company.error) throw company.error;
  if (observations.error) throw observations.error;
  if (sources.error) throw sources.error;
  if (!company.data) return null;
  return {
    company: company.data as Company,
    observations: (observations.data ?? []) as CompanyObservation[],
    sources: (sources.data ?? []) as CompanySource[],
  };
}

export async function getJobs(): Promise<JobRow[]> {
  if (!hasSupabaseConfig()) {
    return mockJobs.map((job) => ({
      ...job,
      company_name: mockCompanies.find((company) => company.id === job.company_id)?.name ?? null,
    }));
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("crawl_jobs")
    .select("*, companies(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as CrawlJob),
    company_name: (row as { companies?: { name?: string } }).companies?.name ?? null,
  }));
}

export async function getExportRows(filters: CompanyFilters = {}, options: CompanyQueryOptions = {}) {
  const companies = await getCompanies(filters, { limit: options.limit ?? exportRowLimit });
  const sourceUrls = await getSourceUrlsByCompanyIds(companies.map((company) => company.id));
  return companies.map((company): CompanyExportRow => ({
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

async function countCompanies(column?: string, operator?: string, value?: unknown) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("companies").select("id", { count: "exact", head: true });
  if (column && operator === "not.is") query = query.not(column, "is", value);
  if (column && operator === "is") query = query.is(column, value);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function filterMockCompanies(filters: CompanyFilters) {
  const q = filters.q ? normalizeCompanySearchTerm(filters.q) : null;
  const corporateNumberQuery = filters.q ? normalizeCorporateNumber(filters.q) : null;
  const filtered = mockCompanies.filter((company) => {
    if (filters.q) {
      if (!q) return false;
      const haystack = [
        company.name,
        company.name_kana,
        company.corporate_number,
        company.official_url,
        company.industry,
        company.prefecture,
        company.city,
        company.address,
      ]
        .filter(Boolean)
        .join(" ")
        .normalize("NFKC")
        .toLocaleLowerCase("ja");
      const isCorporateNumberMatch = corporateNumberQuery != null && normalizeCorporateNumber(company.corporate_number) === corporateNumberQuery;
      if (!isCorporateNumberMatch && !haystack.includes(q.toLocaleLowerCase("ja"))) return false;
    }
    if (filters.prefecture && company.prefecture !== filters.prefecture) return false;
    if (filters.industry && !company.industry?.includes(filters.industry)) return false;
    if (filters.employeeRange && toEmployeeRange(company.employee_count) !== filters.employeeRange) return false;
    if (filters.revenueRange && toRevenueRange(company.annual_revenue) !== filters.revenueRange) return false;
    if (filters.hasUrl === "yes" && !company.official_url) return false;
    if (filters.hasUrl === "no" && company.official_url) return false;
    if (filters.hasCorporateNumber === "yes" && !hasCorporateNumberValue(company.corporate_number)) return false;
    if (filters.hasCorporateNumber === "no" && hasCorporateNumberValue(company.corporate_number)) return false;
    if (filters.hasRevenue === "yes" && company.annual_revenue == null) return false;
    if (filters.hasRevenue === "no" && company.annual_revenue != null) return false;
    if (filters.hasEmployeeCount === "yes" && company.employee_count == null) return false;
    if (filters.hasEmployeeCount === "no" && company.employee_count != null) return false;
    if (filters.valueKind === "estimated" && company.annual_revenue_type !== "estimated") return false;
    if (filters.valueKind === "official" && (company.annual_revenue == null || !isOfficialRevenueType(company.annual_revenue_type))) return false;
    if (filters.minConfidence != null && company.data_confidence_score < filters.minConfidence) return false;
    if (filters.excludedCompanyIds?.includes(company.id)) return false;
    return true;
  });
  return sortCompanies(filtered, filters.sort).map((company) => ({
    ...company,
    source_types: unique(mockSources.filter((source) => source.company_id === company.id).map((source) => source.source_type)),
  }));
}

export function isOfficialRevenueType(type: string | null | undefined) {
  return type !== "estimated" && type !== "unknown";
}

export function formatPostgrestInList(values: string[]) {
  return `(${values.map((value) => `"${value.replace(/["\\]/g, "\\$&")}"`).join(",")})`;
}

function sortCompanies(companies: Company[], sort: CompanySort = "updated_desc") {
  return [...companies].sort((a, b) => {
    if (sort === "name_asc") return a.name.localeCompare(b.name, "ja");
    if (sort === "confidence_desc") return b.data_confidence_score - a.data_confidence_score;
    if (sort === "revenue_desc") return (b.annual_revenue ?? -1) - (a.annual_revenue ?? -1);
    if (sort === "employee_desc") return (b.employee_count ?? -1) - (a.employee_count ?? -1);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

function applySupabaseSort<T extends { order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => T }>(query: T, sort: CompanySort = "updated_desc") {
  if (sort === "name_asc") return query.order("name", { ascending: true });
  if (sort === "confidence_desc") return query.order("data_confidence_score", { ascending: false, nullsFirst: false });
  if (sort === "revenue_desc") return query.order("annual_revenue", { ascending: false, nullsFirst: false });
  if (sort === "employee_desc") return query.order("employee_count", { ascending: false, nullsFirst: false });
  return query.order("updated_at", { ascending: false });
}

async function attachSourceTypes(companies: CompanyListRow[]) {
  if (!companies.length) return companies;
  const supabase = getSupabaseAdmin();
  const byCompany = new Map<string, SourceKind[]>();
  for (const batch of chunk(
    companies.map((company) => company.id),
    sourceTypeLookupBatchSize,
  )) {
    const { data, error } = await supabase.from("company_sources").select("company_id, source_type").in("company_id", batch);
    if (error) throw error;
    for (const row of (data ?? []) as { company_id: string; source_type: SourceKind }[]) {
      byCompany.set(row.company_id, unique([...(byCompany.get(row.company_id) ?? []), row.source_type]));
    }
  }
  return companies.map((company) => ({ ...company, source_types: byCompany.get(company.id) ?? [] }));
}

export async function getSourceUrlsByCompanyIds(companyIds: string[]) {
  const sourceUrls = new Map<string, string[]>();
  if (!companyIds.length) return sourceUrls;

  if (!hasSupabaseConfig()) {
    for (const source of mockSources) {
      if (!companyIds.includes(source.company_id) || !source.source_url) continue;
      sourceUrls.set(source.company_id, unique([...(sourceUrls.get(source.company_id) ?? []), source.source_url]));
    }
    return sourceUrls;
  }

  const supabase = getSupabaseAdmin();
  for (const batch of chunk(companyIds, sourceUrlLookupBatchSize)) {
    const { data, error } = await supabase.from("company_sources").select("company_id, source_url").in("company_id", batch).not("source_url", "is", null);
    if (error) throw error;
    for (const row of (data ?? []) as { company_id: string; source_url: string | null }[]) {
      if (!row.source_url) continue;
      sourceUrls.set(row.company_id, unique([...(sourceUrls.get(row.company_id) ?? []), row.source_url]));
    }
  }
  return sourceUrls;
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

export function normalizeCompanySearchTerm(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[%_,()*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeQueryLimit(limit: number) {
  const normalized = Number.isFinite(limit) ? Math.floor(limit) : companyListRowLimit;
  return Math.max(1, Math.min(normalized, exportRowLimit));
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
