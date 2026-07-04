import { NextResponse } from "next/server";
import { createSavedCompanyList } from "@/lib/lists";
import { revalidateAppPath } from "@/lib/revalidate";
import { buildRedirectUrl, companyFiltersToSearchParams, parseListCreateForm } from "@/lib/validation";

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = parseListCreateForm(form);
  if (!parsed.success) {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { error: "invalid-list" }), 303);
  }

  try {
    const result = await createSavedCompanyList(parsed.data);
    revalidateAppPath("/lists");
    if (result.id) {
      revalidateAppPath(`/lists/${result.id}`);
      return NextResponse.redirect(buildRedirectUrl(request.url, `/lists/${result.id}`, { notice: "saved" }), 303);
    }

    const params = companyFiltersToSearchParams(parsed.data.filters);
    params.set("name", parsed.data.name);
    if (parsed.data.description) params.set("description", parsed.data.description);
    params.set("notice", result.dryRun ? "dry-run" : "saved");
    params.set("rowCount", String(result.rowCount));
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  } catch {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { error: "operation-failed" }), 303);
  }
}
