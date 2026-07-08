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

type JobUpdatePayload = Record<string, unknown>;

type JobMutationClient = {
  from: (table: "crawl_jobs") => {
    update: (values: JobUpdatePayload) => {
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
  return updateJobIfStatusIn(
    client,
    id,
    {
      status: "pending",
      error_message: null,
      scheduled_at: now.toISOString(),
      started_at: null,
      finished_at: null,
    },
    retryableJobStatuses,
  );
}

export async function markJobStopped(client: JobMutationClient, id: string, now = new Date()) {
  return updateJobIfStatusIn(
    client,
    id,
    {
      status: "skipped",
      finished_at: now.toISOString(),
    },
    stoppableJobStatuses,
  );
}

async function updateJobIfStatusIn(client: JobMutationClient, id: string, values: JobUpdatePayload, allowedStatuses: readonly CrawlJobStatus[]) {
  const { data, error } = await client
    .from("crawl_jobs")
    .update(values)
    .eq("id", id)
    .in("status", allowedStatuses)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
