export type CsvImportPreviewRow = {
  corporate_number: string;
  company_name: string;
  official_url: string;
  industry: string;
};

export type CsvImportPreview = {
  rowCount: number;
  validRows: number;
  missingRequiredColumns: string[];
  missingRequiredCount: number;
  duplicateKeys: string[];
  invalidCorporateNumberCount: number;
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
const optionalColumns = ["official_url", "industry"] as const;
export type CsvColumn = (typeof requiredColumns)[number] | (typeof optionalColumns)[number];
export type CsvColumnAliasGroup = {
  key: CsvColumn;
  label: string;
  values: readonly string[];
};

export const csvColumnAliases: Record<CsvColumn, readonly string[]> = {
  corporate_number: ["corporate_number", "corporateNumber", "法人番号", "法人番号(13桁)", "法人番号13桁"],
  company_name: ["company_name", "companyName", "企業名", "会社名", "会社名(商号)", "法人名", "名称", "商号", "商号又は名称"],
  official_url: ["official_url", "officialUrl", "url", "URL", "公式URL", "会社URL", "企業URL", "公式サイト", "ホームページ", "HP", "Webサイト", "ウェブサイト", "website"],
  industry: ["industry", "業種", "業界", "業態", "産業分類", "事業内容"],
};

const csvColumnLabels: Record<CsvColumn, string> = {
  corporate_number: "法人番号",
  company_name: "企業名",
  official_url: "URL",
  industry: "業種",
};

export const requiredCsvColumns = [...requiredColumns];
export const optionalCsvColumns = [...optionalColumns];
export const csvImportMaxBytes = 1_000_000;
export const csvImportMaxSizeLabel = "1MB";
export const csvColumnAliasGroups = [
  { key: "corporate_number", label: csvColumnLabels.corporate_number, values: csvColumnAliases.corporate_number },
  { key: "company_name", label: csvColumnLabels.company_name, values: csvColumnAliases.company_name },
  { key: "official_url", label: csvColumnLabels.official_url, values: csvColumnAliases.official_url },
  { key: "industry", label: csvColumnLabels.industry, values: csvColumnAliases.industry },
] as const satisfies readonly CsvColumnAliasGroup[];

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
    preview.missingRequiredColumns.length > 0 ? `必須列不足 ${preview.missingRequiredColumns.join(", ")}` : null,
    preview.missingRequiredCount > 0 ? `必須欠損 ${preview.missingRequiredCount}行` : null,
    preview.duplicateKeys.length > 0 ? `法人番号重複 ${preview.duplicateKeys.length}件` : null,
    preview.invalidCorporateNumberCount > 0 ? `法人番号不正 ${preview.invalidCorporateNumberCount}行` : null,
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
