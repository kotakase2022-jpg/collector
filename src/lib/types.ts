export type SourceKind =
  | "nta"
  | "gbizinfo"
  | "edinet"
  | "shokuba"
  | "official_site"
  | "third_party"
  | "search"
  | "llm_extraction";

export type ObservationSourceType = "official" | "reported" | "estimated" | "unknown";

export type ExtractionMethod = "api" | "html_rule" | "pdf_rule" | "llm" | "manual";

export type EmployeeCountType = "consolidated" | "standalone" | "unknown";

export type AnnualRevenueType =
  | "sales"
  | "operating_revenue"
  | "ordinary_revenue"
  | "estimated"
  | "unknown";

export type CompanyStatus = "active" | "closed" | "merged" | "unknown";

export type CrawlJobType =
  | "seed_import"
  | "enrich_gbizinfo"
  | "enrich_edinet"
  | "discover_official_url"
  | "crawl_official_site"
  | "extract_company_profile"
  | "verify_data";

export type CrawlJobStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export type Company = {
  id: string;
  corporate_number: string | null;
  name: string;
  name_kana: string | null;
  postal_code: string | null;
  address: string | null;
  prefecture: string | null;
  city: string | null;
  official_url: string | null;
  industry: string | null;
  industry_code: string | null;
  employee_count: number | null;
  employee_count_type: EmployeeCountType;
  annual_revenue: number | null;
  annual_revenue_currency: string;
  annual_revenue_period: string | null;
  annual_revenue_type: AnnualRevenueType;
  revenue_range: string | null;
  data_confidence_score: number;
  coverage_score: number;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
};

export type CompanySource = {
  id: string;
  company_id: string;
  source_type: SourceKind;
  source_url: string | null;
  source_title: string | null;
  fetched_at: string;
  raw_text: string | null;
  raw_json: Record<string, unknown> | null;
  confidence_score: number;
  created_at: string;
};

export type CompanyObservation = {
  id: string;
  company_id: string;
  field_name: "official_url" | "industry" | "employee_count" | "annual_revenue";
  observed_value: string | null;
  normalized_value: string | null;
  source_id: string | null;
  source_type: ObservationSourceType;
  confidence_score: number;
  extraction_method: ExtractionMethod;
  is_selected: boolean;
  created_at: string;
};

export type CrawlJob = {
  id: string;
  company_id: string | null;
  job_type: CrawlJobType;
  status: CrawlJobStatus;
  priority: number;
  attempts: number;
  error_message: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type DashboardMetrics = {
  totalCompanies: number;
  withUrl: number;
  withIndustry: number;
  withEmployeeCount: number;
  withAnnualRevenue: number;
  officialRatio: number;
  estimatedRatio: number;
  runningJobs: number;
  errorJobs: number;
  freshnessDays: number | null;
};

export type CompanySort = "updated_desc" | "confidence_desc" | "revenue_desc" | "employee_desc" | "name_asc";

export type CompanyFilters = {
  scope?: "all";
  q?: string;
  prefecture?: string;
  industry?: string;
  employeeRange?: string;
  revenueRange?: string;
  hasUrl?: "yes" | "no";
  hasCorporateNumber?: "yes" | "no";
  hasRevenue?: "yes" | "no";
  hasEmployeeCount?: "yes" | "no";
  valueKind?: "official" | "estimated";
  minConfidence?: number;
  sort?: CompanySort;
  excludedCompanyIds?: string[];
};

export type SavedCompanyList = {
  id: string;
  name: string;
  description: string | null;
  filters: CompanyFilters;
  row_count: number;
  created_at: string;
  updated_at: string;
};

export type SavedCompanyListItem = {
  id: string;
  list_id: string;
  company_id: string;
  position: number;
  snapshot: Company;
  created_at: string;
};

export type ListQualitySummary = {
  total: number;
  withUrl: number;
  withRevenue: number;
  withEmployeeCount: number;
  estimatedRevenue: number;
  lowConfidence: number;
  missingCorporateNumber: number;
  duplicateCorporateNumbers: string[];
};

export type ListQualityIssueSeverity = "warning" | "danger";

export type ListQualityIssue = {
  key: "missing_corporate_number" | "missing_url" | "missing_revenue" | "estimated_revenue" | "missing_employee_count" | "low_confidence";
  label: string;
  severity: ListQualityIssueSeverity;
};

export type ListReadiness = {
  score: number;
  label: "即利用向き" | "要確認" | "補完優先" | "対象なし";
  tone: "good" | "warning" | "danger";
  blockers: string[];
  nextAction: string;
  recommendedActions: string[];
};

export type LlmExtractionResult = {
  is_official_company_page: boolean;
  company_name_match_score: number;
  industry: {
    value: string | null;
    confidence: number;
    evidence: string | null;
  };
  employee_count: {
    value: number | null;
    type: EmployeeCountType;
    is_approximate: boolean;
    period: string | null;
    confidence: number;
    evidence: string | null;
  };
  annual_revenue: {
    value_jpy: number | null;
    type: AnnualRevenueType;
    is_approximate: boolean;
    period: string | null;
    confidence: number;
    evidence: string | null;
  };
  notes: string[];
};
