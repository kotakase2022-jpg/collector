import { addCompanySource, addObservation, refreshCompanySelectedValues } from "@/lib/etl/store";
import { confidenceForSource, observationKind } from "@/lib/etl/scoring";
import { normalizeEmployeeCount, normalizeUrl } from "@/lib/etl/normalize";

export type GBizInfoClientOptions = {
  token?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export async function fetchGBizInfoByCorporateNumber(corporateNumber: string, options: GBizInfoClientOptions = {}) {
  const token = options.token ?? process.env.GBIZINFO_API_TOKEN;
  if (!token) throw new Error("GBIZINFO_API_TOKEN is not configured.");

  const baseUrl = options.baseUrl ?? process.env.GBIZINFO_API_BASE_URL ?? "https://info.gbiz.go.jp/hojin/v1/hojin";
  const url = `${baseUrl.replace(/\/$/, "")}/${corporateNumber}`;
  const response = await (options.fetchImpl ?? fetch)(url, {
    headers: {
      Accept: "application/json",
      "X-hojinInfo-api-token": token,
      "User-Agent": "JapanCompanyCollector/0.1",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`gBizINFO request failed: ${response.status}`);
  return readJsonObjectResponse(response, "gBizINFO");
}

async function readJsonObjectResponse(response: Response, label: string) {
  try {
    const json = (await response.json()) as unknown;
    if (json && typeof json === "object" && !Array.isArray(json)) return json as Record<string, unknown>;
  } catch {
    // API gateways and maintenance pages may return HTML/text with a 200 status.
  }
  throw new Error(`${label} response was not a JSON object`);
}

export async function applyGBizInfo(companyId: string, raw: Record<string, unknown>, sourceUrl?: string) {
  const source = await addCompanySource({
    companyId,
    sourceType: "gbizinfo",
    sourceUrl: sourceUrl ?? "https://info.gbiz.go.jp/",
    sourceTitle: "gBizINFO",
    rawJson: raw,
    confidenceScore: 70,
  });

  const profile = extractGBizProfile(raw);
  const confidence = confidenceForSource("gbizinfo", "api", 70);

  if (profile.officialUrl) {
    await addObservation({
      companyId,
      fieldName: "official_url",
      observedValue: profile.officialUrl,
      normalizedValue: normalizeUrl(profile.officialUrl),
      sourceId: source.id,
      sourceType: observationKind("gbizinfo", "api"),
      confidenceScore: confidence,
      extractionMethod: "api",
    });
  }

  if (profile.industry) {
    await addObservation({
      companyId,
      fieldName: "industry",
      observedValue: profile.industry,
      normalizedValue: profile.industry,
      sourceId: source.id,
      sourceType: observationKind("gbizinfo", "api"),
      confidenceScore: confidence,
      extractionMethod: "api",
    });
  }

  if (profile.employeeCount) {
    const normalized = normalizeEmployeeCount(profile.employeeCount);
    if (normalized.value != null) {
      await addObservation({
        companyId,
        fieldName: "employee_count",
        observedValue: profile.employeeCount,
        normalizedValue: String(normalized.value),
        sourceId: source.id,
        sourceType: observationKind("gbizinfo", "api"),
        confidenceScore: confidence,
        extractionMethod: "api",
      });
    }
  }

  await refreshCompanySelectedValues(companyId);
  return profile;
}

export function extractGBizProfile(raw: Record<string, unknown>) {
  const body = findFirstObject(raw, ["hojin-infos", "hojinInfos", "corporation", "data"]) ?? raw;
  return {
    officialUrl: pickString(body, ["url", "company_url", "homepage", "ホームページ"]),
    industry: pickString(body, ["industry", "business_items", "business_summary", "業種", "事業概要"]),
    employeeCount: pickString(body, ["employee_number", "employee_count", "number_of_employees", "従業員数"]),
  };
}

function pickString(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

function findFirstObject(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value) && value[0] && typeof value[0] === "object") return value[0] as Record<string, unknown>;
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return null;
}
