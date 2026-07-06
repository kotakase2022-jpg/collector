import Link from "next/link";
import { ExternalLink, FileSpreadsheet, Save, Search, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { CsvExportButton } from "@/components/app/csv-export-button";
import { CsvImportPreviewPanel } from "@/components/app/csv-import-preview";
import { ListFormStateLink } from "@/components/app/list-form-state-link";
import { ListReadinessPanel } from "@/components/app/list-readiness-panel";
import { QualityIssueBadges } from "@/components/app/quality-issue-badges";
import { ConfidenceBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { exportRowLimit, getCompanies } from "@/lib/data";
import { formatCompanyFilterBadges } from "@/lib/filter-labels";
import { formatDate, formatNumber, formatRevenue } from "@/lib/format";
import { buildListDisplayRows, generatedListDisplayLimit } from "@/lib/list-display";
import { buildListQualitySummary } from "@/lib/list-quality";
import { getSavedCompanyLists } from "@/lib/lists";
import {
  companyFiltersToSearchParams,
  employeeRangeOptions,
  hasCompanyGenerationCriteria,
  listDescriptionMaxLength,
  listNameMaxLength,
  parseCompanyFilters,
  revenueRangeOptions,
  uuidLikeSchema,
} from "@/lib/validation";
import type { CompanyFilters } from "@/lib/types";

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const listFormId = "list-generation-form";
  const params = await searchParams;
  const filters = parseCompanyFilters(params);
  const name = value(params.name) ?? "";
  const description = value(params.description) ?? "";
  const rawListId = value(params.listId);
  const listId = rawListId && uuidLikeSchema.safeParse(rawListId).success ? rawListId : undefined;
  const hasPreview = hasCompanyGenerationCriteria(filters);
  const [savedLists, previewCompanies] = await Promise.all([getSavedCompanyLists(), hasPreview ? getCompanies(filters, { limit: exportRowLimit }) : Promise.resolve([])]);
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
              <form id={listFormId} action="/lists" className="space-y-4">
                {listId ? <input type="hidden" name="listId" value={listId} /> : null}
                {filters.excludedCompanyIds?.length ? <input type="hidden" name="excludedCompanyIds" value={filters.excludedCompanyIds.join(",")} /> : null}
                <Field name="name" label="リスト名" defaultValue={name} placeholder="例: 関西物流フォローリスト" maxLength={listNameMaxLength} />
                <div className="space-y-1.5">
                  <FieldLabel htmlFor="description">用途メモ</FieldLabel>
                  <Textarea id="description" name="description" defaultValue={description} placeholder="用途、確認方針、営業メモなど" maxLength={listDescriptionMaxLength} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative sm:col-span-2">
                    <FieldLabel htmlFor="q">検索</FieldLabel>
                    <Search className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-muted-foreground" />
                    <Input id="q" name="q" defaultValue={filters.q} placeholder="企業名・法人番号・URL・業種・所在地" className="pl-9" />
                  </div>
                  <NativeSelect name="scope" label="対象範囲" defaultValue={filters.scope ?? ""}>
                    <option value="">条件で絞り込む</option>
                    <option value="all">全企業を生成対象にする</option>
                  </NativeSelect>
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
                  <NativeSelect name="hasCorporateNumber" label="法人番号" defaultValue={filters.hasCorporateNumber ?? ""}>
                    <option value="">すべて</option>
                    <option value="yes">法人番号あり</option>
                    <option value="no">法人番号なし</option>
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
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
                    <QualityMetric label="件数" value={quality.total} />
                    <QualityMetric label="URLあり" value={quality.withUrl} />
                    <QualityMetric label="年商あり" value={quality.withRevenue} />
                    <QualityMetric label="従業員数あり" value={quality.withEmployeeCount} />
                    <QualityMetric label="推定年商" value={quality.estimatedRevenue} />
                    <QualityMetric label="低信頼" value={quality.lowConfidence} />
                    <QualityMetric label="法人番号なし" value={quality.missingCorporateNumber} />
                  </div>
                  <ListReadinessPanel quality={quality} />
                  {quality.duplicateCorporateNumbers.length ? (
                    <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">
                      法人番号の重複があります: {quality.duplicateCorporateNumbers.join(", ")}
                    </p>
                  ) : (
                    <p className="rounded-md border p-3 text-sm text-muted-foreground">重複法人番号は検出されていません。</p>
                  )}
                  <QualityActions filters={filters} name={name} description={description} listId={listId} formId={listFormId} />
                  <ActiveFilterSummary filters={filters} />
                  {filters.excludedCompanyIds?.length ? (
                    <p className="rounded-md border p-3 text-sm text-muted-foreground">
                      手動で{filters.excludedCompanyIds.length}件を除外中です。
                      <ListFormStateLink
                        href={buildListHref({ ...filters, excludedCompanyIds: undefined }, name, description, listId)}
                        formId={listFormId}
                        removeKeys={["excludedCompanyIds"]}
                        className="ml-2 font-medium hover:underline"
                      >
                        除外をリセット
                      </ListFormStateLink>
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {previewCompanies.length ? (
                      <>
                        <ListSaveButton formId={listFormId} listId={listId} />
                        <CsvExportButton queryString={exportQuery} fileName="generated-company-list.csv" />
                      </>
                    ) : null}
                  </div>
                  {!previewCompanies.length ? <NoResultRecovery filters={filters} name={name} description={description} listId={listId} formId={listFormId} /> : null}
                  <ResultTable companies={previewCompanies} filters={filters} name={name} description={description} listId={listId} formId={listFormId} />
                </>
              ) : (
                <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-md border p-8 text-center">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">条件を設定すると、生成件数と品質チェックが表示されます。</p>
                  <p className="mt-1 text-sm text-muted-foreground">全企業を対象にする場合は、対象範囲で明示的に選択してください。</p>
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
                    <SavedListFilterSummary filters={list.filters} />
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

function SavedListFilterSummary({ filters }: { filters: CompanyFilters }) {
  const badges = formatCompanyFilterBadges(filters);
  if (!badges.length) return null;
  const visibleBadges = badges.slice(0, 3);
  const hiddenCount = badges.length - visibleBadges.length;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5" aria-label="保存条件">
      {visibleBadges.map((badge) => (
        <span key={badge} className="rounded-sm border px-2 py-1 text-xs text-muted-foreground">
          {badge}
        </span>
      ))}
      {hiddenCount > 0 ? <span className="rounded-sm border px-2 py-1 text-xs text-muted-foreground">+{hiddenCount}</span> : null}
    </div>
  );
}

function ResultTable({
  companies,
  filters,
  name,
  description,
  listId,
  formId,
}: {
  companies: Awaited<ReturnType<typeof getCompanies>>;
  filters: CompanyFilters;
  name: string;
  description: string;
  listId?: string;
  formId: string;
}) {
  const display = buildListDisplayRows(companies, generatedListDisplayLimit);

  return (
    <div className="space-y-2">
      {display.isTruncated ? (
        <p role="status" className="rounded-md border p-3 text-sm text-muted-foreground">
          画面表示は先頭{display.visibleRows.length}件です。保存とCSV出力は生成済みの{display.totalCount}件すべてを対象にします。
        </p>
      ) : null}
      {companies.length >= exportRowLimit ? (
        <p role="status" className="rounded-md border border-amber-200 p-3 text-sm text-amber-700">
          生成対象が上限の{exportRowLimit.toLocaleString("ja-JP")}件に達しています。条件を追加すると、より絞り込んだリストになります。
        </p>
      ) : null}
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
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length ? (
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
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <ListFormStateLink
                        href={buildExcludeHref(filters, company.id, name, description, listId)}
                        formId={formId}
                        patch={{ excludedCompanyIds: appendExcludedCompanyId(filters, company.id).join(",") }}
                      >
                        除外
                      </ListFormStateLink>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-sm text-muted-foreground">
                  条件に一致する企業はありません。条件を広げてください。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ListNotice({ params }: { params: Record<string, string | string[] | undefined> }) {
  const notice = value(params.notice);
  const error = value(params.error);
  const action = value(params.action);
  if (!notice && !error) return null;

  const message =
    error === "invalid-name"
      ? "リスト名を入力してください。"
      : error === "invalid-description"
        ? `用途メモは${listDescriptionMaxLength}文字以内で入力してください。`
      : error === "invalid-list-id"
        ? "保存済みリストを特定できませんでした。リスト一覧から選び直してください。"
        : error === "invalid-list"
          ? "リスト情報を確認してください。"
          : error === "no-criteria"
            ? "保存するには条件を1つ以上設定するか、対象範囲で全企業を明示的に選択してください。"
            : error === "operation-failed" && action === "delete"
              ? "リスト削除に失敗しました。対象リストは削除されていません。Supabase設定と保存済みリスト権限を確認してから再実行してください。"
            : error === "operation-failed"
              ? "リスト操作に失敗しました。保存・更新時の入力条件は保持されています。Supabase設定、RPC権限、保存済みリスト権限を確認してから再実行してください。"
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

function ListSaveButton({ formId, listId }: { formId: string; listId?: string }) {
  if (listId) {
    return (
      <Button type="submit" form={formId} formAction="/api/lists/update" formMethod="post" name="id" value={listId}>
        <Save className="h-4 w-4" />
        更新
      </Button>
    );
  }

  return (
    <Button type="submit" form={formId} formAction="/api/lists/create" formMethod="post">
      <Save className="h-4 w-4" />
      保存
    </Button>
  );
}

function QualityActions({ filters, name, description, listId, formId }: { filters: CompanyFilters; name: string; description: string; listId?: string; formId: string }) {
  const actions = [
    { label: "URLありのみ", patch: { hasUrl: "yes" as const } },
    { label: "法人番号ありのみ", patch: { hasCorporateNumber: "yes" as const } },
    { label: "年商ありのみ", patch: { hasRevenue: "yes" as const } },
    { label: "従業員数ありのみ", patch: { hasEmployeeCount: "yes" as const } },
    { label: "推定年商を除外", patch: { hasRevenue: "yes" as const, valueKind: "official" as const } },
    { label: "信頼度60以上", patch: { minConfidence: 60 } },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button key={action.label} asChild variant="outline" size="sm">
          <ListFormStateLink href={buildListHref({ ...filters, ...action.patch }, name, description, listId)} formId={formId} patch={action.patch}>
            {action.label}
          </ListFormStateLink>
        </Button>
      ))}
    </div>
  );
}

function NoResultRecovery({ filters, name, description, listId, formId }: { filters: CompanyFilters; name: string; description: string; listId?: string; formId: string }) {
  const actions = buildNoResultRecoveryActions(filters);

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-medium">条件に一致する企業がありません。まず条件を1つ外して再生成できます。</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button key={action.label} asChild variant="outline" size="sm" className="bg-background">
            <ListFormStateLink
              href={buildListHref(applyRecoveryAction(filters, action), name, description, listId)}
              formId={formId}
              removeKeys={action.removeKeys}
              patch={action.linkPatch}
            >
              {action.label}
            </ListFormStateLink>
          </Button>
        ))}
      </div>
    </div>
  );
}

type RecoveryAction = {
  label: string;
  removeKeys: Array<keyof CompanyFilters>;
  patch?: Partial<CompanyFilters>;
  linkPatch?: Record<string, string | number | null>;
};

const strictFilterKeys = [
  "employeeRange",
  "revenueRange",
  "hasUrl",
  "hasCorporateNumber",
  "hasRevenue",
  "hasEmployeeCount",
  "valueKind",
  "minConfidence",
] satisfies Array<keyof CompanyFilters>;

const allNarrowingFilterKeys = ["q", "prefecture", "industry", ...strictFilterKeys, "excludedCompanyIds"] satisfies Array<keyof CompanyFilters>;

function buildNoResultRecoveryActions(filters: CompanyFilters): RecoveryAction[] {
  const actions: RecoveryAction[] = [];
  if (filters.excludedCompanyIds?.length) actions.push({ label: "手動除外を解除", removeKeys: ["excludedCompanyIds"] });
  if (filters.q) actions.push({ label: "検索語を外す", removeKeys: ["q"] });
  if (filters.prefecture) actions.push({ label: "都道府県を外す", removeKeys: ["prefecture"] });
  if (filters.industry) actions.push({ label: "業種を外す", removeKeys: ["industry"] });
  if (strictFilterKeys.some((key) => filters[key] != null)) actions.push({ label: "レンジ・有無条件を緩める", removeKeys: [...strictFilterKeys] });
  actions.push({ label: "全企業で再生成", removeKeys: [...allNarrowingFilterKeys], patch: { scope: "all" }, linkPatch: { scope: "all" } });
  return actions;
}

function applyRecoveryAction(filters: CompanyFilters, action: RecoveryAction): CompanyFilters {
  const next: CompanyFilters = { ...filters };
  for (const key of action.removeKeys) {
    delete next[key];
  }
  if (action.patch) {
    return { ...next, ...action.patch };
  }
  return next;
}

function ActiveFilterSummary({ filters }: { filters: CompanyFilters }) {
  const badges = formatCompanyFilterBadges(filters);
  if (!badges.length) return null;

  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">現在の条件</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span key={badge} className="rounded-sm border px-2 py-1 text-xs text-muted-foreground">
            {badge}
          </span>
        ))}
      </div>
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
      excludedCompanyIds: appendExcludedCompanyId(filters, companyId),
    },
    name,
    description,
    listId,
  );
}

function appendExcludedCompanyId(filters: CompanyFilters, companyId: string) {
  return [...new Set([...(filters.excludedCompanyIds ?? []), companyId])];
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}
