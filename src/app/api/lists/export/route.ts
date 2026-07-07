import { createCompaniesCsv } from "@/lib/csv";
import { attachmentContentDisposition } from "@/lib/file-name";
import { getSavedListExport } from "@/lib/lists";
import { uuidLikeSchema } from "@/lib/validation";

type SavedListExportDependencies = {
  createCompaniesCsv: typeof createCompaniesCsv;
  getSavedListExport: typeof getSavedListExport;
  logError: (message: string, error: unknown) => void;
};

const defaultDependencies: SavedListExportDependencies = {
  createCompaniesCsv,
  getSavedListExport,
  logError: console.error,
};

export async function savedListExportResponse(requestUrl: string, dependencies: SavedListExportDependencies = defaultDependencies) {
  const url = new URL(requestUrl);
  const listId = url.searchParams.get("listId");
  if (!listId) return new Response("listId is required", { status: 400 });
  const parsedListId = uuidLikeSchema.safeParse(listId);
  if (!parsedListId.success) return new Response("listId is invalid", { status: 400 });

  try {
    const exportData = await dependencies.getSavedListExport(parsedListId.data);
    if (!exportData) return new Response("list not found", { status: 404 });

    return new Response(dependencies.createCompaniesCsv(exportData.rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": attachmentContentDisposition(`${exportData.list.name}.csv`, "saved-list.csv"),
      },
    });
  } catch (error) {
    dependencies.logError("savedListExportResponse failed", error);
    return new Response("CSV export failed", { status: 500 });
  }
}

export async function GET(request: Request) {
  return savedListExportResponse(request.url);
}
