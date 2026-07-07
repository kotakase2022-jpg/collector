import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, RefreshCw, Save } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { ConfidenceBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCompanyDetail } from "@/lib/data";
import { formatDate, formatNumber, formatRevenue } from "@/lib/format";
import { firstSearchParam } from "@/lib/search-params";
import { uuidLikeSchema } from "@/lib/validation";

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!uuidLikeSchema.safeParse(id).success) notFound();
  const query = await searchParams;
  const detail = await getCompanyDetail(id);
  if (!detail) notFound();
  const { company, observations, sources } = detail;

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-normal">{company.name}</h1>
              <ConfidenceBadge score={company.data_confidence_score} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {company.corporate_number ?? "法人番号なし"} / {company.address ?? "所在地未取得"}
            </p>
          </div>
          <div className="flex gap-2">
            <form action="/api/companies/recrawl" method="post">
              <input type="hidden" name="id" value={company.id} />
              <Button type="submit" variant="secondary">
                <RefreshCw className="h-4 w-4" />
                再クロール
              </Button>
            </form>
            <form action="/api/companies/manual-review" method="post">
              <input type="hidden" name="id" value={company.id} />
              <Button type="submit" variant="outline">
                <Save className="h-4 w-4" />
                手動修正
              </Button>
            </form>
          </div>
        </div>

        <CompanyNotice params={query} />

        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-base">採用された最終値</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Fact label="公式URL" value={company.official_url ? <ExternalUrl href={company.official_url} /> : "-"} />
              <Fact label="業種" value={company.industry ?? "-"} />
              <Fact label="従業員数" value={`${formatNumber(company.employee_count)} / ${company.employee_count_type}`} />
              <Fact label="年商" value={`${formatRevenue(company.annual_revenue)} / ${company.annual_revenue_type}`} />
              <Fact label="年商レンジ" value={company.revenue_range ?? "-"} />
              <Separator />
              <Fact label="更新日時" value={formatDate(company.updated_at)} />
              <Fact label="カバレッジ" value={`${company.coverage_score}/100`} />
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-base">項目ごとの候補値</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>項目</TableHead>
                    <TableHead>観測値</TableHead>
                    <TableHead>正規化値</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead>信頼度</TableHead>
                    <TableHead>方法</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {observations.length ? (
                    observations.map((observation) => (
                      <TableRow key={observation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {observation.field_name}
                            {observation.is_selected ? <Badge variant="secondary">採用</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[360px] truncate">{observation.observed_value ?? "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{observation.normalized_value ?? "-"}</TableCell>
                        <TableCell>{observation.source_type}</TableCell>
                        <TableCell>
                          <ConfidenceBadge score={observation.confidence_score} />
                        </TableCell>
                        <TableCell>{observation.extraction_method}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-28 text-center text-sm text-muted-foreground">
                        候補値はまだありません。再クロールまたは手動修正で検証ジョブを作成できます。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-base">ソースと根拠</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {sources.length ? (
              sources.map((source) => (
                <div key={source.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{source.source_title ?? source.source_type}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(source.fetched_at)}</p>
                    </div>
                    <ConfidenceBadge score={source.confidence_score} />
                  </div>
                  {source.source_url ? (
                    <a href={source.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm hover:underline">
                      source_url
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                  {source.raw_text ? <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{source.raw_text}</p> : null}
                </div>
              ))
            ) : (
              <div className="rounded-md border p-4 text-sm text-muted-foreground lg:col-span-2">
                ソースはまだ保存されていません。再クロールで取得理由とsource_urlを追加できます。
              </div>
            )}
          </CardContent>
        </Card>

        <Button asChild variant="ghost" className="w-fit">
          <Link href="/companies">一覧に戻る</Link>
        </Button>
      </div>
    </AppShell>
  );
}

function CompanyNotice({ params }: { params: Record<string, string | string[] | undefined> }) {
  const notice = firstSearchParam(params.notice);
  const error = firstSearchParam(params.error);
  if (!notice && !error) return null;

  const message =
    error === "operation-failed"
      ? "ジョブ登録に失敗しました。接続設定とSupabaseの権限を確認してください。"
      : notice === "recrawl"
        ? "再クロールジョブを作成しました。クロール管理で進行状況を確認できます。"
        : notice === "manual-review"
          ? "手動修正用の検証ジョブを作成しました。候補値とソースを確認して反映してください。"
          : "Supabase未設定のため、ジョブは保存されずプレビューとして処理されました。";

  return (
    <div role="alert" className={`rounded-md border p-3 text-sm ${error ? "border-destructive text-destructive" : "text-muted-foreground"}`}>
      {message}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{value}</dd>
    </div>
  );
}

function ExternalUrl({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 hover:underline">
      <span className="truncate">{href}</span>
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  );
}
