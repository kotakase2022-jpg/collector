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

export function attachmentContentDisposition(fileName: string, fallback = "download.csv") {
  const sanitized = sanitizeDownloadFileName(fileName, fallback);
  const fallbackName = sanitizeDownloadFileName(fallback, "download.csv");
  const asciiCandidate = sanitizeDownloadFileName(sanitized.replace(/[^\x20-\x7E]/g, ""), fallbackName);
  const asciiFileName = asciiCandidate.includes(".") ? asciiCandidate : fallbackName;

  return `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeRfc5987Value(sanitized)}`;
}

function encodeRfc5987Value(value: string) {
  return encodeURIComponent(value).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}
