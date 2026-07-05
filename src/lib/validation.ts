import { z } from "zod";
import type { CompanyFilters, CompanySort } from "@/lib/types";

export const employeeRangeOptions = ["1-9名", "10-49名", "50-299名", "300-999名", "1000名以上"] as const;
export const revenueRangeOptions = ["1億円未満", "1億-10億円", "10億-100億円", "100億-1000億円", "1000億円以上"] as const;
export const companySortOptions = ["updated_desc", "confidence_desc", "revenue_desc", "employee_desc", "name_asc"] as const satisfies readonly CompanySort[];

export const uuidLikeSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);

export const jobIdSchema = z.object({
  id: uuidLikeSchema,
});
export const jobPrioritySchema = jobIdSchema.extend({
  priority: z.coerce.number().int().min(1).max(999),
});
export const coveragePlanSchema = z.object({
  limit: z.coerce.number().int().min(1).max(5000),
});

export const listCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(300).optional(),
});
export function parseJobPriorityForm(form: FormData) {
  return jobPrioritySchema.safeParse({
    id: form.get("id"),
    priority: form.get("priority"),
  });
}

export function parseJobIdForm(form: FormData) {
  return jobIdSchema.safeParse({
    id: form.get("id"),
  });
}

export function parseCoveragePlanForm(form: FormData) {
  return coveragePlanSchema.safeParse({
    limit: form.get("limit") || "1000",
  });
}

export function parseListCreateForm(form: FormData) {
  const parsed = listCreateSchema.safeParse({
    name: form.get("name"),
    description: form.get("description") || undefined,
  });
  if (!parsed.success) return parsed;

  return {
    ...parsed,
    data: {
      ...parsed.data,
      filters: parseCompanyFilters(Object.fromEntries(form) as Record<string, string | string[] | undefined>),
    },
  };
}

export function parseListUpdateForm(form: FormData) {
  const id = uuidLikeSchema.safeParse(form.get("id"));
  const parsed = parseListCreateForm(form);
  if (!id.success || !parsed.success) return { success: false as const };
  return {
    success: true as const,
    data: {
      ...parsed.data,
      id: id.data,
    },
  };
}

export function parseListIdForm(form: FormData) {
  return uuidLikeSchema.safeParse(form.get("id"));
}

export function parseCompanyFilters(params: Record<string, string | string[] | undefined>): CompanyFilters {
  const pick = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    scope: asChoice(pick("scope"), ["all"] as const),
    q: nonEmpty(pick("q")),
    prefecture: nonEmpty(pick("prefecture")),
    industry: nonEmpty(pick("industry")),
    employeeRange: asChoice(pick("employeeRange"), employeeRangeOptions),
    revenueRange: asChoice(pick("revenueRange"), revenueRangeOptions),
    hasUrl: asChoice(pick("hasUrl"), ["yes", "no"] as const),
    hasRevenue: asChoice(pick("hasRevenue"), ["yes", "no"] as const),
    hasEmployeeCount: asChoice(pick("hasEmployeeCount"), ["yes", "no"] as const),
    valueKind: asChoice(pick("valueKind"), ["official", "estimated"] as const),
    minConfidence: parseOptionalInteger(pick("minConfidence")),
    sort: asChoice(pick("sort"), companySortOptions),
    excludedCompanyIds: parseExcludedCompanyIds(pick("excludedCompanyIds")),
  };
}

export function companyFiltersToSearchParams(filters: CompanyFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === "" || (Array.isArray(value) && !value.length)) continue;
    if (Array.isArray(value)) {
      params.set(key, value.join(","));
      continue;
    }
    params.set(key, String(value));
  }
  return params;
}

export function hasCompanyGenerationCriteria(filters: CompanyFilters) {
  return Boolean(
    filters.scope === "all" ||
      filters.q ||
      filters.prefecture ||
      filters.industry ||
      filters.employeeRange ||
      filters.revenueRange ||
      filters.hasUrl ||
      filters.hasRevenue ||
      filters.hasEmployeeCount ||
      filters.valueKind ||
      filters.minConfidence != null,
  );
}

export function listFormStateToSearchParams(form: FormData) {
  const params = companyFiltersToSearchParams(parseCompanyFilters(Object.fromEntries(form) as Record<string, string | string[] | undefined>));
  const listId = nonEmpty(stringValue(form.get("id")));
  const name = nonEmpty(stringValue(form.get("name")));
  const description = nonEmpty(stringValue(form.get("description")));
  if (listId) params.set("listId", listId);
  if (name) params.set("name", name);
  if (description) params.set("description", description);
  return params;
}

export function buildRedirectUrl(requestUrl: string, pathname: string, params: Record<string, string>) {
  const url = new URL(pathname, requestUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

function nonEmpty(value: string | undefined) {
  return value?.trim() ? value.trim() : undefined;
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : undefined;
}

function parseOptionalInteger(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return undefined;
  return Math.min(parsed, 100);
}

function asChoice<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function parseExcludedCompanyIds(value: string | undefined) {
  const ids = value
    ?.split(",")
    .map((id) => id.trim())
    .filter((id) => uuidLikeSchema.safeParse(id).success);
  return ids?.length ? [...new Set(ids)] : undefined;
}
