import { createSavedListComparisonCsv } from "@/lib/csv";
import { getSavedListComparisonExportRows } from "@/lib/lists";
import { uuidLikeSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseListId = url.searchParams.get("baseListId");
  const targetListId = url.searchParams.get("targetListId");
  if (!baseListId || !targetListId) return new Response("baseListId and targetListId are required", { status: 400 });

  const parsedBaseListId = uuidLikeSchema.safeParse(baseListId);
  const parsedTargetListId = uuidLikeSchema.safeParse(targetListId);
  if (!parsedBaseListId.success || !parsedTargetListId.success) return new Response("list id is invalid", { status: 400 });
  if (parsedBaseListId.data === parsedTargetListId.data) return new Response("targetListId must differ from baseListId", { status: 400 });

  const rows = await getSavedListComparisonExportRows(parsedBaseListId.data, parsedTargetListId.data);
  if (!rows) return new Response("list not found", { status: 404 });

  return new Response(createSavedListComparisonCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="saved-list-comparison-${parsedBaseListId.data}-${parsedTargetListId.data}.csv"`,
    },
  });
}
