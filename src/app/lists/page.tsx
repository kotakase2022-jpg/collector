import Link from "next/link";
import { FileSpreadsheet, Save, Search, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { CsvExportButton } from "@/components/app/csv-export-button";
import { CsvImportPreviewPanel } from "@/components/app/csv-import-preview";
import { QualityIssueBadges } from "@/components/app/quality-issue-badges";
import { ConfidenceBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getCompanies } from "@/lib/data";
import { formatDate, formatNumber, formatRevenue } from "@/lib/format";
import { buildListQualitySummary } from "@/lib/list-quality";
import { getSavedCompanyLists } from "@/lib/lists";
import { companyFiltersToSearchParams, employeeRangeOptions, parseCompanyFilters, revenueRangeOptions } from "@/lib/validation";
import type { CompanyFilters } from "@/lib/types";

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseCompanyFilters(params);
  const name = value(params.name) ?? "";
  const description = value(params.description) ?? "";
  const listId = value(params.listId);
  const hasPreview = Boolean(name || hasFilters(filters));
  const [savedLists, previewCompanies] = await Promise.all([getSavedCompanyLists(), hasPreview ? getCompanies(filters) : Promise.resolve([])]);
  const quality = buildListQualitySummary(previewCompanies);
  const exportQuery = companyFiltersToSearchParams(filters).toString();

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">リスト生成</h1>
            <p className="mt-1 text-sm text-muted-foreground">営業・調査・補完対象を条件で生成し、保存済みリストとして再利用します。</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/companies">企業一覧で詳しく見る</Link>
          </Button>
        </div>

        <ListNotice params={params} />

        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-base">条件設定</CardTitle>
            </CardHeader>
            <CardContent>
              <form action="/lists" className="space-y-4">
                {listId ? <input type="hidden" name="listId" value={listId} /> : null}
                <Field name="name" label="リスト名" defaultValue={name} placeholder="例: 関西物流フォローリスト" required />
                <div className="space-y-1.5">
                  <FieldLabel htmlFor="description">用途メモ</FieldLabel>
                  <Textarea id="description" name="description" defaultValue={description} placeholder="用途、確認方針、営業メモなど" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field name="prefecture" label="都道府県" defaultValue={filters.prefecture} placeholder="大阪府" />
                  <Field name="industry" label="業種" defaultValue={filters.industry} placeholder="物流、製造など" />
                  <NativeSelect name="employeeRange" label="従業員数" defaultValue={filters.employeeRange ?? ""}>
                    <option value="">すべて</option>
                    {employeeRangeOptions.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </NativeSelect>
                  <NativeSelect name="revenueRange" label="年商" defaultValue={filters.revenueRange ?? ""}>
                    <option value="">すべて</option>
                    {revenueRangeOptions.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </NativeSelect>
                  <NativeSelect name="hasUrl" label="URL" defaultValue={filters.hasUrl ?? ""}>
                    <option value="">すべて</option>
                    <option value="yes">URLあり</option>
                    <option value="no">URLなし</option>
                  </NativeSelect>
                  <NativeSelect name="valueKind" label="年商種別" defaultValue={filters.valueKind ?? ""}>
                    <option value="">すべて</option>
                    <option value="official">公式/報告値</option>
                    <option value="estimated">推定値</option>
                  </NativeSelect>
                  <NativeSelect name="hasRevenue" label="年商有無" defaultValue={filters.hasRevenue ?? ""}>
                    <option value="">すべて</option>
                    <option value="yes">年商あり</option>
                    <option value="no">年商なし</option>
                  </NativeSelect>
                  <NativeSelect name="hasEmployeeCount" label="従業員数有無" defaultValue={filters.hasEmployeeCount ?? ""}>
                    <option value="">すべて</option>
                    <option value="yes">従業員数あり</option>
                    <option value="no">従業員数なし</option>
                  </NativeSelect>
                  <Field name="minConfidence" label="最低信頼度" defaultValue={filters.minConfidence?.toString()} placeholder="80" type="number" min={0} max={100} />
                  <NativeSelect name="sort" label="並び替え" defaultValue={filters.sort ?? "confidence_desc"}>
                    <option value="confidence_desc">信頼度が高い順</option>
                    <option value="updated_desc">更新が新しい順</option>
                    <option value="employee_desc">従業員数が多い順</option>
                    <option value="revenue_desc">年商が大きい順</option>
                    <option value="name_asc">企業名順</option>
                  </NativeSelect>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    <Search className="h-4 w-4" />
                    リスト生成
                  </Button>
                  {hasPreview ? (
                    <Button asChild variant="ghost">
                      <Link href="/lists">クリア</Link>
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-base">生成結果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasPreview ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                    <QualityMetric label="件数" value={quality.total} />
                    <QualityMetric label="URLあり" value={quality.withUrl} />
                    <QualityMetric label="年商あり" value={quality.withRevenue} />
                    <QualityMetric label="従業員数あり" value={quality.withEmployeeCount} />
                    <QualityMetric label="推定年商" value={quality.estimatedRevenue} />
                    <QualityMetric label="低信頼" value={quality.lowConfidence} />
                  </div>
                  {quality.duplicateCorporateNumbers.length ? (
                    <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">
                      法人番号の重複があります: {quality.duplicateCorporateNumbers.join(", ")}
                    </p>
                  ) : (
                    <p className="rounded-md border p-3 text-sm text-muted-foreground">重複法人番号は検出されていません。</p>
                  )}
                  <QualityActions filters={filters} name={name} description={description} listId={listId} />
                  {filters.excludedCompanyIds?.length ? (
                    <p className="rounded-md border p-3 text-sm text-muted-foreground">
                      手動で{filters.excludedCompanyIds.length}件を除外中です。
                      <Link href={buildListHref({ ...filters, excludedCompanyIds: undefined }, name, description, listId)} className="ml-2 font-medium hover:underline">
                        除外をリセット
                      </Link>
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {previewCompanies.length ? (
                      <>
                        <form action={listId ? "/api/lists/update" : "/api/lists/create"} method="post">
                          {listId ? <input type="hidden" name="id" value={listId} /> : null}
                          <input type="hidden" name="name" value={name || "名称未設定リスト"} />
                          <input type="hidden" name="description" value={description} />
                          {hiddenFilterFields(filters)}
                          <Button type="submit">
                            <Save className="h-4 w-4" />
                            {listId ? "更新" : "保存"}
                          </Button>
                        </form>
                        <CsvExportButton queryString={exportQuery} fileName="generated-company-list.csv" />
                      </>
                    ) : null}
                  </div>
                  <ResultTable companies={previewCompanies} filters={filters} name={name} description={description} listId={listId} />
                </>
              ) : (
                <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-md border p-8 text-center">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">条件を設定すると、生成件数と品質チェックが表示されます。</p>
                  <p className="mt-1 text-sm text-muted-foreground">保存前に欠損、推定値、低信頼データを確認できます。</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-base">保存済みリスト</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {savedLists.length ? (
                savedLists.map((list) => (
                  <div key={list.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link href={`/lists/${list.id}`} className="block truncate text-sm font-medium hover:underline">
                          {list.name}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{list.description ?? "説明なし"}</p>
                      </div>
                      <span className="shrink-0 rounded-sm border px-2 py-1 text-xs tabular-nums">{list.row_count}件</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>更新: {formatDate(list.updated_at)}</span>
                      <Link href={editListHref(list)} className="hover:underline">
                        編集
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-3">保存済みリストはまだありません。</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="h-4 w-4" />
                CSV取込チェック
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CsvImportPreviewPanel />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function ResultTable({
  companies,
  filters,
  name,
  description,
  listId,
}: {
  companies: Awaited<ReturnType<typeof getCompanies>>;
  filters: CompanyFilters;
  name: string;
  description: string;
  listId?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>企業名</TableHead>
            <TableHead>法人番号</TableHead>
            <TableHead>業種</TableHead>
            <TableHead className="text-right">従業員数</TableHead>
            <TableHead className="text-right">年商</TableHead>
            <TableHead>信頼度</TableHead>
            <TableHead>品質メモ</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.length ? (
            companies.slice(0, 20).map((company) => (
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
                <TableCell>
                  <QualityIssueBadges company={company} />
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={buildExcludeHref(filters, company.id, name, description, listId)}>除外</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                条件に一致する企業はありません。条件を広げてください。
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ListNotice({ params }: { params: Record<string, string | string[] | undefined> }) {
  const notice = value(params.notice);
  const error = value(params.error);
  if (!notice && !error) return null;

  const message =
    error === "invalid-list"
      ? "リスト名を入力してください。"
      : error === "operation-failed"
        ? "リスト保存に失敗しました。Supabase設定と権限を確認してください。"
        : error === "not-found"
          ? "対象の保存済みリストが見つかりませんでした。"
        : notice === "dry-run"
          ? `Supabase未設定のため保存は行わず、${value(params.rowCount) ?? "0"}件のプレビューとして表示しています。`
          : notice === "dry-run-update"
            ? `Supabase未設定のため更新は行わず、${value(params.rowCount) ?? "0"}件のプレビューとして表示しています。`
            : notice === "dry-run-delete"
              ? "Supabase未設定のため削除は行わず、プレビューとして処理しました。"
              : notice === "deleted"
                ? "リストを削除しました。"
                : "リストを保存しました。";

  return (
    <div role="alert" className={`rounded-md border p-3 text-sm ${error ? "border-destructive text-destructive" : "text-muted-foreground"}`}>
      {message}
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

function QualityActions({ filters, name, description, listId }: { filters: CompanyFilters; name: string; description: string; listId?: string }) {
  const actions = [
    { label: "URLありのみ", patch: { hasUrl: "yes" as const } },
    { label: "年商ありのみ", patch: { hasRevenue: "yes" as const } },
    { label: "従業員数ありのみ", patch: { hasEmployeeCount: "yes" as const } },
    { label: "推定年商を除外", patch: { hasRevenue: "yes" as const, valueKind: "official" as const } },
    { label: "信頼度60以上", patch: { minConfidence: 60 } },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button key={action.label} asChild variant="outline" size="sm">
          <Link href={buildListHref({ ...filters, ...action.patch }, name, description, listId)}>{action.label}</Link>
        </Button>
      ))}
    </div>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={props.name}>{label}</FieldLabel>
      <Input id={props.name} {...props} />
    </div>
  );
}

function NativeSelect({
  label,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={props.name}>{label}</FieldLabel>
      <select
        id={props.name}
        {...props}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}

function hiddenFilterFields(filters: CompanyFilters) {
  return [...companyFiltersToSearchParams(filters).entries()].map(([key, fieldValue]) => <input key={key} type="hidden" name={key} value={fieldValue} />);
}

function editListHref(list: { id: string; name: string; description: string | null; filters: CompanyFilters }) {
  return buildListHref(list.filters, list.name, list.description ?? "", list.id);
}

function buildListHref(filters: CompanyFilters, name: string, description: string, listId?: string) {
  const params = companyFiltersToSearchParams(filters);
  if (listId) params.set("listId", listId);
  if (name) params.set("name", name);
  if (description) params.set("description", description);
  return `/lists?${params.toString()}`;
}

function buildExcludeHref(filters: CompanyFilters, companyId: string, name: string, description: string, listId?: string) {
  return buildListHref(
    {
      ...filters,
      excludedCompanyIds: [...new Set([...(filters.excludedCompanyIds ?? []), companyId])],
    },
    name,
    description,
    listId,
  );
}

function hasFilters(filters: CompanyFilters) {
  return [...companyFiltersToSearchParams(filters).keys()].length > 0;
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}
