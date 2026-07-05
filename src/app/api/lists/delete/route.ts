import { NextResponse } from "next/server";
import { deleteSavedCompanyList } from "@/lib/lists";
import { revalidateAppPath } from "@/lib/revalidate";
import { buildRedirectUrl, parseListIdForm } from "@/lib/validation";

export async function POST(request: Request) {
  const form = await request.formData();
  const id = parseListIdForm(form);
  if (!id.success) {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { error: "invalid-list-id" }), 303);
  }

  try {
    const result = await deleteSavedCompanyList(id.data);
    revalidateAppPath("/lists");
    revalidateAppPath(`/lists/${id.data}`);
    return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { notice: result.dryRun ? "dry-run-delete" : "deleted" }), 303);
  } catch {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { error: "operation-failed" }), 303);
  }
}
