const unsafeFileNameChars = /[<>:"/\\|?*\u0000-\u001F]/g;
const maxFileNameLength = 180;

export function sanitizeDownloadFileName(value: string, fallback = "download.csv") {
  const sanitized = value
    .trim()
    .replace(unsafeFileNameChars, "-")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .replace(/^[ .-]+|[ .-]+$/g, "");

  if (!sanitized || sanitized === "." || sanitized === "..") return fallback;
  if (sanitized.length <= maxFileNameLength) return sanitized;
  if (sanitized.toLowerCase().endsWith(".csv")) {
    const stem = sanitized.slice(0, maxFileNameLength - 4).replace(/[ .-]+$/g, "");
    return `${stem || "download"}.csv`;
  }
  return sanitized.slice(0, maxFileNameLength);
}
