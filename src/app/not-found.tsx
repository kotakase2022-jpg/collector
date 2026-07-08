import Link from "next/link";
import { SearchX } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <AppShell>
      <Card className="rounded-md">
        <CardContent className="flex min-h-96 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border text-muted-foreground">
            <SearchX className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-normal">対象データが見つかりません</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              企業または保存済みリストが削除されたか、URLのIDが誤っている可能性があります。条件を変えて検索し直してください。
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/companies">企業を検索</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/lists">リスト生成へ</Link>
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
