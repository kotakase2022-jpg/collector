import { setTimeout as delay } from "node:timers/promises";
import { PDFParse } from "pdf-parse";
import { assertRobotsAllowed, loadRobotsPolicy } from "@/lib/etl/robots";
import { discoverProfileLinks, extractTitle, extractVisibleText, ruleBasedExtractCompanyProfile } from "@/lib/etl/html-extract";
import { addCompanySource, addObservation, refreshCompanySelectedValues } from "@/lib/etl/store";
import { confidenceForSource, observationKind } from "@/lib/etl/scoring";

const MAX_CRAWL_RESPONSE_BYTES = 5_000_000;

export type CrawlOptions = {
  maxDepth?: number;
  maxPages?: number;
  userAgent?: string;
};

export type CrawledPage = {
  url: string;
  title: string | null;
  text: string;
  html?: string | null;
  contentType: string | null;
};

export async function crawlOfficialSite(startUrl: string, options: CrawlOptions = {}) {
  const maxDepth = options.maxDepth ?? 2;
  const maxPages = options.maxPages ?? 20;
  const userAgent = options.userAgent ?? "JapanCompanyCollector/0.1";
  const origin = new URL(startUrl).origin;
  const policy = await loadRobotsPolicy(startUrl, userAgent);
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
  const seen = new Set<string>();
  const pages: CrawledPage[] = [];

  while (queue.length && pages.length < maxPages) {
    const item = queue.shift()!;
    const normalized = normalizeForCrawl(item.url);
    if (seen.has(normalized) || new URL(normalized).origin !== origin) continue;
    seen.add(normalized);
    if (!policy.canFetch(normalized)) continue;

    const page = await fetchPage(normalized, userAgent);
    if (!page) continue;
    pages.push(page);

    if (item.depth >= maxDepth || !page.contentType?.includes("text/html")) continue;
    const links = page.html ? discoverProfileLinks(normalized, page.html) : [];
    for (const link of links) queue.push({ url: link.url, depth: item.depth + 1 });

    await delay(policy.crawlDelayMs);
  }

  return pages;
}

export async function extractAndStoreOfficialSite(companyId: string, officialUrl: string) {
  await assertRobotsAllowed(officialUrl);
  const pages = await crawlOfficialSite(officialUrl);
  const confidence = confidenceForSource("official_site", "html_rule", 90);

  for (const page of pages) {
    const source = await addCompanySource({
      companyId,
      sourceType: "official_site",
      sourceUrl: page.url,
      sourceTitle: page.title,
      rawText: page.text.slice(0, 30000),
      confidenceScore: confidence,
    });

    const extracted = ruleBasedExtractCompanyProfile(page.text);
    if (extracted.industry.value) {
      await addObservation({
        companyId,
        fieldName: "industry",
        observedValue: extracted.industry.evidence,
        normalizedValue: extracted.industry.value,
        sourceId: source.id,
        sourceType: observationKind("official_site", "html_rule"),
        confidenceScore: 90,
        extractionMethod: "html_rule",
      });
    }

    if (extracted.employeeCount.value != null) {
      await addObservation({
        companyId,
        fieldName: "employee_count",
        observedValue: extracted.employeeCount.evidence,
        normalizedValue: String(extracted.employeeCount.value),
        sourceId: source.id,
        sourceType: observationKind("official_site", "html_rule"),
        confidenceScore: /採用/.test(page.title ?? "") ? 80 : 90,
        extractionMethod: "html_rule",
      });
    }

    if (extracted.annualRevenue.value != null) {
      await addObservation({
        companyId,
        fieldName: "annual_revenue",
        observedValue: extracted.annualRevenue.evidence,
        normalizedValue: String(extracted.annualRevenue.value),
        sourceId: source.id,
        sourceType: observationKind("official_site", "html_rule", extracted.annualRevenue.type === "estimated"),
        confidenceScore: extracted.annualRevenue.type === "estimated" ? 30 : 90,
        extractionMethod: "html_rule",
      });
    }
  }

  await refreshCompanySelectedValues(companyId);
  return pages;
}

async function fetchPage(url: string, userAgent: string): Promise<CrawledPage | null> {
  const response = await fetch(url, {
    headers: { "user-agent": userAgent, accept: "text/html,application/pdf;q=0.8,*/*;q=0.2" },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) return null;
  const contentType = response.headers.get("content-type");
  const isPdf = isPdfResponse(url, contentType);
  if (!isPdf && contentType && !isTextLikeResponse(contentType)) return null;
  if (contentLengthExceeds(response.headers, MAX_CRAWL_RESPONSE_BYTES)) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_CRAWL_RESPONSE_BYTES) return null;

  if (isPdf) {
    let parser: PDFParse | null = null;
    try {
      parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      return { url, title: null, text: parsed.text, html: null, contentType: "application/pdf" };
    } catch {
      return null;
    } finally {
      await parser?.destroy();
    }
  }

  const html = buffer.toString("utf8");
  return { url, title: extractTitle(html), text: extractVisibleText(html), html, contentType };
}

function isPdfResponse(url: string, contentType: string | null) {
  return contentType?.toLowerCase().includes("application/pdf") || url.toLowerCase().endsWith(".pdf");
}

function isTextLikeResponse(contentType: string) {
  const normalized = contentType.toLowerCase();
  return normalized.includes("text/html") || normalized.includes("application/xhtml+xml") || normalized.includes("text/plain");
}

function contentLengthExceeds(headers: Headers, maxBytes: number) {
  const rawLength = headers.get("content-length");
  if (!rawLength) return false;
  const length = Number(rawLength);
  return Number.isFinite(length) && length > maxBytes;
}

function normalizeForCrawl(url: string) {
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.toString();
}
