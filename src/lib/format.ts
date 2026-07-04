export function formatNumber(value: number | null | undefined) {
  if (value == null) return "-";
  return new Intl.NumberFormat("ja-JP").format(value);
}

export function formatRevenue(value: number | null | undefined) {
  if (value == null) return "-";
  if (value >= 100_000_000) return `${trimDecimal(value / 100_000_000)}億円`;
  if (value >= 10_000) return `${trimDecimal(value / 10_000)}万円`;
  return `${formatNumber(value)}円`;
}

export function formatPercent(value: number | null | undefined) {
  if (value == null) return "-";
  return `${value}%`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function trimDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
