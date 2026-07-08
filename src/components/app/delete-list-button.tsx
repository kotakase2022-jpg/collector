"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function DeleteListButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm("この保存済みリストを削除します。元に戻せないため、CSVが必要な場合は先にCSVを出力してください。")) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "削除中" : "削除"}
    </Button>
  );
}
