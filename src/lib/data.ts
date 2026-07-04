import { differenceInCalendarDays } from "date-fns";
import type { CompanyExportRow } from "@/lib/csv";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { mockCompanies, mockDashboardMetrics, mockJobs, mockObservations, mockSources } from "@/lib/mock/data";
import type { Company, CompanyFilters, CompanyObservation, CompanySource, CrawlJob, DashboardMetrics } from "@/lib/types";

export type CompanyListRow = Company & { source_types?: string[] };
export type JobRow = CrawlJob & { company_name?: string | null };

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

export async function getCompanies(filters: CompanyFilters = {}): Promise<CompanyListRow[]> {
  if (!hasSupabaseConfig()) return filterMockCompanies(filters);
  const supabase = getSupabaseAdmin();
  let query = supabase.from("companies").select("*").order("updated_at", { ascending: false }).limit(100);

  if (filters.q) query = query.or(`name.ilike.%${filters.q}%,corporate_number.ilike.%${filters.q}%`);
  if (filters.prefecture) query = query.eq("prefecture", filters.prefecture);
  if (filters.industry) query = query.ilike("industry", `%${filters.industry}%`);
  if (filters.hasUrl === "yes") query = query.not("official_url", "is", null);
  if (filters.hasUrl === "no") query = query.is("official_url", null);
  if (filters.hasRevenue === "yes") query = query.not("annual_revenue", "is", null);
  if (filters.hasRevenue === "no") query = query.is("annual_revenue", null);
  if (filters.hasEmployeeCount === "yes") query = query.not("employee_count", "is", null);
  if (filters.hasEmployeeCount === "no") query = query.is("employee_count", null);
  if (filters.valueKind === "estimated") query = query.eq("annual_revenue_type", "estimated");
  if (filters.valueKind === "official") query = query.neq("annual_revenue_type", "estimated");
  if (filters.minConfidence != null) query = query.gte("data_confidence_score", filters.minConfidence);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CompanyListRow[];
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

export async function getExportRows() {
  const companies = await getCompanies({});
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
    source_urls: "",
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
  return mockCompanies.filter((company) => {
    if (filters.q && !`${company.name} ${company.corporate_number ?? ""}`.includes(filters.q)) return false;
    if (filters.prefecture && company.prefecture !== filters.prefecture) return false;
    if (filters.industry && !company.industry?.includes(filters.industry)) return false;
    if (filters.hasUrl === "yes" && !company.official_url) return false;
    if (filters.hasUrl === "no" && company.official_url) return false;
    if (filters.hasRevenue === "yes" && company.annual_revenue == null) return false;
    if (filters.hasRevenue === "no" && company.annual_revenue != null) return false;
    if (filters.hasEmployeeCount === "yes" && company.employee_count == null) return false;
    if (filters.hasEmployeeCount === "no" && company.employee_count != null) return false;
    if (filters.valueKind === "estimated" && company.annual_revenue_type !== "estimated") return false;
    if (filters.valueKind === "official" && company.annual_revenue_type === "estimated") return false;
    if (filters.minConfidence != null && company.data_confidence_score < filters.minConfidence) return false;
    return true;
  });
}
