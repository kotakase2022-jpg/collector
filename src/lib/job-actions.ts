import type { CrawlJobStatus } from "@/lib/types";

export const retryableJobStatuses = ["failed", "skipped"] as const satisfies readonly CrawlJobStatus[];
export const stoppableJobStatuses = ["pending", "running"] as const satisfies readonly CrawlJobStatus[];
const retryableJobStatusSet: ReadonlySet<CrawlJobStatus> = new Set(retryableJobStatuses);
const stoppableJobStatusSet: ReadonlySet<CrawlJobStatus> = new Set(stoppableJobStatuses);

export function canRetryJobStatus(status: CrawlJobStatus) {
  return retryableJobStatusSet.has(status);
}

export function canStopJobStatus(status: CrawlJobStatus) {
  return stoppableJobStatusSet.has(status);
}

type JobMutationClient = {
  from: (table: "crawl_jobs") => {
    update: (values: Record<string, unknown>) => {
      eq: (column: "id", value: string) => {
        in: (column: "status", values: readonly CrawlJobStatus[]) => {
          select: (columns: "id") => {
            maybeSingle: () => PromiseLike<{ data: { id: string } | null; error: Error | { message: string } | null }>;
          };
        };
      };
    };
  };
};

export async function markJobForRetry(client: JobMutationClient, id: string, now = new Date()) {
  const { data, error } = await client
    .from("crawl_jobs")
    .update({
      status: "pending",
      error_message: null,
      scheduled_at: now.toISOString(),
      started_at: null,
      finished_at: null,
    })
    .eq("id", id)
    .in("status", retryableJobStatuses)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function markJobStopped(client: JobMutationClient, id: string, now = new Date()) {
  const { data, error } = await client
    .from("crawl_jobs")
    .update({
      status: "skipped",
      finished_at: now.toISOString(),
    })
    .eq("id", id)
    .in("status", stoppableJobStatuses)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
