import { Badge } from "@/components/ui/badge";
import { getCompanyQualityIssues } from "@/lib/list-quality";
import type { Company } from "@/lib/types";

type QualityIssueBadgesProps = {
  company: Pick<Company, "corporate_number" | "official_url" | "annual_revenue" | "annual_revenue_type" | "employee_count" | "data_confidence_score">;
};

export function QualityIssueBadges({ company }: QualityIssueBadgesProps) {
  const issues = getCompanyQualityIssues(company);
  if (!issues.length) {
    return (
      <Badge variant="outline" className="rounded-sm border-emerald-200 text-emerald-700">
        良好
      </Badge>
    );
  }

  return (
    <div className="flex min-w-36 flex-wrap gap-1">
      {issues.map((issue) => (
        <Badge key={issue.key} variant={issue.severity === "danger" ? "destructive" : "outline"} className="rounded-sm">
          {issue.label}
        </Badge>
      ))}
    </div>
  );
}
