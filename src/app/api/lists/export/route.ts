import { createCompaniesCsv } from "@/lib/csv";
import { getSavedListExportRows } from "@/lib/lists";
import { uuidLikeSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const listId = url.searchParams.get("listId");
  if (!listId) return new Response("listId is required", { status: 400 });
  const parsedListId = uuidLikeSchema.safeParse(listId);
  if (!parsedListId.success) return new Response("listId is invalid", { status: 400 });

  const rows = await getSavedListExportRows(parsedListId.data);
  if (!rows) return new Response("list not found", { status: 404 });

  return new Response(createCompaniesCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="saved-list-${parsedListId.data}.csv"`,
    },
  });
}
