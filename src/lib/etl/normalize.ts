const corporateSuffixes = [
  "株式会社",
  "有限会社",
  "合同会社",
  "合名会社",
  "合資会社",
  "一般社団法人",
  "一般財団法人",
  "公益社団法人",
  "公益財団法人",
  "医療法人",
  "学校法人",
  "社会福祉法人",
  "(株)",
  "（株）",
  "(有)",
  "（有）",
  "Co.,Ltd.",
  "Co. Ltd.",
  "Inc.",
  "Ltd.",
];

export function normalizeCompanyName(name: string) {
  let value = toHalfWidth(name)
    .replace(/\s+/g, "")
    .replace(/[‐-―ー－]/g, "-")
    .trim();

  for (const suffix of corporateSuffixes) {
    value = value.replaceAll(suffix, "");
  }

  return value.toLowerCase();
}

export function toHalfWidth(value: string) {
  return value
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ");
}

export function normalizeCorporateNumber(value: string | null | undefined) {
  if (!value) return null;
  const digits = value.normalize("NFKC").replace(/\D/g, "");
  return digits.length === 13 ? digits : null;
}

export function normalizeEmployeeCount(value: string) {
  const normalized = toHalfWidth(value).replace(/,/g, "");
  const match = normalized.match(/(?:約|およそ|社員数|従業員数|職員数|従業員)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:名|人|persons?|employees?)?/i);

  if (!match) {
    return { value: null, isApproximate: /約|およそ|程度/.test(normalized) };
  }

  return {
    value: Math.round(Number(match[1])),
    isApproximate: /約|およそ|程度/.test(normalized),
  };
}

export function normalizeRevenueToJpy(value: string) {
  const normalized = toHalfWidth(value).replace(/,/g, "").replace(/\s+/g, "");
  const match = normalized.match(/([0-9]+(?:\.[0-9]+)?)(兆|億|万)?円?/);

  if (!match) {
    return { value: null, isApproximate: /約|およそ|程度|推定/.test(normalized) };
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === "兆" ? 1_000_000_000_000 : unit === "億" ? 100_000_000 : unit === "万" ? 10_000 : 1;

  return {
    value: Math.round(amount * multiplier),
    isApproximate: /約|およそ|程度|推定/.test(normalized),
  };
}

export function revenueRange(value: number | null) {
  if (value == null) return null;
  if (value < 100_000_000) return "1億円未満";
  if (value < 1_000_000_000) return "1億-10億円";
  if (value < 10_000_000_000) return "10億-100億円";
  if (value < 100_000_000_000) return "100億-1000億円";
  return "1000億円以上";
}

export function employeeRange(value: number | null) {
  if (value == null) return null;
  if (value < 1) return null;
  if (value < 10) return "1-9名";
  if (value < 50) return "10-49名";
  if (value < 300) return "50-299名";
  if (value < 1000) return "300-999名";
  return "1000名以上";
}

export function computeCoverageScore(input: {
  officialUrl?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  annualRevenue?: number | null;
}) {
  let score = 0;
  if (input.officialUrl) score += 25;
  if (input.industry) score += 25;
  if (input.employeeCount != null) score += 25;
  if (input.annualRevenue != null) score += 25;
  return score;
}

export function normalizeUrl(url: string) {
  const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
  parsed.hash = "";
  parsed.search = "";
  return parsed.toString().replace(/\/$/, "");
}
