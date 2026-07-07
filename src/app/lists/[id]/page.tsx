import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, GitCompare, Pencil } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { CsvExportButton } from "@/components/app/csv-export-button";
import { DeleteListButton } from "@/components/app/delete-list-button";
import { ListReadinessPanel } from "@/components/app/list-readiness-panel";
import { NoticeBanner } from "@/components/app/notice-banner";
import { QualityIssueBadges } from "@/components/app/quality-issue-badges";
import { ConfidenceBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompanyFilterBadges } from "@/lib/filter-labels";
import { formatDate, formatNumber, formatRevenue } from "@/lib/format";
import { sanitizeDownloadFileName } from "@/lib/file-name";
import { buildListDisplayRows, savedListDisplayLimit } from "@/lib/list-display";
import { getSavedCompanyListDetail, getSavedCompanyListPairComparison, getSavedCompanyLists } from "@/lib/lists";
import { firstSearchParam } from "@/lib/search-params";
import { companyFiltersToSearchParams, uuidLikeSchema } from "@/lib/validation";
import type { CompanyFilters, SavedCompanyList } from "@/lib/types";
import type { SavedCompanyListPairComparison } from "@/lib/lists";

export default async function SavedListDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!uuidLikeSchema.safeParse(id).success) notFound();
  const query = await searchParams;
  const rawCompareListId = firstSearchParam(query.compareListId);
  const compareListId = rawCompareListId && rawCompareListId !== id && uuidLikeSchema.safeParse(rawCompareListId).success ? rawCompareListId : undefined;
  const [detail, savedLists, pairComparison] = await Promise.all([
    getSavedCompanyListDetail(id),
    getSavedCompanyLists(),
    compareListId ? getSavedCompanyListPairComparison(id, compareListId) : Promise.resolve(null),
  ]);
  if (!detail) notFound();
  const display = buildListDisplayRows(detail.companies, savedListDisplayLimit);
  const compareWarning =
    rawCompareListId && !compareListId
      ? "別の保存リストを選択してください。"
      : compareListId && !pairComparison
        ? "比較対象の保存リストを読み込めませんでした。"
        : null;
  const listExportFileName = sanitizeDownloadFileName(`${detail.list.name}.csv`, "saved-company-list.csv");

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">{detail.list.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{detail.list.description ?? "説明なし"}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button asChild variant="secondary">
              <Link href="/lists">
                <ArrowLeft className="h-4 w-4" />
                リスト生成へ
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={editHref(detail.list)}>
                <Pencil className="h-4 w-4" />
                条件を再編集
              </Link>
            </Button>
            <CsvExportButton endpoint="/api/lists/export" queryString={`listId=${id}`} fileName={listExportFileName} />
            <form action="/api/lists/delete" method="post">
              <input type="hidden" name="id" value={id} />
              <DeleteListButton />
            </form>
          </div>
        </div>

        <ListNotice params={query} />

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
          <QualityMetric label="件数" value={detail.quality.total} />
          <QualityMetric label="URLあり" value={detail.quality.withUrl} />
          <QualityMetric label="年商あり" value={detail.quality.withRevenue} />
          <QualityMetric label="従業員数あり" value={detail.quality.withEmployeeCount} />
          <QualityMetric label="推定年商" value={detail.quality.estimatedRevenue} />
          <QualityMetric label="低信頼" value={detail.quality.lowConfidence} />
          <QualityMetric label="法人番号なし" value={detail.quality.missingCorporateNumber} />
        </div>
        <ListReadinessPanel quality={detail.quality} />
        <SavedListNextActions savedCount={detail.companies.length} currentCount={detail.comparison.currentCount} />

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-base">再生成チェック</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-5">
              <QualityMetric label="保存済み" value={detail.comparison.savedCount} />
              <QualityMetric label="現在条件" value={detail.comparison.currentCount} />
              <QualityMetric label="値変更" value={detail.comparison.changedCount} />
              <QualityMetric label="追加候補" value={detail.comparison.addedCount} />
              <QualityMetric label="除外候補" value={detail.comparison.removedCount} />
            </div>
            {detail.comparison.hasChanges ? (
              <div className="grid gap-3 md:grid-cols-3">
                <ChangedComparisonPreview companies={detail.comparison.changedCompanies} total={detail.comparison.changedCount} />
                <ComparisonPreview title="追加候補" companies={detail.comparison.addedCompanies} total={detail.comparison.addedCount} />
                <ComparisonPreview title="除外候補" companies={detail.comparison.removedCompanies} total={detail.comparison.removedCount} />
              </div>
            ) : (
              <NoticeBanner role={null}>保存済みリストは現在の条件結果と一致しています。</NoticeBanner>
            )}
          </CardContent>
        </Card>

        <SavedListPairComparisonCard currentListId={id} savedLists={savedLists} selectedListId={compareListId} comparison={pairComparison} warning={compareWarning} />

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-base">保存条件</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {filterBadges(detail.list.filters).length ? (
              filterBadges(detail.list.filters).map((badge) => (
                <span key={badge} className="rounded-sm border px-2 py-1 text-muted-foreground">
                  {badge}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">条件なし</span>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-base">リスト内企業</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <SavedListDisplaySummary display={display} />
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>企業名</TableHead>
                    <TableHead>法人番号</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>業種</TableHead>
                    <TableHead className="text-right">従業員数</TableHead>
                    <TableHead className="text-right">年商</TableHead>
                    <TableHead>信頼度</TableHead>
                    <TableHead>品質メモ</TableHead>
                    <TableHead>最終更新</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.companies.length ? (
                    display.visibleRows.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">
                          <Link href={`/companies/${company.id}`} className="hover:underline">
                            {company.name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{company.corporate_number ?? "-"}</TableCell>
                        <TableCell>
                          {company.official_url ? (
                            <a href={company.official_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm hover:underline">
                              URL
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{company.industry ?? "-"}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(company.employee_count)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatRevenue(company.annual_revenue)}</TableCell>
                        <TableCell>
                          <ConfidenceBadge score={company.data_confidence_score} />
                        </TableCell>
                        <TableCell>
                          <QualityIssueBadges company={company} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(company.updated_at)}</TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={excludeAndEditHref(detail.list, company.id)}>除外して再編集</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-40">
                        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center text-sm">
                          <div>
                            <p className="font-medium text-foreground">この保存リストには企業がありません。</p>
                            <p className="mt-1 text-muted-foreground">保存時の条件では0件です。条件を広げて再編集するか、リスト生成画面で新しい条件を試してください。</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={editHref(detail.list)}>
                                <Pencil className="h-4 w-4" />
                                条件を広げて再編集
                              </Link>
                            </Button>
                            <Button asChild variant="secondary" size="sm">
                              <Link href="/lists">
                                <ArrowLeft className="h-4 w-4" />
                                リスト生成へ戻る
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function SavedListPairComparisonCard({
  currentListId,
  savedLists,
  selectedListId,
  comparison,
  warning,
}: {
  currentListId: string;
  savedLists: SavedCompanyList[];
  selectedListId?: string;
  comparison: SavedCompanyListPairComparison | null;
  warning: string | null;
}) {
  const comparisonTargets = savedLists.filter((list) => list.id !== currentListId);

  return (
    <Card className="rounded-md" role="region" aria-label="保存リスト比較">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCompare className="h-4 w-4" />
          保存リスト比較
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form action={`/lists/${currentListId}`} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <label htmlFor="compareListId" className="block text-xs font-medium text-muted-foreground">
              比較する保存リスト
            </label>
            <select
              id="compareListId"
              name="compareListId"
              defaultValue={selectedListId ?? ""}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              disabled={!comparisonTargets.length}
              required={comparisonTargets.length > 0}
            >
              <option value="">{comparisonTargets.length ? "比較対象を選択" : "他の保存リストがありません"}</option>
              {comparisonTargets.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list.row_count})
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline" disabled={!comparisonTargets.length}>
            <GitCompare className="h-4 w-4" />
            比較
          </Button>
        </form>

        {warning ? <NoticeBanner variant="error">{warning}</NoticeBanner> : null}

        {comparison ? (
          <SavedListPairComparisonResult comparison={comparison} />
        ) : (
          <NoticeBanner role={null}>
            別の保存リストを選ぶと、再利用やCSV出力の前に追加・除外・値変更を確認できます。
          </NoticeBanner>
        )}
      </CardContent>
    </Card>
  );
}

function SavedListDisplaySummary({ display }: { display: ReturnType<typeof buildListDisplayRows> }) {
  return (
    <NoticeBanner role="status">
      画面表示は{display.visibleRows.length} / {display.totalCount}件です。CSV出力は保存済みの{display.totalCount}件すべてを対象にします。
      {display.isTruncated ? ` 残り${display.hiddenCount}件はCSVで確認できます。` : null}
    </NoticeBanner>
  );
}

function SavedListNextActions({ savedCount, currentCount }: { savedCount: number; currentCount: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-3" role="region" aria-label="次のアクション">
      <div className="rounded-md border p-3">
        <p className="text-sm font-medium">保存CSV</p>
        <p className="mt-1 text-xs text-muted-foreground">保存時点の{savedCount}件をそのまま出力</p>
      </div>
      <div className="rounded-md border p-3">
        <p className="text-sm font-medium">条件再編集</p>
        <p className="mt-1 text-xs text-muted-foreground">現在条件の{currentCount}件から再生成</p>
      </div>
      <div className="rounded-md border p-3">
        <p className="text-sm font-medium">差分比較</p>
        <p className="mt-1 text-xs text-muted-foreground">別リストとの差分をCSVで確認</p>
      </div>
    </div>
  );
}

function SavedListPairComparisonResult({ comparison }: { comparison: SavedCompanyListPairComparison }) {
  const exportQuery = new URLSearchParams({
    baseListId: comparison.baseList.id,
    targetListId: comparison.targetList.id,
  }).toString();
  const comparisonExportFileName = sanitizeDownloadFileName(`${comparison.baseList.name}-${comparison.targetList.name}-comparison.csv`, "saved-company-list-comparison.csv");

  return (
    <div className="space-y-3">
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{comparison.baseList.name}</span>
        <span className="mx-2">vs</span>
        <span className="font-medium text-foreground">{comparison.targetList.name}</span>
      </div>
      <div className="flex justify-end">
        <CsvExportButton endpoint="/api/lists/compare-export" queryString={exportQuery} fileName={comparisonExportFileName} />
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        <QualityMetric label="保存元" value={comparison.savedCount} />
        <QualityMetric label="比較先" value={comparison.currentCount} />
        <QualityMetric label="値変更" value={comparison.changedCount} />
        <QualityMetric label="追加" value={comparison.addedCount} />
        <QualityMetric label="除外" value={comparison.removedCount} />
      </div>
      {comparison.hasChanges ? (
        <div className="grid gap-3 md:grid-cols-3">
          <ChangedComparisonPreview companies={comparison.changedCompanies} total={comparison.changedCount} />
          <ComparisonPreview title="追加" companies={comparison.addedCompanies} total={comparison.addedCount} />
          <ComparisonPreview title="除外" companies={comparison.removedCompanies} total={comparison.removedCount} />
        </div>
      ) : (
        <NoticeBanner role={null}>2つの保存リストは同じ企業と比較対象項目で一致しています。</NoticeBanner>
      )}
    </div>
  );
}

function ListNotice({ params }: { params: Record<string, string | string[] | undefined> }) {
  const notice = firstSearchParam(params.notice);
  if (notice !== "saved" && notice !== "updated") return null;
  return <NoticeBanner>{notice === "updated" ? "リスト条件を更新しました。" : "リストを保存しました。以後この画面から再表示・CSV出力できます。"}</NoticeBanner>;
}

function QualityMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ComparisonPreview({
  title,
  companies,
  total,
}: {
  title: string;
  companies: { id: string; name: string; corporate_number: string | null }[];
  total: number;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-sm font-medium">
        {title}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {companies.length} / {total}件を表示
        </span>
      </p>
      {companies.length ? (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {companies.map((company) => (
            <li key={company.id} className="truncate">
              {company.name}
              {company.corporate_number ? <span className="ml-2 font-mono text-xs">{company.corporate_number}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">該当なし</p>
      )}
    </div>
  );
}

function ChangedComparisonPreview({
  companies,
  total,
}: {
  companies: {
    id: string;
    name: string;
    corporate_number: string | null;
    changes: { field: string; before: string | number | null; after: string | number | null }[];
  }[];
  total: number;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-sm font-medium">
        値変更
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {companies.length} / {total}件を表示
        </span>
      </p>
      {companies.length ? (
        <ul className="mt-2 space-y-3 text-sm text-muted-foreground">
          {companies.map((company) => (
            <li key={company.id} className="space-y-1">
              <p className="truncate font-medium text-foreground">
                {company.name}
                {company.corporate_number ? <span className="ml-2 font-mono text-xs text-muted-foreground">{company.corporate_number}</span> : null}
              </p>
              <ul className="space-y-1">
                {company.changes.slice(0, 3).map((change) => (
                  <li key={change.field} className="text-xs">
                    <span className="font-medium">{comparisonFieldLabel(change.field)}</span>: {formatComparisonValue(change.field, change.before)} → {formatComparisonValue(change.field, change.after)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">該当なし</p>
      )}
    </div>
  );
}

function comparisonFieldLabel(field: string) {
  const labels: Record<string, string> = {
    official_url: "URL",
    industry: "業種",
    employee_count: "従業員数",
    employee_count_type: "従業員数種別",
    annual_revenue: "年商",
    annual_revenue_type: "年商種別",
    data_confidence_score: "信頼度",
  };
  return labels[field] ?? field;
}

function formatComparisonValue(field: string, value: string | number | null) {
  if (value == null || value === "") return "-";
  if (field === "annual_revenue" && typeof value === "number") return formatRevenue(value);
  if (field === "employee_count" && typeof value === "number") return formatNumber(value);
  return String(value);
}

function editHref(list: { id: string; name: string; description: string | null; filters: CompanyFilters }) {
  const params = companyFiltersToSearchParams(list.filters);
  params.set("listId", list.id);
  params.set("name", list.name);
  if (list.description) params.set("description", list.description);
  return `/lists?${params.toString()}`;
}

function excludeAndEditHref(list: { id: string; name: string; description: string | null; filters: CompanyFilters }, companyId: string) {
  return editHref({
    ...list,
    filters: {
      ...list.filters,
      excludedCompanyIds: [...new Set([...(list.filters.excludedCompanyIds ?? []), companyId])],
    },
  });
}

function filterBadges(filters: CompanyFilters) {
  return formatCompanyFilterBadges(filters);
}
