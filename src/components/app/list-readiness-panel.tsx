import { Badge } from "@/components/ui/badge";
import { buildListReadiness } from "@/lib/list-quality";
import type { ListQualitySummary } from "@/lib/types";

type ListReadinessPanelProps = {
  quality: ListQualitySummary;
};

const toneClasses = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-destructive/40 bg-destructive/5 text-destructive",
} as const;

export function ListReadinessPanel({ quality }: ListReadinessPanelProps) {
  const readiness = buildListReadiness(quality);

  return (
    <div className={`rounded-md border p-3 ${toneClasses[readiness.tone]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium opacity-80">業務利用目安</p>
          <p className="mt-1 text-sm font-semibold">
            {readiness.label}・{readiness.score}点
          </p>
        </div>
        <Badge variant={readiness.tone === "danger" ? "destructive" : "outline"} className="rounded-sm bg-background/70">
          {readiness.blockers.length ? `${readiness.blockers.length}項目確認` : "確認不要"}
        </Badge>
      </div>
      {readiness.blockers.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {readiness.blockers.map((blocker) => (
            <span key={blocker} className="rounded-sm border border-current/20 bg-background/70 px-2 py-1 text-xs">
              {blocker}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-3 text-sm">{readiness.nextAction}</p>
      {readiness.recommendedActions.length ? (
        <div className="mt-3 border-t border-current/20 pt-3">
          <p className="text-xs font-medium opacity-80">次の一手</p>
          <ol aria-label="次の一手" className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {readiness.recommendedActions.map((action, index) => (
              <li key={action} className="flex min-w-0 gap-2">
                <span className="tabular-nums opacity-70">{index + 1}.</span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
