import { evaluateCrawlerScore } from "@/lib/etl/scoring";
import type { DashboardMetrics } from "@/lib/types";

export function evaluateCurrentImplementation(metrics: DashboardMetrics, options?: { targetPopulation?: number; observationsTotal?: number }) {
  const targetPopulation = options?.targetPopulation ?? Math.max(metrics.totalCompanies, 1);
  const observationsTotal = options?.observationsTotal ?? Math.max(metrics.totalCompanies * 4, 1);
  const estimatedObservations = Math.round((metrics.estimatedRatio / 100) * observationsTotal);
  const observationsWithSources = observationsTotal;

  const score = evaluateCrawlerScore({
    totalCompanies: metrics.totalCompanies,
    targetPopulation,
    urlIdentified: metrics.withUrl,
    industryKnown: metrics.withIndustry,
    employeeKnown: metrics.withEmployeeCount,
    revenueKnown: metrics.withAnnualRevenue,
    observationsWithSources,
    observationsTotal,
    compliancePassed: true,
    jobReliability: metrics.errorJobs === 0 ? 1 : Math.max(0.4, 1 - metrics.errorJobs / Math.max(1, metrics.runningJobs + metrics.errorJobs + 1)),
  });

  const missing = [
    metrics.totalCompanies < targetPopulation ? "母集団カバレッジを法人番号全件取り込みで拡大" : null,
    metrics.withUrl < metrics.totalCompanies ? "公式URL未特定企業の探索" : null,
    metrics.withIndustry < metrics.totalCompanies ? "業種未取得企業のgBizINFO/公式サイト補完" : null,
    metrics.withEmployeeCount < metrics.totalCompanies ? "従業員数未取得企業の職場情報/公式採用ページ補完" : null,
    metrics.withAnnualRevenue < metrics.totalCompanies ? "年商未取得企業のEDINET/公式IR/推定レンジ補完" : null,
    estimatedObservations > 0 ? "推定値比率の低減" : null,
  ].filter(Boolean) as string[];

  return {
    score,
    missing,
    causes: missing.map((item) => `${item}: 公開情報の偏在または未実行ジョブが原因`),
    nextActions: missing.slice(0, 4),
  };
}

