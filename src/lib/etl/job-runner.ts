import { getSupabaseAdmin } from "@/lib/supabase/server";
import { applyEdinetFacts, fetchEdinetDocumentXbrl, listEdinetDocuments, type EdinetDocument } from "@/lib/etl/edinet";
import { applyGBizInfo, fetchGBizInfoByCorporateNumber } from "@/lib/etl/gbizinfo";
import { extractAndStoreOfficialSite } from "@/lib/etl/official-crawler";
import { scoreOfficialUrlCandidate, type UrlCandidateScore } from "@/lib/etl/official-url";
import { safeDiscoverOfficialUrlCandidates, type SearchResult } from "@/lib/etl/search";
import { addCompanySource, addObservation, refreshCompanySelectedValues } from "@/lib/etl/store";
import { observationKind } from "@/lib/etl/scoring";
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
  applyEdinetDocuments?: (companyId: string, documents: EdinetDocument[]) => Promise<number>;
  discoverOfficialUrl?: typeof safeDiscoverOfficialUrlCandidates;
  persistOfficialUrlCandidate?: (job: DiscoverOfficialUrlJob, candidate: SearchResult, score: UrlCandidateScore) => Promise<void>;
};

type RunnerCompany = {
  corporate_number?: string;
  official_url?: string;
  name?: string;
  address?: string | null;
  prefecture?: string | null;
  city?: string | null;
};
type DiscoverOfficialUrlJob = CrawlJob & { companies?: RunnerCompany };

export type JobRunnerResult =
  | (CrawlJob & {
      companies?: RunnerCompany;
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

  const crawlJob = job as CrawlJob & { companies?: RunnerCompany };
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

async function executeJob(job: CrawlJob & { companies?: RunnerCompany }, dependencies: JobRunnerDependencies) {
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
    const matchedDocuments = documents.filter((document) => document.corporateNumber === corporateNumber);
    if (matchedDocuments.length === 0) throw new Error(`No EDINET documents found for corporate number ${corporateNumber} on ${date}`);
    const appliedCount = await (dependencies.applyEdinetDocuments ?? applyEdinetDocuments)(job.company_id, matchedDocuments);
    if (appliedCount < 1) throw new Error("EDINET documents were found, but no XBRL facts were applied");
    return;
  }

  if (job.job_type === "discover_official_url") {
    const companyName = job.companies?.name;
    if (!companyName) throw new Error("Company has no name");
    await (dependencies.discoverOfficialUrl ?? safeDiscoverOfficialUrlCandidates)({
      companyName,
      prefecture: job.companies?.prefecture,
      city: job.companies?.city,
    }).then(async (candidates) => {
      const best = bestOfficialUrlCandidate(job, candidates);
      if (!best || best.score.confidenceScore < 80) throw new Error("No official URL candidate reached confidence threshold");
      await (dependencies.persistOfficialUrlCandidate ?? persistOfficialUrlCandidate)(job, best.candidate, best.score);
    });
    return;
  }

  if (job.job_type === "crawl_official_site" || job.job_type === "extract_company_profile") {
    const officialUrl = job.companies?.official_url;
    if (!officialUrl) throw new Error("Company has no official_url");
    await (dependencies.extractOfficialSite ?? extractAndStoreOfficialSite)(job.company_id, officialUrl);
    return;
  }

  if (job.job_type === "verify_data") {
    return;
  }

  throw new Error(`Job type ${job.job_type} is not implemented in this runner yet.`);
}

function bestOfficialUrlCandidate(job: DiscoverOfficialUrlJob, candidates: SearchResult[]) {
  const companyName = job.companies?.name;
  if (!companyName) return null;
  const scored = candidates.map((candidate) => ({
    candidate,
    score: scoreOfficialUrlCandidate({
      companyName,
      address: job.companies?.address,
      corporateNumber: job.companies?.corporate_number,
      candidateUrl: candidate.url,
      title: candidate.title,
      snippet: candidate.snippet,
    }),
  }));
  return scored.sort((a, b) => b.score.confidenceScore - a.score.confidenceScore)[0] ?? null;
}

async function persistOfficialUrlCandidate(job: DiscoverOfficialUrlJob, candidate: SearchResult, score: UrlCandidateScore) {
  const companyId = job.company_id;
  if (!companyId) throw new Error("Job requires company_id");
  const source = await addCompanySource({
    companyId,
    sourceType: "search",
    sourceUrl: candidate.url,
    sourceTitle: candidate.title,
    rawJson: { candidate, score },
    confidenceScore: score.confidenceScore,
  });
  await addObservation({
    companyId,
    fieldName: "official_url",
    observedValue: candidate.url,
    normalizedValue: score.url,
    sourceId: source.id,
    sourceType: observationKind("search", "api"),
    confidenceScore: score.confidenceScore,
    extractionMethod: "api",
  });
  await refreshCompanySelectedValues(companyId);
}

async function applyEdinetDocuments(companyId: string, documents: EdinetDocument[]): Promise<number> {
  let appliedCount = 0;
  for (const document of documents) {
    const xbrlText = await fetchEdinetDocumentXbrl(document.docID);
    const facts = await applyEdinetFacts(companyId, {
      docId: document.docID,
      sourceUrl: `https://disclosure.edinet-fsa.go.jp/api/v2/documents/${encodeURIComponent(document.docID)}?type=1`,
      xbrlText,
      period: document.periodEnd ?? null,
    });
    if (facts.annualRevenue || facts.employeeCount) appliedCount += 1;
  }
  return appliedCount;
}

async function markJob(supabase: SupabaseRunnerClient, id: string, status: CrawlJob["status"], values: Record<string, unknown>) {
  const { error } = await supabase.from("crawl_jobs").update({ status, ...values }).eq("id", id);
  if (error) throw error;
}

async function log(supabase: SupabaseRunnerClient, jobId: string, level: "info" | "warn" | "error", message: string, metadata?: Record<string, unknown>) {
  await supabase.from("crawl_logs").insert({ job_id: jobId, level, message, metadata: metadata ?? null });
}
