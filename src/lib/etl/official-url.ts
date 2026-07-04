import { normalizeCompanyName, normalizeUrl } from "@/lib/etl/normalize";

const thirdPartyDomains = [
  "wikipedia.org",
  "google.com",
  "yahoo.co.jp",
  "indeed.com",
  "doda.jp",
  "rikunabi.com",
  "mynavi.jp",
  "en-gage.net",
  "wantedly.com",
  "jobtalk.jp",
  "openwork.jp",
  "baseconnect.in",
  "houjin.jp",
  "salesnow.jp",
  "mapion.co.jp",
];

export type UrlCandidateInput = {
  companyName: string;
  address?: string | null;
  corporateNumber?: string | null;
  candidateUrl: string;
  title?: string | null;
  snippet?: string | null;
  pageText?: string | null;
};

export type UrlCandidateScore = {
  url: string;
  confidenceScore: number;
  isThirdParty: boolean;
  reasons: string[];
};

export function scoreOfficialUrlCandidate(input: UrlCandidateInput): UrlCandidateScore {
  const url = normalizeUrl(input.candidateUrl);
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const text = `${input.title ?? ""}\n${input.snippet ?? ""}\n${input.pageText ?? ""}`;
  const normalizedName = normalizeCompanyName(input.companyName);
  const normalizedText = normalizeCompanyName(text);
  const reasons: string[] = [];
  let score = 35;

  const isThirdParty = thirdPartyDomains.some((domain) => hostname.endsWith(domain));
  if (isThirdParty) {
    score -= 45;
    reasons.push("third_party_domain");
  }

  if (normalizedText.includes(normalizedName)) {
    score += 25;
    reasons.push("company_name_match");
  }

  if (input.address && normalizedText.includes(input.address.replace(/\s/g, "").slice(0, 8))) {
    score += 15;
    reasons.push("address_match");
  }

  if (input.corporateNumber && text.includes(input.corporateNumber)) {
    score += 20;
    reasons.push("corporate_number_match");
  }

  if (/会社概要|企業情報|corporate|company profile|about us/i.test(text)) {
    score += 10;
    reasons.push("profile_signal");
  }

  if (hostname.includes(normalizedName.replace(/[^a-z0-9]/g, "").slice(0, 8))) {
    score += 8;
    reasons.push("domain_name_signal");
  }

  return {
    url,
    confidenceScore: Math.max(0, Math.min(100, score)),
    isThirdParty,
    reasons,
  };
}

