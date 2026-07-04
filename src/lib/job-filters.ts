import type { JobRow } from "@/lib/data";
import type { CrawlJobStatus } from "@/lib/types";

export const jobStatusOptions = ["pending", "running", "completed", "failed", "skipped"] as const satisfies readonly CrawlJobStatus[];

export const jobStatusLabels: Record<CrawlJobStatus, string> = {
  pending: "待機",
  running: "実行中",
  completed: "完了",
  failed: "失敗",
  skipped: "スキップ",
};

export type JobFilters = {
  q?: string;
  status?: CrawlJobStatus;
};

export function parseJobFilters(params: Record<string, string | string[] | undefined>): JobFilters {
  const q = normalizeParam(params.q);
  const status = normalizeParam(params.status);
  return {
    q,
    status: isJobStatus(status) ? status : undefined,
  };
}

export function filterJobs(jobs: JobRow[], filters: JobFilters) {
  const query = filters.q?.toLocaleLowerCase("ja");
  return jobs.filter((job) => {
    if (filters.status && job.status !== filters.status) return false;
    if (!query) return true;
    return [job.company_name, job.job_type, job.status, job.error_message]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("ja").includes(query));
  });
}

export function hasJobFilters(filters: JobFilters) {
  return Boolean(filters.q || filters.status);
}

function normalizeParam(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

function isJobStatus(value: string | undefined): value is CrawlJobStatus {
  return jobStatusOptions.includes(value as CrawlJobStatus);
}
