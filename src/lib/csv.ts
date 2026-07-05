import { stringify } from "csv-stringify/sync";

export type CompanyExportRow = {
  corporate_number: string;
  company_name: string;
  official_url: string;
  industry: string;
  employee_count: number | "";
  employee_count_type: string;
  annual_revenue: number | "";
  annual_revenue_type: string;
  revenue_range: string;
  confidence_score: number;
  source_urls: string;
  updated_at: string;
};

export type SavedListComparisonExportRow = {
  change_type: "changed" | "added" | "removed";
  base_list_name: string;
  target_list_name: string;
  corporate_number: string;
  company_name: string;
  changed_fields: string;
};

export function createCompaniesCsv(rows: CompanyExportRow[]) {
  return `\uFEFF${stringify(rows.map(sanitizeCompanyExportRow), {
    header: true,
    columns: [
      "corporate_number",
      "company_name",
      "official_url",
      "industry",
      "employee_count",
      "employee_count_type",
      "annual_revenue",
      "annual_revenue_type",
      "revenue_range",
      "confidence_score",
      "source_urls",
      "updated_at",
    ],
  })}`;
}

export function createSavedListComparisonCsv(rows: SavedListComparisonExportRow[]) {
  return `\uFEFF${stringify(rows.map(sanitizeSavedListComparisonExportRow), {
    header: true,
    columns: ["change_type", "base_list_name", "target_list_name", "corporate_number", "company_name", "changed_fields"],
  })}`;
}

export function decodeCsvBuffer(buffer: ArrayBuffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("shift_jis").decode(buffer);
  }
}

function sanitizeCompanyExportRow(row: CompanyExportRow): CompanyExportRow {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, sanitizeCsvValue(value)])) as CompanyExportRow;
}

function sanitizeSavedListComparisonExportRow(row: SavedListComparisonExportRow): SavedListComparisonExportRow {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, sanitizeCsvValue(value)])) as SavedListComparisonExportRow;
}

function sanitizeCsvValue(value: string | number | "") {
  if (typeof value !== "string") return value;
  const firstMeaningfulChar = value.trimStart().at(0);
  return firstMeaningfulChar && ["=", "+", "-", "@", "\t", "\r"].includes(firstMeaningfulChar) ? `'${value}` : value;
}
