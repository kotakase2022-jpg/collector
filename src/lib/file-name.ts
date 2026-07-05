const unsafeFileNameChars = /[<>:"/\\|?*\u0000-\u001F]/g;

export function sanitizeDownloadFileName(value: string, fallback = "download.csv") {
  const sanitized = value
    .trim()
    .replace(unsafeFileNameChars, "-")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .replace(/^[ .-]+|[ .-]+$/g, "");

  if (!sanitized || sanitized === "." || sanitized === "..") return fallback;
  return sanitized.slice(0, 180);
}
