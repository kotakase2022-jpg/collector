import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { deflateRawSync } from "node:zlib";
import { parse as parseCsv } from "csv-parse/sync";
import { afterEach, describe, expect, test, vi } from "vitest";
import { companiesExportResponse, GET as exportCompanies } from "@/app/api/companies/export/route";
import { POST as manualReviewCompany, manualReviewCompanyRedirect } from "@/app/api/companies/manual-review/route";
import { POST as recrawlCompany, recrawlCompanyRedirect } from "@/app/api/companies/recrawl/route";
import { POST as createList, createListRedirect } from "@/app/api/lists/create/route";
import { POST as deleteList, deleteListRedirect } from "@/app/api/lists/delete/route";
import { savedListComparisonExportResponse, GET as exportListComparison } from "@/app/api/lists/compare-export/route";
import { savedListExportResponse, GET as exportList } from "@/app/api/lists/export/route";
import { POST as importListPreview } from "@/app/api/lists/import-preview/route";
import { POST as updateList, updateListRedirect } from "@/app/api/lists/update/route";
import { POST as updatePriority, jobPriorityRedirect } from "@/app/api/jobs/priority/route";
import { POST as planCoverageJobs, planCoverageRedirect } from "@/app/api/jobs/plan-coverage/route";
import { POST as retryJob, retryJobRedirect } from "@/app/api/jobs/retry/route";
import { POST as runNextJob, runNextJobRedirect } from "@/app/api/jobs/run-next/route";
import { POST as stopJob, stopJobRedirect } from "@/app/api/jobs/stop/route";
import { createCompaniesCsv, createSavedListComparisonCsv } from "@/lib/csv";
import {
  exportRowLimit,
  getCompanies,
  getCompanyDetail,
  getDashboardMetrics,
  getExportRows,
  getJobs,
  formatPostgrestInList,
  hasCorporateNumberValue,
  isOfficialRevenueType,
  missingCorporateNumberSupabaseFilter,
  normalizeCompanySearchTerm,
  officialRevenueTypeSupabaseFilter,
  sourceTypeLookupBatchSize,
  sourceUrlLookupBatchSize,
} from "@/lib/data";
import { matchCompanyIdentity } from "@/lib/etl/dedupe";
import { extractEdinetFactsFromXbrl, extractXbrlTextFromZip, fetchEdinetDocumentXbrl, listEdinetDocuments } from "@/lib/etl/edinet";
import { extractGBizProfile, fetchGBizInfoByCorporateNumber } from "@/lib/etl/gbizinfo";
import { discoverProfileLinks, extractTitle, extractVisibleText, ruleBasedExtractCompanyProfile } from "@/lib/etl/html-extract";
import { buildCoverageJobPlans, queueCoverageJobs } from "@/lib/etl/job-planner";
import { runNextCrawlJob, type JobRunnerDependencies } from "@/lib/etl/job-runner";
import { buildExtractionPrompt, extractCompanyProfileWithLlm, extractionJsonSchema, hasOpenAiConfig, parseLlmExtractionOutput } from "@/lib/etl/llm";
import { parseNtaCsv } from "@/lib/etl/nta";
import { markJobForRetry, markJobStopped, retryableJobStatuses, stoppableJobStatuses } from "@/lib/job-actions";
import {
  computeCoverageScore,
  employeeRange,
  normalizeCompanyName,
  normalizeCorporateNumber,
  normalizeEmployeeCount,
  normalizeRevenueToJpy,
  normalizeUrl,
  revenueRange,
} from "@/lib/etl/normalize";
import { crawlOfficialSite } from "@/lib/etl/official-crawler";
import { scoreOfficialUrlCandidate } from "@/lib/etl/official-url";
import { assertRobotsAllowed, createRobotsPolicyFromText, loadRobotsPolicy } from "@/lib/etl/robots";
import { createSearchProvider, discoverOfficialUrlCandidates, safeDiscoverOfficialUrlCandidates, type SearchProvider } from "@/lib/etl/search";
import { buildEvaluationReport, evaluateCurrentImplementation } from "@/lib/etl/self-evaluation";
import { clampScore, confidenceForSource, evaluateCrawlerScore, observationKind, selectBestObservation } from "@/lib/etl/scoring";
import { buildCompanySelectedValueUpdate, buildCompanyUpsertRow, companyUpsertConflictTarget } from "@/lib/etl/store";
import { formatCompanyFilterBadges } from "@/lib/filter-labels";
import { attachmentContentDisposition, sanitizeDownloadFileName } from "@/lib/file-name";
import { formatDate, formatNumber, formatPercent, formatRevenue } from "@/lib/format";
import { filterJobs, parseJobFilters } from "@/lib/job-filters";
import { buildListDisplayRows, generatedListDisplayLimit, savedListDisplayLimit } from "@/lib/list-display";
import { firstSearchParam } from "@/lib/search-params";
import {
  buildCsvImportReadiness,
  csvColumnAliasGroups,
  csvImportMaxBytes,
  csvImportMaxSizeLabel,
} from "@/lib/csv-import-preview";
import {
  buildListQualitySummary,
  buildListReadiness,
  getCompanyQualityIssues,
  parseCompanyCsvImportPreview,
} from "@/lib/list-quality";
import {
  buildSaveCompanyListRpcArgs,
  buildSavedCompanyListFieldChanges,
  buildSavedCompanyListComparison,
  buildSavedCompanyListPairComparison,
  buildSavedListComparisonExportRows,
  buildSavedCompanyListRpcItems,
  createSavedCompanyList,
  deleteSavedCompanyList,
  getSavedCompanyListDetail,
  getSavedCompanyListPairComparison,
  getSavedCompanyListSnapshot,
  getSavedCompanyLists,
  getSavedListExportRows,
  saveCompanyListWithRpc,
  updateSavedCompanyList,
} from "@/lib/lists";
import { mockCompanies } from "@/lib/mock/data";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import {
  employeeRangeOptions,
  hasCompanyGenerationCriteria,
  listDescriptionMaxLength,
  listFormValidationErrorCode,
  listFormStateToSearchParams,
  listNameMaxLength,
  parseCompanyFilters,
  parseCoveragePlanForm,
  parseJobIdForm,
  parseJobPriorityForm,
  parseListCreateForm,
  parseListIdForm,
  parseListUpdateForm,
  revenueRangeOptions,
} from "@/lib/validation";
import { installGitHooks } from "../scripts/install-git-hooks";
import type { CompanyObservation, CrawlJob } from "@/lib/types";

const fixtureRoot = path.join(process.cwd(), "tests", "fixtures");
const managedEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "GBIZINFO_API_TOKEN",
  "GBIZINFO_API_BASE_URL",
  "EDINET_API_KEY",
  "EDINET_API_BASE_URL",
  "EDINET_DOCUMENT_API_BASE_URL",
] as const;
const originalEnv = Object.fromEntries(managedEnvKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  for (const key of managedEnvKeys) {
    const value = originalEnv[key];
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("CSV parsing and validation", () => {
  test("法人番号データ取り込み用CSVをパースできる", () => {
    const records = parseNtaCsv(fixture("csv/normal-nta.csv"));
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      corporateNumber: "1234567890123",
      address: "宮城県仙台市青葉区中央1-1",
      status: "active",
    });
  });

  test("空CSVは空配列として扱う", () => {
    expect(parseNtaCsv(fixture("csv/empty.csv"))).toEqual([]);
  });

  test("不正CSVは取り込み対象から除外する", () => {
    expect(parseNtaCsv(fixture("csv/invalid-nta.csv"))).toEqual([]);
  });

  test("法人番号の境界値CSVを保持する", () => {
    const records = parseNtaCsv(fixture("csv/boundary-nta.csv"));
    expect(records.map((record) => record.corporateNumber)).toEqual(["0000000000001", "9999999999999"]);
  });

  test("ジョブ優先度フォームを検証できる", () => {
    const valid = new FormData();
    valid.set("id", "aaaaaaaa-0000-4000-8000-000000000001");
    valid.set("priority", "1");
    expect(parseJobPriorityForm(valid).success).toBe(true);
    expect(parseJobIdForm(valid).success).toBe(true);
    expect(parseCoveragePlanForm(new FormData()).success).toBe(true);

    const invalid = new FormData();
    invalid.set("id", "aaaaaaaa-0000-4000-8000-000000000001");
    invalid.set("priority", "0");
    expect(parseJobPriorityForm(invalid).success).toBe(false);
    invalid.set("limit", "5001");
    expect(parseCoveragePlanForm(invalid).success).toBe(false);

    const missingId = new FormData();
    expect(parseJobIdForm(missingId).success).toBe(false);
    missingId.set("id", "------------------------------------");
    expect(parseJobIdForm(missingId).success).toBe(false);
  });

  test("企業一覧フィルタ入力を安全に正規化する", () => {
    expect([...employeeRangeOptions]).toEqual(["1-9名", "10-49名", "50-299名", "300-999名", "1000名以上"]);
    expect([...revenueRangeOptions]).toEqual(["1億円未満", "1億-10億円", "10億-100億円", "100億-1000億円", "1000億円以上"]);

    expect(
      parseCompanyFilters({
        q: " 青葉 ",
        hasUrl: "yes",
        hasCorporateNumber: "yes",
        hasRevenue: "no",
        hasEmployeeCount: "yes",
        employeeRange: "10-49名",
        revenueRange: "1億-10億円",
        valueKind: "estimated",
        minConfidence: "80",
        sort: "revenue_desc",
        scope: "all",
        excludedCompanyIds: "22222222-2222-4222-8222-222222222222,invalid,------------------------------------,22222222-2222-4222-8222-222222222222",
      }),
    ).toEqual(
      expect.objectContaining({
        scope: "all",
        q: "青葉",
        hasUrl: "yes",
        hasCorporateNumber: "yes",
        hasRevenue: "no",
        hasEmployeeCount: "yes",
        employeeRange: "10-49名",
        revenueRange: "1億-10億円",
        valueKind: "estimated",
        minConfidence: 80,
        sort: "revenue_desc",
        excludedCompanyIds: ["22222222-2222-4222-8222-222222222222"],
      }),
    );
    expect(parseCompanyFilters({ hasUrl: "maybe", minConfidence: "101", sort: "random", scope: "implicit-all" })).toEqual({ minConfidence: 100 });
    expect(parseCompanyFilters({ minConfidence: "-1" })).toEqual({});
    expect(parseCompanyFilters({ minConfidence: "80.5" })).toEqual({});
    expect(hasCompanyGenerationCriteria(parseCompanyFilters({ name: "not-a-filter", sort: "confidence_desc" }))).toBe(false);
    expect(hasCompanyGenerationCriteria(parseCompanyFilters({ excludedCompanyIds: "22222222-2222-4222-8222-222222222222" }))).toBe(false);
    expect(hasCompanyGenerationCriteria(parseCompanyFilters({ scope: "all" }))).toBe(true);
    expect(hasCompanyGenerationCriteria(parseCompanyFilters({ q: "青葉" }))).toBe(true);
    expect(hasCompanyGenerationCriteria(parseCompanyFilters({ hasCorporateNumber: "yes" }))).toBe(true);
    expect(hasCorporateNumberValue("1234567890123")).toBe(true);
    expect(hasCorporateNumberValue("１２３-４５６７８９０１２３")).toBe(true);
    expect(hasCorporateNumberValue("")).toBe(false);
    expect(hasCorporateNumberValue("   ")).toBe(false);
    expect(hasCorporateNumberValue("ABC-123")).toBe(false);
    expect(hasCorporateNumberValue("123456789012")).toBe(false);
    expect(missingCorporateNumberSupabaseFilter).toBe("corporate_number.is.null,corporate_number.eq.");
  });

  test("リスト生成フォームを保存前に検証できる", () => {
    const form = new FormData();
    form.set("id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    form.set("name", " 関西物流フォロー ");
    form.set("description", "年商未取得を補完する");
    form.set("prefecture", "大阪府");
    form.set("hasRevenue", "no");
    form.set("sort", "employee_desc");
    form.set("excludedCompanyIds", "22222222-2222-4222-8222-222222222222");

    const parsed = parseListCreateForm(form);

    expect(parsed.success).toBe(true);
    expect(parseListUpdateForm(form).success).toBe(true);
    expect(parseListIdForm(form).success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toMatchObject({
        name: "関西物流フォロー",
        description: "年商未取得を補完する",
        filters: { prefecture: "大阪府", hasRevenue: "no", sort: "employee_desc", excludedCompanyIds: ["22222222-2222-4222-8222-222222222222"] },
      });
    }
    expect(listFormStateToSearchParams(form).toString()).toContain("name=%E9%96%A2%E8%A5%BF%E7%89%A9%E6%B5%81%E3%83%95%E3%82%A9%E3%83%AD%E3%83%BC");
    expect(listFormStateToSearchParams(form).toString()).toContain("prefecture=%E5%A4%A7%E9%98%AA%E5%BA%9C");

    const boundary = new FormData();
    boundary.set("name", "x".repeat(listNameMaxLength));
    boundary.set("description", "y".repeat(listDescriptionMaxLength));
    expect(parseListCreateForm(boundary).success).toBe(true);

    boundary.set("name", "x".repeat(listNameMaxLength + 1));
    expect(parseListCreateForm(boundary).success).toBe(false);

    boundary.set("name", "ok");
    boundary.set("description", "y".repeat(listDescriptionMaxLength + 1));
    const overlongDescription = parseListCreateForm(boundary);
    expect(overlongDescription.success).toBe(false);
    if (!overlongDescription.success) {
      expect(listFormValidationErrorCode(overlongDescription.error)).toBe("invalid-description");
    }

    const invalid = new FormData();
    invalid.set("name", "");
    const missingName = parseListCreateForm(invalid);
    expect(missingName.success).toBe(false);
    if (!missingName.success) {
      expect(listFormValidationErrorCode(missingName.error)).toBe("invalid-name");
    }
    expect(parseListUpdateForm(invalid).success).toBe(false);
    expect(parseListIdForm(invalid).success).toBe(false);
  });

  test("searchParamsの単一値を安定して取り出せる", () => {
    expect(firstSearchParam("notice")).toBe("notice");
    expect(firstSearchParam(["notice", "ignored"])).toBe("notice");
    expect(firstSearchParam(undefined)).toBeUndefined();
  });

  test("git hook installer configures hooks when possible and skips missing git safely", () => {
    const chmod = vi.fn();
    const execFile = vi.fn();
    const warn = vi.fn();
    const exists = (target: string) => [".git", ".githooks", ".githooks/pre-commit", ".githooks/pre-push"].includes(target);

    installGitHooks({ exists, chmod, execFile, platform: "linux", warn });

    expect(chmod).toHaveBeenCalledWith(".githooks/pre-commit", 0o755);
    expect(chmod).toHaveBeenCalledWith(".githooks/pre-push", 0o755);
    expect(execFile).toHaveBeenCalledWith("git", ["config", "core.hooksPath", ".githooks"], { stdio: "inherit" });
    expect(warn).not.toHaveBeenCalled();

    const missingGitExec = vi.fn(() => {
      const error = new Error("spawn git ENOENT") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      throw error;
    });
    installGitHooks({ exists, chmod: vi.fn(), execFile: missingGitExec, platform: "win32", warn });

    expect(warn).toHaveBeenCalledWith("Git was not found; skipping local hook installation.");
  });

  test("CSVアップロードプレビューは欠損・重複・URL不正を検出する", () => {
    const preview = parseCompanyCsvImportPreview(fixture("csv/list-upload.csv"));
    const readiness = buildCsvImportReadiness(preview);
    const okReadiness = buildCsvImportReadiness(parseCompanyCsvImportPreview("corporate_number,company_name,official_url,industry\n1234567890123,Acme,https://example.com,IT\n"));
    const emptyReadiness = buildCsvImportReadiness(parseCompanyCsvImportPreview("corporate_number,company_name\n"));
    const invalidCorporateNumberPreview = parseCompanyCsvImportPreview(
      "corporate_number,company_name,official_url\n1234567890123,Acme,https://example.com\nABC-123,Invalid,https://example.com\n123-4567890123,Duplicate,https://example.com\n1234567890123,Duplicate2,https://example.com\n",
    );
    const invalidCorporateNumberReadiness = buildCsvImportReadiness(invalidCorporateNumberPreview);

    expect(preview.rowCount).toBe(4);
    expect(preview.missingRequiredColumns).toEqual([]);
    expect(preview.validRows).toBe(1);
    expect(preview.missingRequiredCount).toBe(1);
    expect(preview.duplicateKeys).toEqual(["2234567890123"]);
    expect(preview.invalidCorporateNumberCount).toBe(0);
    expect(preview.invalidUrlCount).toBe(1);
    expect(preview.previewRows[0]).toMatchObject({ company_name: "東都精密工業株式会社" });
    expect(preview.rowIssueCount).toBe(3);
    expect(preview.rowIssues).toEqual([
      { rowNumber: 3, corporate_number: "2234567890123", company_name: "北浜物流合同会社", issues: ["法人番号重複"] },
      { rowNumber: 4, corporate_number: "2234567890123", company_name: "北浜物流合同会社 支店", issues: ["URL不正", "法人番号重複"] },
      { rowNumber: 5, corporate_number: "", company_name: "名称欠損テスト", issues: ["必須欠損: corporate_number"] },
    ]);
    expect(readiness).toMatchObject({ label: "修正が必要", tone: "warning", nextAction: expect.stringContaining("corporate_number") });
    expect(readiness.issues).toEqual(expect.arrayContaining(["必須欠損 1行", "法人番号重複 1件", "URL不正 1行"]));
    expect(okReadiness).toMatchObject({ label: "取込確認OK", tone: "good", issues: [] });
    expect(emptyReadiness).toMatchObject({ label: "対象行なし", tone: "danger" });
    expect(invalidCorporateNumberPreview).toMatchObject({
      rowCount: 4,
      validRows: 0,
      duplicateKeys: ["1234567890123"],
      invalidCorporateNumberCount: 1,
      invalidUrlCount: 0,
      rowIssueCount: 4,
    });
    expect(invalidCorporateNumberPreview.rowIssues).toEqual([
      { rowNumber: 2, corporate_number: "1234567890123", company_name: "Acme", issues: ["法人番号重複"] },
      { rowNumber: 3, corporate_number: "ABC-123", company_name: "Invalid", issues: ["法人番号不正"] },
      { rowNumber: 4, corporate_number: "123-4567890123", company_name: "Duplicate", issues: ["法人番号重複"] },
      { rowNumber: 5, corporate_number: "1234567890123", company_name: "Duplicate2", issues: ["法人番号重複"] },
    ]);
    expect(invalidCorporateNumberReadiness.issues).toEqual(expect.arrayContaining(["法人番号重複 1件", "法人番号不正 1行"]));
  });

  test("CSVアップロードプレビューは空行を除外しても元CSVの行番号を保持する", () => {
    const preview = parseCompanyCsvImportPreview(
      [
        "corporate_number,company_name,official_url",
        "1234567890123,Acme,https://example.com",
        "",
        "bad-1,Invalid,https://example.com",
        "2234567890123,Duplicate A,https://example.com/a",
        "",
        "2234567890123,Duplicate B,ftp://example.com/b",
      ].join("\n"),
    );

    expect(preview.rowCount).toBe(4);
    expect(preview.validRows).toBe(1);
    expect(preview.rowIssueCount).toBe(3);
    expect(preview.rowIssues.map((issue) => issue.rowNumber)).toEqual([4, 5, 7]);
    expect(preview.rowIssues.at(-1)).toMatchObject({ rowNumber: 7, corporate_number: "2234567890123", company_name: "Duplicate B" });
  });

  test("CSVアップロードプレビューの行別問題は総数を残しつつ表示件数を制限する", () => {
    const csv = [
      "corporate_number,company_name,official_url",
      ...Array.from({ length: 12 }, (_, index) => `bad-${index + 1},Invalid ${index + 1},https://example.com/${index + 1}`),
    ].join("\n");

    const preview = parseCompanyCsvImportPreview(csv);

    expect(preview.rowIssueCount).toBe(12);
    expect(preview.rowIssues).toHaveLength(10);
    expect(preview.rowIssues[0]).toMatchObject({ rowNumber: 2, corporate_number: "bad-1", issues: ["法人番号不正"] });
    expect(preview.rowIssues.at(-1)).toMatchObject({ rowNumber: 11, corporate_number: "bad-10", issues: ["法人番号不正"] });
  });

  test("CSVアップロードプレビューは必須列不足を行欠損と区別する", () => {
    const preview = parseCompanyCsvImportPreview(fixture("csv/missing-columns-list-upload.csv"));
    const readiness = buildCsvImportReadiness(preview);

    expect(preview.rowCount).toBe(1);
    expect(preview.missingRequiredColumns).toEqual(["corporate_number"]);
    expect(preview.missingRequiredCount).toBe(1);
    expect(readiness.issues).toContain("必須列不足 corporate_number");
    expect(readiness.nextAction).toContain("corporate_number");
  });

  test("CSV upload preview reports duplicate canonical headers", () => {
    const preview = parseCompanyCsvImportPreview(
      [
        "corporate_number,corporateNumber,company_name,official_url",
        "1234567890123,2234567890123,Acme,https://example.com",
      ].join("\n"),
    );
    const readiness = buildCsvImportReadiness(preview);

    expect(preview).toMatchObject({
      rowCount: 1,
      validRows: 1,
      duplicateColumns: ["corporate_number"],
      missingRequiredColumns: [],
    });
    expect(preview.previewRows[0].corporate_number).toBe("1234567890123");
    expect(readiness).toMatchObject({ tone: "warning", issues: expect.arrayContaining(["列重複 corporate_number"]) });
  });

  test("CSVアップロードプレビューは日本語ヘッダーを標準列へ正規化する", () => {
    const preview = parseCompanyCsvImportPreview(fixture("csv/japanese-headers-list-upload.csv"));
    const readiness = buildCsvImportReadiness(preview);
    const commonSpreadsheetPreview = parseCompanyCsvImportPreview(
      "法人番号（１３桁）,会社名（商号）,ホームページ,産業分類\n1234567890123,表記ゆれ株式会社,https://example.jp/home,製造業\n",
    );

    expect(preview).toMatchObject({
      rowCount: 1,
      validRows: 1,
      missingRequiredColumns: [],
      missingRequiredCount: 0,
      duplicateKeys: [],
      invalidUrlCount: 0,
    });
    expect(preview.previewRows[0]).toEqual({
      corporate_number: "1234567890123",
      company_name: "日本語ヘッダー株式会社",
      official_url: "https://example.jp/nihongo",
      industry: "情報通信",
    });
    expect(readiness).toMatchObject({ label: "取込確認OK", tone: "good", issues: [] });
    expect(commonSpreadsheetPreview).toMatchObject({
      missingRequiredColumns: [],
      missingRequiredCount: 0,
      invalidUrlCount: 0,
    });
    expect(csvColumnAliasGroups.map((column) => column.label)).toEqual(["法人番号", "企業名", "URL", "業種"]);
    expect(csvColumnAliasGroups.find((column) => column.key === "official_url")?.values).toContain("ホームページ");
    expect(csvColumnAliasGroups.find((column) => column.key === "industry")?.values).toContain("産業分類");
    expect(commonSpreadsheetPreview.previewRows[0]).toEqual({
      corporate_number: "1234567890123",
      company_name: "表記ゆれ株式会社",
      official_url: "https://example.jp/home",
      industry: "製造業",
    });
  });

  test("CSV取込メタ情報はクライアント安全なモジュールに分離されている", () => {
    const metadataModule = readFileSync(path.join(process.cwd(), "src", "lib", "csv-import-preview.ts"), "utf8");
    const clientComponent = readFileSync(path.join(process.cwd(), "src", "components", "app", "csv-import-preview.tsx"), "utf8");

    expect(metadataModule).not.toContain("csv-parse");
    expect(clientComponent).toContain("@/lib/csv-import-preview");
    expect(clientComponent).not.toContain("@/lib/list-quality");
  });

  test("CSV upload preview normalizes common URL values without hiding invalid URLs", () => {
    const preview = parseCompanyCsvImportPreview(
      [
        "corporate_number,company_name,official_url",
        "1234567890123,Protocol Missing,www.example.co.jp/company",
        "2234567890123,Already HTTPS,https://example.com/profile",
        "3234567890123,Full Width Domain,ｗｗｗ．example．co．jp／company",
        "4234567890123,Full Width HTTPS,ｈｔｔｐｓ：／／example．jp／profile",
        "5234567890123,Invalid URL,not-a-url",
        "6234567890123,Unsafe Scheme,mailto:sales@example.com",
      ].join("\n"),
    );

    expect(preview.previewRows).toEqual([
      { corporate_number: "1234567890123", company_name: "Protocol Missing", official_url: "https://www.example.co.jp/company", industry: "" },
      { corporate_number: "2234567890123", company_name: "Already HTTPS", official_url: "https://example.com/profile", industry: "" },
      { corporate_number: "3234567890123", company_name: "Full Width Domain", official_url: "https://www.example.co.jp/company", industry: "" },
      { corporate_number: "4234567890123", company_name: "Full Width HTTPS", official_url: "https://example.jp/profile", industry: "" },
      { corporate_number: "5234567890123", company_name: "Invalid URL", official_url: "not-a-url", industry: "" },
    ]);
    expect(preview.invalidUrlCount).toBe(2);
    expect(preview.validRows).toBe(4);
    expect(preview.rowIssues).toEqual([
      { rowNumber: 6, corporate_number: "5234567890123", company_name: "Invalid URL", issues: ["URL不正"] },
      { rowNumber: 7, corporate_number: "6234567890123", company_name: "Unsafe Scheme", issues: ["URL不正"] },
    ]);
  });

  test("CSV upload preview flags spreadsheet formula and control-prefixed values", () => {
    const preview = parseCompanyCsvImportPreview(
      [
        "corporate_number,company_name,official_url,industry",
        '1234567890123,"=HYPERLINK(""https://evil.example"")",https://example.com,IT',
        '2234567890123,Safe Url," \thttps://example.com/unsafe",Logistics',
        '3234567890123,Safe Industry,https://example.com," +Industry"',
        '4234567890123,"@Bad",https://example.com,"-Industry"',
      ].join("\n"),
    );
    const readiness = buildCsvImportReadiness(preview);

    expect(preview).toMatchObject({
      rowCount: 4,
      validRows: 0,
      dangerousValueCount: 5,
      invalidUrlCount: 0,
      rowIssueCount: 4,
    });
    expect(preview.previewRows[1].official_url).toBe("https://example.com/unsafe");
    expect(preview.rowIssues).toEqual([
      { rowNumber: 2, corporate_number: "1234567890123", company_name: '=HYPERLINK("https://evil.example")', issues: ["危険な値: company_name"] },
      { rowNumber: 3, corporate_number: "2234567890123", company_name: "Safe Url", issues: ["危険な値: official_url"] },
      { rowNumber: 4, corporate_number: "3234567890123", company_name: "Safe Industry", issues: ["危険な値: industry"] },
      { rowNumber: 5, corporate_number: "4234567890123", company_name: "@Bad", issues: ["危険な値: company_name, industry"] },
    ]);
    expect(readiness).toMatchObject({ label: "修正が必要", tone: "danger" });
    expect(readiness.issues).toContain("危険な値 5件");
  });

  test("CSV upload preview accepts full-width corporate numbers for validation and duplicate checks", () => {
    const preview = parseCompanyCsvImportPreview(
      [
        "corporate_number,company_name,official_url",
        "１２３-４５６７８９０１２３,Full Width,https://example.com/full-width",
        "1234567890123,Ascii Duplicate,https://example.com/ascii",
        "２２３４５６７８９０１２３,Full Width Unique,https://example.com/unique",
      ].join("\n"),
    );

    expect(preview).toMatchObject({
      rowCount: 3,
      validRows: 1,
      duplicateKeys: ["1234567890123"],
      invalidCorporateNumberCount: 0,
      invalidUrlCount: 0,
      rowIssueCount: 2,
    });
    expect(preview.rowIssues).toEqual([
      { rowNumber: 2, corporate_number: "１２３-４５６７８９０１２３", company_name: "Full Width", issues: ["法人番号重複"] },
      { rowNumber: 3, corporate_number: "1234567890123", company_name: "Ascii Duplicate", issues: ["法人番号重複"] },
    ]);
  });

  test("リスト品質メモは行単位の欠損・推定・低信頼を検出する", () => {
    expect(
      getCompanyQualityIssues({
        corporate_number: null,
        official_url: null,
        annual_revenue: 900_000_000,
        annual_revenue_type: "estimated",
        employee_count: null,
        data_confidence_score: 30,
      }).map((issue) => issue.key),
    ).toEqual(["missing_corporate_number", "missing_url", "estimated_revenue", "missing_employee_count", "low_confidence"]);

    expect(
      getCompanyQualityIssues({
        corporate_number: "   ",
        official_url: "https://example.com",
        annual_revenue: 1_000_000_000,
        annual_revenue_type: "sales",
        employee_count: 120,
        data_confidence_score: 90,
      }).map((issue) => issue.key),
    ).toEqual(["missing_corporate_number"]);

    expect(
      getCompanyQualityIssues({
        corporate_number: "1234567890123",
        official_url: "https://example.com",
        annual_revenue: 1_000_000_000,
        annual_revenue_type: "sales",
        employee_count: 120,
        data_confidence_score: 90,
      }),
    ).toEqual([]);

    expect(
      buildListQualitySummary([
        {
          corporate_number: "   ",
          official_url: "https://example.com",
          annual_revenue: 1_000_000_000,
          annual_revenue_type: "sales",
          employee_count: 120,
          data_confidence_score: 90,
        },
        {
          corporate_number: "1234567890123",
          official_url: "https://example.com",
          annual_revenue: 1_000_000_000,
          annual_revenue_type: "sales",
          employee_count: 120,
          data_confidence_score: 90,
        },
        {
          corporate_number: " １２３-４５６７８９０１２３ ",
          official_url: "https://example.com",
          annual_revenue: 1_000_000_000,
          annual_revenue_type: "sales",
          employee_count: 120,
          data_confidence_score: 90,
        },
        {
          corporate_number: "ABC-123",
          official_url: "https://example.com",
          annual_revenue: 1_000_000_000,
          annual_revenue_type: "sales",
          employee_count: 120,
          data_confidence_score: 90,
        },
      ]),
    ).toMatchObject({ missingCorporateNumber: 2, duplicateCorporateNumbers: ["1234567890123"] });

    const ready = buildListReadiness(
      buildListQualitySummary([
        {
          corporate_number: "1234567890123",
          official_url: "https://example.com",
          annual_revenue: 1_000_000_000,
          annual_revenue_type: "sales",
          employee_count: 120,
          data_confidence_score: 90,
        },
      ]),
    );
    const needsWork = buildListReadiness(
      buildListQualitySummary([
        {
          corporate_number: null,
          official_url: null,
          annual_revenue: null,
          annual_revenue_type: "unknown",
          employee_count: null,
          data_confidence_score: 30,
        },
      ]),
    );

    expect(ready).toMatchObject({ label: "即利用向き", score: 100, blockers: [] });
    expect(needsWork.label).toBe("補完優先");
    expect(needsWork.blockers).toEqual(expect.arrayContaining(["法人番号なし 1件", "URLなし 1件", "年商なし 1件", "従業員数なし 1件", "低信頼 1件"]));
    expect(buildListReadiness(buildListQualitySummary([]))).toMatchObject({ label: "対象なし", score: 0 });
    expect(
      buildListReadiness({
        total: 2,
        withUrl: 2,
        withRevenue: 2,
        withEmployeeCount: 2,
        estimatedRevenue: 0,
        lowConfidence: 0,
        missingCorporateNumber: 0,
        duplicateCorporateNumbers: ["1234567890123"],
      }),
    ).toMatchObject({ blockers: ["法人番号重複あり"], nextAction: expect.stringContaining("重複") });
    expect(ready.recommendedActions).toEqual(["保存済みリストとして保存する", "CSV出力して業務利用する"]);
    expect(needsWork.recommendedActions).toEqual(["法人番号ありの企業に絞る", "信頼度60以上で絞る", "URLありのみで絞る", "年商あり・公式/報告値で絞る"]);
    expect(buildListReadiness(buildListQualitySummary([])).recommendedActions).toEqual(["検索語や都道府県を外す", "対象範囲で全企業を明示選択する"]);
  });

  test("保存済みリスト条件は業務ユーザー向けの日本語ラベルへ整形する", () => {
    expect(formatCompanyFilterBadges({ scope: "all", sort: "confidence_desc" })).toEqual(["対象: 全企業", "並び替え: 信頼度が高い順"]);
    const allWithExclusionBadges = formatCompanyFilterBadges({ scope: "all", excludedCompanyIds: ["22222222-2222-4222-8222-222222222222"] });
    expect(allWithExclusionBadges).toHaveLength(2);
    expect(allWithExclusionBadges[0]).toBe(formatCompanyFilterBadges({ scope: "all" })[0]);
    expect(allWithExclusionBadges[1]).toContain("1");
    expect(
      formatCompanyFilterBadges({
        q: "物流",
        prefecture: "大阪府",
        hasUrl: "yes",
        hasCorporateNumber: "yes",
        hasRevenue: "no",
        valueKind: "official",
        minConfidence: 80,
        sort: "employee_desc",
        excludedCompanyIds: ["22222222-2222-4222-8222-222222222222"],
      }),
    ).toEqual(["検索: 物流", "都道府県: 大阪府", "URLあり", "法人番号あり", "年商なし", "公式/報告値", "信頼度80以上", "並び替え: 従業員数が多い順", "手動除外: 1件"]);
  });

  test("リスト画面表示は保存・CSV対象件数と分離して大量描画を抑制する", () => {
    const rows = Array.from({ length: savedListDisplayLimit + 5 }, (_, index) => ({ id: String(index) }));
    const savedDisplay = buildListDisplayRows(rows, savedListDisplayLimit);
    const generatedDisplay = buildListDisplayRows(rows, generatedListDisplayLimit);

    expect(savedDisplay).toMatchObject({ totalCount: savedListDisplayLimit + 5, hiddenCount: 5, isTruncated: true });
    expect(savedDisplay.visibleRows).toHaveLength(savedListDisplayLimit);
    expect(generatedDisplay.visibleRows).toHaveLength(generatedListDisplayLimit);
    expect(buildListDisplayRows(rows, rows.length).isTruncated).toBe(false);
    expect(buildListDisplayRows([], savedListDisplayLimit)).toMatchObject({ visibleRows: [], totalCount: 0, hiddenCount: 0, isTruncated: false });
    expect(buildListDisplayRows(rows, 0)).toMatchObject({ visibleRows: [], totalCount: savedListDisplayLimit + 5, hiddenCount: savedListDisplayLimit + 5, isTruncated: true });
    expect(buildListDisplayRows(rows, -1)).toMatchObject({ visibleRows: [], totalCount: savedListDisplayLimit + 5, hiddenCount: savedListDisplayLimit + 5, isTruncated: true });
  });
});

describe("normalization and domain logic", () => {
  test("企業名を法人格や全角差分を吸収して正規化できる", () => {
    expect(normalizeCompanyName("株式会社　ＡＢＣ商事")).toBe(normalizeCompanyName("ABC商事"));
    expect(normalizeCompanyName("（株）東都精密")).toBe(normalizeCompanyName("東都精密"));
  });

  test("金額計算と境界レンジを正規化できる", () => {
    expect(normalizeRevenueToJpy("50億円")).toEqual({ value: 5_000_000_000, isApproximate: false });
    expect(normalizeRevenueToJpy("約3.5億円")).toEqual({ value: 350_000_000, isApproximate: true });
    expect(revenueRange(99_999_999)).toBe("1億円未満");
    expect(revenueRange(100_000_000)).toBe("1億-10億円");
  });

  test("従業員数を正規化できる", () => {
    expect(normalizeEmployeeCount("約1,200名")).toEqual({ value: 1200, isApproximate: true });
    expect(normalizeEmployeeCount("社員数 35人")).toEqual({ value: 35, isApproximate: false });
  });

  test("日付と年商表示は日本時間で安定する", () => {
    expect(formatDate("2026-07-03T00:00:00Z")).toContain("2026/07/03");
    expect(formatRevenue(1_200_000_000)).toBe("12億円");
  });

  test("公式URL候補を第三者サイトより高く評価できる", () => {
    const official = scoreOfficialUrlCandidate({
      companyName: "東都精密工業株式会社",
      candidateUrl: "https://touto-seimitsu.example.com",
      title: "東都精密工業株式会社 会社概要",
      pageText: "東都精密工業株式会社 会社概要 東京都千代田区",
      address: "東京都千代田区",
    });
    const thirdParty = scoreOfficialUrlCandidate({
      companyName: "東都精密工業株式会社",
      candidateUrl: "https://openwork.jp/company/example",
      title: "東都精密工業の求人情報",
    });

    expect(official.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(thirdParty.confidenceScore).toBeLessThan(official.confidenceScore);
    expect(thirdParty.isThirdParty).toBe(true);
  });

  test("法人番号なしでも名称・所在地・ドメインで重複名寄せできる", () => {
    const result = matchCompanyIdentity(
      { name: "株式会社日本データサービス", address: "愛知県名古屋市中区三の丸1-1", url: "https://www.nds.example.jp" },
      { name: "日本データサービス", address: "愛知県名古屋市中区三の丸1-1", url: "https://nds.example.jp/company" },
    );
    expect(result.isMatch).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });
});

describe("extraction and source handling", () => {
  test("robots.txtのDisallowを遵守できる", () => {
    const policy = createRobotsPolicyFromText("https://example.com/robots.txt", "User-agent: *\nDisallow: /private\nCrawl-delay: 2");
    expect(policy.canFetch("https://example.com/company")).toBe(true);
    expect(policy.canFetch("https://example.com/private/profile")).toBe(false);
    expect(policy.crawlDelayMs).toBe(2000);
  });

  test("HTML会社概要テキストから主要項目をルール抽出できる", () => {
    const text = "会社概要\n事業内容：物流・倉庫業\n従業員数：86名\n売上高：12億円（2025年度）";
    const extracted = ruleBasedExtractCompanyProfile(text);
    expect(extracted.industry.value).toBe("物流・倉庫業");
    expect(extracted.employeeCount.value).toBe(86);
    expect(extracted.annualRevenue.value).toBe(1_200_000_000);
    expect(extracted.annualRevenue.period).toBe("2025年度");
  });

  test("gBizINFO APIレスポンスをプロフィールへ整形できる", () => {
    const raw = JSON.parse(fixture("api/gbizinfo-success.json")) as Record<string, unknown>;
    expect(extractGBizProfile(raw)).toEqual({
      officialUrl: "https://example.com/touto",
      industry: "精密機器製造",
      employeeCount: "従業員数 1,250名",
    });
  });

  test("gBizINFO API success responses must be JSON objects", async () => {
    const htmlFetch = vi.fn(async () => new Response("<html>maintenance</html>", { status: 200, headers: { "content-type": "text/html" } }));
    await expect(
      fetchGBizInfoByCorporateNumber("1234567890123", {
        token: "gbiz-token",
        baseUrl: "https://gbiz.test/hojin",
        fetchImpl: htmlFetch,
      }),
    ).rejects.toThrow("gBizINFO response was not a JSON object");

    const arrayFetch = vi.fn(async () => Response.json([{ url: "https://example.com" }]));
    await expect(
      fetchGBizInfoByCorporateNumber("1234567890123", {
        token: "gbiz-token",
        baseUrl: "https://gbiz.test/hojin",
        fetchImpl: arrayFetch,
      }),
    ).rejects.toThrow("gBizINFO response was not a JSON object");
  });

  test("EDINET XBRL風データから年商と従業員数を抽出できる", () => {
    const xbrl = "<xbrl><NetSales>50億円</NetSales><NumberOfEmployees>1,250</NumberOfEmployees></xbrl>";
    const facts = extractEdinetFactsFromXbrl(xbrl);
    expect(facts.annualRevenue?.normalized).toBe(5_000_000_000);
    expect(facts.employeeCount?.normalized).toBe(1250);
  });

  test("EDINET XBRL numeric monetary facts are treated as raw JPY amounts", () => {
    const xbrl = "<xbrl><OperatingRevenue>12,000,000</OperatingRevenue><NumberOfEmployees>42</NumberOfEmployees></xbrl>";
    const facts = extractEdinetFactsFromXbrl(xbrl);
    expect(facts.annualRevenue).toMatchObject({
      observed: "12,000,000",
      normalized: 12_000_000,
      type: "operating_revenue",
      evidence: "OperatingRevenue: 12,000,000",
    });
    expect(facts.employeeCount?.normalized).toBe(42);
  });

  test("EDINET XBRL facts with attributes keep their parent fact names", () => {
    const xbrl = [
      "<xbrl>",
      '<jpcrp_cor:NetSales contextRef="CurrentYearDuration" unitRef="JPY" decimals="-6">12,000,000</jpcrp_cor:NetSales>',
      '<jpcrp_cor:NumberOfEmployees contextRef="CurrentYearInstant">42</jpcrp_cor:NumberOfEmployees>',
      "</xbrl>",
    ].join("");
    const facts = extractEdinetFactsFromXbrl(xbrl);
    expect(facts.annualRevenue).toMatchObject({
      observed: "12,000,000",
      normalized: 12_000_000,
      type: "sales",
      evidence: "NetSales: 12,000,000",
    });
    expect(facts.employeeCount).toMatchObject({
      observed: "42",
      normalized: 42,
      evidence: "NumberOfEmployees: 42",
    });
  });

  test("EDINET fact selection uses business priority instead of document order", () => {
    const xbrl = [
      "<xbrl>",
      "<OrdinaryIncome>999</OrdinaryIncome>",
      "<OperatingRevenue>888</OperatingRevenue>",
      "<NetSales>12,000,000</NetSales>",
      "<AverageNumberOfTemporaryWorkers>300</AverageNumberOfTemporaryWorkers>",
      "<NumberOfEmployees>42</NumberOfEmployees>",
      "</xbrl>",
    ].join("");
    const facts = extractEdinetFactsFromXbrl(xbrl);
    expect(facts.annualRevenue).toMatchObject({
      observed: "12,000,000",
      normalized: 12_000_000,
      type: "sales",
      evidence: "NetSales: 12,000,000",
    });
    expect(facts.employeeCount).toMatchObject({
      observed: "42",
      normalized: 42,
      evidence: "NumberOfEmployees: 42",
    });
  });

  test("EDINET ZIPレスポンスからXBRL本文を取り出せる", async () => {
    const xbrl = "<xbrl><Revenue>12,000,000</Revenue><NumberOfEmployees>42</NumberOfEmployees></xbrl>";
    const deflatedArchive = createZipFixture("XBRL/PublicDoc/test.xbrl", xbrl, 8);
    const storedArchive = createZipFixture("XBRL/PublicDoc/test.xml", xbrl, 0);

    expect(extractXbrlTextFromZip(deflatedArchive)).toBe(xbrl);
    expect(extractXbrlTextFromZip(storedArchive)).toBe(xbrl);

    const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response(deflatedArchive, { status: 200, headers: { "content-type": "application/zip" } });
    });
    const fetched = await fetchEdinetDocumentXbrl("S100TEST", { baseUrl: "https://edinet.test/api/documents", apiKey: "edinet-key", fetchImpl: fetchMock });
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]));

    expect(fetched).toBe(xbrl);
    expect(requestedUrl.toString()).toBe("https://edinet.test/api/documents/S100TEST?type=1&Subscription-Key=edinet-key");
  });

  test("外部検索API失敗時は空候補へフォールバックする", async () => {
    const provider: SearchProvider = {
      name: "failing",
      search: async () => {
        throw new Error("upstream down");
      },
    };
    await expect(safeDiscoverOfficialUrlCandidates({ companyName: "東都精密工業株式会社", provider })).resolves.toEqual([]);
  });
});

describe("selection, persistence mapping, and API handlers", () => {
  test("信頼度と鮮度で採用観測値を選定できる", () => {
    const observations = [
      observation("old-high", 90, "2025-01-01T00:00:00Z"),
      observation("new-low", 80, "2026-01-01T00:00:00Z"),
      observation("new-high", 90, "2026-01-01T00:00:00Z"),
    ];
    expect(selectBestObservation(observations)?.id).toBe("new-high");
  });

  test("Supabase保存前のcompanies更新値を観測値から一貫して作れる", () => {
    const update = buildCompanySelectedValueUpdate({
      official_url: observation("url", 80, "2026-01-01T00:00:00Z", "official_url", "https://example.com", "https://example.com"),
      industry: observation("industry", 70, "2026-01-01T00:00:00Z", "industry", "製造業", "製造業"),
      employee_count: observation("employee", 90, "2026-01-01T00:00:00Z", "employee_count", "連結 1,200名", "1200"),
      annual_revenue: observation("revenue", 30, "2026-01-01T00:00:00Z", "annual_revenue", "推定 10億円", "1000000000", "estimated"),
    });
    expect(update).toMatchObject({
      official_url: "https://example.com",
      industry: "製造業",
      employee_count: 1200,
      employee_count_type: "consolidated",
      annual_revenue: 1_000_000_000,
      annual_revenue_type: "estimated",
      coverage_score: 100,
    });
  });

  test("company upsert rows normalize corporate numbers before persistence", () => {
    expect(buildCompanyUpsertRow({ corporateNumber: "１２３-４５６７８９０１２３", name: "Full Width" })).toMatchObject({
      corporate_number: "1234567890123",
      name: "Full Width",
      status: "active",
    });
    expect(buildCompanyUpsertRow({ corporateNumber: "   ", name: "Whitespace" }).corporate_number).toBeNull();
    expect(buildCompanyUpsertRow({ corporateNumber: "not-a-number", name: "Invalid" }).corporate_number).toBeNull();
    expect(buildCompanyUpsertRow({ corporateNumber: null, name: "Missing" }).corporate_number).toBeNull();
  });

  test("company fallback upserts target a schema-backed name address uniqueness rule", () => {
    const rowWithCorporateNumber = buildCompanyUpsertRow({ corporateNumber: "1234567890123", name: "With Number", address: null });
    const rowWithoutCorporateNumber = buildCompanyUpsertRow({ corporateNumber: null, name: "Fallback", address: null });
    const initialSchemaSql = readFileSync(path.join(process.cwd(), "supabase", "migrations", "202607030001_initial_schema.sql"), "utf8");
    const fallbackIndexSql = readFileSync(path.join(process.cwd(), "supabase", "migrations", "202607070002_company_fallback_unique_index.sql"), "utf8");

    expect(companyUpsertConflictTarget(rowWithCorporateNumber)).toBe("corporate_number");
    expect(companyUpsertConflictTarget(rowWithoutCorporateNumber)).toBe("name,address");
    expect(initialSchemaSql).toContain("companies_name_address_uidx");
    expect(initialSchemaSql).toContain("on public.companies(name, address) nulls not distinct");
    expect(fallbackIndexSql).toContain("companies_name_address_uidx");
    expect(fallbackIndexSql).toContain("group by name, address");
    expect(fallbackIndexSql).toContain("on public.companies(name, address) nulls not distinct");
  });

  test("CSVエクスポート整形が必須列を出力できる", () => {
    const csv = createCompaniesCsv([
      {
        corporate_number: "1234567890123",
        company_name: "=HYPERLINK(\"https://evil.example\")",
        official_url: "https://example.com",
        industry: "精密機器製造",
        employee_count: 1200,
        employee_count_type: "consolidated",
        annual_revenue: 5000000000,
        annual_revenue_type: "sales",
        revenue_range: "10億-100億円",
        confidence_score: 100,
        source_urls: "\thttps://example.com/profile",
        updated_at: "2026-07-03T00:00:00Z",
      },
      {
        corporate_number: "2234567890123",
        company_name: "Safe Company",
        official_url: "https://safe.example",
        industry: "邊ｾ蟇・ｩ溷勣陬ｽ騾",
        employee_count: "",
        employee_count_type: "unknown",
        annual_revenue: "",
        annual_revenue_type: "unknown",
        revenue_range: "",
        confidence_score: 70,
        source_urls: " \thttps://example.com/space-tab",
        updated_at: "2026-07-04T00:00:00Z",
      },
    ]);
    const rows = parseCsv(csv, { bom: true, columns: true }) as Record<string, string>[];
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("corporate_number,company_name,official_url,industry");
    expect(rows[0].company_name).toBe("'=HYPERLINK(\"https://evil.example\")");
    expect(rows[0].source_urls).toBe("'\thttps://example.com/profile");
    expect(rows[1].source_urls).toBe("' \thttps://example.com/space-tab");
  });

  test("CSVダウンロード名は日本語を保ちつつ危険なファイル名文字を除去する", () => {
    expect(sanitizeDownloadFileName(" 高信頼URLあり営業リスト.csv ")).toBe("高信頼URLあり営業リスト.csv");
    expect(sanitizeDownloadFileName("営業/調査:大阪*物流?.csv")).toBe("営業-調査-大阪-物流-.csv");
    expect(sanitizeDownloadFileName(" \u0000 / ")).toBe("download.csv");
    expect(sanitizeDownloadFileName("x".repeat(220))).toHaveLength(180);
    const longCsvName = sanitizeDownloadFileName(`${"営業リスト".repeat(80)}.csv`);
    expect(longCsvName).toHaveLength(180);
    expect(longCsvName.endsWith(".csv")).toBe(true);
    const disposition = attachmentContentDisposition("営業/調査:大阪*物流?.csv", "saved-list.csv");
    expect(disposition).toContain('filename="saved-list.csv"');
    expect(decodeDispositionFileName(disposition)).toBe("営業-調査-大阪-物流-.csv");
  });

  test("CSV API handlerはモックデータでCSVレスポンスを返す", async () => {
    const response = await exportCompanies();
    await expect(response.text()).resolves.toContain("東都精密工業株式会社");
    expect(response.headers.get("content-type")).toContain("text/csv");
  });

  test("CSV API handlerは企業一覧の絞り込み条件を反映する", async () => {
    const response = await exportCompanies(new Request("http://localhost/api/companies/export?prefecture=宮城県&valueKind=estimated"));
    const csv = await response.text();

    expect(csv).toContain("青葉食品株式会社");
    expect(csv).not.toContain("東都精密工業株式会社");
    expect(csv).toContain("https://example.invalid/estimate-policy");
  });

  test("優先度API handlerは不正入力を保存せずエラーへリダイレクトする", async () => {
    const body = new FormData();
    body.set("id", "aaaaaaaa-0000-4000-8000-000000000001");
    body.set("priority", "not-a-number");
    const response = await updatePriority(new Request("http://localhost/api/jobs/priority", { method: "POST", body }));

    const invalidJobBody = new FormData();
    invalidJobBody.set("id", "------------------------------------");
    invalidJobBody.set("priority", "42");
    const invalidJobResponse = await updatePriority(new Request("http://localhost/api/jobs/priority", { method: "POST", body: invalidJobBody }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("error=invalid-priority");
    expect(invalidJobResponse.status).toBe(303);
    expect(invalidJobResponse.headers.get("location")).toContain("error=invalid-job");
  });
});

describe("safe fallback data and route behavior", () => {
  test("data accessors use mock data when Supabase is not configured", async () => {
    clearSupabaseEnv();
    expect(hasSupabaseConfig()).toBe(false);
    expect(() => getSupabaseAdmin()).toThrow("Supabase env is missing");

    const metrics = await getDashboardMetrics();
    const allCompanies = await getCompanies();
    const limitedCompanies = await getCompanies({}, { limit: 2 });
    const withUrl = await getCompanies({ hasUrl: "yes" });
    const withCorporateNumber = await getCompanies({ hasCorporateNumber: "yes" });
    const withoutCorporateNumber = await getCompanies({ hasCorporateNumber: "no" });
    const withoutRevenue = await getCompanies({ hasRevenue: "no" });
    const employeeRangeRows = await getCompanies({ employeeRange: "50-299名" });
    const revenueRangeRows = await getCompanies({ revenueRange: "1億-10億円" });
    const officialRevenueRows = await getCompanies({ valueKind: "official" });
    const withoutEmployeeRows = await getCompanies({ hasEmployeeCount: "no" });
    const highConfidenceRows = await getCompanies({ minConfidence: 80 });
    const keywordRows = await getCompanies({ q: "3234567890123" });
    const hyphenatedKeywordRows = await getCompanies({ q: "323-4567890123" });
    const urlKeywordRows = await getCompanies({ q: "kitahama-logi" });
    const uppercaseUrlKeywordRows = await getCompanies({ q: "KITAHAMA-LOGI" });
    const kanaKeywordRows = await getCompanies({ q: mockCompanies[0].name_kana ?? "" });
    const cityKeywordRows = await getCompanies({ q: mockCompanies[1].city ?? "" });
    const industryKeywordRows = await getCompanies({ q: mockCompanies[3].industry ?? "" });
    const fullWidthKeywordRows = await getCompanies({ q: "３２３４５６７８９０１２３" });
    const invalidKeywordRows = await getCompanies({ q: "%%,,()__**" });
    const manuallyExcludedRows = await getCompanies({ prefecture: "大阪府", excludedCompanyIds: ["22222222-2222-4222-8222-222222222222"] });
    const employeeSortedRows = await getCompanies({ sort: "employee_desc" });
    const confidenceSortedRows = await getCompanies({ sort: "confidence_desc" });
    const nameSortedRows = await getCompanies({ sort: "name_asc" });
    const sortedByRevenue = await getCompanies({ sort: "revenue_desc" });
    const filteredRows = await getExportRows({ prefecture: "宮城県" });
    const limitedExportRows = await getExportRows({}, { limit: 2 });
    const emptyExportRows = await getExportRows({ q: "該当なし" });
    const detail = await getCompanyDetail(allCompanies[0].id);
    const missingDetail = await getCompanyDetail("99999999-9999-4999-8999-999999999999");
    const jobs = await getJobs();
    const rows = await getExportRows();
    const savedLists = await getSavedCompanyLists();
    const savedListSnapshot = await getSavedCompanyListSnapshot(savedLists[0].id);
    const savedListDetail = await getSavedCompanyListDetail(savedLists[0].id);
    const savedListExportRows = await getSavedListExportRows(savedLists[0].id);
    const dryRunCreate = await createSavedCompanyList({ name: "dry run", filters: { hasUrl: "yes" } });
    const dryRunUpdate = await updateSavedCompanyList({ id: savedLists[0].id, name: "updated", filters: { hasUrl: "yes", minConfidence: 80 } });
    const dryRunDelete = await deleteSavedCompanyList(savedLists[0].id);
    const quality = buildListQualitySummary(allCompanies);

    expect(metrics.totalCompanies).toBeGreaterThan(0);
    expect(allCompanies.length).toBeGreaterThan(0);
    expect(limitedCompanies).toHaveLength(2);
    expect(exportRowLimit).toBeGreaterThan(100);
    expect(sourceTypeLookupBatchSize).toBeLessThanOrEqual(100);
    expect(sourceUrlLookupBatchSize).toBeLessThanOrEqual(100);
    expect(allCompanies.some((company) => company.source_types?.length)).toBe(true);
    expect(withUrl.every((company) => Boolean(company.official_url))).toBe(true);
    expect(withCorporateNumber).toHaveLength(allCompanies.length);
    expect(withCorporateNumber.every((company) => Boolean(company.corporate_number))).toBe(true);
    expect(withoutCorporateNumber).toEqual([]);
    expect(withoutRevenue.every((company) => company.annual_revenue == null)).toBe(true);
    expect(employeeRangeRows.every((company) => company.employee_count != null && company.employee_count >= 50 && company.employee_count < 300)).toBe(true);
    expect(revenueRangeRows.every((company) => company.revenue_range === "1億-10億円")).toBe(true);
    expect(officialRevenueRows).toHaveLength(1);
    expect(officialRevenueRows[0].annual_revenue_type).toBe("sales");
    expect(withoutEmployeeRows.every((company) => company.employee_count == null)).toBe(true);
    expect(highConfidenceRows.every((company) => company.data_confidence_score >= 80)).toBe(true);
    expect(keywordRows).toHaveLength(1);
    expect(keywordRows[0]).toMatchObject({ name: "青葉食品株式会社", corporate_number: "3234567890123" });
    expect(hyphenatedKeywordRows).toHaveLength(1);
    expect(hyphenatedKeywordRows[0]).toMatchObject({ name: "青葉食品株式会社", corporate_number: "3234567890123" });
    expect(urlKeywordRows).toHaveLength(1);
    expect(urlKeywordRows[0]).toMatchObject({ name: "北浜物流合同会社", official_url: "https://example.jp/kitahama-logi" });
    expect(uppercaseUrlKeywordRows).toHaveLength(1);
    expect(kanaKeywordRows).toHaveLength(1);
    expect(kanaKeywordRows[0].id).toBe(mockCompanies[0].id);
    expect(cityKeywordRows).toHaveLength(1);
    expect(cityKeywordRows[0].id).toBe(mockCompanies[1].id);
    expect(industryKeywordRows).toHaveLength(1);
    expect(industryKeywordRows[0].id).toBe(mockCompanies[3].id);
    expect(fullWidthKeywordRows[0]).toMatchObject({ name: "青葉食品株式会社" });
    expect(invalidKeywordRows).toEqual([]);
    expect(normalizeCompanySearchTerm(" ％ＫＩＴＡＨＡＭＡ＿LOGI,() ")).toBe("KITAHAMALOGI");
    expect(manuallyExcludedRows).toEqual([]);
    expect(employeeSortedRows[0].employee_count).toBeGreaterThanOrEqual(employeeSortedRows[1].employee_count ?? 0);
    expect(confidenceSortedRows[0].data_confidence_score).toBeGreaterThanOrEqual(confidenceSortedRows[1].data_confidence_score);
    expect(nameSortedRows.map((company) => company.name)).toEqual([...nameSortedRows].map((company) => company.name).sort((a, b) => a.localeCompare(b, "ja")));
    expect(sortedByRevenue[0].annual_revenue).toBeGreaterThanOrEqual(sortedByRevenue[1].annual_revenue ?? 0);
    expect(filteredRows).toHaveLength(1);
    expect(filteredRows[0]).toMatchObject({ company_name: "青葉食品株式会社", source_urls: expect.stringContaining("estimate-policy") });
    expect(limitedExportRows).toHaveLength(2);
    expect(emptyExportRows).toEqual([]);
    expect(detail?.company.id).toBe(allCompanies[0].id);
    expect(missingDetail).toBeNull();
    expect(jobs.some((job) => job.company_name)).toBe(true);
    expect(rows[0]).toHaveProperty("company_name");
    expect(rows).toHaveLength(allCompanies.length);
    expect(savedLists[0].row_count).toBeGreaterThan(0);
    expect(savedListSnapshot?.companies).toHaveLength(savedListDetail?.companies.length ?? 0);
    expect(savedListSnapshot?.list.row_count).toBe(savedListSnapshot?.companies.length);
    expect(savedListDetail?.quality.total).toBe(savedListDetail?.companies.length);
    expect(savedListExportRows?.[0]).toHaveProperty("company_name");
    expect(savedListExportRows).toHaveLength(savedListSnapshot?.companies.length ?? 0);
    expect(savedListExportRows?.[0].source_urls).toContain("disclosure.edinet-fsa.go.jp");
    expect(dryRunCreate).toMatchObject({ dryRun: true, rowCount: withUrl.length });
    expect(dryRunUpdate).toMatchObject({ dryRun: true, id: savedLists[0].id });
    expect(dryRunDelete).toMatchObject({ dryRun: true, id: savedLists[0].id });
    expect(quality.duplicateCorporateNumbers).toEqual([]);
  });

  test("job retry and stop routes stay in dry-run mode without Supabase", async () => {
    clearSupabaseEnv();
    const retryBody = new FormData();
    retryBody.set("id", "aaaaaaaa-0000-4000-8000-000000000001");
    const retryResponse = await retryJob(new Request("http://localhost/api/jobs/retry", { method: "POST", body: retryBody }));

    const stopBody = new FormData();
    stopBody.set("id", "aaaaaaaa-0000-4000-8000-000000000001");
    const stopResponse = await stopJob(new Request("http://localhost/api/jobs/stop", { method: "POST", body: stopBody }));

    expect(retryResponse.status).toBe(303);
    expect(retryResponse.headers.get("location")).toContain("notice=dry-run");
    expect(stopResponse.status).toBe(303);
    expect(stopResponse.headers.get("location")).toContain("notice=dry-run");
  });

  test("job filters narrow by status and operational keywords", async () => {
    const jobs = await getJobs();
    const failedFilters = parseJobFilters({ status: "failed", q: "公式URL" });
    const failedJobs = filterJobs(jobs, failedFilters);
    const invalidStatusFilters = parseJobFilters({ status: "broken" });

    expect(failedJobs).toHaveLength(1);
    expect(failedJobs[0]).toMatchObject({ status: "failed", job_type: "discover_official_url" });
    expect(filterJobs(jobs, invalidStatusFilters)).toHaveLength(jobs.length);
    expect(filterJobs(jobs, { q: "存在しないジョブ" })).toEqual([]);
  });

  test("job runner executes pending gBizINFO jobs including null schedules", async () => {
    const raw = { data: [{ corporate_number: "1234567890123" }] };
    const supabase = createRunnerSupabase(
      runnerJob({
        job_type: "enrich_gbizinfo",
        companies: { corporate_number: "１２３-４５６７８９０１２３" },
      }),
    );
    const fetchGBizInfo = vi.fn(async () => raw);
    const applyGBiz = vi.fn(async () => ({ officialUrl: null, industry: null, employeeCount: null }));

    const result = await runNextCrawlJob({
      supabase: supabase.client,
      now: fixedRunnerDate,
      fetchGBizInfo,
      applyGBizInfo: applyGBiz,
    });

    expect(result?.id).toBe("job-1");
    expect(result?.run_status).toBe("completed");
    expect(supabase.filters).toContain("scheduled_at.is.null,scheduled_at.lte.2026-07-03T00:00:00.000Z");
    expect(fetchGBizInfo).toHaveBeenCalledWith("1234567890123");
    expect(applyGBiz).toHaveBeenCalledWith("company-1", raw);
    expect(supabase.updates.map((update) => update.values.status)).toEqual(["running", "completed"]);
    expect(supabase.logs).toContainEqual(expect.objectContaining({ level: "info", message: "Job completed" }));
  });

  test("job runner executes planned EDINET and official URL discovery jobs", async () => {
    const edinetSupabase = createRunnerSupabase(
      runnerJob({
        job_type: "enrich_edinet",
        companies: { corporate_number: "１２３-４５６７８９０１２３" },
      }),
    );
    const listEdinet = vi.fn(async () => [{ docID: "doc-1", corporateNumber: "１２３-４５６７８９０１２３" }]);
    const applyEdinetDocuments = vi.fn(async () => 1);

    const edinetResult = await runNextCrawlJob({
      supabase: edinetSupabase.client,
      now: fixedRunnerDate,
      listEdinetDocuments: listEdinet,
      applyEdinetDocuments,
    });

    expect(edinetResult?.run_status).toBe("completed");
    expect(listEdinet).toHaveBeenCalledWith("2026-07-03");
    expect(applyEdinetDocuments).toHaveBeenCalledWith("company-1", [{ docID: "doc-1", corporateNumber: "１２３-４５６７８９０１２３" }]);
    expect(edinetSupabase.updates.map((update) => update.values.status)).toEqual(["running", "completed"]);

    const discoverSupabase = createRunnerSupabase(
      runnerJob({
        job_type: "discover_official_url",
        companies: { corporate_number: "1234567890123", name: "東都精密工業株式会社", prefecture: "東京都", city: "千代田区" },
      }),
    );
    const discoverOfficialUrl = vi.fn(async () => [{ title: "東都精密工業株式会社 会社概要", url: "https://example.com/company", snippet: "法人番号 1234567890123" }]);
    const persistOfficialUrlCandidate = vi.fn(async () => undefined);

    const discoverResult = await runNextCrawlJob({
      supabase: discoverSupabase.client,
      now: fixedRunnerDate,
      discoverOfficialUrl,
      persistOfficialUrlCandidate,
    });

    expect(discoverResult?.run_status).toBe("completed");
    expect(discoverOfficialUrl).toHaveBeenCalledWith({ companyName: "東都精密工業株式会社", prefecture: "東京都", city: "千代田区" });
    expect(persistOfficialUrlCandidate).toHaveBeenCalledWith(
      expect.objectContaining({ company_id: "company-1" }),
      expect.objectContaining({ url: "https://example.com/company" }),
      expect.objectContaining({ confidenceScore: expect.any(Number) }),
    );
    const persistCall = persistOfficialUrlCandidate.mock.calls[0] as unknown as [unknown, unknown, { confidenceScore: number }];
    expect(persistCall[2].confidenceScore).toBeGreaterThanOrEqual(80);
    expect(discoverSupabase.updates.map((update) => update.values.status)).toEqual(["running", "completed"]);
  });

  test("job runner searches recent EDINET filing dates before failing coverage-gap jobs", async () => {
    const edinetSupabase = createRunnerSupabase(
      runnerJob({
        job_type: "enrich_edinet",
        companies: { corporate_number: "1234567890123" },
      }),
    );
    const listEdinet = vi.fn(async (date: string) => {
      if (date === "2026-07-01") return [{ docID: "doc-older", corporateNumber: "1234567890123", periodEnd: "2026-03-31" }];
      return [{ docID: `doc-${date}`, corporateNumber: "9999999999999" }];
    });
    const applyEdinetDocuments = vi.fn(async () => 1);

    const edinetResult = await runNextCrawlJob({
      supabase: edinetSupabase.client,
      now: fixedRunnerDate,
      listEdinetDocuments: listEdinet,
      applyEdinetDocuments,
    });

    expect(edinetResult?.run_status).toBe("completed");
    expect(listEdinet).toHaveBeenCalledTimes(3);
    expect(listEdinet.mock.calls.map(([date]) => date)).toEqual(["2026-07-03", "2026-07-02", "2026-07-01"]);
    expect(applyEdinetDocuments).toHaveBeenCalledWith("company-1", [
      { docID: "doc-older", corporateNumber: "1234567890123", periodEnd: "2026-03-31" },
    ]);
    expect(edinetSupabase.updates.map((update) => update.values.status)).toEqual(["running", "completed"]);
  });

  test("job runner fails EDINET jobs when no filing or facts are applied", async () => {
    const noFilingSupabase = createRunnerSupabase(
      runnerJob({
        job_type: "enrich_edinet",
        companies: { corporate_number: "1234567890123" },
      }),
    );

    const noFilingResult = await runNextCrawlJob({
      supabase: noFilingSupabase.client,
      now: fixedRunnerDate,
      listEdinetDocuments: vi.fn(async () => [{ docID: "doc-2", corporateNumber: "9999999999999" }]),
    });

    expect(noFilingResult?.run_status).toBe("failed");
    expect(noFilingResult?.error_message).toContain("No EDINET documents found");
    expect(noFilingSupabase.updates.map((update) => update.values.status)).toEqual(["running", "failed"]);

    const noFactsSupabase = createRunnerSupabase(
      runnerJob({
        job_type: "enrich_edinet",
        companies: { corporate_number: "1234567890123" },
      }),
    );

    const noFactsResult = await runNextCrawlJob({
      supabase: noFactsSupabase.client,
      now: fixedRunnerDate,
      listEdinetDocuments: vi.fn(async () => [{ docID: "doc-1", corporateNumber: "1234567890123" }]),
      applyEdinetDocuments: vi.fn(async () => 0),
    });

    expect(noFactsResult?.run_status).toBe("failed");
    expect(noFactsResult?.error_message).toContain("no XBRL facts were applied");
    expect(noFactsSupabase.updates.map((update) => update.values.status)).toEqual(["running", "failed"]);
  });

  test("job runner completes manual verification jobs without marking them unsupported", async () => {
    const supabase = createRunnerSupabase(runnerJob({ job_type: "verify_data" }));

    const result = await runNextCrawlJob({ supabase: supabase.client, now: fixedRunnerDate });

    expect(result?.run_status).toBe("completed");
    expect(supabase.updates.map((update) => update.values.status)).toEqual(["running", "completed"]);
  });

  test("job runner marks unsupported jobs as failed with crawl logs", async () => {
    const supabase = createRunnerSupabase(runnerJob({ job_type: "seed_import" }));

    const result = await runNextCrawlJob({ supabase: supabase.client, now: fixedRunnerDate });

    expect(result?.id).toBe("job-1");
    expect(result?.run_status).toBe("failed");
    expect(supabase.updates.map((update) => update.values.status)).toEqual(["running", "failed"]);
    expect(String(supabase.updates[1].values.error_message)).toContain("not implemented");
    expect(supabase.logs).toContainEqual(expect.objectContaining({ level: "error", message: expect.stringContaining("not implemented") }));
  });

  test("job runner returns null when no pending job is available", async () => {
    const supabase = createRunnerSupabase(null);

    await expect(runNextCrawlJob({ supabase: supabase.client, now: fixedRunnerDate })).resolves.toBeNull();
    expect(supabase.updates).toEqual([]);
    expect(supabase.logs).toEqual([]);
  });

  test("job runner skips execution when another runner claims the selected job first", async () => {
    const supabase = createRunnerSupabase(runnerJob({ job_type: "enrich_gbizinfo" }), { claimMatches: false });
    const fetchGBizInfo = vi.fn(async () => ({ data: [] }));

    await expect(runNextCrawlJob({ supabase: supabase.client, now: fixedRunnerDate, fetchGBizInfo })).resolves.toBeNull();
    expect(fetchGBizInfo).not.toHaveBeenCalled();
    expect(supabase.updates).toEqual([]);
    expect(supabase.logs).toEqual([]);
  });

  test("job retry and stop routes reject missing ids before mutations", async () => {
    clearSupabaseEnv();
    const retryResponse = await retryJob(new Request("http://localhost/api/jobs/retry", { method: "POST", body: new FormData() }));

    const stopBody = new FormData();
    stopBody.set("id", "------------------------------------");
    const stopResponse = await stopJob(new Request("http://localhost/api/jobs/stop", { method: "POST", body: stopBody }));

    expect(retryResponse.status).toBe(303);
    expect(retryResponse.headers.get("location")).toContain("/jobs?error=invalid-job");
    expect(stopResponse.status).toBe(303);
    expect(stopResponse.headers.get("location")).toContain("/jobs?error=invalid-job");
  });

  test("job retry and stop routes reject unsafe current states", async () => {
    const body = new FormData();
    body.set("id", "aaaaaaaa-0000-4000-8000-000000000001");
    const revalidate = vi.fn();
    const logError = vi.fn();

    const retryWrongState = await retryJobRedirect("http://localhost/api/jobs/retry", body, {
      hasConfig: () => true,
      retry: async () => false,
      revalidate,
    });
    const retryUpdated = await retryJobRedirect("http://localhost/api/jobs/retry", body, {
      hasConfig: () => true,
      retry: async () => true,
      revalidate,
    });
    const retryFailure = await retryJobRedirect("http://localhost/api/jobs/retry", body, {
      hasConfig: () => true,
      logError,
      retry: async () => {
        throw new Error("retry db down");
      },
      revalidate,
    });
    const stopWrongState = await stopJobRedirect("http://localhost/api/jobs/stop", body, {
      hasConfig: () => true,
      stop: async () => false,
      revalidate,
    });
    const stopFailure = await stopJobRedirect("http://localhost/api/jobs/stop", body, {
      hasConfig: () => true,
      logError,
      stop: async () => {
        throw new Error("db down");
      },
      revalidate,
    });

    expect(retryWrongState.headers.get("location")).toContain("error=invalid-job-state");
    expect(retryUpdated.headers.get("location")).toContain("notice=updated");
    expect(retryFailure.headers.get("location")).toContain("error=operation-failed");
    expect(stopWrongState.headers.get("location")).toContain("error=invalid-job-state");
    expect(stopFailure.headers.get("location")).toContain("error=operation-failed");
    expect(logError).toHaveBeenCalledWith("retryJobRedirect failed", expect.any(Error));
    expect(logError).toHaveBeenCalledWith("stopJobRedirect failed", expect.any(Error));
    expect(revalidate).toHaveBeenCalledWith("/jobs");
  });

  test("job action helpers constrain mutations by current status", async () => {
    const retryMutation = createJobMutationClient(true);
    const stoppedMutation = createJobMutationClient(false);
    const fixedNow = new Date("2026-07-07T10:00:00+09:00");

    const retryUpdated = await markJobForRetry(retryMutation.client, "job-1", fixedNow);
    const stoppedUpdated = await markJobStopped(stoppedMutation.client, "job-2", fixedNow);

    expect(retryUpdated).toBe(true);
    expect(retryMutation.state).toMatchObject({
      table: "crawl_jobs",
      id: "job-1",
      statuses: [...retryableJobStatuses],
      values: {
        status: "pending",
        error_message: null,
        scheduled_at: fixedNow.toISOString(),
        started_at: null,
        finished_at: null,
      },
    });
    expect(stoppedUpdated).toBe(false);
    expect(stoppedMutation.state).toMatchObject({
      table: "crawl_jobs",
      id: "job-2",
      statuses: [...stoppableJobStatuses],
      values: {
        status: "skipped",
        finished_at: fixedNow.toISOString(),
      },
    });
  });

  test("job priority route accepts valid dry-run updates without touching production data", async () => {
    clearSupabaseEnv();
    const body = new FormData();
    body.set("id", "aaaaaaaa-0000-4000-8000-000000000001");
    body.set("priority", "42");

    const response = await updatePriority(new Request("http://localhost/api/jobs/priority", { method: "POST", body }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("notice=dry-run");
  });

  test("job priority route logs Supabase update failures without revalidating jobs", async () => {
    const body = new FormData();
    body.set("id", "aaaaaaaa-0000-4000-8000-000000000001");
    body.set("priority", "42");
    const revalidate = vi.fn();
    const logError = vi.fn();

    const response = await jobPriorityRedirect("http://localhost/api/jobs/priority", body, {
      hasConfig: () => true,
      updatePriority: async () => new Error("priority update failed"),
      revalidate,
      logError,
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/jobs?error=operation-failed");
    expect(logError).toHaveBeenCalledWith("jobPriorityRedirect failed", expect.any(Error));
    expect(revalidate).not.toHaveBeenCalled();
  });

  test("coverage planning route supports dry-run planning and rejects invalid limits", async () => {
    clearSupabaseEnv();
    const body = new FormData();
    body.set("limit", "4");

    const response = await planCoverageJobs(new Request("http://localhost/api/jobs/plan-coverage", { method: "POST", body }));
    const invalidBody = new FormData();
    invalidBody.set("limit", "0");
    const invalidResponse = await planCoverageJobs(new Request("http://localhost/api/jobs/plan-coverage", { method: "POST", body: invalidBody }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("notice=dry-run-coverage");
    expect(response.headers.get("location")).toContain("planned=");
    expect(invalidResponse.status).toBe(303);
    expect(invalidResponse.headers.get("location")).toContain("error=invalid-plan-limit");
  });

  test("coverage planning route logs operation failures without revalidating jobs", async () => {
    const body = new FormData();
    body.set("limit", "4");
    const revalidate = vi.fn();
    const logError = vi.fn();

    const response = await planCoverageRedirect("http://localhost/api/jobs/plan-coverage", body, {
      queueCoverageJobs: async () => {
        throw new Error("planner failed");
      },
      revalidate,
      logError,
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/jobs?error=operation-failed");
    expect(logError).toHaveBeenCalledWith("planCoverageRedirect failed", expect.any(Error));
    expect(revalidate).not.toHaveBeenCalled();
  });

  test("job mutation routes recover from malformed form posts", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const malformedRequest = (url: string) =>
      new Request(url, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "not multipart",
      });

    try {
      const priorityResponse = await updatePriority(malformedRequest("http://localhost/api/jobs/priority"));
      const planCoverageResponse = await planCoverageJobs(malformedRequest("http://localhost/api/jobs/plan-coverage"));
      const retryResponse = await retryJob(malformedRequest("http://localhost/api/jobs/retry"));
      const stopResponse = await stopJob(malformedRequest("http://localhost/api/jobs/stop"));

      for (const response of [priorityResponse, planCoverageResponse, retryResponse, stopResponse]) {
        const location = new URL(response.headers.get("location")!);
        expect(response.status).toBe(303);
        expect(location.pathname).toBe("/jobs");
        expect(location.searchParams.get("error")).toBe("operation-failed");
      }
      expect(consoleError).toHaveBeenCalledWith("jobPriorityRedirect form parse failed", expect.any(Error));
      expect(consoleError).toHaveBeenCalledWith("planCoverageRedirect form parse failed", expect.any(Error));
      expect(consoleError).toHaveBeenCalledWith("retryJobRedirect form parse failed", expect.any(Error));
      expect(consoleError).toHaveBeenCalledWith("stopJobRedirect form parse failed", expect.any(Error));
    } finally {
      consoleError.mockRestore();
    }
  });

  test("run-next route stays in dry-run mode without Supabase", async () => {
    clearSupabaseEnv();

    const response = await runNextJob(new Request("http://localhost/api/jobs/run-next", { method: "POST" }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("notice=dry-run-run");
  });

  test("run-next route reports completed, failed, empty, and operation failures", async () => {
    const revalidate = vi.fn();
    const logError = vi.fn();
    const completed = await runNextJobRedirect("http://localhost/api/jobs/run-next", {
      hasConfig: () => true,
      revalidate,
      runJob: async () => ({ ...runnerJob({ job_type: "enrich_gbizinfo" }), run_status: "completed" }),
    });
    const failed = await runNextJobRedirect("http://localhost/api/jobs/run-next", {
      hasConfig: () => true,
      revalidate,
      runJob: async () => ({ ...runnerJob({ job_type: "verify_data" }), run_status: "failed" }),
    });
    const empty = await runNextJobRedirect("http://localhost/api/jobs/run-next", {
      hasConfig: () => true,
      revalidate,
      runJob: async () => null,
    });
    const error = await runNextJobRedirect("http://localhost/api/jobs/run-next", {
      hasConfig: () => true,
      logError,
      revalidate,
      runJob: async () => {
        throw new Error("db down");
      },
    });

    expect(completed.headers.get("location")).toContain("notice=job-ran");
    expect(completed.headers.get("location")).toContain("jobType=enrich_gbizinfo");
    expect(failed.headers.get("location")).toContain("notice=job-failed");
    expect(empty.headers.get("location")).toContain("notice=no-pending-job");
    expect(error.headers.get("location")).toContain("error=operation-failed");
    expect(logError).toHaveBeenCalledWith("runNextJobRedirect failed", expect.any(Error));
    expect(revalidate).toHaveBeenCalledWith("/jobs");
  });

  test("company detail actions create safe dry-run redirects without Supabase", async () => {
    clearSupabaseEnv();
    const body = new FormData();
    body.set("id", "11111111-1111-4111-8111-111111111111");

    const recrawlResponse = await recrawlCompany(new Request("http://localhost/api/companies/recrawl", { method: "POST", body }));
    const manualBody = new FormData();
    manualBody.set("id", "11111111-1111-4111-8111-111111111111");
    const manualResponse = await manualReviewCompany(new Request("http://localhost/api/companies/manual-review", { method: "POST", body: manualBody }));

    expect(recrawlResponse.status).toBe(303);
    expect(recrawlResponse.headers.get("location")).toContain("/companies/11111111-1111-4111-8111-111111111111");
    expect(recrawlResponse.headers.get("location")).toContain("notice=dry-run");
    expect(manualResponse.status).toBe(303);
    expect(manualResponse.headers.get("location")).toContain("notice=dry-run");
  });

  test("company detail actions log scheduling failures without revalidating company state", async () => {
    const body = new FormData();
    body.set("id", "11111111-1111-4111-8111-111111111111");
    const manualBody = new FormData();
    manualBody.set("id", "11111111-1111-4111-8111-111111111111");
    const revalidate = vi.fn();
    const logError = vi.fn();

    const recrawlResponse = await recrawlCompanyRedirect("http://localhost/api/companies/recrawl", body, {
      hasConfig: () => true,
      scheduleRecrawl: async () => new Error("recrawl insert failed"),
      revalidate,
      logError,
    });
    const manualResponse = await manualReviewCompanyRedirect("http://localhost/api/companies/manual-review", manualBody, {
      hasConfig: () => true,
      scheduleManualReview: async () => new Error("manual insert failed"),
      revalidate,
      logError,
    });

    expect(recrawlResponse.status).toBe(303);
    expect(recrawlResponse.headers.get("location")).toContain("/companies/11111111-1111-4111-8111-111111111111?error=operation-failed");
    expect(manualResponse.status).toBe(303);
    expect(manualResponse.headers.get("location")).toContain("/companies/11111111-1111-4111-8111-111111111111?error=operation-failed");
    expect(logError).toHaveBeenCalledWith("recrawlCompanyRedirect failed", expect.any(Error));
    expect(logError).toHaveBeenCalledWith("manualReviewCompanyRedirect failed", expect.any(Error));
    expect(revalidate).not.toHaveBeenCalled();
  });

  test("company detail actions reject invalid company ids before scheduling jobs", async () => {
    clearSupabaseEnv();
    const recrawlBody = new FormData();
    recrawlBody.set("id", "------------------------------------");
    const recrawlResponse = await recrawlCompany(new Request("http://localhost/api/companies/recrawl", { method: "POST", body: recrawlBody }));

    const manualBody = new FormData();
    manualBody.set("id", "");
    const manualResponse = await manualReviewCompany(new Request("http://localhost/api/companies/manual-review", { method: "POST", body: manualBody }));

    expect(recrawlResponse.status).toBe(303);
    expect(recrawlResponse.headers.get("location")).toContain("/companies?error=invalid-company");
    expect(manualResponse.status).toBe(303);
    expect(manualResponse.headers.get("location")).toContain("/companies?error=invalid-company");
  });

  test("company detail actions recover from malformed form posts", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const malformedRequest = (url: string) =>
      new Request(url, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "not multipart",
      });

    try {
      const recrawlResponse = await recrawlCompany(malformedRequest("http://localhost/api/companies/recrawl"));
      const manualResponse = await manualReviewCompany(malformedRequest("http://localhost/api/companies/manual-review"));

      for (const response of [recrawlResponse, manualResponse]) {
        const location = new URL(response.headers.get("location")!);
        expect(response.status).toBe(303);
        expect(location.pathname).toBe("/companies");
        expect(location.searchParams.get("error")).toBe("operation-failed");
      }
      expect(consoleError).toHaveBeenCalledWith("recrawlCompanyRedirect form parse failed", expect.any(Error));
      expect(consoleError).toHaveBeenCalledWith("manualReviewCompanyRedirect form parse failed", expect.any(Error));
    } finally {
      consoleError.mockRestore();
    }
  });

  test("list creation route stays in dry-run mode without Supabase", async () => {
    clearSupabaseEnv();
    const body = new FormData();
    body.set("name", "大阪物流フォロー");
    body.set("prefecture", "大阪府");
    body.set("hasRevenue", "no");
    body.set("sort", "employee_desc");

    const response = await createList(new Request("http://localhost/api/lists/create", { method: "POST", body }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/lists?");
    expect(response.headers.get("location")).toContain("notice=dry-run");
    expect(response.headers.get("location")).toContain("prefecture=");
  });

  test("saved list creation keeps generated rows beyond the table preview limit", async () => {
    clearSupabaseEnv();
    const originalLength = mockCompanies.length;
    const base = mockCompanies[0];

    try {
      for (let index = 0; index < 125; index += 1) {
        mockCompanies.push({
          ...base,
          id: `bulk-company-${index}`,
          corporate_number: String(8000000000000 + index),
          name: `大容量テスト株式会社${String(index).padStart(3, "0")}`,
          prefecture: "大容量県",
          updated_at: new Date(`2026-07-03T00:${String(index % 60).padStart(2, "0")}:00.000Z`).toISOString(),
        });
      }

      const result = await createSavedCompanyList({
        name: "大容量リスト",
        filters: { prefecture: "大容量県", sort: "name_asc" },
      });

      expect(result).toMatchObject({ dryRun: true, rowCount: 125 });
    } finally {
      mockCompanies.splice(originalLength);
    }
  });

  test("saved list RPC payload keeps stable positions and snapshots", () => {
    const rows = buildSavedCompanyListRpcItems([mockCompanies[0], mockCompanies[1]]);
    const args = buildSaveCompanyListRpcArgs({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "高信頼リスト",
      description: "",
      filters: { hasUrl: "yes", minConfidence: 80 },
      companies: [mockCompanies[0], mockCompanies[1]],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      company_id: mockCompanies[0].id,
      position: 1,
      snapshot: mockCompanies[0],
    });
    expect(rows[1]).toMatchObject({
      company_id: mockCompanies[1].id,
      position: 2,
    });
    expect(args).toMatchObject({
      p_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      p_name: "高信頼リスト",
      p_description: null,
      p_filters: { hasUrl: "yes", minConfidence: 80 },
      p_items: rows,
    });
  });

  test("saved list comparison reports additions and removals without mutating snapshots", () => {
    const comparison = buildSavedCompanyListComparison([mockCompanies[0], mockCompanies[1]], [mockCompanies[1], mockCompanies[2]], 1);

    expect(comparison).toMatchObject({
      savedCount: 2,
      currentCount: 2,
      unchangedCount: 1,
      changedCount: 0,
      addedCount: 1,
      removedCount: 1,
      hasChanges: true,
    });
    expect(comparison.changedCompanies).toEqual([]);
    expect(comparison.addedCompanies).toEqual([{ id: mockCompanies[2].id, name: mockCompanies[2].name, corporate_number: mockCompanies[2].corporate_number }]);
    expect(comparison.removedCompanies).toEqual([{ id: mockCompanies[0].id, name: mockCompanies[0].name, corporate_number: mockCompanies[0].corporate_number }]);
  });

  test("saved list comparison reports field changes for retained companies", () => {
    const updatedCompany = {
      ...mockCompanies[1],
      official_url: "https://example.jp/kitahama-logi-updated",
      annual_revenue: 1200000000,
      annual_revenue_type: "sales" as const,
      data_confidence_score: 95,
    };
    const fieldChanges = buildSavedCompanyListFieldChanges(mockCompanies[1], updatedCompany);
    const comparison = buildSavedCompanyListComparison([mockCompanies[1]], [updatedCompany]);

    expect(fieldChanges).toEqual([
      { field: "official_url", before: mockCompanies[1].official_url, after: "https://example.jp/kitahama-logi-updated" },
      { field: "annual_revenue", before: null, after: 1200000000 },
      { field: "annual_revenue_type", before: "unknown", after: "sales" },
      { field: "data_confidence_score", before: 90, after: 95 },
    ]);
    expect(comparison).toMatchObject({
      savedCount: 1,
      currentCount: 1,
      unchangedCount: 0,
      changedCount: 1,
      addedCount: 0,
      removedCount: 0,
      hasChanges: true,
    });
    expect(comparison.changedCompanies).toEqual([
      {
        id: mockCompanies[1].id,
        name: mockCompanies[1].name,
        corporate_number: mockCompanies[1].corporate_number,
        changes: fieldChanges,
      },
    ]);
  });

  test("saved list pair comparison keeps list summaries with added removed and changed companies", () => {
    const updatedCompany = {
      ...mockCompanies[1],
      annual_revenue: 1200000000,
      annual_revenue_type: "sales" as const,
      data_confidence_score: 95,
    };
    const baseList = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Base list",
      description: null,
      filters: { hasUrl: "yes" as const },
      row_count: 2,
      created_at: "2026-07-03T00:00:00.000Z",
      updated_at: "2026-07-03T01:00:00.000Z",
    };
    const targetList = {
      ...baseList,
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Target list",
      row_count: 2,
      updated_at: "2026-07-04T01:00:00.000Z",
    };

    const comparison = buildSavedCompanyListPairComparison(
      { list: baseList, companies: [mockCompanies[0], mockCompanies[1]] },
      { list: targetList, companies: [updatedCompany, mockCompanies[2]] },
      2,
    );

    expect(comparison).toMatchObject({
      savedCount: 2,
      currentCount: 2,
      unchangedCount: 0,
      changedCount: 1,
      addedCount: 1,
      removedCount: 1,
      hasChanges: true,
      baseList: { id: baseList.id, name: "Base list", row_count: 2 },
      targetList: { id: targetList.id, name: "Target list", row_count: 2 },
    });
    expect(comparison.changedCompanies).toEqual([
      expect.objectContaining({
        id: mockCompanies[1].id,
        changes: [
          { field: "annual_revenue", before: null, after: 1200000000 },
          { field: "annual_revenue_type", before: "unknown", after: "sales" },
          { field: "data_confidence_score", before: 90, after: 95 },
        ],
      }),
    ]);
    expect(comparison.addedCompanies).toEqual([{ id: mockCompanies[2].id, name: mockCompanies[2].name, corporate_number: mockCompanies[2].corporate_number }]);
    expect(comparison.removedCompanies).toEqual([{ id: mockCompanies[0].id, name: mockCompanies[0].name, corporate_number: mockCompanies[0].corporate_number }]);
  });

  test("saved list pair comparison loads mock snapshots safely without Supabase", async () => {
    const comparison = await getSavedCompanyListPairComparison("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");

    expect(comparison).toMatchObject({
      baseList: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
      targetList: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
      savedCount: 3,
      currentCount: 2,
      hasChanges: true,
      addedCount: 0,
      removedCount: 1,
    });
    expect(comparison?.removedCompanies).toEqual([{ id: mockCompanies[0].id, name: mockCompanies[0].name, corporate_number: mockCompanies[0].corporate_number }]);
    await expect(getSavedCompanyListPairComparison("not-found", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")).resolves.toBeNull();
  });

  test("saved list comparison export uses an explicit unlimited diff option", () => {
    const list = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Base list",
      description: null,
      filters: {},
      row_count: 1,
      created_at: "2026-07-03T00:00:00.000Z",
      updated_at: "2026-07-03T01:00:00.000Z",
    };
    const addedCompanies = Array.from({ length: 8 }, (_, index) => ({
      ...mockCompanies[1],
      id: `comparison-added-${index}`,
      corporate_number: String(9100000000000 + index),
      name: `追加企業${index}`,
    }));

    const previewComparison = buildSavedCompanyListPairComparison(
      { list, companies: [mockCompanies[0]] },
      { list: { ...list, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "Target list", row_count: 9 }, companies: [mockCompanies[0], ...addedCompanies] },
      { previewLimit: 3 },
    );
    const exportComparison = buildSavedCompanyListPairComparison(
      { list, companies: [mockCompanies[0]] },
      { list: { ...list, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "Target list", row_count: 9 }, companies: [mockCompanies[0], ...addedCompanies] },
      { unlimited: true },
    );

    expect(previewComparison.addedCount).toBe(8);
    expect(previewComparison.addedCompanies).toHaveLength(3);
    expect(exportComparison.addedCompanies).toHaveLength(8);
    expect(buildSavedListComparisonExportRows(exportComparison)).toHaveLength(8);
  });

  test("saved list comparison export rows and API expose portable CSV diffs", async () => {
    const comparison = buildSavedCompanyListPairComparison(
      {
        list: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          name: "Base list",
          description: null,
          filters: {},
          row_count: 2,
          created_at: "2026-07-03T00:00:00.000Z",
          updated_at: "2026-07-03T01:00:00.000Z",
        },
        companies: [mockCompanies[0], mockCompanies[1]],
      },
      {
        list: {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          name: "Target list",
          description: null,
          filters: {},
          row_count: 2,
          created_at: "2026-07-04T00:00:00.000Z",
          updated_at: "2026-07-04T01:00:00.000Z",
        },
        companies: [{ ...mockCompanies[1], data_confidence_score: 95 }, mockCompanies[2]],
      },
    );
    expect(buildSavedListComparisonExportRows(comparison)).toEqual([
      {
        change_type: "changed",
        base_list_name: "Base list",
        target_list_name: "Target list",
        corporate_number: mockCompanies[1].corporate_number,
        company_name: mockCompanies[1].name,
        changed_fields: "data_confidence_score",
        before_values: String(mockCompanies[1].data_confidence_score),
        after_values: "95",
      },
      {
        change_type: "added",
        base_list_name: "Base list",
        target_list_name: "Target list",
        corporate_number: mockCompanies[2].corporate_number,
        company_name: mockCompanies[2].name,
        changed_fields: "",
        before_values: "",
        after_values: "",
      },
      {
        change_type: "removed",
        base_list_name: "Base list",
        target_list_name: "Target list",
        corporate_number: mockCompanies[0].corporate_number,
        company_name: mockCompanies[0].name,
        changed_fields: "",
        before_values: "",
        after_values: "",
      },
    ]);

    const response = await exportListComparison(
      new Request("http://localhost/api/lists/compare-export?baseListId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa&targetListId=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(decodeDispositionFileName(response.headers.get("content-disposition")!)).toContain("-comparison.csv");
    const csv = await response.text();
    expect(csv).toContain("change_type,base_list_name,target_list_name,corporate_number,company_name,changed_fields,before_values,after_values");
    expect(csv).toContain("removed");
    expect(csv).toContain("1234567890123");
    const safeComparisonCsv = createSavedListComparisonCsv([
      {
        change_type: "changed",
        base_list_name: "Base list",
        target_list_name: "Target list",
        corporate_number: "1234567890123",
        company_name: "=HYPERLINK(\"https://evil.example\")",
        changed_fields: "official_url",
        before_values: " @old",
        after_values: "+new",
      },
      {
        change_type: "changed",
        base_list_name: "Base list",
        target_list_name: "Target list",
        corporate_number: "2234567890123",
        company_name: "Safe Company",
        changed_fields: "official_url",
        before_values: "https://safe.example",
        after_values: " \nhttps://example.com/space-newline",
      },
    ]);
    expect(safeComparisonCsv).toContain("'=HYPERLINK");
    expect(safeComparisonCsv).toContain("' @old");
    expect(safeComparisonCsv).toContain("'+new");
    expect(safeComparisonCsv).toContain("' \nhttps://example.com/space-newline");
    await expect(
      exportListComparison(
        new Request("http://localhost/api/lists/compare-export?baseListId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa&targetListId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
      ),
    ).resolves.toHaveProperty("status", 400);
  });

  test("saved list comparison export sanitizes unsafe download names", async () => {
    const response = await savedListComparisonExportResponse(
      "http://localhost/api/lists/compare-export?baseListId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa&targetListId=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      {
        createSavedListComparisonCsv,
        getSavedListComparisonExport: async () => ({
          baseList: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "\u55b6\u696d/\u8abf\u67fb:\u5927\u962a*" },
          targetList: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "\u6771\u4eac?\u6bd4\u8f03" },
          rows: [],
        }),
        logError: vi.fn(),
      },
    );

    const disposition = response.headers.get("content-disposition");
    expect(response.status).toBe(200);
    expect(disposition).toContain('filename="comparison.csv"');
    expect(decodeDispositionFileName(disposition!)).toBe("\u55b6\u696d-\u8abf\u67fb-\u5927\u962a-\u6771\u4eac-\u6bd4\u8f03-comparison.csv");
  });

  test("saved list persistence uses the transactional RPC and surfaces failures", async () => {
    const rpc = vi.fn(async () => ({ data: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", error: null }));

    await expect(
      saveCompanyListWithRpc(
        { rpc },
        {
          id: null,
          name: "高信頼リスト",
          filters: { hasUrl: "yes" },
          companies: [mockCompanies[0]],
        },
      ),
    ).resolves.toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

    expect(rpc).toHaveBeenCalledWith(
      "save_company_list",
      expect.objectContaining({
        p_id: null,
        p_name: "高信頼リスト",
        p_items: [expect.objectContaining({ company_id: mockCompanies[0].id, position: 1 })],
      }),
    );

    await expect(
      saveCompanyListWithRpc(
        {
          rpc: async () => ({ data: null, error: new Error("transaction failed") }),
        },
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          name: "失敗するリスト",
          filters: {},
          companies: [],
        },
      ),
    ).rejects.toThrow("transaction failed");
  });

  test("saved list RPC migrations restrict execution to service_role", () => {
    const migrationSql = readdirSync(path.join(process.cwd(), "supabase", "migrations"))
      .filter((fileName) => fileName.endsWith(".sql"))
      .map((fileName) => readFileSync(path.join(process.cwd(), "supabase", "migrations", fileName), "utf8"))
      .filter((sql) => sql.includes("save_company_list"))
      .join("\n");

    expect(migrationSql).toContain("security invoker");
    expect(migrationSql).not.toContain("security definer");
    expect(migrationSql).toContain("revoke execute on function public.save_company_list(uuid, text, text, jsonb, jsonb) from public");
    expect(migrationSql).toContain("revoke execute on function public.save_company_list(uuid, text, text, jsonb, jsonb) from anon");
    expect(migrationSql).toContain("revoke execute on function public.save_company_list(uuid, text, text, jsonb, jsonb) from authenticated");
    expect(migrationSql).toContain("grant execute on function public.save_company_list(uuid, text, text, jsonb, jsonb) to service_role");
  });

  test("coverage queue RPC migration restricts execution to service_role", () => {
    const migrationSql = readFileSync(path.join(process.cwd(), "supabase", "migrations", "202607070001_queue_crawl_jobs_rpc.sql"), "utf8");

    expect(migrationSql).toContain("set search_path = public");
    expect(migrationSql).toContain("revoke execute on function public.queue_crawl_jobs(jsonb) from public");
    expect(migrationSql).toContain("revoke execute on function public.queue_crawl_jobs(jsonb) from anon");
    expect(migrationSql).toContain("revoke execute on function public.queue_crawl_jobs(jsonb) from authenticated");
    expect(migrationSql).toContain("grant execute on function public.queue_crawl_jobs(jsonb) to service_role");
  });

  test("list creation route rejects missing names before data access", async () => {
    clearSupabaseEnv();
    const body = new FormData();
    body.set("name", "");
    body.set("prefecture", "大阪府");
    body.set("hasRevenue", "no");

    const response = await createList(new Request("http://localhost/api/lists/create", { method: "POST", body }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/lists?");
    expect(response.headers.get("location")).toContain("error=invalid-name");
    expect(response.headers.get("location")).toContain("prefecture=");
    expect(response.headers.get("location")).toContain("hasRevenue=no");
  });

  test("list create and update routes report overlong purpose memos distinctly", async () => {
    clearSupabaseEnv();
    const createBody = new FormData();
    createBody.set("name", "用途メモが長すぎるリスト");
    createBody.set("description", "x".repeat(listDescriptionMaxLength + 1));
    createBody.set("scope", "all");

    const updateBody = new FormData();
    updateBody.set("id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    updateBody.set("name", "用途メモが長すぎる更新リスト");
    updateBody.set("description", "x".repeat(listDescriptionMaxLength + 1));
    updateBody.set("scope", "all");

    const createResponse = await createList(new Request("http://localhost/api/lists/create", { method: "POST", body: createBody }));
    const updateResponse = await updateList(new Request("http://localhost/api/lists/update", { method: "POST", body: updateBody }));

    expect(createResponse.status).toBe(303);
    expect(createResponse.headers.get("location")).toContain("error=invalid-description");
    expect(createResponse.headers.get("location")).toContain("scope=all");
    expect(updateResponse.status).toBe(303);
    expect(updateResponse.headers.get("location")).toContain("error=invalid-description");
    expect(updateResponse.headers.get("location")).toContain("listId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });

  test("list create and update routes reject criteria-less saves before generating all rows", async () => {
    clearSupabaseEnv();
    const createBody = new FormData();
    createBody.set("name", "名前だけのリスト");
    createBody.set("sort", "confidence_desc");

    const createResponse = await createList(new Request("http://localhost/api/lists/create", { method: "POST", body: createBody }));

    const excludedOnlyCreateBody = new FormData();
    excludedOnlyCreateBody.set("name", "excluded-only");
    excludedOnlyCreateBody.set("excludedCompanyIds", "22222222-2222-4222-8222-222222222222");

    const excludedOnlyCreateResponse = await createList(new Request("http://localhost/api/lists/create", { method: "POST", body: excludedOnlyCreateBody }));

    const updateBody = new FormData();
    updateBody.set("id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    updateBody.set("name", "名前だけの更新");
    updateBody.set("sort", "confidence_desc");

    const updateResponse = await updateList(new Request("http://localhost/api/lists/update", { method: "POST", body: updateBody }));

    const excludedOnlyUpdateBody = new FormData();
    excludedOnlyUpdateBody.set("id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    excludedOnlyUpdateBody.set("name", "excluded-only-update");
    excludedOnlyUpdateBody.set("excludedCompanyIds", "22222222-2222-4222-8222-222222222222");

    const excludedOnlyUpdateResponse = await updateList(new Request("http://localhost/api/lists/update", { method: "POST", body: excludedOnlyUpdateBody }));

    expect(createResponse.status).toBe(303);
    expect(createResponse.headers.get("location")).toContain("error=no-criteria");
    expect(createResponse.headers.get("location")).toContain("name=");
    expect(excludedOnlyCreateResponse.status).toBe(303);
    expect(excludedOnlyCreateResponse.headers.get("location")).toContain("error=no-criteria");
    expect(excludedOnlyCreateResponse.headers.get("location")).toContain("excludedCompanyIds=");
    expect(updateResponse.status).toBe(303);
    expect(updateResponse.headers.get("location")).toContain("error=no-criteria");
    expect(updateResponse.headers.get("location")).toContain("listId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(excludedOnlyUpdateResponse.status).toBe(303);
    expect(excludedOnlyUpdateResponse.headers.get("location")).toContain("error=no-criteria");
    expect(excludedOnlyUpdateResponse.headers.get("location")).toContain("listId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });

  test("list create and update routes preserve form state when persistence fails", async () => {
    const revalidate = vi.fn();
    const logError = vi.fn();
    const createBody = new FormData();
    createBody.set("name", "保存失敗後も戻れる新規リスト");
    createBody.set("description", "保存失敗時の復旧導線を確認する");
    createBody.set("scope", "all");
    createBody.set("sort", "confidence_desc");

    const updateBody = new FormData();
    updateBody.set("id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    updateBody.set("name", "保存失敗後も戻れる更新リスト");
    updateBody.set("description", "更新失敗時の復旧導線を確認する");
    updateBody.set("hasUrl", "yes");
    updateBody.set("minConfidence", "80");
    updateBody.set("excludedCompanyIds", "11111111-1111-4111-8111-111111111111");

    const createResponse = await createListRedirect(new Request("http://localhost/api/lists/create", { method: "POST", body: createBody }), {
      createSavedCompanyList: async () => {
        throw new Error("rpc down");
      },
      logError,
      revalidateAppPath: revalidate,
    });
    const updateResponse = await updateListRedirect(new Request("http://localhost/api/lists/update", { method: "POST", body: updateBody }), {
      updateSavedCompanyList: async () => {
        throw new Error("rpc down");
      },
      logError,
      revalidateAppPath: revalidate,
    });

    const createLocation = new URL(createResponse.headers.get("location")!);
    const updateLocation = new URL(updateResponse.headers.get("location")!);

    expect(createResponse.status).toBe(303);
    expect(createLocation.pathname).toBe("/lists");
    expect(createLocation.searchParams.get("error")).toBe("operation-failed");
    expect(createLocation.searchParams.get("name")).toBe("保存失敗後も戻れる新規リスト");
    expect(createLocation.searchParams.get("description")).toBe("保存失敗時の復旧導線を確認する");
    expect(createLocation.searchParams.get("scope")).toBe("all");
    expect(createLocation.searchParams.get("sort")).toBe("confidence_desc");
    expect(updateResponse.status).toBe(303);
    expect(updateLocation.pathname).toBe("/lists");
    expect(updateLocation.searchParams.get("error")).toBe("operation-failed");
    expect(updateLocation.searchParams.get("listId")).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(updateLocation.searchParams.get("name")).toBe("保存失敗後も戻れる更新リスト");
    expect(updateLocation.searchParams.get("description")).toBe("更新失敗時の復旧導線を確認する");
    expect(updateLocation.searchParams.get("hasUrl")).toBe("yes");
    expect(updateLocation.searchParams.get("minConfidence")).toBe("80");
    expect(updateLocation.searchParams.get("excludedCompanyIds")).toBe("11111111-1111-4111-8111-111111111111");
    expect(logError).toHaveBeenCalledWith("createListRedirect failed", expect.any(Error));
    expect(logError).toHaveBeenCalledWith("updateListRedirect failed", expect.any(Error));
    expect(revalidate).not.toHaveBeenCalled();
  });

  test("list update route stays in dry-run mode and preserves filters without Supabase", async () => {
    clearSupabaseEnv();
    const body = new FormData();
    body.set("id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    body.set("name", "高信頼URLあり営業リスト");
    body.set("hasUrl", "yes");
    body.set("minConfidence", "80");

    const response = await updateList(new Request("http://localhost/api/lists/update", { method: "POST", body }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("notice=dry-run-update");
    expect(response.headers.get("location")).toContain("listId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });

  test("list update and delete routes reject invalid ids", async () => {
    const updateBody = new FormData();
    updateBody.set("id", "------------------------------------");
    updateBody.set("name", "invalid");
    updateBody.set("hasUrl", "yes");
    const updateResponse = await updateList(new Request("http://localhost/api/lists/update", { method: "POST", body: updateBody }));

    const deleteBody = new FormData();
    deleteBody.set("id", "invalid");
    const deleteResponse = await deleteList(new Request("http://localhost/api/lists/delete", { method: "POST", body: deleteBody }));

    expect(updateResponse.status).toBe(303);
    expect(updateResponse.headers.get("location")).toContain("error=invalid-list-id");
    expect(updateResponse.headers.get("location")).toContain("hasUrl=yes");
    expect(deleteResponse.status).toBe(303);
    expect(deleteResponse.headers.get("location")).toContain("error=invalid-list-id");
  });

  test("list mutation routes recover from malformed form posts", async () => {
    const logError = vi.fn();
    const createSavedCompanyList = vi.fn();
    const updateSavedCompanyList = vi.fn();
    const deleteSavedCompanyList = vi.fn();
    const revalidateAppPath = vi.fn();
    const malformedRequest = (url: string) =>
      new Request(url, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "not multipart",
      });

    const createResponse = await createListRedirect(malformedRequest("http://localhost/api/lists/create"), {
      createSavedCompanyList,
      logError,
      revalidateAppPath,
    });
    const updateResponse = await updateListRedirect(malformedRequest("http://localhost/api/lists/update"), {
      updateSavedCompanyList,
      logError,
      revalidateAppPath,
    });
    const deleteResponse = await deleteListRedirect(malformedRequest("http://localhost/api/lists/delete"), {
      deleteSavedCompanyList,
      logError,
      revalidateAppPath,
    });

    const createLocation = new URL(createResponse.headers.get("location")!);
    const updateLocation = new URL(updateResponse.headers.get("location")!);
    const deleteLocation = new URL(deleteResponse.headers.get("location")!);

    expect(createResponse.status).toBe(303);
    expect(createLocation.pathname).toBe("/lists");
    expect(createLocation.searchParams.get("error")).toBe("operation-failed");
    expect(updateResponse.status).toBe(303);
    expect(updateLocation.pathname).toBe("/lists");
    expect(updateLocation.searchParams.get("error")).toBe("operation-failed");
    expect(deleteResponse.status).toBe(303);
    expect(deleteLocation.pathname).toBe("/lists");
    expect(deleteLocation.searchParams.get("error")).toBe("operation-failed");
    expect(deleteLocation.searchParams.get("action")).toBe("delete");
    expect(logError).toHaveBeenCalledWith("createListRedirect form parse failed", expect.any(Error));
    expect(logError).toHaveBeenCalledWith("updateListRedirect form parse failed", expect.any(Error));
    expect(logError).toHaveBeenCalledWith("deleteListRedirect form parse failed", expect.any(Error));
    expect(createSavedCompanyList).not.toHaveBeenCalled();
    expect(updateSavedCompanyList).not.toHaveBeenCalled();
    expect(deleteSavedCompanyList).not.toHaveBeenCalled();
    expect(revalidateAppPath).not.toHaveBeenCalled();
  });

  test("list delete route is safe in dry-run mode without Supabase", async () => {
    clearSupabaseEnv();
    const body = new FormData();
    body.set("id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

    const response = await deleteList(new Request("http://localhost/api/lists/delete", { method: "POST", body }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/lists?notice=dry-run-delete");
  });

  test("list delete route reports operation failures without revalidating deleted state", async () => {
    const revalidate = vi.fn();
    const logError = vi.fn();
    const body = new FormData();
    body.set("id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

    const response = await deleteListRedirect(new Request("http://localhost/api/lists/delete", { method: "POST", body }), {
      deleteSavedCompanyList: async () => {
        throw new Error("delete failed");
      },
      logError,
      revalidateAppPath: revalidate,
    });
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(303);
    expect(location.pathname).toBe("/lists");
    expect(location.searchParams.get("error")).toBe("operation-failed");
    expect(location.searchParams.get("action")).toBe("delete");
    expect(logError).toHaveBeenCalledWith("deleteListRedirect failed", expect.any(Error));
    expect(revalidate).not.toHaveBeenCalled();
  });

  test("list export and import preview API handlers are deterministic", async () => {
    clearSupabaseEnv();
    const missingListIdResponse = await exportList(new Request("http://localhost/api/lists/export"));
    const invalidListIdResponse = await exportList(new Request("http://localhost/api/lists/export?listId=------------------------------------"));
    const notFoundListResponse = await exportList(new Request("http://localhost/api/lists/export?listId=00000000-0000-4000-8000-000000000000"));
    const exportResponse = await exportList(new Request("http://localhost/api/lists/export?listId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"));
    const exportBytes = new Uint8Array(await exportResponse.arrayBuffer());
    const exportCsv = new TextDecoder().decode(exportBytes.slice(3));

    const importBody = new FormData();
    importBody.set("file", new File([fixture("csv/list-upload.csv")], "list-upload.csv", { type: "text/csv" }));
    const importResponse = await importListPreview(new Request("http://localhost/api/lists/import-preview", { method: "POST", body: importBody }));
    const importJson = await importResponse.json();
    const malformedImportResponse = await importListPreview(
      new Request("http://localhost/api/lists/import-preview", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "not multipart",
      }),
    );

    expect(missingListIdResponse.status).toBe(400);
    expect(invalidListIdResponse.status).toBe(400);
    await expect(invalidListIdResponse.text()).resolves.toContain("invalid");
    expect(notFoundListResponse.status).toBe(404);
    expect(exportResponse.status).toBe(200);
    expect([...exportBytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(decodeDispositionFileName(exportResponse.headers.get("content-disposition")!)).toBe(`${(await getSavedCompanyLists()).find((list) => list.id === "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")!.name}.csv`);
    expect(exportCsv).toContain("company_name");
    expect(importResponse.status).toBe(200);
    expect(importJson).toMatchObject({ rowCount: 4, invalidCorporateNumberCount: 0, invalidUrlCount: 1 });
    expect(importJson.rowIssues).toEqual(expect.arrayContaining([expect.objectContaining({ rowNumber: 4, issues: expect.arrayContaining(["URL不正", "法人番号重複"]) })]));
    expect(malformedImportResponse.status).toBe(400);
    await expect(malformedImportResponse.json()).resolves.toMatchObject({ error: "CSVファイルを選択してください。" });
  });

  test("CSV export API handlers log operation failures with stable 500 responses", async () => {
    const logError = vi.fn();
    const companiesError = new Error("companies export failed");
    const savedListError = new Error("saved list export failed");
    const comparisonError = new Error("comparison export failed");

    const companiesResponse = await companiesExportResponse("http://localhost/api/companies/export", {
      createCompaniesCsv,
      getExportRows: async () => {
        throw companiesError;
      },
      logError,
    });
    const savedListResponse = await savedListExportResponse("http://localhost/api/lists/export?listId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", {
      createCompaniesCsv,
      getSavedListExport: async () => {
        throw savedListError;
      },
      logError,
    });
    const comparisonResponse = await savedListComparisonExportResponse(
      "http://localhost/api/lists/compare-export?baseListId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa&targetListId=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      {
        createSavedListComparisonCsv,
        getSavedListComparisonExport: async () => {
          throw comparisonError;
        },
        logError,
      },
    );

    expect(companiesResponse.status).toBe(500);
    expect(savedListResponse.status).toBe(500);
    expect(comparisonResponse.status).toBe(500);
    await expect(companiesResponse.text()).resolves.toBe("CSV export failed");
    await expect(savedListResponse.text()).resolves.toBe("CSV export failed");
    await expect(comparisonResponse.text()).resolves.toBe("CSV export failed");
    expect(companiesResponse.headers.get("content-disposition")).toBeNull();
    expect(savedListResponse.headers.get("content-disposition")).toBeNull();
    expect(comparisonResponse.headers.get("content-disposition")).toBeNull();
    expect(logError).toHaveBeenCalledWith("companiesExportResponse failed", companiesError);
    expect(logError).toHaveBeenCalledWith("savedListExportResponse failed", savedListError);
    expect(logError).toHaveBeenCalledWith("savedListComparisonExportResponse failed", comparisonError);
  });

  test("list import preview accepts Shift_JIS CSV from spreadsheet workflows", async () => {
    const asciiPrefix = new TextEncoder().encode("corporate_number,company_name\n1234567890123,");
    const shiftJisNihon = new Uint8Array([0x93, 0xfa, 0x96, 0x7b]);
    const newline = new TextEncoder().encode("\n");
    const bytes = new Uint8Array(asciiPrefix.length + shiftJisNihon.length + newline.length);
    bytes.set(asciiPrefix, 0);
    bytes.set(shiftJisNihon, asciiPrefix.length);
    bytes.set(newline, asciiPrefix.length + shiftJisNihon.length);
    const body = new FormData();
    body.set("file", new File([bytes], "shift-jis.csv", { type: "text/csv" }));

    const response = await importListPreview(new Request("http://localhost/api/lists/import-preview", { method: "POST", body }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.previewRows[0].company_name).toBe("日本");
  });

  test("list import preview rejects missing files", async () => {
    const response = await importListPreview(new Request("http://localhost/api/lists/import-preview", { method: "POST", body: new FormData() }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("CSV") });
  });

  test("list import preview rejects files larger than the shared upload limit", async () => {
    const body = new FormData();
    body.set("file", new File([new Uint8Array(csvImportMaxBytes + 1)], "too-large.csv", { type: "text/csv" }));

    const response = await importListPreview(new Request("http://localhost/api/lists/import-preview", { method: "POST", body }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining(csvImportMaxSizeLabel) });
  });
});

describe("external API adapters with deterministic mocks", () => {
  test("gBizINFO client sends authenticated request and rejects missing token", async () => {
    delete process.env.GBIZINFO_API_TOKEN;
    await expect(fetchGBizInfoByCorporateNumber("1234567890123")).rejects.toThrow("GBIZINFO_API_TOKEN");

    process.env.GBIZINFO_API_TOKEN = "test-token";
    const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response(JSON.stringify({ data: [{ url: "https://example.test" }] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const raw = await fetchGBizInfoByCorporateNumber("1234567890123", { baseUrl: "https://gbiz.test/hojin" });

    expect(raw).toEqual({ data: [{ url: "https://example.test" }] });
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://gbiz.test/hojin/1234567890123");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ "X-hojinInfo-api-token": "test-token" });
  });

  test("EDINET list client formats date query and API key safely", async () => {
    process.env.EDINET_API_KEY = "edinet-key";
    process.env.EDINET_API_BASE_URL = "https://edinet.test/documents.json";
    const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response(
        JSON.stringify({
          results: [
            { docID: " S100TEST ", filerName: " Example Inc. ", corporateNumber: " 1234567890123 " },
            { docID: "" },
            { filerName: "missing doc id" },
            null,
          ],
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const docs = await listEdinetDocuments("2026-07-03");
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]));

    expect(docs).toEqual([{ docID: "S100TEST", filerName: "Example Inc.", corporateNumber: "1234567890123" }]);
    expect(requestedUrl.searchParams.get("date")).toBe("2026-07-03");
    expect(requestedUrl.searchParams.get("type")).toBe("2");
    expect(requestedUrl.searchParams.get("Subscription-Key")).toBe("edinet-key");

    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>maintenance</html>", { status: 200, headers: { "content-type": "text/html" } })));
    await expect(listEdinetDocuments("2026-07-03")).rejects.toThrow("EDINET documents response was not JSON");

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ StatusCode: 401, message: "Access denied due to invalid subscription key." })));
    await expect(listEdinetDocuments("2026-07-03")).rejects.toThrow("EDINET documents request failed: 401 Access denied");

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ statusCode: "503", message: "EDINET maintenance" })));
    await expect(listEdinetDocuments("2026-07-03")).rejects.toThrow("EDINET documents request failed: 503 EDINET maintenance");

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ results: { docID: "S100TEST" } })));
    await expect(listEdinetDocuments("2026-07-03")).rejects.toThrow("EDINET documents response results were not an array");
  });

  test("official URL discovery stays disabled without an injected search provider", async () => {
    const provider: SearchProvider = {
      name: "mock-search",
      search: vi.fn(async (query, limit) => [{ title: query, url: `https://example.test/${limit}` }]),
    };

    expect(createSearchProvider()).toBeNull();
    await expect(discoverOfficialUrlCandidates({ companyName: "Acme" })).resolves.toEqual([]);
    await expect(discoverOfficialUrlCandidates({ companyName: "Acme", prefecture: "Tokyo", city: "Chiyoda", provider })).resolves.toEqual([
      { title: expect.stringContaining("Acme"), url: "https://example.test/10" },
    ]);
  });
});

describe("coverage job planning", () => {
  test("coverage planner can run on gBizINFO and known official URLs while EDINET is unavailable", () => {
    const plans = buildCoverageJobPlans(mockCompanies);
    const byCompany = new Map<string, string[]>();
    for (const plan of plans) {
      byCompany.set(plan.company_id, [...(byCompany.get(plan.company_id) ?? []), plan.job_type]);
    }

    expect(byCompany.get("33333333-3333-4333-8333-333333333333")).toEqual(["enrich_gbizinfo"]);
    expect(byCompany.get("44444444-4444-4444-8444-444444444444")).toEqual(["enrich_gbizinfo", "crawl_official_site"]);
    expect(plans).not.toContainEqual(expect.objectContaining({ job_type: "enrich_edinet" }));
    expect(plans.every((plan) => plan.priority >= 35 && plan.priority <= 65)).toBe(true);
  });

  test("coverage planner schedules EDINET jobs only when EDINET is enabled", () => {
    const plans = buildCoverageJobPlans(mockCompanies, [], { edinetEnabled: true });
    const byCompany = new Map<string, string[]>();
    for (const plan of plans) {
      byCompany.set(plan.company_id, [...(byCompany.get(plan.company_id) ?? []), plan.job_type]);
    }

    expect(byCompany.get("33333333-3333-4333-8333-333333333333")).toEqual(["enrich_gbizinfo", "enrich_edinet"]);
    expect(byCompany.get("44444444-4444-4444-8444-444444444444")).toEqual(["enrich_gbizinfo", "enrich_edinet", "crawl_official_site"]);
  });

  test("coverage planner skips pending or running duplicate jobs", () => {
    const plans = buildCoverageJobPlans(mockCompanies, [
      { company_id: "33333333-3333-4333-8333-333333333333", job_type: "enrich_gbizinfo", status: "pending" },
      { company_id: "44444444-4444-4444-8444-444444444444", job_type: "crawl_official_site", status: "running" },
    ], { edinetEnabled: true });

    expect(plans).not.toContainEqual(expect.objectContaining({ company_id: "33333333-3333-4333-8333-333333333333", job_type: "enrich_gbizinfo" }));
    expect(plans).not.toContainEqual(expect.objectContaining({ company_id: "44444444-4444-4444-8444-444444444444", job_type: "crawl_official_site" }));
    expect(plans).toContainEqual(expect.objectContaining({ company_id: "44444444-4444-4444-8444-444444444444", job_type: "enrich_edinet" }));
  });

  test("coverage planner does not schedule public-data enrichment for invalid corporate numbers", () => {
    const plans = buildCoverageJobPlans([
      {
        id: "invalid-corporate-number",
        corporate_number: "ABC-123",
        official_url: null,
        industry: null,
        employee_count: null,
        annual_revenue: null,
        annual_revenue_type: null,
      },
      {
        id: "full-width-corporate-number",
        corporate_number: "１２３-４５６７８９０１２３",
        official_url: null,
        industry: null,
        employee_count: null,
        annual_revenue: null,
        annual_revenue_type: null,
      },
    ], [], { edinetEnabled: true });

    expect(plans).not.toContainEqual(expect.objectContaining({ company_id: "invalid-corporate-number" }));
    expect(plans).not.toContainEqual(expect.objectContaining({ company_id: "invalid-corporate-number", job_type: "enrich_gbizinfo" }));
    expect(plans).not.toContainEqual(expect.objectContaining({ company_id: "invalid-corporate-number", job_type: "enrich_edinet" }));
    expect(plans).toContainEqual(expect.objectContaining({ company_id: "full-width-corporate-number", job_type: "enrich_gbizinfo" }));
    expect(plans).toContainEqual(expect.objectContaining({ company_id: "full-width-corporate-number", job_type: "enrich_edinet" }));
  });

  test("coverage planner dry-run is safe without Supabase credentials", async () => {
    clearSupabaseEnv();
    const result = await queueCoverageJobs({ dryRun: true, limit: 4 });

    expect(result.dryRun).toBe(true);
    expect(result.inserted).toBe(0);
    expect(result.planned.length).toBeGreaterThan(0);
  });

  test("coverage planner queues through the DB-backed conflict-safe RPC", async () => {
    const supabase = createCoveragePlannerSupabase({
      companies: mockCompanies.slice(0, 4),
      jobs: [],
      inserted: 2,
    });

    const result = await queueCoverageJobs({ limit: 4, supabase, edinetEnabled: true });
    const queuedJobs = supabase.rpc.mock.calls[0][1].p_jobs;

    expect(result.dryRun).toBe(false);
    expect(result.planned.length).toBeGreaterThan(2);
    expect(result.inserted).toBe(2);
    expect(supabase.rpc).toHaveBeenCalledWith("queue_crawl_jobs", {
      p_jobs: expect.arrayContaining([
        expect.objectContaining({
          company_id: "33333333-3333-4333-8333-333333333333",
          job_type: "enrich_gbizinfo",
          priority: 35,
        }),
      ]),
    });
    expect(queuedJobs.every((job) => job.scheduled_at && !("status" in job))).toBe(true);
    expect(supabase.queryCalls).toContainEqual(expect.objectContaining({ table: "companies", limit: 4 }));
    expect(supabase.queryCalls).toContainEqual(expect.objectContaining({ table: "crawl_jobs", inFilter: { column: "status", values: ["pending", "running"] } }));
  });
});

describe("robots, crawling, and extraction helpers", () => {
  test("robots loader allows permitted paths and fails closed on network errors", async () => {
    const fetchMock = vi.fn(async () => new Response("User-agent: *\nDisallow: /blocked\nCrawl-delay: 1", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const policy = await loadRobotsPolicy("https://example.test/company", "TestBot");
    expect(policy.canFetch("https://example.test/company")).toBe(true);
    expect(policy.canFetch("https://example.test/blocked/page")).toBe(false);
    expect(policy.crawlDelayMs).toBe(1000);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    await expect(assertRobotsAllowed("https://example.test/company", "TestBot")).rejects.toThrow("robots.txt disallows");
  });

  test("robots loader fails closed on unsupported successful content types", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(new Uint8Array([137, 80, 78, 71]), { status: 200, headers: { "content-type": "image/png" } }))
      .mockResolvedValueOnce(new Response("<html>not robots</html>", { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(assertRobotsAllowed("https://example.test/company", "TestBot")).rejects.toThrow("robots.txt disallows");
    await expect(assertRobotsAllowed("https://example.test/company", "TestBot")).rejects.toThrow("robots.txt disallows");
  });

  test("official site crawler fetches only same-origin HTML when robots permits it", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nAllow: /", { status: 200 });
      return new Response("<html><head><title>Acme Profile</title></head><body><script>bad()</script><h1>Acme</h1><a href='/company/profile'>Company Profile</a></body></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const pages = await crawlOfficialSite("https://acme.test/", { maxDepth: 0, maxPages: 1, userAgent: "TestBot" });

    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({ url: "https://acme.test/", title: "Acme Profile", contentType: "text/html; charset=utf-8" });
    expect(pages[0].text).toContain("Acme");
    expect(pages[0].text).not.toContain("bad()");
  });

  test("official site crawler skips unsupported content and malformed PDFs without crashing", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nAllow: /", { status: 200 });
      if (url.endsWith("/broken.pdf")) return new Response("not a pdf", { status: 200, headers: { "content-type": "application/pdf" } });
      return new Response(new Uint8Array([137, 80, 78, 71]), { status: 200, headers: { "content-type": "image/png" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(crawlOfficialSite("https://acme.test/logo.png", { maxDepth: 0, maxPages: 1, userAgent: "TestBot" })).resolves.toEqual([]);
    await expect(crawlOfficialSite("https://acme.test/broken.pdf", { maxDepth: 0, maxPages: 1, userAgent: "TestBot" })).resolves.toEqual([]);
  });

  test("official site crawler skips oversized responses before parsing", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nAllow: /", { status: 200 });
      return new Response("<html><title>Too Large</title></html>", { status: 200, headers: { "content-length": "5000001", "content-type": "text/html; charset=utf-8" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(crawlOfficialSite("https://acme.test/large", { maxDepth: 0, maxPages: 1, userAgent: "TestBot" })).resolves.toEqual([]);
  });

  test("HTML helpers extract title, text, and profile-like same-origin links", () => {
    const html = "<html><head><title>Acme</title></head><body><style>.x{}</style><a href='/about'>about</a><a href='https://other.test/profile'>profile</a><p>Main text</p></body></html>";
    const links = discoverProfileLinks("https://acme.test/", html);

    expect(extractTitle(html)).toBe("Acme");
    expect(extractVisibleText(html)).toContain("Main text");
    expect(links).toEqual([{ url: "https://acme.test/about", label: "about" }]);
  });
});

describe("LLM prompts, scoring, and deterministic metrics", () => {
  test("LLM extraction refuses live calls without an API key and builds bounded prompts", async () => {
    delete process.env.OPENAI_API_KEY;
    expect(hasOpenAiConfig()).toBe(false);
    await expect(
      extractCompanyProfileWithLlm({
        companyName: "Acme",
        corporateNumber: "1234567890123",
        pageUrl: "https://acme.test/profile",
        pageTitle: "Profile",
        extractedText: "x".repeat(25_000),
      }),
    ).rejects.toThrow("OPENAI_API_KEY");

    const prompt = buildExtractionPrompt({
      companyName: "Acme",
      corporateNumber: null,
      pageUrl: "https://acme.test/profile",
      pageTitle: null,
      extractedText: "x".repeat(25_000),
    });

    expect(prompt).toContain("company_name: Acme");
    expect(prompt).toContain("annual_revenue.type must be estimated");
    expect(prompt.length).toBeLessThan(25_000);
    expect(extractionJsonSchema.required).toContain("annual_revenue");
  });

  test("LLM extraction output parser rejects malformed JSON and schema drift clearly", () => {
    const validOutput = JSON.stringify({
      is_official_company_page: true,
      company_name_match_score: 95,
      industry: { value: "製造業", confidence: 90, evidence: "精密機器を製造" },
      employee_count: { value: 120, type: "standalone", is_approximate: false, period: "2026", confidence: 80, evidence: "従業員120名" },
      annual_revenue: { value_jpy: null, type: "unknown", is_approximate: false, period: null, confidence: 0, evidence: null },
      notes: ["official profile"],
    });

    expect(parseLlmExtractionOutput(validOutput)).toMatchObject({
      is_official_company_page: true,
      industry: { value: "製造業" },
      employee_count: { value: 120, type: "standalone" },
      annual_revenue: { value_jpy: null, type: "unknown" },
    });
    expect(() => parseLlmExtractionOutput("<html>maintenance</html>")).toThrow("LLM extraction response was not JSON");
    expect(() =>
      parseLlmExtractionOutput(
        JSON.stringify({
          is_official_company_page: true,
          company_name_match_score: 120,
          industry: { value: "製造業", confidence: 90, evidence: "精密機器を製造" },
          employee_count: { value: 120, type: "standalone", is_approximate: false, period: "2026", confidence: 80, evidence: "従業員120名" },
          annual_revenue: { value_jpy: null, type: "unknown", is_approximate: false, period: null, confidence: 0, evidence: null },
          notes: [],
        }),
      ),
    ).toThrow("LLM extraction response did not match schema");
  });

  test("confidence scoring clamps values and classifies observation source kinds", () => {
    expect(confidenceForSource("edinet", "pdf_rule")).toBe(100);
    expect(confidenceForSource("third_party", "manual", 150)).toBe(100);
    expect(clampScore(-20)).toBe(0);
    expect(observationKind("official_site", "html_rule")).toBe("official");
    expect(observationKind("gbizinfo", "api")).toBe("reported");
    expect(observationKind("llm_extraction", "llm")).toBe("estimated");
  });

  test("crawler score and current implementation evaluation are reproducible", () => {
    const score = evaluateCrawlerScore({
      totalCompanies: 10,
      targetPopulation: 20,
      urlIdentified: 5,
      industryKnown: 6,
      employeeKnown: 4,
      revenueKnown: 3,
      observationsWithSources: 20,
      observationsTotal: 40,
      compliancePassed: true,
      jobReliability: 0.8,
    });
    const evaluation = evaluateCurrentImplementation({
      totalCompanies: 10,
      withUrl: 5,
      withIndustry: 6,
      withEmployeeCount: 4,
      withAnnualRevenue: 3,
      officialRatio: 40,
      estimatedRatio: 10,
      runningJobs: 1,
      errorJobs: 0,
      freshnessDays: 2,
    });

    expect(score).toBe(55);
    expect(
      evaluateCrawlerScore({
        totalCompanies: 1,
        targetPopulation: 1,
        urlIdentified: 1,
        industryKnown: 1,
        employeeKnown: 1,
        revenueKnown: 1,
        observationsWithSources: 4,
        observationsTotal: 4,
        compliancePassed: true,
        jobReliability: 1,
      }),
    ).toBe(100);
    expect(evaluation.score).toBeGreaterThan(0);
    expect(evaluation.nextActions.length).toBeGreaterThan(0);

    const report = buildEvaluationReport(
      {
        totalCompanies: 4,
        withUrl: 3,
        withIndustry: 4,
        withEmployeeCount: 3,
        withAnnualRevenue: 2,
        officialRatio: 75,
        estimatedRatio: 25,
        runningJobs: 1,
        errorJobs: 1,
        freshnessDays: 0,
      },
      { dataMode: "mock" },
    );
    expect(report).toMatchObject({ dataMode: "mock", scoreScope: "sample_data" });
    expect(report.releaseReady).toBe(false);
    expect(report.verification.stagingSmoke).toMatchObject({ required: false, status: "not_required", passedAt: null });
    expect(report.operationalRisks).toEqual(expect.arrayContaining([expect.stringContaining("Supabase未設定"), expect.stringContaining("failedジョブ")]));
  });

  test("evaluation report treats staging smoke evidence as a release gate for Supabase mode", () => {
    const metrics = {
      totalCompanies: 1,
      withUrl: 1,
      withIndustry: 1,
      withEmployeeCount: 1,
      withAnnualRevenue: 1,
      officialRatio: 100,
      estimatedRatio: 0,
      runningJobs: 0,
      errorJobs: 0,
      freshnessDays: 0,
    };

    const missingSmoke = buildEvaluationReport(metrics, { dataMode: "supabase" });
    expect(missingSmoke.releaseReady).toBe(false);
    expect(missingSmoke.verification.stagingSmoke).toMatchObject({ required: true, status: "missing", passedAt: null });
    expect(missingSmoke.releaseGateFailures).toEqual(expect.arrayContaining([expect.stringContaining("ステージングスモーク成功証跡")]));
    expect(missingSmoke.nextActions[0]).toContain("npm run smoke:staging");

    const staleSmoke = buildEvaluationReport(metrics, {
      dataMode: "supabase",
      stagingSmokePassedAt: "2026-07-05T00:00:00.000Z",
      stagingSmokeCommitSha: "old-sha",
      expectedCommitSha: "new-sha",
    });
    expect(staleSmoke.releaseReady).toBe(false);
    expect(staleSmoke.verification.stagingSmoke).toMatchObject({
      required: true,
      status: "stale",
      passedAt: "2026-07-05T00:00:00.000Z",
      commitSha: "old-sha",
      expectedCommitSha: "new-sha",
    });
    expect(staleSmoke.releaseGateFailures).toEqual(expect.arrayContaining([expect.stringContaining("現在のコミット")]));

    const verified = buildEvaluationReport(metrics, { dataMode: "supabase", stagingSmokePassedAt: "2026-07-05T00:00:00.000Z" });
    expect(verified.releaseReady).toBe(true);
    expect(verified.verification.stagingSmoke).toMatchObject({
      required: true,
      status: "passed",
      passedAt: "2026-07-05T00:00:00.000Z",
    });
    expect(verified.releaseGateFailures).toHaveLength(0);

    const verifiedForCurrentCommit = buildEvaluationReport(metrics, {
      dataMode: "supabase",
      stagingSmokePassedAt: "2026-07-05T00:00:00.000Z",
      stagingSmokeCommitSha: "same-sha",
      expectedCommitSha: "same-sha",
    });
    expect(verifiedForCurrentCommit.releaseReady).toBe(true);
    expect(verifiedForCurrentCommit.verification.stagingSmoke).toMatchObject({ status: "passed", commitSha: "same-sha", expectedCommitSha: "same-sha" });

    const annualRevenueOnlyRisk = buildEvaluationReport(
      {
        ...metrics,
        withAnnualRevenue: 0,
      },
      { dataMode: "supabase", stagingSmokePassedAt: "2026-07-05T00:00:00.000Z" },
    );
    expect(annualRevenueOnlyRisk.releaseReady).toBe(false);
    expect(annualRevenueOnlyRisk.operationalRisks).toEqual(expect.arrayContaining([expect.stringContaining("年商は非上場企業")]));
    expect(annualRevenueOnlyRisk.releaseGateFailures).toHaveLength(0);
  });

  test("normalization helpers cover empty, malformed, and boundary values", () => {
    expect(normalizeCorporateNumber("12-34567890123")).toBe("1234567890123");
    expect(normalizeCorporateNumber("１２３-４５６７８９０１２３")).toBe("1234567890123");
    expect(normalizeCorporateNumber("123")).toBeNull();
    expect(normalizeUrl("example.test/path?utm=1#top")).toBe("https://example.test/path");
    expect(normalizeUrl(" HTTP://EXAMPLE.TEST/path?utm=1#top ")).toBe("http://example.test/path");
    expect(normalizeUrl("ｗｗｗ．ｅｘａｍｐｌｅ．ｊｐ/company/")).toBe("https://www.example.jp/company");
    expect(employeeRange(null)).toBeNull();
    expect(employeeRange(0)).toBeNull();
    expect(employeeRange(9)).toContain("1-9");
    expect(computeCoverageScore({ officialUrl: "https://example.test", industry: "IT", employeeCount: 10, annualRevenue: 1000 })).toBe(100);
  });

  test("official revenue filters keep null revenue types aligned across mock and Supabase paths", () => {
    expect(isOfficialRevenueType(null)).toBe(true);
    expect(isOfficialRevenueType("sales")).toBe(true);
    expect(isOfficialRevenueType("estimated")).toBe(false);
    expect(isOfficialRevenueType("unknown")).toBe(false);
    expect(officialRevenueTypeSupabaseFilter).toContain("annual_revenue_type.is.null");
    expect(officialRevenueTypeSupabaseFilter).toContain("annual_revenue_type.not.in.(estimated,unknown)");
    expect(formatPostgrestInList(["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"])).toBe(
      '("11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222")',
    );
  });

  test("format helpers handle nulls and small numeric values", () => {
    expect(formatNumber(null)).toBe("-");
    expect(formatNumber(1200)).toBe("1,200");
    expect(formatPercent(null)).toBe("-");
    expect(formatPercent(75)).toBe("75%");
    expect(formatRevenue(null)).toBe("-");
    expect(formatRevenue(5000)).toContain("5,000");
  });

  test("selected value mapping has safe unknown defaults", () => {
    const update = buildCompanySelectedValueUpdate({});

    expect(update).toMatchObject({
      official_url: null,
      industry: null,
      employee_count: null,
      employee_count_type: "unknown",
      annual_revenue: null,
      annual_revenue_type: "unknown",
      data_confidence_score: 0,
      coverage_score: 0,
    });
  });
});

function fixture(relativePath: string) {
  return readFileSync(path.join(fixtureRoot, relativePath), "utf8");
}

function decodeDispositionFileName(disposition: string) {
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/)?.[1];
  expect(encoded).toBeTruthy();
  return decodeURIComponent(encoded!);
}

function createZipFixture(fileName: string, text: string, compressionMethod: 0 | 8 = 8) {
  const fileNameBuffer = Buffer.from(fileName, "utf8");
  const raw = Buffer.from(text, "utf8");
  const compressed = compressionMethod === 8 ? deflateRawSync(raw) : raw;
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(compressionMethod, 8);
  localHeader.writeUInt32LE(compressed.length, 18);
  localHeader.writeUInt32LE(raw.length, 22);
  localHeader.writeUInt16LE(fileNameBuffer.length, 26);

  const centralDirectory = Buffer.alloc(46);
  centralDirectory.writeUInt32LE(0x02014b50, 0);
  centralDirectory.writeUInt16LE(20, 4);
  centralDirectory.writeUInt16LE(20, 6);
  centralDirectory.writeUInt16LE(compressionMethod, 10);
  centralDirectory.writeUInt32LE(compressed.length, 20);
  centralDirectory.writeUInt32LE(raw.length, 24);
  centralDirectory.writeUInt16LE(fileNameBuffer.length, 28);

  const centralDirectoryOffset = localHeader.length + fileNameBuffer.length + compressed.length;
  const centralDirectorySize = centralDirectory.length + fileNameBuffer.length;
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(1, 8);
  endOfCentralDirectory.writeUInt16LE(1, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectorySize, 12);
  endOfCentralDirectory.writeUInt32LE(centralDirectoryOffset, 16);

  return Buffer.concat([localHeader, fileNameBuffer, compressed, centralDirectory, fileNameBuffer, endOfCentralDirectory]);
}

function clearSupabaseEnv() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function fixedRunnerDate() {
  return new Date("2026-07-03T00:00:00.000Z");
}

function runnerJob(
  overrides: Partial<CrawlJob> & { companies?: { corporate_number?: string; official_url?: string; name?: string; prefecture?: string | null; city?: string | null } } = {},
) {
  return {
    id: "job-1",
    company_id: "company-1",
    job_type: "enrich_gbizinfo",
    status: "pending",
    priority: 10,
    attempts: 0,
    error_message: null,
    scheduled_at: null,
    started_at: null,
    finished_at: null,
    created_at: "2026-07-03T00:00:00.000Z",
    companies: { corporate_number: "1234567890123", official_url: "https://example.test", name: "Example株式会社", prefecture: "東京都", city: "千代田区" },
    ...overrides,
  } satisfies CrawlJob & { companies?: { corporate_number?: string; official_url?: string; name?: string; prefecture?: string | null; city?: string | null } };
}

function createCoveragePlannerSupabase({
  companies,
  jobs,
  inserted,
}: {
  companies: unknown[];
  jobs: unknown[];
  inserted: number;
}) {
  type PlannerResponse = { data: unknown[] | null; error: Error | null };
  type Fulfilled<TResult> = ((value: PlannerResponse) => TResult | PromiseLike<TResult>) | null | undefined;
  type Rejected<TResult> = ((reason: unknown) => TResult | PromiseLike<TResult>) | null | undefined;
  type QueuedJob = { company_id: string; job_type: string; priority: number; scheduled_at: string };
  const queryCalls: { table: string; columns: string; limit?: number; inFilter?: { column: string; values: string[] } }[] = [];
  const rpc = vi.fn(async (fn: "queue_crawl_jobs", args: { p_jobs: QueuedJob[] }) => {
    expect(fn).toBe("queue_crawl_jobs");
    expect(Array.isArray(args.p_jobs)).toBe(true);
    return { data: inserted, error: null };
  });

  return {
    queryCalls,
    rpc,
    from(table: string) {
      return {
        select(columns: string) {
          const call: (typeof queryCalls)[number] = { table, columns };
          queryCalls.push(call);
          const result: PlannerResponse = { data: table === "companies" ? companies : jobs, error: null };
          const query = {
            limit(count: number) {
              call.limit = count;
              return query;
            },
            in(column: string, values: string[]) {
              call.inFilter = { column, values };
              return query;
            },
            then<TResult1 = PlannerResponse, TResult2 = never>(onfulfilled?: Fulfilled<TResult1>, onrejected?: Rejected<TResult2>) {
              return Promise.resolve(result).then(onfulfilled, onrejected);
            },
          };
          return query;
        },
      };
    },
  };
}

function createRunnerSupabase(job: ReturnType<typeof runnerJob> | null, options: { claimMatches?: boolean } = {}) {
  type RunnerClient = NonNullable<JobRunnerDependencies["supabase"]>;
  const updates: { id: string; values: Record<string, unknown> }[] = [];
  const logs: Record<string, unknown>[] = [];
  const filters: string[] = [];
  const claimMatches = options.claimMatches ?? true;

  const client: RunnerClient = {
    from(table: string) {
      const query = {
        eq: () => query,
        or: (filter: string) => {
          filters.push(filter);
          return query;
        },
        order: () => query,
        limit: () => query,
        maybeSingle: async () => ({ data: table === "crawl_jobs" ? job : null, error: null }),
      };

      return {
        select: () => query,
        update: (values: Record<string, unknown>) => {
          const state: { id?: string; status?: string } = {};
          const mutation = {
            eq: (column: string, value: string) => {
              if (column === "id") state.id = value;
              if (column === "status") state.status = value;
              return mutation;
            },
            select: () => ({
              maybeSingle: async () => {
                if (state.status && (!claimMatches || job?.status !== state.status)) return { data: null, error: null };
                const id = state.id ?? "job";
                updates.push({ id, values });
                return { data: { id }, error: null };
              },
            }),
          };
          return mutation;
        },
        insert: async (values: Record<string, unknown>) => {
          logs.push(values);
          return { error: null };
        },
      };
    },
  };

  return { client, updates, logs, filters };
}

function createJobMutationClient(hasMatch: boolean) {
  const state: { table?: string; values?: Record<string, unknown>; id?: string; statuses?: string[]; select?: string } = {};
  const client: Parameters<typeof markJobForRetry>[0] = {
    from(table) {
      state.table = table;
      return {
        update(values) {
          state.values = values;
          return {
            eq(_column, id) {
              state.id = id;
              return {
                in(_column, statuses) {
                  state.statuses = [...statuses];
                  return {
                    select(columns) {
                      state.select = columns;
                      return {
                        maybeSingle: async () => ({ data: hasMatch ? { id: state.id ?? "job" } : null, error: null }),
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  return { client, state };
}

function observation(
  id: string,
  confidence: number,
  createdAt: string,
  fieldName: CompanyObservation["field_name"] = "industry",
  observedValue = "A",
  normalizedValue = "A",
  sourceType: CompanyObservation["source_type"] = "official",
): CompanyObservation {
  return {
    id,
    company_id: "company",
    field_name: fieldName,
    observed_value: observedValue,
    normalized_value: normalizedValue,
    source_id: "source",
    source_type: sourceType,
    confidence_score: confidence,
    extraction_method: sourceType === "estimated" ? "llm" : "api",
    is_selected: false,
    created_at: createdAt,
  };
}
