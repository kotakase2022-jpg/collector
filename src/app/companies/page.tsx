import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { CsvExportButton } from "@/components/app/csv-export-button";
import { ConfidenceBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCompanies } from "@/lib/data";
import { formatDate, formatNumber, formatRevenue } from "@/lib/format";
import { employeeRangeOptions, parseCompanyFilters, revenueRangeOptions } from "@/lib/validation";
import type { CompanyFilters, SourceKind } from "@/lib/types";

const employeeRangeLabels = ["1-9名", "10-49名", "50-299名", "300-999名", "1000名以上"];
const revenueRangeLabels = ["1億円未満", "1億-10億円", "10億-100億円", "100億-1000億円", "1000億円以上"];

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseCompanyFilters(params);
  const companies = await getCompanies(filters);
  const hasActiveFilters = hasFilters(filters);
  const exportQuery = buildFilterQuery(filters);
  const filterFormKey = exportQuery;
  const notice = companyNotice(params.error);

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">企業一覧</h1>
            <p className="mt-1 text-sm text-muted-foreground">法人番号、企業名、URL、業種、従業員数、年商を出所つきで検索できます。</p>
          </div>
          <CsvExportButton queryString={exportQuery} />
        </div>

        {notice ? (
          <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {notice}
          </div>
        ) : null}

        <Card className="rounded-md">
          <CardContent className="pt-6">
            <form key={filterFormKey} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="relative xl:col-span-2">
                <FieldLabel htmlFor="q">検索</FieldLabel>
                <Search className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-muted-foreground" />
                <Input id="q" name="q" defaultValue={filters.q} placeholder="企業名・法人番号・URL・業種・所在地" className="pl-9" />
              </div>
              <Field name="prefecture" label="都道府県" defaultValue={filters.prefecture} placeholder="東京都" />
              <Field name="industry" label="業種" defaultValue={filters.industry} placeholder="製造、物流など" />
              <NativeSelect name="employeeRange" label="従業員数レンジ" defaultValue={filters.employeeRange ?? ""}>
                <option value="">すべて</option>
                {employeeRangeOptions.map((range, index) => (
                  <option key={range} value={range}>
                    {employeeRangeLabels[index] ?? range}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect name="revenueRange" label="年商レンジ" defaultValue={filters.revenueRange ?? ""}>
                <option value="">すべて</option>
                {revenueRangeOptions.map((range, index) => (
                  <option key={range} value={range}>
                    {revenueRangeLabels[index] ?? range}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect name="hasUrl" label="URL" defaultValue={filters.hasUrl ?? ""}>
                <option value="">URLすべて</option>
                <option value="yes">URLあり</option>
                <option value="no">URLなし</option>
              </NativeSelect>
              <NativeSelect name="hasCorporateNumber" label="法人番号" defaultValue={filters.hasCorporateNumber ?? ""}>
                <option value="">法人番号すべて</option>
                <option value="yes">法人番号あり</option>
                <option value="no">法人番号なし</option>
              </NativeSelect>
              <NativeSelect name="hasRevenue" label="年商" defaultValue={filters.hasRevenue ?? ""}>
                <option value="">年商すべて</option>
                <option value="yes">年商あり</option>
                <option value="no">年商なし</option>
              </NativeSelect>
              <NativeSelect name="hasEmployeeCount" label="従業員数" defaultValue={filters.hasEmployeeCount ?? ""}>
                <option value="">従業員数すべて</option>
                <option value="yes">従業員数あり</option>
                <option value="no">従業員数なし</option>
              </NativeSelect>
              <NativeSelect name="valueKind" label="値種別" defaultValue={filters.valueKind ?? ""}>
                <option value="">値種別すべて</option>
                <option value="official">公式・報告値</option>
                <option value="estimated">推定値</option>
              </NativeSelect>
              <Field name="minConfidence" label="最低信頼度" defaultValue={filters.minConfidence?.toString()} placeholder="80" type="number" min={0} max={100} />
              <NativeSelect name="sort" label="並び替え" defaultValue={filters.sort ?? "updated_desc"}>
                <option value="updated_desc">更新が新しい順</option>
                <option value="confidence_desc">信頼度が高い順</option>
                <option value="revenue_desc">年商が大きい順</option>
                <option value="employee_desc">従業員数が多い順</option>
                <option value="name_asc">企業名順</option>
              </NativeSelect>
              <div className="flex items-end gap-2">
                <Button type="submit">検索</Button>
                {hasActiveFilters ? (
                  <Button asChild variant="ghost">
                    <Link href="/companies">解除</Link>
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-muted-foreground">
              <span>{companies.length}件</span>
              {hasActiveFilters ? <span>現在の条件はCSV出力にも反映されます</span> : null}
            </div>
            <div className="overflow-x-auto">
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
                    <TableHead>データソース</TableHead>
                    <TableHead>最終更新</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length ? (
                    companies.map((company) => (
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
                          <SourceBadges sourceTypes={company.source_types ?? []} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(company.updated_at)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-sm text-muted-foreground">
                        条件に一致する企業はありません。条件を解除するか、信頼度やレンジを広げてください。
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

function companyNotice(error: string | string[] | undefined) {
  const code = Array.isArray(error) ? error[0] : error;
  if (code === "invalid-company") {
    return "企業を特定できなかったため、操作を実行できませんでした。対象企業が削除済みか、URLが不正な可能性があります。";
  }
  return null;
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

const sourceLabels: Record<SourceKind, string> = {
  nta: "NTA",
  gbizinfo: "gBiz",
  edinet: "EDINET",
  shokuba: "職場情報",
  official_site: "公式",
  third_party: "第三者",
  search: "検索",
  llm_extraction: "LLM",
};

function SourceBadges({ sourceTypes }: { sourceTypes: SourceKind[] }) {
  if (!sourceTypes.length) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {sourceTypes.slice(0, 3).map((sourceType) => (
        <Badge key={sourceType} variant="outline" className="rounded-sm">
          {sourceLabels[sourceType]}
        </Badge>
      ))}
      {sourceTypes.length > 3 ? <span className="text-xs text-muted-foreground">+{sourceTypes.length - 3}</span> : null}
    </div>
  );
}

function hasFilters(filters: CompanyFilters) {
  return Boolean(
    filters.q ||
      filters.prefecture ||
      filters.industry ||
      filters.employeeRange ||
      filters.revenueRange ||
      filters.hasUrl ||
      filters.hasCorporateNumber ||
      filters.hasRevenue ||
      filters.hasEmployeeCount ||
      filters.valueKind ||
      filters.minConfidence != null ||
      (filters.sort != null && filters.sort !== "updated_desc"),
  );
}

function buildFilterQuery(filters: CompanyFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === "") continue;
    params.set(key, String(value));
  }
  return params.toString();
}
