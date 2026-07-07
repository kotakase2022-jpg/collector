import { parse } from "csv-parse/sync";
import { hasCorporateNumberValue } from "@/lib/corporate-number";
import { normalizeCorporateNumber } from "@/lib/etl/normalize";
import {
  csvColumnAliases,
  requiredCsvColumns,
  type CsvColumn,
  type CsvImportPreview,
  type CsvImportRowIssue,
} from "@/lib/csv-import-preview";
import type { Company } from "@/lib/types";
import type { ListQualityIssue, ListQualitySummary, ListReadiness } from "@/lib/types";

type CsvParsedRow = {
  record: string[];
  info: {
    lines: number;
  };
};

export {
  buildCsvImportReadiness,
  csvColumnAliasGroups,
  csvImportMaxBytes,
  csvImportMaxSizeLabel,
  optionalCsvColumns,
  requiredCsvColumns,
  type CsvColumn,
  type CsvColumnAliasGroup,
  type CsvImportPreview,
  type CsvImportRowIssue,
  type CsvImportPreviewRow,
  type CsvImportReadiness,
} from "@/lib/csv-import-preview";

export function buildListQualitySummary(companies: Pick<Company, "corporate_number" | "official_url" | "annual_revenue" | "annual_revenue_type" | "employee_count" | "data_confidence_score">[]): ListQualitySummary {
  const corporateCounts = new Map<string, number>();
  for (const company of companies) {
    const corporateNumber = normalizeCorporateNumber(company.corporate_number);
    if (!corporateNumber) continue;
    corporateCounts.set(corporateNumber, (corporateCounts.get(corporateNumber) ?? 0) + 1);
  }

  return {
    total: companies.length,
    withUrl: companies.filter((company) => Boolean(company.official_url)).length,
    withRevenue: companies.filter((company) => company.annual_revenue != null).length,
    withEmployeeCount: companies.filter((company) => company.employee_count != null).length,
    estimatedRevenue: companies.filter((company) => company.annual_revenue_type === "estimated").length,
    lowConfidence: companies.filter((company) => company.data_confidence_score < 60).length,
    missingCorporateNumber: companies.filter((company) => !hasCorporateNumberValue(company.corporate_number)).length,
    duplicateCorporateNumbers: [...corporateCounts.entries()].filter(([, count]) => count > 1).map(([corporateNumber]) => corporateNumber),
  };
}

export function getCompanyQualityIssues(
  company: Pick<Company, "corporate_number" | "official_url" | "annual_revenue" | "annual_revenue_type" | "employee_count" | "data_confidence_score">,
): ListQualityIssue[] {
  const issues: ListQualityIssue[] = [];
  if (!hasCorporateNumberValue(company.corporate_number)) {
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
      recommendedActions: ["検索語や都道府県を外す", "対象範囲で全企業を明示選択する"],
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
    recommendedActions: recommendedReadinessActions(summary, {
      missingUrl,
      missingRevenue,
      missingEmployee,
      hasDuplicateCorporateNumbers: summary.duplicateCorporateNumbers.length > 0,
    }),
  };
}

export function parseCompanyCsvImportPreview(csvText: string): CsvImportPreview {
  const parsedRows = parse(csvText, {
    bom: true,
    info: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  }) as unknown as CsvParsedRow[];
  const rows = parsedRows.map((row) => row.record);
  const headers = rows[0] ?? [];
  const dataRows = parsedRows.slice(1);
  const sourceRowNumbers = dataRows.map((row) => row.info.lines);
  const missingRequiredColumns = requiredCsvColumns.filter((column) => !headers.some((header) => canonicalCsvColumn(header) === column));
  const duplicateColumns = duplicateCanonicalCsvColumns(headers);
  const rawRecords = dataRows.map(({ record }) => normalizeCsvRecord(headers, record, { normalizeUrls: false }));
  const records = dataRows.map(({ record }) => normalizeCsvRecord(headers, record));

  const duplicateCounter = new Map<string, number>();
  let missingRequiredCount = 0;
  let invalidCorporateNumberCount = 0;
  let invalidUrlCount = 0;
  let dangerousValueCount = 0;
  const invalidRowIndexes = new Set<number>();
  const issuesByRow = records.map((): string[] => []);

  records.forEach((record, index) => {
    const missingRequiredFields = requiredCsvColumns.filter((column) => !record[column]?.trim());
    if (missingRequiredFields.length) {
      missingRequiredCount += 1;
      invalidRowIndexes.add(index);
      issuesByRow[index].push(`必須欠損: ${missingRequiredFields.join(", ")}`);
    }
    const rawCorporateNumber = record.corporate_number?.trim();
    const normalizedCorporateNumber = normalizeCorporateNumber(rawCorporateNumber);
    if (rawCorporateNumber && !normalizedCorporateNumber) {
      invalidCorporateNumberCount += 1;
      invalidRowIndexes.add(index);
      issuesByRow[index].push("法人番号不正");
    }
    if (normalizedCorporateNumber) duplicateCounter.set(normalizedCorporateNumber, (duplicateCounter.get(normalizedCorporateNumber) ?? 0) + 1);
    const url = record.official_url?.trim();
    if (url && !isHttpUrl(url)) {
      invalidUrlCount += 1;
      invalidRowIndexes.add(index);
      issuesByRow[index].push("URL不正");
    }
    const dangerousColumns = findDangerousCsvColumns(rawRecords[index] ?? {});
    if (dangerousColumns.length) {
      dangerousValueCount += dangerousColumns.length;
      invalidRowIndexes.add(index);
      issuesByRow[index].push(`危険な値: ${dangerousColumns.join(", ")}`);
    }
  });

  const duplicateKeys = new Set([...duplicateCounter.entries()].filter(([, count]) => count > 1).map(([key]) => key));
  records.forEach((record, index) => {
    const key = normalizeCorporateNumber(record.corporate_number?.trim());
    if (key && duplicateKeys.has(key)) {
      invalidRowIndexes.add(index);
      issuesByRow[index].push("法人番号重複");
    }
  });

  return {
    rowCount: records.length,
    validRows: records.length - invalidRowIndexes.size,
    missingRequiredColumns,
    duplicateColumns,
    missingRequiredCount,
    duplicateKeys: [...duplicateKeys],
    invalidCorporateNumberCount,
    invalidUrlCount,
    dangerousValueCount,
    previewRows: records.slice(0, 5).map((record) => ({
      corporate_number: record.corporate_number ?? "",
      company_name: record.company_name ?? "",
      official_url: record.official_url ?? "",
      industry: record.industry ?? "",
    })),
    rowIssueCount: issuesByRow.filter((issues) => issues.length > 0).length,
    rowIssues: buildCsvRowIssues(records, issuesByRow, sourceRowNumbers),
  };
}

function buildCsvRowIssues(records: Partial<Record<CsvColumn, string>>[], issuesByRow: string[][], sourceRowNumbers: number[]): CsvImportRowIssue[] {
  return records
    .map((record, index) => ({
      rowNumber: sourceRowNumbers[index] ?? index + 2,
      corporate_number: record.corporate_number ?? "",
      company_name: record.company_name ?? "",
      issues: issuesByRow[index],
    }))
    .filter((rowIssue) => rowIssue.issues.length > 0)
    .slice(0, 10);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function findDangerousCsvColumns(record: Partial<Record<CsvColumn, string>>) {
  return (Object.entries(record) as [CsvColumn, string][]).filter(([, value]) => isDangerousCsvCellValue(value)).map(([column]) => column);
}

function isDangerousCsvCellValue(value: string) {
  const firstMeaningfulChar = value.trimStart().at(0);
  return /^[ \t\r\n]*[\t\r\n]/.test(value) || (firstMeaningfulChar !== undefined && ["=", "+", "-", "@"].includes(firstMeaningfulChar));
}

function normalizeCsvRecord(headers: string[], values: string[], options: { normalizeUrls?: boolean } = {}) {
  const record: Partial<Record<CsvColumn, string>> = {};
  headers.forEach((header, index) => {
    const column = canonicalCsvColumn(header);
    if (!column) return;
    const shouldNormalizeUrl = options.normalizeUrls ?? true;
    const value = column === "official_url" && shouldNormalizeUrl ? normalizeCsvUrl(values[index] ?? "") : (values[index] ?? "");
    if (record[column] == null || !record[column]?.trim()) {
      record[column] = value;
    }
  });
  return record;
}

function normalizeCsvUrl(value: string) {
  const trimmed = value.trim().normalize("NFKC");
  if (!trimmed) return "";
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) return trimmed;

  const candidate = `https://${trimmed}`;
  return isHttpUrl(candidate) && new URL(candidate).hostname.includes(".") ? candidate : trimmed;
}

function canonicalCsvColumn(header: string): CsvColumn | null {
  const normalizedHeader = normalizeCsvHeader(header);
  for (const [column, aliases] of Object.entries(csvColumnAliases) as [CsvColumn, readonly string[]][]) {
    if (aliases.some((alias) => normalizeCsvHeader(alias) === normalizedHeader)) return column;
  }
  return null;
}

function duplicateCanonicalCsvColumns(headers: string[]) {
  const counts = new Map<CsvColumn, number>();
  for (const header of headers) {
    const column = canonicalCsvColumn(header);
    if (!column) continue;
    counts.set(column, (counts.get(column) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([column]) => column);
}

function normalizeCsvHeader(header: string) {
  return header.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
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

function recommendedReadinessActions(
  summary: ListQualitySummary,
  details: {
    missingUrl: number;
    missingRevenue: number;
    missingEmployee: number;
    hasDuplicateCorporateNumbers: boolean;
  },
) {
  if (summary.total === 0) return ["検索語や都道府県を外す", "対象範囲で全企業を明示選択する"];
  if (
    !details.hasDuplicateCorporateNumbers &&
    summary.missingCorporateNumber === 0 &&
    details.missingUrl === 0 &&
    details.missingRevenue === 0 &&
    details.missingEmployee === 0 &&
    summary.estimatedRevenue === 0 &&
    summary.lowConfidence === 0
  ) {
    return ["保存済みリストとして保存する", "CSV出力して業務利用する"];
  }

  const actions = [
    details.hasDuplicateCorporateNumbers ? "法人番号重複を除外する" : null,
    summary.missingCorporateNumber > 0 ? "法人番号ありの企業に絞る" : null,
    summary.lowConfidence > 0 ? "信頼度60以上で絞る" : null,
    details.missingUrl > 0 ? "URLありのみで絞る" : null,
    details.missingRevenue > 0 || summary.estimatedRevenue > 0 ? "年商あり・公式/報告値で絞る" : null,
    details.missingEmployee > 0 ? "従業員数ありのみで絞る" : null,
  ].filter(Boolean) as string[];

  return actions.slice(0, 4);
}
