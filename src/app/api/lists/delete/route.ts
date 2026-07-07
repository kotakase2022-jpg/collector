import { NextResponse } from "next/server";
import { deleteSavedCompanyList } from "@/lib/lists";
import { revalidateAppPath } from "@/lib/revalidate";
import { buildRedirectUrl, parseListIdForm } from "@/lib/validation";

type DeleteListRedirectDependencies = {
  deleteSavedCompanyList: typeof deleteSavedCompanyList;
  revalidateAppPath: typeof revalidateAppPath;
  logError?: (message: string, error: unknown) => void;
};

const defaultDependencies: DeleteListRedirectDependencies = {
  deleteSavedCompanyList,
  revalidateAppPath,
};

export async function POST(request: Request) {
  return deleteListRedirect(request);
}

export async function deleteListRedirect(request: Request, dependencies: DeleteListRedirectDependencies = defaultDependencies) {
  const form = await request.formData();
  const id = parseListIdForm(form);
  if (!id.success) {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { error: "invalid-list-id" }), 303);
  }

  try {
    const result = await dependencies.deleteSavedCompanyList(id.data);
    dependencies.revalidateAppPath("/lists");
    dependencies.revalidateAppPath(`/lists/${id.data}`);
    return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { notice: result.dryRun ? "dry-run-delete" : "deleted" }), 303);
  } catch (error) {
    (dependencies.logError ?? console.error)("deleteListRedirect failed", error);
    return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { error: "operation-failed", action: "delete" }), 303);
  }
}
