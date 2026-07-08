import type { CompanyObservation, ExtractionMethod, ObservationSourceType, SourceKind } from "@/lib/types";

const sourceBaseScores: Record<SourceKind, number> = {
  edinet: 100,
  nta: 100,
  shokuba: 85,
  official_site: 90,
  gbizinfo: 70,
  third_party: 50,
  search: 45,
  llm_extraction: 30,
};

const extractionBoost: Record<ExtractionMethod, number> = {
  api: 5,
  pdf_rule: 4,
  html_rule: 3,
  llm: 0,
  manual: 8,
};

const crawlerScoreWeights = {
  population: 20,
  url: 15,
  industry: 15,
  employee: 15,
  revenue: 15,
  verification: 10,
  compliance: 10,
  operations: 10,
} as const;

export function confidenceForSource(sourceType: SourceKind, method: ExtractionMethod, explicitConfidence?: number) {
  if (explicitConfidence != null) return clampScore(explicitConfidence);
  return clampScore(sourceBaseScores[sourceType] + extractionBoost[method]);
}

export function observationKind(sourceType: SourceKind, method: ExtractionMethod, isEstimated = false): ObservationSourceType {
  if (isEstimated) return "estimated";
  if (sourceType === "edinet" || sourceType === "nta" || sourceType === "official_site" || sourceType === "shokuba") {
    return "official";
  }
  if (sourceType === "llm_extraction" && method === "llm") return "estimated";
  if (sourceType === "third_party" || sourceType === "gbizinfo" || sourceType === "search") return "reported";
  return "unknown";
}

export function selectBestObservation<T extends Pick<CompanyObservation, "confidence_score" | "created_at">>(observations: T[]) {
  return [...observations].sort((a, b) => {
    if (b.confidence_score !== a.confidence_score) return b.confidence_score - a.confidence_score;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0] ?? null;
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function evaluateCrawlerScore(input: {
  totalCompanies: number;
  targetPopulation: number;
  urlIdentified: number;
  industryKnown: number;
  employeeKnown: number;
  revenueKnown: number;
  observationsWithSources: number;
  observationsTotal: number;
  compliancePassed: boolean;
  jobReliability: number;
}) {
  const ratio = (num: number, den: number) => (den <= 0 ? 0 : Math.min(1, num / den));

  const population = ratio(input.totalCompanies, input.targetPopulation) * crawlerScoreWeights.population;
  const url = ratio(input.urlIdentified, input.totalCompanies) * crawlerScoreWeights.url;
  const industry = ratio(input.industryKnown, input.totalCompanies) * crawlerScoreWeights.industry;
  const employee = ratio(input.employeeKnown, input.totalCompanies) * crawlerScoreWeights.employee;
  const revenue = ratio(input.revenueKnown, input.totalCompanies) * crawlerScoreWeights.revenue;
  const verification = ratio(input.observationsWithSources, input.observationsTotal) * crawlerScoreWeights.verification;
  const compliance = input.compliancePassed ? crawlerScoreWeights.compliance : 0;
  const operations = Math.min(1, input.jobReliability) * crawlerScoreWeights.operations;
  const weightedTotal = Object.values(crawlerScoreWeights).reduce((total, weight) => total + weight, 0);
  const rawScore = population + url + industry + employee + revenue + verification + compliance + operations;

  return clampScore((rawScore / weightedTotal) * 100);
}
