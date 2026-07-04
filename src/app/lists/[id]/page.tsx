import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { CsvExportButton } from "@/components/app/csv-export-button";
import { ConfidenceBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatNumber, formatRevenue } from "@/lib/format";
import { getSavedCompanyListDetail } from "@/lib/lists";

export default async function SavedListDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const detail = await getSavedCompanyListDetail(id);
  if (!detail) notFound();

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">{detail.list.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{detail.list.description ?? "説明なし"}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href="/lists">
                <ArrowLeft className="h-4 w-4" />
                リスト生成へ
              </Link>
            </Button>
            <CsvExportButton endpoint="/api/lists/export" queryString={`listId=${id}`} fileName={`${detail.list.name}.csv`} />
          </div>
        </div>

        <ListNotice params={query} />

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <QualityMetric label="件数" value={detail.quality.total} />
          <QualityMetric label="URLあり" value={detail.quality.withUrl} />
          <QualityMetric label="年商あり" value={detail.quality.withRevenue} />
          <QualityMetric label="従業員数あり" value={detail.quality.withEmployeeCount} />
          <QualityMetric label="推定年商" value={detail.quality.estimatedRevenue} />
          <QualityMetric label="低信頼" value={detail.quality.lowConfidence} />
        </div>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-base">リスト内企業</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>企業名</TableHead>
                  <TableHead>法人番号</TableHead>
                  <TableHead>業種</TableHead>
                  <TableHead className="text-right">従業員数</TableHead>
                  <TableHead className="text-right">年商</TableHead>
                  <TableHead>信頼度</TableHead>
                  <TableHead>最終更新</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.companies.length ? (
                  detail.companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <Link href={`/companies/${company.id}`} className="hover:underline">
                          {company.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{company.corporate_number ?? "-"}</TableCell>
                      <TableCell>{company.industry ?? "-"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(company.employee_count)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatRevenue(company.annual_revenue)}</TableCell>
                      <TableCell>
                        <ConfidenceBadge score={company.data_confidence_score} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(company.updated_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                      このリストに企業はありません。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function ListNotice({ params }: { params: Record<string, string | string[] | undefined> }) {
  const notice = value(params.notice);
  if (notice !== "saved") return null;
  return (
    <div role="alert" className="rounded-md border p-3 text-sm text-muted-foreground">
      リストを保存しました。以後この画面から再表示・CSV出力できます。
    </div>
  );
}

function QualityMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}
