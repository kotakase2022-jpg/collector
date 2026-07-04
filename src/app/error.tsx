"use client";

import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <AppShell>
      <Card className="rounded-md">
        <CardContent className="flex min-h-96 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-normal">画面の読み込みに失敗しました</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              一時的な接続不良、Supabaseの権限設定、または外部APIの応答不良が原因の可能性があります。再読み込みしても直らない場合は、環境変数とサーバーログを確認してください。
            </p>
            {error.digest ? <p className="mt-2 font-mono text-xs text-muted-foreground">digest: {error.digest}</p> : null}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => unstable_retry()}>
              <RotateCw className="h-4 w-4" />
              再試行
            </Button>
            <Button asChild variant="secondary">
              <Link href="/jobs">クロール管理を見る</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">ダッシュボードへ戻る</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
