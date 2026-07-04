import { getSupabaseAdmin } from "@/lib/supabase/server";
import { applyGBizInfo, fetchGBizInfoByCorporateNumber } from "@/lib/etl/gbizinfo";
import { extractAndStoreOfficialSite } from "@/lib/etl/official-crawler";
import type { CrawlJob } from "@/lib/types";

export async function runNextCrawlJob() {
  const supabase = getSupabaseAdmin();
  const { data: job, error } = await supabase
    .from("crawl_jobs")
    .select("*, companies(*)")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("priority", { ascending: true })
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!job) return null;

  await markJob(job.id, "running", { started_at: new Date().toISOString(), attempts: (job.attempts ?? 0) + 1 });

  try {
    await executeJob(job as CrawlJob & { companies?: { corporate_number?: string; official_url?: string } });
    await markJob(job.id, "completed", { finished_at: new Date().toISOString(), error_message: null });
    await log(job.id, "info", "Job completed");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markJob(job.id, "failed", { finished_at: new Date().toISOString(), error_message: message });
    await log(job.id, "error", message);
  }

  return job;
}

async function executeJob(job: CrawlJob & { companies?: { corporate_number?: string; official_url?: string } }) {
  if (!job.company_id) throw new Error("Job requires company_id");

  if (job.job_type === "enrich_gbizinfo") {
    const corporateNumber = job.companies?.corporate_number;
    if (!corporateNumber) throw new Error("Company has no corporate number");
    const raw = await fetchGBizInfoByCorporateNumber(corporateNumber);
    await applyGBizInfo(job.company_id, raw);
    return;
  }

  if (job.job_type === "crawl_official_site" || job.job_type === "extract_company_profile") {
    const officialUrl = job.companies?.official_url;
    if (!officialUrl) throw new Error("Company has no official_url");
    await extractAndStoreOfficialSite(job.company_id, officialUrl);
    return;
  }

  throw new Error(`Job type ${job.job_type} is not implemented in this runner yet.`);
}

async function markJob(id: string, status: CrawlJob["status"], values: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("crawl_jobs").update({ status, ...values }).eq("id", id);
  if (error) throw error;
}

async function log(jobId: string, level: "info" | "warn" | "error", message: string, metadata?: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  await supabase.from("crawl_logs").insert({ job_id: jobId, level, message, metadata: metadata ?? null });
}

