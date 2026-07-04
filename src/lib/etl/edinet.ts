import { XMLParser } from "fast-xml-parser";
import { addCompanySource, addObservation, refreshCompanySelectedValues } from "@/lib/etl/store";
import { confidenceForSource, observationKind } from "@/lib/etl/scoring";
import { normalizeRevenueToJpy } from "@/lib/etl/normalize";
import type { AnnualRevenueType } from "@/lib/types";

export type EdinetDocument = {
  docID: string;
  filerName?: string;
  ordinanceCode?: string;
  formCode?: string;
  docDescription?: string;
  submitDateTime?: string;
  periodStart?: string;
  periodEnd?: string;
  corporateNumber?: string;
};

export async function listEdinetDocuments(date: string) {
  const apiKey = process.env.EDINET_API_KEY;
  const baseUrl = process.env.EDINET_API_BASE_URL ?? "https://api.edinet-fsa.go.jp/api/v2/documents.json";
  const url = new URL(baseUrl);
  url.searchParams.set("date", date);
  url.searchParams.set("type", "2");
  if (apiKey) url.searchParams.set("Subscription-Key", apiKey);

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "JapanCompanyCollector/0.1" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`EDINET documents request failed: ${response.status}`);
  const json = (await response.json()) as { results?: EdinetDocument[] };
  return json.results ?? [];
}

export function extractEdinetFactsFromXbrl(xbrlText: string) {
  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false });
  const data = parser.parse(xbrlText) as Record<string, unknown>;
  const facts = flattenFacts(data);

  const revenueFact = findFact(facts, [
    "NetSales",
    "Revenue",
    "OperatingRevenue",
    "OrdinaryIncome",
    "SalesRevenue",
  ]);
  const employeeFact = findFact(facts, ["NumberOfEmployees", "AverageNumberOfTemporaryWorkers"]);

  return {
    annualRevenue: revenueFact
      ? {
          observed: revenueFact.value,
          normalized: normalizeRevenueToJpy(revenueFact.value).value,
          type: revenueTypeFromKey(revenueFact.key),
          evidence: `${revenueFact.key}: ${revenueFact.value}`,
        }
      : null,
    employeeCount: employeeFact
      ? {
          observed: employeeFact.value,
          normalized: Number(employeeFact.value.replace(/,/g, "")),
          evidence: `${employeeFact.key}: ${employeeFact.value}`,
        }
      : null,
  };
}

export async function applyEdinetFacts(companyId: string, input: {
  docId: string;
  sourceUrl: string;
  xbrlText: string;
  period?: string | null;
}) {
  const facts = extractEdinetFactsFromXbrl(input.xbrlText);
  const source = await addCompanySource({
    companyId,
    sourceType: "edinet",
    sourceUrl: input.sourceUrl,
    sourceTitle: `EDINET ${input.docId}`,
    rawText: input.xbrlText.slice(0, 20000),
    confidenceScore: 100,
  });
  const confidence = confidenceForSource("edinet", "pdf_rule", 100);

  if (facts.annualRevenue?.normalized != null) {
    await addObservation({
      companyId,
      fieldName: "annual_revenue",
      observedValue: facts.annualRevenue.observed,
      normalizedValue: String(facts.annualRevenue.normalized),
      sourceId: source.id,
      sourceType: observationKind("edinet", "pdf_rule"),
      confidenceScore: confidence,
      extractionMethod: "pdf_rule",
    });
  }

  if (facts.employeeCount?.normalized != null && Number.isFinite(facts.employeeCount.normalized)) {
    await addObservation({
      companyId,
      fieldName: "employee_count",
      observedValue: facts.employeeCount.observed,
      normalizedValue: String(facts.employeeCount.normalized),
      sourceId: source.id,
      sourceType: observationKind("edinet", "pdf_rule"),
      confidenceScore: confidence,
      extractionMethod: "pdf_rule",
    });
  }

  await refreshCompanySelectedValues(companyId);
  return facts;
}

function flattenFacts(value: unknown, path: string[] = [], output: { key: string; value: string }[] = []) {
  if (value == null) return output;
  if (typeof value === "string" || typeof value === "number") {
    output.push({ key: path[path.length - 1] ?? "", value: String(value) });
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => flattenFacts(item, path, output));
    return output;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key.startsWith("@_")) continue;
      flattenFacts(child, [...path, key], output);
    }
  }
  return output;
}

function findFact(facts: { key: string; value: string }[], keys: string[]) {
  return facts.find((fact) => keys.some((key) => fact.key.toLowerCase().includes(key.toLowerCase())) && /[0-9]/.test(fact.value));
}

function revenueTypeFromKey(key: string): AnnualRevenueType {
  if (/OperatingRevenue/i.test(key)) return "operating_revenue";
  if (/Ordinary/i.test(key)) return "ordinary_revenue";
  return "sales";
}

