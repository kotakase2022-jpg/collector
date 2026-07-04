import { parse } from "csv-parse/sync";
import type { Company } from "@/lib/types";
import type { ListQualityIssue, ListQualitySummary } from "@/lib/types";

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

const requiredColumns = ["corporate_number", "company_name"] as const;

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

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
