import Link from "next/link";
import { ListPlus, Play, RefreshCw, Square, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { JobStatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getJobs } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { canRetryJobStatus, canStopJobStatus } from "@/lib/job-actions";
import { filterJobs, hasJobFilters, jobStatusLabels, jobStatusOptions, parseJobFilters } from "@/lib/job-filters";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseJobFilters(params);
  const jobs = await getJobs();
  const filteredJobs = filterJobs(jobs, filters);
  const hasActiveFilters = hasJobFilters(filters);
  const filterFormKey = `${filters.q ?? ""}:${filters.status ?? ""}`;
  const completed = jobs.filter((job) => job.status === "completed").length;
  const successRate = jobs.length ? Math.round((completed / jobs.length) * 100) : 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">クロール管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">ジョブの状態、成功率、エラー内容、リトライ、停止、優先度変更を管理します。</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <form action="/api/jobs/plan-coverage" method="post" className="flex flex-wrap items-end gap-2">
              <div className="space-y-1.5">
                <label htmlFor="coverage-limit" className="block text-xs font-medium text-muted-foreground">
                  補完対象上限
                </label>
                <Input id="coverage-limit" name="limit" type="number" min={1} max={5000} defaultValue={1000} className="h-9 w-28" />
              </div>
              <Button type="submit" variant="secondary">
                <ListPlus className="h-4 w-4" />
                補完ジョブを計画
              </Button>
            </form>
            <form action="/api/jobs/run-next" method="post">
              <Button type="submit">
                <Play className="h-4 w-4" />
                次のジョブを1件実行
              </Button>
            </form>
          </div>
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
            <div className="border-b p-4">
              <form key={filterFormKey} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                <div className="space-y-1.5">
                  <label htmlFor="q" className="block text-xs font-medium text-muted-foreground">
                    検索
                  </label>
                  <Input id="q" name="q" defaultValue={filters.q} placeholder="企業名、ジョブ種別、エラー内容" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="status" className="block text-xs font-medium text-muted-foreground">
                    ステータス
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={filters.status ?? ""}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="">すべて</option>
                    {jobStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {jobStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit">絞り込み</Button>
                  {hasActiveFilters ? (
                    <Button asChild variant="ghost">
                      <Link href="/jobs">解除</Link>
                    </Button>
                  ) : null}
                </div>
              </form>
              <p className="mt-3 text-sm text-muted-foreground">
                {filteredJobs.length} / {jobs.length}件を表示中
              </p>
            </div>
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
                {filteredJobs.length ? (
                  filteredJobs.map((job) => (
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
                          {canRetryJobStatus(job.status) ? (
                            <form action="/api/jobs/retry" method="post">
                              <input type="hidden" name="id" value={job.id} />
                              <Button type="submit" variant="ghost" size="icon" title="リトライ" aria-label={`${job.company_name ?? "ジョブ"}をリトライ`}>
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </form>
                          ) : null}
                          {canStopJobStatus(job.status) ? (
                            <form action="/api/jobs/stop" method="post">
                              <input type="hidden" name="id" value={job.id} />
                              <Button type="submit" variant="ghost" size="icon" title="停止" aria-label={`${job.company_name ?? "ジョブ"}を停止`}>
                                <Square className="h-4 w-4" />
                              </Button>
                            </form>
                          ) : null}
                          {!canRetryJobStatus(job.status) && !canStopJobStatus(job.status) ? <span className="text-xs text-muted-foreground">操作なし</span> : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                      条件に一致するジョブはありません。ステータスや検索語を解除してください。
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

function JobNotice({ params }: { params: Record<string, string | string[] | undefined> }) {
  const notice = value(params.notice);
  const error = value(params.error);
  if (!notice && !error) return null;

  const message =
    error === "invalid-priority"
      ? "優先度は1から999の整数で入力してください。"
      : error === "invalid-plan-limit"
        ? "補完対象上限は1から5000の整数で入力してください。"
      : error === "invalid-job"
        ? "ジョブIDが不正です。画面を再読み込みしてから操作してください。"
        : error === "invalid-job-state"
          ? "このステータスのジョブには指定した操作を実行できません。最新状態を確認してから、failed/skippedはリトライ、pending/runningは停止を選んでください。"
      : error === "operation-failed"
        ? "ジョブ操作に失敗しました。接続設定とSupabaseの権限を確認してください。"
      : notice === "dry-run-coverage"
        ? `Supabase未設定のため保存せず、補完ジョブ${value(params.planned) ?? "0"}件を計画しました。`
      : notice === "coverage-planned"
        ? `補完ジョブ${value(params.inserted) ?? "0"}件を登録しました。計画対象は${value(params.planned) ?? "0"}件です。`
      : notice === "dry-run-run"
        ? "Supabase未設定のため、ジョブ実行は行わずプレビューとして処理しました。"
      : notice === "no-pending-job"
        ? "実行可能なpendingジョブはありません。"
      : notice === "job-ran"
        ? `次のジョブを実行しました（${value(params.jobType) ?? "job"}）。`
      : notice === "job-failed"
        ? `ジョブは実行されましたがfailedとして記録されました（${value(params.jobType) ?? "job"}）。ログを確認してください。`
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
