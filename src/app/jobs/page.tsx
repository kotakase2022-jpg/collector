import { RefreshCw, Square, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { JobStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getJobs } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const jobs = await getJobs();
  const completed = jobs.filter((job) => job.status === "completed").length;
  const successRate = jobs.length ? Math.round((completed / jobs.length) * 100) : 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">クロール管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">ジョブの状態、成功率、エラー内容、リトライ、停止、優先度変更を管理します。</p>
        </div>

        <JobNotice params={params} />

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="rounded-md">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">ジョブ総数</p>
              <p className="mt-1 text-2xl font-semibold">{jobs.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-md">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">成功率</p>
              <p className="mt-1 text-2xl font-semibold">{successRate}%</p>
            </CardContent>
          </Card>
          <Card className="rounded-md">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">失敗</p>
              <p className="mt-1 text-2xl font-semibold">{jobs.filter((job) => job.status === "failed").length}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>企業</TableHead>
                  <TableHead>ジョブ種別</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>優先度</TableHead>
                  <TableHead>試行</TableHead>
                  <TableHead>エラー</TableHead>
                  <TableHead>作成日時</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.company_name ?? "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{job.job_type}</TableCell>
                    <TableCell>
                      <JobStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell>
                      <form action="/api/jobs/priority" method="post" className="flex items-center gap-2">
                        <input type="hidden" name="id" value={job.id} />
                        <Input name="priority" defaultValue={job.priority} className="h-8 w-20" />
                        <Button type="submit" variant="ghost" size="icon" title="優先度変更" aria-label={`${job.company_name ?? "ジョブ"}の優先度を変更`}>
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>{job.attempts}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">{job.error_message ?? "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(job.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <form action="/api/jobs/retry" method="post">
                          <input type="hidden" name="id" value={job.id} />
                          <Button type="submit" variant="ghost" size="icon" title="リトライ" aria-label={`${job.company_name ?? "ジョブ"}をリトライ`}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </form>
                        <form action="/api/jobs/stop" method="post">
                          <input type="hidden" name="id" value={job.id} />
                          <Button type="submit" variant="ghost" size="icon" title="停止" aria-label={`${job.company_name ?? "ジョブ"}を停止`}>
                            <Square className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
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

function JobNotice({ params }: { params: Record<string, string | string[] | undefined> }) {
  const notice = value(params.notice);
  const error = value(params.error);
  if (!notice && !error) return null;

  const message =
    error === "invalid-priority"
      ? "優先度は1から999の整数で入力してください。"
      : notice === "dry-run"
        ? "Supabase未設定のため、ジョブ操作は保存されずプレビューとして処理されました。"
        : "ジョブ操作を受け付けました。";

  return (
    <div role="alert" className={`rounded-md border p-3 text-sm ${error ? "border-destructive text-destructive" : "text-muted-foreground"}`}>
      {message}
    </div>
  );
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}
