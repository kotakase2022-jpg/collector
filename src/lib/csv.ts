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

export function createCompaniesCsv(rows: CompanyExportRow[]) {
  return stringify(rows, {
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
  });
}

