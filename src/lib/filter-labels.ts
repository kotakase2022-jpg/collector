import type { CompanyFilters } from "@/lib/types";

const sortLabels: Record<NonNullable<CompanyFilters["sort"]>, string> = {
  updated_desc: "更新が新しい順",
  confidence_desc: "信頼度が高い順",
  revenue_desc: "年商が大きい順",
  employee_desc: "従業員数が多い順",
  name_asc: "企業名順",
};

export function formatCompanyFilterBadges(filters: CompanyFilters) {
  const badges: string[] = [];
  if (filters.q) badges.push(`検索: ${filters.q}`);
  if (filters.prefecture) badges.push(`都道府県: ${filters.prefecture}`);
  if (filters.industry) badges.push(`業種: ${filters.industry}`);
  if (filters.employeeRange) badges.push(`従業員数: ${filters.employeeRange}`);
  if (filters.revenueRange) badges.push(`年商: ${filters.revenueRange}`);
  if (filters.hasUrl) badges.push(filters.hasUrl === "yes" ? "URLあり" : "URLなし");
  if (filters.hasRevenue) badges.push(filters.hasRevenue === "yes" ? "年商あり" : "年商なし");
  if (filters.hasEmployeeCount) badges.push(filters.hasEmployeeCount === "yes" ? "従業員数あり" : "従業員数なし");
  if (filters.valueKind) badges.push(filters.valueKind === "official" ? "公式/報告値" : "推定値");
  if (filters.minConfidence != null) badges.push(`信頼度${filters.minConfidence}以上`);
  if (filters.sort) badges.push(`並び替え: ${sortLabels[filters.sort]}`);
  return badges;
}
