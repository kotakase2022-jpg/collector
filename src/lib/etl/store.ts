import { getSupabaseAdmin } from "@/lib/supabase/server";
import { computeCoverageScore, revenueRange } from "@/lib/etl/normalize";
import { selectBestObservation } from "@/lib/etl/scoring";
import type {
  AnnualRevenueType,
  Company,
  CompanyObservation,
  EmployeeCountType,
  ExtractionMethod,
  ObservationSourceType,
  SourceKind,
} from "@/lib/types";

export type UpsertCompanyInput = {
  corporateNumber?: string | null;
  name: string;
  nameKana?: string | null;
  postalCode?: string | null;
  address?: string | null;
  prefecture?: string | null;
  city?: string | null;
  status?: "active" | "closed" | "merged" | "unknown";
};

export async function upsertCompany(input: UpsertCompanyInput) {
  const supabase = getSupabaseAdmin();
  const row = {
    corporate_number: input.corporateNumber ?? null,
    name: input.name,
    name_kana: input.nameKana ?? null,
    postal_code: input.postalCode ?? null,
    address: input.address ?? null,
    prefecture: input.prefecture ?? null,
    city: input.city ?? null,
    status: input.status ?? "active",
  };

  const { data, error } = await supabase
    .from("companies")
    .upsert(row, { onConflict: input.corporateNumber ? "corporate_number" : "name,address" })
    .select("*")
    .single();

  if (error) throw error;
  return data as Company;
}

export async function addCompanySource(input: {
  companyId: string;
  sourceType: SourceKind;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  rawText?: string | null;
  rawJson?: Record<string, unknown> | null;
  confidenceScore: number;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("company_sources")
    .insert({
      company_id: input.companyId,
      source_type: input.sourceType,
      source_url: input.sourceUrl ?? null,
      source_title: input.sourceTitle ?? null,
      raw_text: input.rawText ?? null,
      raw_json: input.rawJson ?? null,
      confidence_score: input.confidenceScore,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function addObservation(input: {
  companyId: string;
  fieldName: CompanyObservation["field_name"];
  observedValue?: string | null;
  normalizedValue?: string | null;
  sourceId?: string | null;
  sourceType: ObservationSourceType;
  confidenceScore: number;
  extractionMethod: ExtractionMethod;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("company_observations")
    .insert({
      company_id: input.companyId,
      field_name: input.fieldName,
      observed_value: input.observedValue ?? null,
      normalized_value: input.normalizedValue ?? null,
      source_id: input.sourceId ?? null,
      source_type: input.sourceType,
      confidence_score: input.confidenceScore,
      extraction_method: input.extractionMethod,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as CompanyObservation;
}

export async function refreshCompanySelectedValues(companyId: string) {
  const supabase = getSupabaseAdmin();
  const { data: observations, error } = await supabase
    .from("company_observations")
    .select("*")
    .eq("company_id", companyId);

  if (error) throw error;
  const all = (observations ?? []) as CompanyObservation[];
  const byField = groupBy(all, (observation) => observation.field_name);

  await supabase.from("company_observations").update({ is_selected: false }).eq("company_id", companyId);

  const selected = {
    official_url: selectBestObservation(byField.official_url ?? []),
    industry: selectBestObservation(byField.industry ?? []),
    employee_count: selectBestObservation(byField.employee_count ?? []),
    annual_revenue: selectBestObservation(byField.annual_revenue ?? []),
  };

  const selectedIds = Object.values(selected)
    .filter(Boolean)
    .map((observation) => observation!.id);

  if (selectedIds.length) {
    await supabase.from("company_observations").update({ is_selected: true }).in("id", selectedIds);
  }

  const update = buildCompanySelectedValueUpdate(selected);

  const { error: updateError } = await supabase.from("companies").update(update).eq("id", companyId);
  if (updateError) throw updateError;
  return update;
}

export function buildCompanySelectedValueUpdate(selected: {
  official_url?: CompanyObservation | null;
  industry?: CompanyObservation | null;
  employee_count?: CompanyObservation | null;
  annual_revenue?: CompanyObservation | null;
}) {
  const employeeCount = parseInteger(selected.employee_count?.normalized_value);
  const annualRevenue = parseInteger(selected.annual_revenue?.normalized_value);
  const annualRevenueType = (selected.annual_revenue?.source_type === "estimated"
    ? "estimated"
    : "sales") as AnnualRevenueType;
  const employeeCountType = inferEmployeeType(selected.employee_count?.observed_value);

  return {
    official_url: selected.official_url?.normalized_value ?? null,
    industry: selected.industry?.normalized_value ?? null,
    employee_count: employeeCount,
    employee_count_type: employeeCountType,
    annual_revenue: annualRevenue,
    annual_revenue_type: annualRevenue == null ? "unknown" : annualRevenueType,
    revenue_range: revenueRange(annualRevenue),
    data_confidence_score: Math.max(0, ...Object.values(selected).map((value) => value?.confidence_score ?? 0)),
    coverage_score: computeCoverageScore({
      officialUrl: selected.official_url?.normalized_value,
      industry: selected.industry?.normalized_value,
      employeeCount,
      annualRevenue,
    }),
  };
}

function groupBy<T, K extends string>(items: T[], key: (item: T) => K) {
  return items.reduce(
    (acc, item) => {
      const group = key(item);
      acc[group] ??= [];
      acc[group].push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

function parseInteger(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function inferEmployeeType(value: string | null | undefined): EmployeeCountType {
  if (!value) return "unknown";
  return /連結|consolidated/i.test(value) ? "consolidated" : "standalone";
}
