import { inflateRawSync } from "node:zlib";
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

export async function fetchEdinetDocumentXbrl(docId: string, options: { baseUrl?: string; apiKey?: string; fetchImpl?: typeof fetch } = {}) {
  const apiKey = options.apiKey ?? process.env.EDINET_API_KEY;
  const baseUrl = options.baseUrl ?? process.env.EDINET_DOCUMENT_API_BASE_URL ?? "https://api.edinet-fsa.go.jp/api/v2/documents";
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(docId)}`);
  url.searchParams.set("type", "1");
  if (apiKey) url.searchParams.set("Subscription-Key", apiKey);

  const response = await (options.fetchImpl ?? fetch)(url, {
    headers: { Accept: "application/zip, application/xml, text/xml, */*", "User-Agent": "JapanCompanyCollector/0.1" },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`EDINET document request failed: ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";
  if (/xml|text/i.test(contentType) || buffer.subarray(0, 128).toString("utf8").trimStart().startsWith("<")) {
    return buffer.toString("utf8");
  }

  return extractXbrlTextFromZip(buffer);
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
          normalized: normalizeEdinetRevenueFact(revenueFact.value),
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

export function extractXbrlTextFromZip(buffer: Buffer) {
  const entry = findZipEntries(buffer).find((item) => /\.(xbrl|xml)$/i.test(item.fileName) && !/audit|summary/i.test(item.fileName));
  if (!entry) throw new Error("EDINET archive did not contain an XBRL/XML document");

  const localHeaderOffset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) throw new Error("Invalid EDINET archive local file header");
  const fileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) return compressed.toString("utf8");
  if (entry.compressionMethod === 8) return inflateRawSync(compressed).toString("utf8");
  throw new Error(`Unsupported EDINET archive compression method: ${entry.compressionMethod}`);
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
    output.push({ key: lastFactKey(path), value: String(value) });
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

function lastFactKey(path: string[]) {
  return [...path].reverse().find((key) => key !== "#text") ?? "";
}

function findFact(facts: { key: string; value: string }[], keys: string[]) {
  return facts.find((fact) => keys.some((key) => fact.key.toLowerCase().includes(key.toLowerCase())) && /[0-9]/.test(fact.value));
}

function revenueTypeFromKey(key: string): AnnualRevenueType {
  if (/OperatingRevenue/i.test(key)) return "operating_revenue";
  if (/Ordinary/i.test(key)) return "ordinary_revenue";
  return "sales";
}

function normalizeEdinetRevenueFact(value: string) {
  const normalizedRevenue = normalizeRevenueToJpy(value).value;
  if (normalizedRevenue != null) return normalizedRevenue;

  const rawJpy = value.replace(/,/g, "").trim();
  if (!/^\d+(?:\.\d+)?$/.test(rawJpy)) return null;

  const amount = Number(rawJpy);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount);
}

function findZipEntries(buffer: Buffer) {
  const endOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);
  const entries: { fileName: string; compressionMethod: number; compressedSize: number; localHeaderOffset: number }[] = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("Invalid EDINET archive central directory");
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    entries.push({ fileName, compressionMethod, compressedSize, localHeaderOffset });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(buffer: Buffer) {
  const minOffset = Math.max(0, buffer.length - 0xffff - 22);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error("Invalid EDINET archive: end of central directory not found");
}
