"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CsvExportButton() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleExport() {
    setError(null);
    setStatus(null);
    setIsPending(true);
    try {
      const response = await fetch("/api/companies/export", { headers: { accept: "text/csv" } });
      if (!response.ok) throw new Error(`CSV export failed with ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "companies.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("CSV export generated.");
    } catch {
      setError("CSV出力に失敗しました。時間をおいて再実行してください。");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="button" onClick={handleExport} disabled={isPending}>
        <Download className="h-4 w-4" />
        {isPending ? "出力中" : "CSV"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {status ? (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      ) : null}
    </div>
  );
}
