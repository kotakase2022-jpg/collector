import { z } from "zod";
import type { CompanyFilters } from "@/lib/types";

export const jobPrioritySchema = z.object({
  id: z.string().min(1, "job id is required"),
  priority: z.coerce.number().int().min(1).max(999),
});

export function parseJobPriorityForm(form: FormData) {
  return jobPrioritySchema.safeParse({
    id: form.get("id"),
    priority: form.get("priority"),
  });
}

export function parseCompanyFilters(params: Record<string, string | string[] | undefined>): CompanyFilters {
  const pick = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    q: nonEmpty(pick("q")),
    prefecture: nonEmpty(pick("prefecture")),
    industry: nonEmpty(pick("industry")),
    hasUrl: asChoice(pick("hasUrl"), ["yes", "no"] as const),
    hasRevenue: asChoice(pick("hasRevenue"), ["yes", "no"] as const),
    hasEmployeeCount: asChoice(pick("hasEmployeeCount"), ["yes", "no"] as const),
    valueKind: asChoice(pick("valueKind"), ["official", "estimated"] as const),
    minConfidence: parseOptionalInteger(pick("minConfidence")),
  };
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

function parseOptionalInteger(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function asChoice<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

