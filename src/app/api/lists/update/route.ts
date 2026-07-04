import { NextResponse } from "next/server";
import { revalidateAppPath } from "@/lib/revalidate";
import { updateSavedCompanyList } from "@/lib/lists";
import { buildRedirectUrl, companyFiltersToSearchParams, parseListUpdateForm } from "@/lib/validation";

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = parseListUpdateForm(form);
  if (!parsed.success) {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { error: "invalid-list" }), 303);
  }

  try {
    const result = await updateSavedCompanyList(parsed.data);
    revalidateAppPath("/lists");
    if (!result.id) {
      return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { error: "not-found" }), 303);
    }

    if (!result.dryRun) {
      revalidateAppPath(`/lists/${result.id}`);
      return NextResponse.redirect(buildRedirectUrl(request.url, `/lists/${result.id}`, { notice: "updated" }), 303);
    }

    const params = companyFiltersToSearchParams(parsed.data.filters);
    params.set("listId", parsed.data.id);
    params.set("name", parsed.data.name);
    if (parsed.data.description) params.set("description", parsed.data.description);
    params.set("notice", "dry-run-update");
    params.set("rowCount", String(result.rowCount));
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  } catch {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { error: "operation-failed" }), 303);
  }
}
