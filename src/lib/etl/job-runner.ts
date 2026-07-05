import { getSupabaseAdmin } from "@/lib/supabase/server";
import { listEdinetDocuments } from "@/lib/etl/edinet";
import { applyGBizInfo, fetchGBizInfoByCorporateNumber } from "@/lib/etl/gbizinfo";
import { extractAndStoreOfficialSite } from "@/lib/etl/official-crawler";
import { safeDiscoverOfficialUrlCandidates } from "@/lib/etl/search";
import type { CrawlJob } from "@/lib/types";

type SupabaseRunnerClient = {
  from: (table: string) => {
    select: (columns: string) => SupabaseRunnerQuery;
    update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: Error | null }> };
    insert: (values: Record<string, unknown>) => Promise<{ error: Error | null }>;
  };
};

type SupabaseRunnerQuery = {
  eq: (column: string, value: string) => SupabaseRunnerQuery;
  or: (filters: string) => SupabaseRunnerQuery;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseRunnerQuery;
  limit: (count: number) => SupabaseRunnerQuery;
  maybeSingle: () => Promise<{ data: unknown; error: Error | null }>;
};

export type JobRunnerDependencies = {
  supabase?: SupabaseRunnerClient;
  now?: () => Date;
  fetchGBizInfo?: typeof fetchGBizInfoByCorporateNumber;
  applyGBizInfo?: typeof applyGBizInfo;
  extractOfficialSite?: typeof extractAndStoreOfficialSite;
  listEdinetDocuments?: typeof listEdinetDocuments;
  discoverOfficialUrl?: typeof safeDiscoverOfficialUrlCandidates;
};

export type JobRunnerResult =
  | (CrawlJob & {
      companies?: { corporate_number?: string; official_url?: string; name?: string; prefecture?: string | null; city?: string | null };
      run_status: "completed" | "failed";
    })
  | null;

export async function runNextCrawlJob(dependencies: JobRunnerDependencies = {}): Promise<JobRunnerResult> {
  const supabase = dependencies.supabase ?? (getSupabaseAdmin() as unknown as SupabaseRunnerClient);
  const nowIso = (dependencies.now?.() ?? new Date()).toISOString();
  const { data: job, error } = await supabase
    .from("crawl_jobs")
    .select("*, companies(*)")
    .eq("status", "pending")
    .or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`)
    .order("priority", { ascending: true })
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!job) return null;

  const crawlJob = job as CrawlJob & { companies?: { corporate_number?: string; official_url?: string; name?: string; prefecture?: string | null; city?: string | null } };
  await markJob(supabase, crawlJob.id, "running", { started_at: nowIso, attempts: (crawlJob.attempts ?? 0) + 1 });

  try {
    await executeJob(crawlJob, dependencies);
    await markJob(supabase, crawlJob.id, "completed", { finished_at: (dependencies.now?.() ?? new Date()).toISOString(), error_message: null });
    await log(supabase, crawlJob.id, "info", "Job completed");
    return { ...crawlJob, run_status: "completed" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markJob(supabase, crawlJob.id, "failed", { finished_at: (dependencies.now?.() ?? new Date()).toISOString(), error_message: message });
    await log(supabase, crawlJob.id, "error", message);
    return { ...crawlJob, error_message: message, run_status: "failed" };
  }
}

async function executeJob(
  job: CrawlJob & { companies?: { corporate_number?: string; official_url?: string; name?: string; prefecture?: string | null; city?: string | null } },
  dependencies: JobRunnerDependencies,
) {
  if (!job.company_id) throw new Error("Job requires company_id");

  if (job.job_type === "enrich_gbizinfo") {
    const corporateNumber = job.companies?.corporate_number;
    if (!corporateNumber) throw new Error("Company has no corporate number");
    const raw = await (dependencies.fetchGBizInfo ?? fetchGBizInfoByCorporateNumber)(corporateNumber);
    await (dependencies.applyGBizInfo ?? applyGBizInfo)(job.company_id, raw);
    return;
  }

  if (job.job_type === "enrich_edinet") {
    const corporateNumber = job.companies?.corporate_number;
    if (!corporateNumber) throw new Error("Company has no corporate number");
    const date = (dependencies.now?.() ?? new Date()).toISOString().slice(0, 10);
    const documents = await (dependencies.listEdinetDocuments ?? listEdinetDocuments)(date);
    documents.some((document) => document.corporateNumber === corporateNumber);
    return;
  }

  if (job.job_type === "discover_official_url") {
    const companyName = job.companies?.name;
    if (!companyName) throw new Error("Company has no name");
    await (dependencies.discoverOfficialUrl ?? safeDiscoverOfficialUrlCandidates)({
      companyName,
      prefecture: job.companies?.prefecture,
      city: job.companies?.city,
    });
    return;
  }

  if (job.job_type === "crawl_official_site" || job.job_type === "extract_company_profile") {
    const officialUrl = job.companies?.official_url;
    if (!officialUrl) throw new Error("Company has no official_url");
    await (dependencies.extractOfficialSite ?? extractAndStoreOfficialSite)(job.company_id, officialUrl);
    return;
  }

  throw new Error(`Job type ${job.job_type} is not implemented in this runner yet.`);
}

async function markJob(supabase: SupabaseRunnerClient, id: string, status: CrawlJob["status"], values: Record<string, unknown>) {
  const { error } = await supabase.from("crawl_jobs").update({ status, ...values }).eq("id", id);
  if (error) throw error;
}

async function log(supabase: SupabaseRunnerClient, jobId: string, level: "info" | "warn" | "error", message: string, metadata?: Record<string, unknown>) {
  await supabase.from("crawl_logs").insert({ job_id: jobId, level, message, metadata: metadata ?? null });
}
