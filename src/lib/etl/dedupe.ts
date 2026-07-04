import { normalizeCompanyName, normalizeCorporateNumber, normalizeUrl } from "@/lib/etl/normalize";

export type IdentityCandidate = {
  corporateNumber?: string | null;
  name: string;
  address?: string | null;
  url?: string | null;
  phone?: string | null;
};

export function matchCompanyIdentity(a: IdentityCandidate, b: IdentityCandidate) {
  const aNumber = normalizeCorporateNumber(a.corporateNumber);
  const bNumber = normalizeCorporateNumber(b.corporateNumber);

  if (aNumber && bNumber) {
    return {
      isMatch: aNumber === bNumber,
      score: aNumber === bNumber ? 100 : 0,
      reason: "corporate_number",
    };
  }

  let score = 0;
  const reasons: string[] = [];

  if (normalizeCompanyName(a.name) === normalizeCompanyName(b.name)) {
    score += 45;
    reasons.push("name");
  }

  if (a.address && b.address && compactAddress(a.address).includes(compactAddress(b.address).slice(0, 10))) {
    score += 30;
    reasons.push("address");
  }

  if (a.url && b.url && domain(a.url) === domain(b.url)) {
    score += 20;
    reasons.push("domain");
  }

  if (a.phone && b.phone && normalizePhone(a.phone) === normalizePhone(b.phone)) {
    score += 20;
    reasons.push("phone");
  }

  return {
    isMatch: score >= 75,
    score: Math.min(100, score),
    reason: reasons.join("+") || "no_match",
  };
}

function compactAddress(value: string) {
  return value.replace(/\s/g, "").replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));
}

function domain(url: string) {
  return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

