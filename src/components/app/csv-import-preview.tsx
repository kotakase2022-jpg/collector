"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildCsvImportReadiness, optionalCsvColumns, requiredCsvColumns, type CsvImportPreview } from "@/lib/list-quality";

const toneClasses = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-destructive/40 bg-destructive/5 text-destructive",
} as const;

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

  function handleFileChange() {
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">DBには保存せず、列・欠損・重複・URL形式だけを検査します。</p>
        <p className="mt-1">
          必須列: <span className="font-mono">{requiredCsvColumns.join(", ")}</span>
        </p>
        <p className="mt-1">
          任意列: <span className="font-mono">{optionalCsvColumns.join(", ")}</span> / 1MB以下
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor="csv-upload" className="block text-xs font-medium text-muted-foreground">
            CSVファイル
          </label>
          <Input id="csv-upload" name="file" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
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
        <CsvImportResult result={result} />
      ) : null}
    </div>
  );
}

function CsvImportResult({ result }: { result: CsvImportPreview }) {
  const readiness = buildCsvImportReadiness(result);

  return (
    <div role="status" className="space-y-3 rounded-md border p-4">
      <div className={`rounded-md border p-3 ${toneClasses[readiness.tone]}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{readiness.label}</p>
          <Badge variant={readiness.tone === "danger" ? "destructive" : "outline"} className="rounded-sm bg-background/70">
            {readiness.issues.length ? `${readiness.issues.length}項目確認` : "確認不要"}
          </Badge>
        </div>
        {readiness.issues.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {readiness.issues.map((issue) => (
              <span key={issue} className="rounded-sm border border-current/20 bg-background/70 px-2 py-1 text-xs">
                {issue}
              </span>
            ))}
          </div>
        ) : null}
        <p className="mt-2 text-sm">{readiness.nextAction}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-6">
        <ResultMetric label="行数" value={result.rowCount} />
        <ResultMetric label="有効行" value={result.validRows} />
        <ResultMetric label="必須列不足" value={result.missingRequiredColumns.length} />
        <ResultMetric label="必須欠損" value={result.missingRequiredCount} />
        <ResultMetric label="重複キー" value={result.duplicateKeys.length} />
        <ResultMetric label="URL不正" value={result.invalidUrlCount} />
      </div>
      {result.missingRequiredColumns.length ? <p className="text-xs text-muted-foreground">不足している必須列: {result.missingRequiredColumns.join(", ")}</p> : null}
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
