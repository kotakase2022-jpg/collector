import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parse as parseCsv } from "csv-parse/sync";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GET as exportCompanies } from "@/app/api/companies/export/route";
import { POST as manualReviewCompany } from "@/app/api/companies/manual-review/route";
import { POST as recrawlCompany } from "@/app/api/companies/recrawl/route";
import { POST as createList } from "@/app/api/lists/create/route";
import { POST as deleteList } from "@/app/api/lists/delete/route";
import { GET as exportList } from "@/app/api/lists/export/route";
import { POST as importListPreview } from "@/app/api/lists/import-preview/route";
import { POST as updateList } from "@/app/api/lists/update/route";
import { POST as updatePriority } from "@/app/api/jobs/priority/route";
import { POST as planCoverageJobs } from "@/app/api/jobs/plan-coverage/route";
import { POST as retryJob } from "@/app/api/jobs/retry/route";
import { POST as runNextJob, runNextJobRedirect } from "@/app/api/jobs/run-next/route";
import { POST as stopJob } from "@/app/api/jobs/stop/route";
import { createCompaniesCsv } from "@/lib/csv";
import { exportRowLimit, getCompanies, getCompanyDetail, getDashboardMetrics, getExportRows, getJobs, normalizeCompanySearchTerm } from "@/lib/data";
import { matchCompanyIdentity } from "@/lib/etl/dedupe";
import { extractEdinetFactsFromXbrl, listEdinetDocuments } from "@/lib/etl/edinet";
import { extractGBizProfile, fetchGBizInfoByCorporateNumber } from "@/lib/etl/gbizinfo";
import { discoverProfileLinks, extractTitle, extractVisibleText, ruleBasedExtractCompanyProfile } from "@/lib/etl/html-extract";
import { buildCoverageJobPlans, queueCoverageJobs } from "@/lib/etl/job-planner";
import { runNextCrawlJob, type JobRunnerDependencies } from "@/lib/etl/job-runner";
import { buildExtractionPrompt, extractCompanyProfileWithLlm, extractionJsonSchema, hasOpenAiConfig } from "@/lib/etl/llm";
import { parseNtaCsv } from "@/lib/etl/nta";
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
import { buildCompanySelectedValueUpdate } from "@/lib/etl/store";
import { formatCompanyFilterBadges } from "@/lib/filter-labels";
import { sanitizeDownloadFileName } from "@/lib/file-name";
import { formatDate, formatNumber, formatPercent, formatRevenue } from "@/lib/format";
import { filterJobs, parseJobFilters } from "@/lib/job-filters";
import { buildListDisplayRows, generatedListDisplayLimit, savedListDisplayLimit } from "@/lib/list-display";
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
  buildSavedCompanyListRpcItems,
  createSavedCompanyList,
  deleteSavedCompanyList,
  getSavedCompanyListDetail,
  getSavedCompanyLists,
  getSavedListExportRows,
  saveCompanyListWithRpc,
  updateSavedCompanyList,
} from "@/lib/lists";
import { mockCompanies } from "@/lib/mock/data";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import {
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
} from "@/lib/validation";
import type { CompanyObservation, CrawlJob } from "@/lib/types";

const fixtureRoot = path.join(process.cwd(), "tests", "fixtures");
const managedEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "SEARCH_API_ENDPOINT",
  "SEARCH_API_KEY",
  "GBIZINFO_API_TOKEN",
  "GBIZINFO_API_BASE_URL",
  "EDINET_API_KEY",
  "EDINET_API_BASE_URL",
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
    expect(
      parseCompanyFilters({
        q: " 青葉 ",
        hasUrl: "yes",
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

  test("CSVアップロードプレビューは欠損・重複・URL不正を検出する", () => {
    const preview = parseCompanyCsvImportPreview(fixture("csv/list-upload.csv"));
    const readiness = buildCsvImportReadiness(preview);
    const okReadiness = buildCsvImportReadiness(parseCompanyCsvImportPreview("corporate_number,company_name,official_url,industry\n1234567890123,Acme,https://example.com,IT\n"));
    const emptyReadiness = buildCsvImportReadiness(parseCompanyCsvImportPreview("corporate_number,company_name\n"));

    expect(preview.rowCount).toBe(4);
    expect(preview.missingRequiredColumns).toEqual([]);
    expect(preview.validRows).toBe(1);
    expect(preview.missingRequiredCount).toBe(1);
    expect(preview.duplicateKeys).toEqual(["2234567890123"]);
    expect(preview.invalidUrlCount).toBe(1);
    expect(preview.previewRows[0]).toMatchObject({ company_name: "東都精密工業株式会社" });
    expect(readiness).toMatchObject({ label: "修正が必要", tone: "warning", nextAction: expect.stringContaining("corporate_number") });
    expect(readiness.issues).toEqual(expect.arrayContaining(["必須欠損 1行", "法人番号重複 1件", "URL不正 1行"]));
    expect(okReadiness).toMatchObject({ label: "取込確認OK", tone: "good", issues: [] });
    expect(emptyReadiness).toMatchObject({ label: "対象行なし", tone: "danger" });
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
        corporate_number: "1234567890123",
        official_url: "https://example.com",
        annual_revenue: 1_000_000_000,
        annual_revenue_type: "sales",
        employee_count: 120,
        data_confidence_score: 90,
      }),
    ).toEqual([]);

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
        hasRevenue: "no",
        valueKind: "official",
        minConfidence: 80,
        sort: "employee_desc",
        excludedCompanyIds: ["22222222-2222-4222-8222-222222222222"],
      }),
    ).toEqual(["検索: 物流", "都道府県: 大阪府", "URLあり", "年商なし", "公式/報告値", "信頼度80以上", "並び替え: 従業員数が多い順", "手動除外: 1件"]);
  });

  test("リスト画面表示は保存・CSV対象件数と分離して大量描画を抑制する", () => {
    const rows = Array.from({ length: savedListDisplayLimit + 5 }, (_, index) => ({ id: String(index) }));
    const savedDisplay = buildListDisplayRows(rows, savedListDisplayLimit);
    const generatedDisplay = buildListDisplayRows(rows, generatedListDisplayLimit);

    expect(savedDisplay).toMatchObject({ totalCount: savedListDisplayLimit + 5, hiddenCount: 5, isTruncated: true });
    expect(savedDisplay.visibleRows).toHaveLength(savedListDisplayLimit);
    expect(generatedDisplay.visibleRows).toHaveLength(generatedListDisplayLimit);
    expect(buildListDisplayRows(rows, rows.length).isTruncated).toBe(false);
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

  test("EDINET XBRL風データから年商と従業員数を抽出できる", () => {
    const xbrl = "<xbrl><NetSales>50億円</NetSales><NumberOfEmployees>1,250</NumberOfEmployees></xbrl>";
    const facts = extractEdinetFactsFromXbrl(xbrl);
    expect(facts.annualRevenue?.normalized).toBe(5_000_000_000);
    expect(facts.employeeCount?.normalized).toBe(1250);
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
        source_urls: "https://example.com/profile",
        updated_at: "2026-07-03T00:00:00Z",
      },
    ]);
    const rows = parseCsv(csv, { bom: true, columns: true }) as Record<string, string>[];
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("corporate_number,company_name,official_url,industry");
    expect(rows[0].company_name).toBe("'=HYPERLINK(\"https://evil.example\")");
  });

  test("CSVダウンロード名は日本語を保ちつつ危険なファイル名文字を除去する", () => {
    expect(sanitizeDownloadFileName(" 高信頼URLあり営業リスト.csv ")).toBe("高信頼URLあり営業リスト.csv");
    expect(sanitizeDownloadFileName("営業/調査:大阪*物流?.csv")).toBe("営業-調査-大阪-物流-.csv");
    expect(sanitizeDownloadFileName(" \u0000 / ")).toBe("download.csv");
    expect(sanitizeDownloadFileName("x".repeat(220))).toHaveLength(180);
    const longCsvName = sanitizeDownloadFileName(`${"営業リスト".repeat(80)}.csv`);
    expect(longCsvName).toHaveLength(180);
    expect(longCsvName.endsWith(".csv")).toBe(true);
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
    const withoutRevenue = await getCompanies({ hasRevenue: "no" });
    const employeeRangeRows = await getCompanies({ employeeRange: "50-299名" });
    const revenueRangeRows = await getCompanies({ revenueRange: "1億-10億円" });
    const officialRevenueRows = await getCompanies({ valueKind: "official" });
    const withoutEmployeeRows = await getCompanies({ hasEmployeeCount: "no" });
    const highConfidenceRows = await getCompanies({ minConfidence: 80 });
    const keywordRows = await getCompanies({ q: "3234567890123" });
    const urlKeywordRows = await getCompanies({ q: "kitahama-logi" });
    const uppercaseUrlKeywordRows = await getCompanies({ q: "KITAHAMA-LOGI" });
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
    expect(allCompanies.some((company) => company.source_types?.length)).toBe(true);
    expect(withUrl.every((company) => Boolean(company.official_url))).toBe(true);
    expect(withoutRevenue.every((company) => company.annual_revenue == null)).toBe(true);
    expect(employeeRangeRows.every((company) => company.employee_count != null && company.employee_count >= 50 && company.employee_count < 300)).toBe(true);
    expect(revenueRangeRows.every((company) => company.revenue_range === "1億-10億円")).toBe(true);
    expect(officialRevenueRows).toHaveLength(1);
    expect(officialRevenueRows[0].annual_revenue_type).toBe("sales");
    expect(withoutEmployeeRows.every((company) => company.employee_count == null)).toBe(true);
    expect(highConfidenceRows.every((company) => company.data_confidence_score >= 80)).toBe(true);
    expect(keywordRows).toHaveLength(1);
    expect(keywordRows[0]).toMatchObject({ name: "青葉食品株式会社", corporate_number: "3234567890123" });
    expect(urlKeywordRows).toHaveLength(1);
    expect(urlKeywordRows[0]).toMatchObject({ name: "北浜物流合同会社", official_url: "https://example.jp/kitahama-logi" });
    expect(uppercaseUrlKeywordRows).toHaveLength(1);
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
    expect(savedListDetail?.quality.total).toBe(savedListDetail?.companies.length);
    expect(savedListExportRows?.[0]).toHaveProperty("company_name");
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
        companies: { corporate_number: "1234567890123" },
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

  test("job runner marks unsupported jobs as failed with crawl logs", async () => {
    const supabase = createRunnerSupabase(runnerJob({ job_type: "verify_data" }));

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

  test("job priority route accepts valid dry-run updates without touching production data", async () => {
    clearSupabaseEnv();
    const body = new FormData();
    body.set("id", "aaaaaaaa-0000-4000-8000-000000000001");
    body.set("priority", "42");

    const response = await updatePriority(new Request("http://localhost/api/jobs/priority", { method: "POST", body }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("notice=dry-run");
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

  test("run-next route stays in dry-run mode without Supabase", async () => {
    clearSupabaseEnv();

    const response = await runNextJob(new Request("http://localhost/api/jobs/run-next", { method: "POST" }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("notice=dry-run-run");
  });

  test("run-next route reports completed, failed, empty, and operation failures", async () => {
    const revalidate = vi.fn();
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

  test("list delete route is safe in dry-run mode without Supabase", async () => {
    clearSupabaseEnv();
    const body = new FormData();
    body.set("id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

    const response = await deleteList(new Request("http://localhost/api/lists/delete", { method: "POST", body }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/lists?notice=dry-run-delete");
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

    expect(missingListIdResponse.status).toBe(400);
    expect(invalidListIdResponse.status).toBe(400);
    await expect(invalidListIdResponse.text()).resolves.toContain("invalid");
    expect(notFoundListResponse.status).toBe(404);
    expect(exportResponse.status).toBe(200);
    expect([...exportBytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(exportCsv).toContain("company_name");
    expect(importResponse.status).toBe(200);
    expect(importJson).toMatchObject({ rowCount: 4, invalidUrlCount: 1 });
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
      return new Response(JSON.stringify({ results: [{ docID: "S100TEST" }] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const docs = await listEdinetDocuments("2026-07-03");
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]));

    expect(docs).toEqual([{ docID: "S100TEST" }]);
    expect(requestedUrl.searchParams.get("date")).toBe("2026-07-03");
    expect(requestedUrl.searchParams.get("type")).toBe("2");
    expect(requestedUrl.searchParams.get("Subscription-Key")).toBe("edinet-key");
  });

  test("search provider can be swapped and HTTP failures are isolated", async () => {
    const provider: SearchProvider = {
      name: "mock-search",
      search: vi.fn(async (query, limit) => [{ title: query, url: `https://example.test/${limit}` }]),
    };

    await expect(discoverOfficialUrlCandidates({ companyName: "Acme", prefecture: "Tokyo", city: "Chiyoda", provider })).resolves.toEqual([
      { title: expect.stringContaining("Acme"), url: "https://example.test/10" },
    ]);

    process.env.SEARCH_API_ENDPOINT = "https://search.test/api";
    process.env.SEARCH_API_KEY = "search-key";
    const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response(JSON.stringify({ results: [{ title: "Acme", url: "https://acme.test" }] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const httpProvider = createSearchProvider();
    const results = await httpProvider?.search("Acme profile", 3);
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]));

    expect(results).toEqual([{ title: "Acme", url: "https://acme.test" }]);
    expect(requestedUrl.searchParams.get("q")).toBe("Acme profile");
    expect(requestedUrl.searchParams.get("limit")).toBe("3");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer search-key" });
  });
});

describe("coverage job planning", () => {
  test("coverage planner schedules missing official URL, employee, revenue, and estimated revenue follow-ups", () => {
    const plans = buildCoverageJobPlans(mockCompanies);
    const byCompany = new Map<string, string[]>();
    for (const plan of plans) {
      byCompany.set(plan.company_id, [...(byCompany.get(plan.company_id) ?? []), plan.job_type]);
    }

    expect(byCompany.get("33333333-3333-4333-8333-333333333333")).toEqual(["enrich_gbizinfo", "enrich_edinet", "discover_official_url"]);
    expect(byCompany.get("44444444-4444-4444-8444-444444444444")).toEqual(["enrich_gbizinfo", "enrich_edinet", "crawl_official_site"]);
    expect(plans.every((plan) => plan.priority >= 35 && plan.priority <= 65)).toBe(true);
  });

  test("coverage planner skips pending or running duplicate jobs", () => {
    const plans = buildCoverageJobPlans(mockCompanies, [
      { company_id: "33333333-3333-4333-8333-333333333333", job_type: "discover_official_url", status: "pending" },
      { company_id: "44444444-4444-4444-8444-444444444444", job_type: "crawl_official_site", status: "running" },
    ]);

    expect(plans).not.toContainEqual(expect.objectContaining({ company_id: "33333333-3333-4333-8333-333333333333", job_type: "discover_official_url" }));
    expect(plans).not.toContainEqual(expect.objectContaining({ company_id: "44444444-4444-4444-8444-444444444444", job_type: "crawl_official_site" }));
    expect(plans).toContainEqual(expect.objectContaining({ company_id: "44444444-4444-4444-8444-444444444444", job_type: "enrich_edinet" }));
  });

  test("coverage planner dry-run is safe without Supabase credentials", async () => {
    clearSupabaseEnv();
    const result = await queueCoverageJobs({ dryRun: true, limit: 4 });

    expect(result.dryRun).toBe(true);
    expect(result.inserted).toBe(0);
    expect(result.planned.length).toBeGreaterThan(0);
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

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
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
  });

  test("normalization helpers cover empty, malformed, and boundary values", () => {
    expect(normalizeCorporateNumber("12-34567890123")).toBe("1234567890123");
    expect(normalizeCorporateNumber("123")).toBeNull();
    expect(normalizeUrl("example.test/path?utm=1#top")).toBe("https://example.test/path");
    expect(employeeRange(null)).toBeNull();
    expect(employeeRange(9)).toContain("1-9");
    expect(computeCoverageScore({ officialUrl: "https://example.test", industry: "IT", employeeCount: 10, annualRevenue: 1000 })).toBe(100);
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

function clearSupabaseEnv() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function fixedRunnerDate() {
  return new Date("2026-07-03T00:00:00.000Z");
}

function runnerJob(overrides: Partial<CrawlJob> & { companies?: { corporate_number?: string; official_url?: string } } = {}) {
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
    companies: { corporate_number: "1234567890123", official_url: "https://example.test" },
    ...overrides,
  } satisfies CrawlJob & { companies?: { corporate_number?: string; official_url?: string } };
}

function createRunnerSupabase(job: ReturnType<typeof runnerJob> | null) {
  type RunnerClient = NonNullable<JobRunnerDependencies["supabase"]>;
  const updates: { id: string; values: Record<string, unknown> }[] = [];
  const logs: Record<string, unknown>[] = [];
  const filters: string[] = [];

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
        update: (values: Record<string, unknown>) => ({
          eq: async (_column: string, id: string) => {
            updates.push({ id, values });
            return { error: null };
          },
        }),
        insert: async (values: Record<string, unknown>) => {
          logs.push(values);
          return { error: null };
        },
      };
    },
  };

  return { client, updates, logs, filters };
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
