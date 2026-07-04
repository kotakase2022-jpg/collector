import { parse } from "csv-parse/sync";
import type { Company } from "@/lib/types";
import type { ListQualityIssue, ListQualitySummary, ListReadiness } from "@/lib/types";

export type CsvImportPreviewRow = {
  corporate_number: string;
  company_name: string;
  official_url: string;
  industry: string;
};

export type CsvImportPreview = {
  rowCount: number;
  validRows: number;
  missingRequiredCount: number;
  duplicateKeys: string[];
  invalidUrlCount: number;
  previewRows: CsvImportPreviewRow[];
};

export type CsvImportReadiness = {
  label: "取込確認OK" | "修正が必要" | "対象行なし";
  tone: "good" | "warning" | "danger";
  issues: string[];
  nextAction: string;
};

const requiredColumns = ["corporate_number", "company_name"] as const;
export const requiredCsvColumns = [...requiredColumns];
export const optionalCsvColumns = ["official_url", "industry"] as const;

export function buildListQualitySummary(companies: Pick<Company, "corporate_number" | "official_url" | "annual_revenue" | "annual_revenue_type" | "employee_count" | "data_confidence_score">[]): ListQualitySummary {
  const corporateCounts = new Map<string, number>();
  for (const company of companies) {
    if (!company.corporate_number) continue;
    corporateCounts.set(company.corporate_number, (corporateCounts.get(company.corporate_number) ?? 0) + 1);
  }

  return {
    total: companies.length,
    withUrl: companies.filter((company) => Boolean(company.official_url)).length,
    withRevenue: companies.filter((company) => company.annual_revenue != null).length,
    withEmployeeCount: companies.filter((company) => company.employee_count != null).length,
    estimatedRevenue: companies.filter((company) => company.annual_revenue_type === "estimated").length,
    lowConfidence: companies.filter((company) => company.data_confidence_score < 60).length,
    missingCorporateNumber: companies.filter((company) => !company.corporate_number).length,
    duplicateCorporateNumbers: [...corporateCounts.entries()].filter(([, count]) => count > 1).map(([corporateNumber]) => corporateNumber),
  };
}

export function getCompanyQualityIssues(
  company: Pick<Company, "corporate_number" | "official_url" | "annual_revenue" | "annual_revenue_type" | "employee_count" | "data_confidence_score">,
): ListQualityIssue[] {
  const issues: ListQualityIssue[] = [];
  if (!company.corporate_number) {
    issues.push({ key: "missing_corporate_number", label: "法人番号なし", severity: "danger" });
  }
  if (!company.official_url) {
    issues.push({ key: "missing_url", label: "URLなし", severity: "warning" });
  }
  if (company.annual_revenue == null) {
    issues.push({ key: "missing_revenue", label: "年商なし", severity: "warning" });
  } else if (company.annual_revenue_type === "estimated") {
    issues.push({ key: "estimated_revenue", label: "推定年商", severity: "warning" });
  }
  if (company.employee_count == null) {
    issues.push({ key: "missing_employee_count", label: "従業員数なし", severity: "warning" });
  }
  if (company.data_confidence_score < 60) {
    issues.push({ key: "low_confidence", label: "低信頼", severity: "danger" });
  }
  return issues;
}

export function buildListReadiness(summary: ListQualitySummary): ListReadiness {
  if (summary.total === 0) {
    return {
      score: 0,
      label: "対象なし",
      tone: "danger",
      blockers: ["条件に一致する企業がありません"],
      nextAction: "条件を広げて対象企業を増やしてください。",
    };
  }

  const missingUrl = summary.total - summary.withUrl;
  const missingRevenue = summary.total - summary.withRevenue;
  const missingEmployee = summary.total - summary.withEmployeeCount;
  const duplicatePenalty = summary.duplicateCorporateNumbers.length ? 20 : 0;
  const score = clampReadiness(
    100 -
      duplicatePenalty -
      ratioPenalty(summary.missingCorporateNumber, summary.total, 15) -
      ratioPenalty(missingUrl, summary.total, 15) -
      ratioPenalty(missingRevenue, summary.total, 15) -
      ratioPenalty(missingEmployee, summary.total, 15) -
      ratioPenalty(summary.estimatedRevenue, summary.total, 10) -
      ratioPenalty(summary.lowConfidence, summary.total, 20),
  );
  const blockers = [
    summary.duplicateCorporateNumbers.length ? "法人番号重複あり" : null,
    summary.missingCorporateNumber > 0 ? `法人番号なし ${summary.missingCorporateNumber}件` : null,
    summary.lowConfidence > 0 ? `低信頼 ${summary.lowConfidence}件` : null,
    missingUrl > 0 ? `URLなし ${missingUrl}件` : null,
    missingRevenue > 0 ? `年商なし ${missingRevenue}件` : null,
    missingEmployee > 0 ? `従業員数なし ${missingEmployee}件` : null,
    summary.estimatedRevenue > 0 ? `推定年商 ${summary.estimatedRevenue}件` : null,
  ].filter(Boolean) as string[];

  return {
    score,
    label: readinessLabel(score),
    tone: score >= 90 ? "good" : score >= 70 ? "warning" : "danger",
    blockers,
    nextAction: nextReadinessAction(blockers),
  };
}

export function parseCompanyCsvImportPreview(csvText: string): CsvImportPreview {
  const records = parse(csvText, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const duplicateCounter = new Map<string, number>();
  let missingRequiredCount = 0;
  let invalidUrlCount = 0;
  let invalidRows = 0;

  for (const record of records) {
    let rowInvalid = false;
    if (requiredColumns.some((column) => !record[column]?.trim())) {
      missingRequiredCount += 1;
      rowInvalid = true;
    }
    const key = record.corporate_number?.trim();
    if (key) duplicateCounter.set(key, (duplicateCounter.get(key) ?? 0) + 1);
    const url = record.official_url?.trim();
    if (url && !isHttpUrl(url)) {
      invalidUrlCount += 1;
      rowInvalid = true;
    }
    if (rowInvalid) invalidRows += 1;
  }

  return {
    rowCount: records.length,
    validRows: records.length - invalidRows,
    missingRequiredCount,
    duplicateKeys: [...duplicateCounter.entries()].filter(([, count]) => count > 1).map(([key]) => key),
    invalidUrlCount,
    previewRows: records.slice(0, 5).map((record) => ({
      corporate_number: record.corporate_number ?? "",
      company_name: record.company_name ?? "",
      official_url: record.official_url ?? "",
      industry: record.industry ?? "",
    })),
  };
}

export function buildCsvImportReadiness(preview: CsvImportPreview): CsvImportReadiness {
  if (preview.rowCount === 0) {
    return {
      label: "対象行なし",
      tone: "danger",
      issues: ["CSVにデータ行がありません"],
      nextAction: "ヘッダー行に続けて企業データを追加してください。",
    };
  }

  const issues = [
    preview.missingRequiredCount > 0 ? `必須欠損 ${preview.missingRequiredCount}行` : null,
    preview.duplicateKeys.length > 0 ? `法人番号重複 ${preview.duplicateKeys.length}件` : null,
    preview.invalidUrlCount > 0 ? `URL不正 ${preview.invalidUrlCount}行` : null,
  ].filter(Boolean) as string[];

  if (!issues.length) {
    return {
      label: "取込確認OK",
      tone: "good",
      issues,
      nextAction: "列と先頭行に問題はありません。必要に応じて保存済みリストや企業一覧と照合してください。",
    };
  }

  return {
    label: "修正が必要",
    tone: preview.validRows > 0 ? "warning" : "danger",
    issues,
    nextAction: "CSVを修正して再検査してください。必須列はcorporate_numberとcompany_nameです。",
  };
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ratioPenalty(count: number, total: number, maxPenalty: number) {
  return total <= 0 ? 0 : Math.round((count / total) * maxPenalty);
}

function clampReadiness(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function readinessLabel(score: number): ListReadiness["label"] {
  if (score >= 90) return "即利用向き";
  if (score >= 70) return "要確認";
  return "補完優先";
}

function nextReadinessAction(blockers: string[]) {
  if (!blockers.length) return "保存またはCSV出力して業務利用できます。";
  if (blockers.some((blocker) => blocker.includes("重複"))) return "重複企業を除外してから保存してください。";
  if (blockers.some((blocker) => blocker.includes("法人番号なし"))) return "法人番号ありの企業へ絞るか、名寄せ候補を詳細画面で確認してください。";
  if (blockers.some((blocker) => blocker.includes("低信頼"))) return "信頼度60以上で絞り込むか、詳細画面で根拠を確認してください。";
  if (blockers.some((blocker) => blocker.includes("URLなし"))) return "URLありのみで絞り込むか、公式URL補完ジョブを計画してください。";
  if (blockers.some((blocker) => blocker.includes("年商なし") || blocker.includes("推定年商"))) return "年商ありのみ、または公式/報告値で絞り込んでください。";
  return "従業員数ありのみで絞り込むか、補完ジョブを計画してください。";
}
