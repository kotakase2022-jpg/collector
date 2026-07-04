import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { CsvExportButton } from "@/components/app/csv-export-button";
import { ConfidenceBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCompanies } from "@/lib/data";
import { formatDate, formatNumber, formatRevenue } from "@/lib/format";
import { parseCompanyFilters } from "@/lib/validation";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseCompanyFilters(params);
  const companies = await getCompanies(filters);

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">企業一覧</h1>
            <p className="mt-1 text-sm text-muted-foreground">法人番号、企業名、URL、業種、従業員数、年商を出所つきで検索します。</p>
          </div>
          <CsvExportButton />
        </div>

        <Card className="rounded-md">
          <CardContent className="pt-6">
            <form className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input name="q" defaultValue={filters.q} placeholder="企業名・法人番号" className="pl-9" />
              </div>
              <Input name="prefecture" defaultValue={filters.prefecture} placeholder="都道府県" />
              <Input name="industry" defaultValue={filters.industry} placeholder="業種" />
              <NativeSelect name="hasUrl" defaultValue={filters.hasUrl ?? ""}>
                <option value="">URLすべて</option>
                <option value="yes">URLあり</option>
                <option value="no">URLなし</option>
              </NativeSelect>
              <NativeSelect name="valueKind" defaultValue={filters.valueKind ?? ""}>
                <option value="">値種別すべて</option>
                <option value="official">公式/報告値</option>
                <option value="estimated">推定値</option>
              </NativeSelect>
              <Button type="submit">検索</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardContent className="p-0">
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
                  <TableHead>最終更新</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
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
                    <TableCell className="text-xs text-muted-foreground">{formatDate(company.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function NativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    />
  );
}

