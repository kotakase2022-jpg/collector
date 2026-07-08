export const generatedListDisplayLimit = 20;
export const savedListDisplayLimit = 100;

export function buildListDisplayRows<T>(rows: T[], limit: number) {
  const visibleRows = rows.slice(0, Math.max(0, limit));
  return {
    visibleRows,
    totalCount: rows.length,
    hiddenCount: Math.max(0, rows.length - visibleRows.length),
    isTruncated: rows.length > visibleRows.length,
  };
}
