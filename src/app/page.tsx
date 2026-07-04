import Link from "next/link";
import { AlertTriangle, Building2, CalendarClock, CircleDollarSign, Database, Globe2, Users } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { MetricCard } from "@/components/app/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getCompanies, getDashboardMetrics, getJobs } from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/format";

export default async function DashboardPage() {
  const [metrics, companies, jobs] = await Promise.all([getDashboardMetrics(), getCompanies({}), getJobs()]);
  const recentErrors = jobs.filter((job) => job.status === "failed").slice(0, 4);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">日本企業データ収集ダッシュボード</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              法人番号を母集団に、出所つきでURL・業種・従業員数・年商を更新します。
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/lists">リスト生成</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/companies">企業一覧</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="総企業数" value={formatNumber(metrics.totalCompanies)} caption="法人番号ベースの母集団" icon={Database} />
          <MetricCard title="URL取得済み" value={formatNumber(metrics.withUrl)} caption="信頼度80以上を採用" icon={Globe2} />
          <MetricCard title="従業員数取得済み" value={formatNumber(metrics.withEmployeeCount)} caption="公式・報告・推定を分離" icon={Users} />
          <MetricCard title="年商取得済み" value={formatNumber(metrics.withAnnualRevenue)} caption="推定は明示して管理" icon={CircleDollarSign} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-base">収集品質</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <QualityRow label="業種取得率" value={rate(metrics.withIndustry, metrics.totalCompanies)} />
              <QualityRow label="URL特定率" value={rate(metrics.withUrl, metrics.totalCompanies)} />
              <QualityRow label="従業員数取得率" value={rate(metrics.withEmployeeCount, metrics.totalCompanies)} />
              <QualityRow label="年商取得率" value={rate(metrics.withAnnualRevenue, metrics.totalCompanies)} />
              <Separator />
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">公式情報比率</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{formatPercent(metrics.officialRatio)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">推定値比率</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{formatPercent(metrics.estimatedRatio)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">データ鮮度</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {metrics.freshnessDays == null ? "-" : `${metrics.freshnessDays}日`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-base">クロール状態</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MetricMini label="実行中ジョブ" value={metrics.runningJobs} icon={CalendarClock} />
                <MetricMini label="エラー件数" value={metrics.errorJobs} icon={AlertTriangle} />
              </div>
              <Separator />
              <div className="space-y-3">
                {recentErrors.length ? (
                  recentErrors.map((job) => (
                    <div key={job.id} className="rounded-md border p-3">
                      <p className="text-sm font-medium">{job.company_name ?? "未紐付け"}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{job.error_message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">未解決のエラーはありません。</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-base">最近の企業</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {companies.slice(0, 4).map((company) => (
                <Link key={company.id} href={`/companies/${company.id}`} className="rounded-md border p-4 hover:bg-accent">
                  <p className="truncate text-sm font-medium">{company.name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{company.industry ?? "業種未取得"}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {company.prefecture ?? "-"}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function QualityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function MetricMini({ label, value, icon: Icon }: { label: string; value: number; icon: typeof CalendarClock }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <p className="text-xs">{label}</p>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums">{formatNumber(value)}</p>
    </div>
  );
}

function rate(value: number, total: number) {
  return total <= 0 ? 0 : Math.round((value / total) * 100);
}
