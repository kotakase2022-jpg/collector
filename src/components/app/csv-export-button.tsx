"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeDownloadFileName } from "@/lib/file-name";

export function CsvExportButton({
  endpoint = "/api/companies/export",
  queryString = "",
  fileName = "companies.csv",
}: {
  endpoint?: string;
  queryString?: string;
  fileName?: string;
}) {
  const exportKey = `${endpoint}?${queryString}:${fileName}`;
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [status, setStatus] = useState<{ key: string; message: string } | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleExport() {
    setError(null);
    setStatus(null);
    setIsPending(true);
    try {
      const response = await fetch(queryString ? `${endpoint}?${queryString}` : endpoint, { headers: { accept: "text/csv" } });
      if (!response.ok) throw new Error(`CSV export failed with ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = sanitizeDownloadFileName(fileName, "companies.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus({ key: exportKey, message: "CSVを作成しました。" });
    } catch {
      setError({ key: exportKey, message: "CSV出力に失敗しました。時間をおいて再実行してください。" });
    } finally {
      setIsPending(false);
    }
  }

  const currentError = error?.key === exportKey ? error.message : null;
  const currentStatus = status?.key === exportKey ? status.message : null;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="button" onClick={handleExport} disabled={isPending}>
        <Download className="h-4 w-4" />
        {isPending ? "出力中" : "CSV"}
      </Button>
      {currentError ? (
        <p role="alert" className="text-sm text-destructive">
          {currentError}
        </p>
      ) : null}
      {currentStatus ? (
        <p role="status" className="text-sm text-muted-foreground">
          {currentStatus}
        </p>
      ) : null}
    </div>
  );
}
