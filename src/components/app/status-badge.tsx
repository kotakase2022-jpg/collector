import { Badge } from "@/components/ui/badge";
import { jobStatusLabels } from "@/lib/job-filters";
import type { CrawlJobStatus } from "@/lib/types";

export function JobStatusBadge({ status }: { status: CrawlJobStatus }) {
  const variant = status === "failed" ? "destructive" : status === "completed" ? "secondary" : "outline";
  return <Badge variant={variant}>{jobStatusLabels[status]}</Badge>;
}

export function ConfidenceBadge({ score }: { score: number }) {
  const variant = score >= 80 ? "default" : score >= 50 ? "secondary" : "outline";
  return <Badge variant={variant}>{score}</Badge>;
}
