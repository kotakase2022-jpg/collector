"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CsvImportPreview } from "@/lib/list-quality";

export function CsvImportPreviewPanel() {
  const [result, setResult] = useState<CsvImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/lists/import-preview", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const body = (await response.json()) as CsvImportPreview | { error?: string };
      if (!response.ok) throw new Error("error" in body ? body.error : "CSVの検査に失敗しました。");
      setResult(body as CsvImportPreview);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "CSVの検査に失敗しました。");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor="csv-upload" className="block text-xs font-medium text-muted-foreground">
            CSVファイル
          </label>
          <Input id="csv-upload" name="file" type="file" accept=".csv,text/csv" />
        </div>
        <Button type="submit" disabled={isPending}>
          <Upload className="h-4 w-4" />
          {isPending ? "検査中" : "CSVを検査"}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {result ? (
        <div role="status" className="space-y-3 rounded-md border p-4">
          <div className="grid gap-3 sm:grid-cols-5">
            <ResultMetric label="行数" value={result.rowCount} />
            <ResultMetric label="有効行" value={result.validRows} />
            <ResultMetric label="必須欠損" value={result.missingRequiredCount} />
            <ResultMetric label="重複キー" value={result.duplicateKeys.length} />
            <ResultMetric label="URL不正" value={result.invalidUrlCount} />
          </div>
          {result.duplicateKeys.length ? <p className="text-xs text-muted-foreground">重複法人番号: {result.duplicateKeys.join(", ")}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">法人番号</th>
                  <th className="py-2 pr-3 font-medium">企業名</th>
                  <th className="py-2 pr-3 font-medium">URL</th>
                  <th className="py-2 pr-3 font-medium">業種</th>
                </tr>
              </thead>
              <tbody>
                {result.previewRows.map((row, index) => (
                  <tr key={`${row.corporate_number}-${index}`} className="border-t">
                    <td className="py-2 pr-3 font-mono">{row.corporate_number || "-"}</td>
                    <td className="py-2 pr-3">{row.company_name || "-"}</td>
                    <td className="py-2 pr-3">{row.official_url || "-"}</td>
                    <td className="py-2 pr-3">{row.industry || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
