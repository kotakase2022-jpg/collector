import { createSavedListComparisonCsv } from "@/lib/csv";
import { attachmentContentDisposition } from "@/lib/file-name";
import { getSavedListComparisonExport } from "@/lib/lists";
import { uuidLikeSchema } from "@/lib/validation";

type SavedListComparisonExportDependencies = {
  createSavedListComparisonCsv: typeof createSavedListComparisonCsv;
  getSavedListComparisonExport: typeof getSavedListComparisonExport;
  logError: (message: string, error: unknown) => void;
};

const defaultDependencies: SavedListComparisonExportDependencies = {
  createSavedListComparisonCsv,
  getSavedListComparisonExport,
  logError: console.error,
};

export async function savedListComparisonExportResponse(requestUrl: string, dependencies: SavedListComparisonExportDependencies = defaultDependencies) {
  const url = new URL(requestUrl);
  const baseListId = url.searchParams.get("baseListId");
  const targetListId = url.searchParams.get("targetListId");
  if (!baseListId || !targetListId) return new Response("baseListId and targetListId are required", { status: 400 });

  const parsedBaseListId = uuidLikeSchema.safeParse(baseListId);
  const parsedTargetListId = uuidLikeSchema.safeParse(targetListId);
  if (!parsedBaseListId.success || !parsedTargetListId.success) return new Response("list id is invalid", { status: 400 });
  if (parsedBaseListId.data === parsedTargetListId.data) return new Response("targetListId must differ from baseListId", { status: 400 });

  try {
    const exportData = await dependencies.getSavedListComparisonExport(parsedBaseListId.data, parsedTargetListId.data);
    if (!exportData) return new Response("list not found", { status: 404 });

    return new Response(dependencies.createSavedListComparisonCsv(exportData.rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": attachmentContentDisposition(`${exportData.baseList.name}-${exportData.targetList.name}-comparison.csv`, "saved-company-list-comparison.csv"),
      },
    });
  } catch (error) {
    dependencies.logError("savedListComparisonExportResponse failed", error);
    return new Response("CSV export failed", { status: 500 });
  }
}

export async function GET(request: Request) {
  return savedListComparisonExportResponse(request.url);
}
