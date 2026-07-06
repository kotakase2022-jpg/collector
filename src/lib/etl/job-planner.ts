import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { normalizeCorporateNumber } from "@/lib/etl/normalize";
import { mockCompanies } from "@/lib/mock/data";
import type { AnnualRevenueType, Company, CrawlJob, CrawlJobType } from "@/lib/types";

export type CoverageCompany = Pick<Company, "id" | "corporate_number" | "official_url" | "industry" | "employee_count" | "annual_revenue"> & {
  annual_revenue_type?: AnnualRevenueType | null;
};

export type ExistingCoverageJob = Pick<CrawlJob, "company_id" | "job_type" | "status">;

export type PlannedCoverageJob = {
  company_id: string;
  job_type: CrawlJobType;
  priority: number;
  reason: "missing_official_url" | "missing_industry" | "missing_employee_count" | "missing_annual_revenue" | "estimated_annual_revenue";
};

type PlannerClient = {
  from: (table: string) => {
    select: (columns: string) => PlannerQuery;
    insert: (values: Record<string, unknown>[]) => PromiseLike<{ error: Error | null }>;
  };
};

type PlannerQuery = {
  limit: (count: number) => PlannerQuery;
  in: (column: string, values: string[]) => PlannerQuery;
} & PromiseLike<{ data: unknown[] | null; error: Error | null }>;

export type QueueCoverageJobsResult = {
  dryRun: boolean;
  planned: PlannedCoverageJob[];
  inserted: number;
};

export function buildCoverageJobPlans(companies: CoverageCompany[], existingJobs: ExistingCoverageJob[] = []): PlannedCoverageJob[] {
  const existing = new Set(
    existingJobs
      .filter((job) => job.company_id && (job.status === "pending" || job.status === "running"))
      .map((job) => jobKey(job.company_id!, job.job_type)),
  );
  const plans: PlannedCoverageJob[] = [];

  for (const company of companies) {
    const reasons = coverageGapReasons(company);
    if (!reasons.length) continue;
    const corporateNumber = normalizeCorporateNumber(company.corporate_number);

    if (corporateNumber && (reasons.includes("missing_official_url") || reasons.includes("missing_industry") || reasons.includes("missing_employee_count"))) {
      pushPlan(plans, existing, company.id, "enrich_gbizinfo", 35, firstReason(reasons, ["missing_official_url", "missing_industry", "missing_employee_count"]));
    }
    if (corporateNumber && (reasons.includes("missing_annual_revenue") || reasons.includes("estimated_annual_revenue") || reasons.includes("missing_employee_count"))) {
      pushPlan(plans, existing, company.id, "enrich_edinet", 45, firstReason(reasons, ["missing_annual_revenue", "estimated_annual_revenue", "missing_employee_count"]));
    }
    if (!company.official_url) {
      pushPlan(plans, existing, company.id, "discover_official_url", 55, "missing_official_url");
    }
    if (company.official_url && (reasons.includes("missing_industry") || reasons.includes("missing_employee_count") || reasons.includes("missing_annual_revenue") || reasons.includes("estimated_annual_revenue"))) {
      pushPlan(plans, existing, company.id, "crawl_official_site", 65, firstReason(reasons, ["missing_industry", "missing_employee_count", "missing_annual_revenue", "estimated_annual_revenue"]));
    }
  }

  return plans.sort((a, b) => a.priority - b.priority || a.company_id.localeCompare(b.company_id) || a.job_type.localeCompare(b.job_type));
}

export async function queueCoverageJobs(options: { dryRun?: boolean; limit?: number; supabase?: PlannerClient } = {}): Promise<QueueCoverageJobsResult> {
  const limit = normalizeLimit(options.limit ?? 1000);
  const supabase = options.supabase ?? (hasSupabaseConfig() ? (getSupabaseAdmin() as unknown as PlannerClient) : null);

  if (!supabase) {
    const planned = buildCoverageJobPlans(mockCompanies.slice(0, limit));
    return { dryRun: true, planned, inserted: 0 };
  }

  const [companiesResult, jobsResult] = await Promise.all([
    supabase.from("companies").select("id, corporate_number, official_url, industry, employee_count, annual_revenue, annual_revenue_type").limit(limit),
    supabase.from("crawl_jobs").select("company_id, job_type, status").in("status", ["pending", "running"]),
  ]);
  if (companiesResult.error) throw companiesResult.error;
  if (jobsResult.error) throw jobsResult.error;

  const planned = buildCoverageJobPlans((companiesResult.data ?? []) as CoverageCompany[], (jobsResult.data ?? []) as ExistingCoverageJob[]);
  if (options.dryRun || !planned.length) return { dryRun: Boolean(options.dryRun), planned, inserted: 0 };

  const { error } = await supabase.from("crawl_jobs").insert(
    planned.map((job) => ({
      company_id: job.company_id,
      job_type: job.job_type,
      status: "pending",
      priority: job.priority,
      scheduled_at: new Date().toISOString(),
    })),
  );
  if (error) throw error;
  return { dryRun: false, planned, inserted: planned.length };
}

function coverageGapReasons(company: CoverageCompany) {
  const reasons: PlannedCoverageJob["reason"][] = [];
  if (!company.official_url) reasons.push("missing_official_url");
  if (!company.industry) reasons.push("missing_industry");
  if (company.employee_count == null) reasons.push("missing_employee_count");
  if (company.annual_revenue == null) reasons.push("missing_annual_revenue");
  if (company.annual_revenue_type === "estimated") reasons.push("estimated_annual_revenue");
  return reasons;
}

function pushPlan(
  plans: PlannedCoverageJob[],
  existing: Set<string>,
  companyId: string,
  jobType: CrawlJobType,
  priority: number,
  reason: PlannedCoverageJob["reason"],
) {
  if (existing.has(jobKey(companyId, jobType)) || plans.some((plan) => plan.company_id === companyId && plan.job_type === jobType)) return;
  plans.push({ company_id: companyId, job_type: jobType, priority, reason });
}

function firstReason(reasons: PlannedCoverageJob["reason"][], order: PlannedCoverageJob["reason"][]) {
  return order.find((reason) => reasons.includes(reason)) ?? reasons[0];
}

function jobKey(companyId: string, jobType: CrawlJobType) {
  return `${companyId}:${jobType}`;
}

function normalizeLimit(limit: number) {
  const normalized = Number.isFinite(limit) ? Math.floor(limit) : 1000;
  return Math.max(1, Math.min(normalized, 5000));
}
