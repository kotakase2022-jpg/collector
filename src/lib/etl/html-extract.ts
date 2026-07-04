import * as cheerio from "cheerio";
import { normalizeEmployeeCount, normalizeRevenueToJpy } from "@/lib/etl/normalize";
import type { AnnualRevenueType, EmployeeCountType } from "@/lib/types";

export type RuleExtraction = {
  industry: { value: string | null; evidence: string | null };
  employeeCount: {
    value: number | null;
    type: EmployeeCountType;
    isApproximate: boolean;
    evidence: string | null;
  };
  annualRevenue: {
    value: number | null;
    type: AnnualRevenueType;
    isApproximate: boolean;
    period: string | null;
    evidence: string | null;
  };
};

const profileKeywords = ["会社概要", "企業情報", "企業概要", "about", "profile", "corporate", "company", "ir", "採用", "事業内容"];

export function extractVisibleText(html: string) {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe").remove();
  return $("body")
    .text()
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractTitle(html: string) {
  const $ = cheerio.load(html);
  return $("title").first().text().trim();
}

export function discoverProfileLinks(baseUrl: string, html: string) {
  const $ = cheerio.load(html);
  const links = new Map<string, string>();

  $("a[href]").each((_, element) => {
    const label = $(element).text().trim();
    const href = String($(element).attr("href") ?? "");
    const haystack = `${label} ${href}`.toLowerCase();
    if (!profileKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) return;

    try {
      const url = new URL(href, baseUrl);
      if (url.origin === new URL(baseUrl).origin) {
        url.hash = "";
        links.set(url.toString(), label || url.pathname);
      }
    } catch {
      // Ignore malformed links.
    }
  });

  return [...links.entries()].map(([url, label]) => ({ url, label })).slice(0, 20);
}

export function ruleBasedExtractCompanyProfile(text: string): RuleExtraction {
  const lines = text
    .split(/\n|。/)
    .map((line) => line.trim())
    .filter(Boolean);

  const employeeLine = findLine(lines, /(従業員数|社員数|職員数|従業員)/);
  const revenueLine = findLine(lines, /(売上高|年商|営業収益|営業収入|経常収益)/);
  const industryLine = findLine(lines, /(事業内容|業種|営業品目|サービス内容|主な事業)/);

  const employee = employeeLine ? normalizeEmployeeCount(employeeLine) : { value: null, isApproximate: false };
  const revenue = revenueLine ? normalizeRevenueToJpy(revenueLine) : { value: null, isApproximate: false };

  return {
    industry: {
      value: industryLine ? cleanLabelValue(industryLine) : null,
      evidence: industryLine ?? null,
    },
    employeeCount: {
      value: employee.value,
      type: /連結/.test(employeeLine ?? "") ? "consolidated" : employee.value == null ? "unknown" : "standalone",
      isApproximate: employee.isApproximate,
      evidence: employeeLine ?? null,
    },
    annualRevenue: {
      value: revenue.value,
      type: revenueTypeFromEvidence(revenueLine ?? ""),
      isApproximate: revenue.isApproximate,
      period: extractPeriod(revenueLine ?? ""),
      evidence: revenueLine ?? null,
    },
  };
}

function findLine(lines: string[], pattern: RegExp) {
  return lines.find((line) => pattern.test(line) && /[0-9０-９]|[一-龥ぁ-んァ-ン]/.test(line));
}

function cleanLabelValue(value: string) {
  return value.replace(/^(事業内容|業種|営業品目|サービス内容|主な事業)\s*[:：]?\s*/, "").trim().slice(0, 300);
}

function revenueTypeFromEvidence(evidence: string): AnnualRevenueType {
  if (/営業収益|営業収入/.test(evidence)) return "operating_revenue";
  if (/経常収益/.test(evidence)) return "ordinary_revenue";
  if (/推定/.test(evidence)) return "estimated";
  if (/売上高|年商/.test(evidence)) return "sales";
  return "unknown";
}

function extractPeriod(evidence: string) {
  return evidence.match(/(20[0-9]{2}|令和[0-9]+|平成[0-9]+)(?:年度|年)?(?:[0-9]{1,2}月期)?/)?.[0] ?? null;
}
