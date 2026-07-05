import { evaluateCrawlerScore } from "@/lib/etl/scoring";
import type { DashboardMetrics } from "@/lib/types";

export type EvaluationDataMode = "supabase" | "mock";
export type EvaluationOptions = {
  targetPopulation?: number;
  observationsTotal?: number;
  dataMode?: EvaluationDataMode;
  stagingSmokePassedAt?: string | null;
  stagingSmokeCommitSha?: string | null;
  expectedCommitSha?: string | null;
  requireStagingSmoke?: boolean;
};

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

export function buildEvaluationReport(
  metrics: DashboardMetrics,
  options: EvaluationOptions = {},
) {
  const dataMode = options.dataMode ?? "supabase";
  const stagingSmokePassedAt = normalizeOptionalTimestamp(options.stagingSmokePassedAt);
  const stagingSmokeCommitSha = normalizeOptionalText(options.stagingSmokeCommitSha);
  const expectedCommitSha = normalizeOptionalText(options.expectedCommitSha);
  const requiresStagingSmoke = options.requireStagingSmoke ?? dataMode === "supabase";
  const smokeCommitMatches = !expectedCommitSha || stagingSmokeCommitSha === expectedCommitSha;
  const stagingSmokeStatus = !requiresStagingSmoke ? "not_required" : stagingSmokePassedAt ? (smokeCommitMatches ? "passed" : "stale") : "missing";
  const hasStagingSmokeEvidence = stagingSmokeStatus === "passed";
  const evaluation = evaluateCurrentImplementation(metrics, options);
  const operationalRisks = [
    dataMode === "mock" ? "Supabase未設定のため、スコアは開発用モックデータのサンプル評価です。本番カバレッジ評価にはSupabase接続と実データ取り込みが必要です。" : null,
    stagingSmokeStatus === "missing"
      ? "ステージングスモーク成功証跡が未確認です。Supabase接続済みリリース候補は、隔離ステージングでread-only smokeを通してから本番準備完了にしてください。"
      : null,
    stagingSmokeStatus === "stale"
      ? "ステージングスモーク成功証跡が現在のコミットと一致しません。最新コミットでread-only smokeを再実行してから本番準備完了にしてください。"
      : null,
    metrics.errorJobs > 0 ? `failedジョブが${metrics.errorJobs}件あります。ログ確認、リトライ、停止、または補完ジョブ再計画が必要です。` : null,
    metrics.runningJobs > 0 ? `runningジョブが${metrics.runningJobs}件あります。長時間runningのまま残る場合は停止または再実行を確認してください。` : null,
    metrics.withAnnualRevenue < metrics.totalCompanies ? "年商は非上場企業で未公表が多いため、unknownとestimatedの区別を維持したまま補完してください。" : null,
  ].filter(Boolean) as string[];
  const releaseGateFailures = operationalRisks.filter((risk) => {
    if (risk.startsWith("年商は非上場企業")) return false;
    return true;
  });
  const nextActions = [
    requiresStagingSmoke && !hasStagingSmokeEvidence ? "隔離ステージングSupabaseで `npm run smoke:staging` を最新コミットに対して成功させ、成功レポートを自己評価に反映" : null,
    ...evaluation.nextActions,
  ].filter(Boolean) as string[];

  return {
    dataMode,
    scoreScope: dataMode === "mock" ? "sample_data" : "connected_database",
    releaseReady: evaluation.score === 100 && releaseGateFailures.length === 0,
    releaseGateFailures,
    verification: {
      stagingSmoke: {
        required: requiresStagingSmoke,
        status: stagingSmokeStatus,
        passedAt: stagingSmokePassedAt,
        commitSha: stagingSmokeCommitSha,
        expectedCommitSha,
      },
    },
    metrics,
    ...evaluation,
    nextActions,
    operationalRisks,
  };
}

function normalizeOptionalTimestamp(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
