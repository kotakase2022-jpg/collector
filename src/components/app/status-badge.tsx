import { Badge } from "@/components/ui/badge";
import type { CrawlJobStatus } from "@/lib/types";

const jobLabels: Record<CrawlJobStatus, string> = {
  pending: "待機",
  running: "実行中",
  completed: "完了",
  failed: "失敗",
  skipped: "スキップ",
};

export function JobStatusBadge({ status }: { status: CrawlJobStatus }) {
  const variant = status === "failed" ? "destructive" : status === "completed" ? "secondary" : "outline";
  return <Badge variant={variant}>{jobLabels[status]}</Badge>;
}

export function ConfidenceBadge({ score }: { score: number }) {
  const variant = score >= 80 ? "default" : score >= 50 ? "secondary" : "outline";
  return <Badge variant={variant}>{score}</Badge>;
}

