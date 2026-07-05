import { NextResponse } from "next/server";
import { revalidateAppPath } from "@/lib/revalidate";
import { updateSavedCompanyList } from "@/lib/lists";
import { buildRedirectUrl, companyFiltersToSearchParams, hasCompanyGenerationCriteria, listFormStateToSearchParams, parseListCreateForm, parseListIdForm } from "@/lib/validation";

export async function POST(request: Request) {
  const form = await request.formData();
  const id = parseListIdForm(form);
  if (!id.success) {
    const params = listFormStateToSearchParams(form);
    params.set("error", "invalid-list-id");
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  }

  const parsed = parseListCreateForm(form);
  if (!parsed.success) {
    const params = listFormStateToSearchParams(form);
    params.set("error", "invalid-name");
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  }
  const data = { ...parsed.data, id: id.data };

  if (!hasCompanyGenerationCriteria(data.filters)) {
    const params = listFormStateToSearchParams(form);
    params.set("error", "no-criteria");
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  }

  try {
    const result = await updateSavedCompanyList(data);
    revalidateAppPath("/lists");
    if (!result.id) {
      return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { error: "not-found" }), 303);
    }

    if (!result.dryRun) {
      revalidateAppPath(`/lists/${result.id}`);
      return NextResponse.redirect(buildRedirectUrl(request.url, `/lists/${result.id}`, { notice: "updated" }), 303);
    }

    const params = companyFiltersToSearchParams(data.filters);
    params.set("listId", data.id);
    params.set("name", data.name);
    if (data.description) params.set("description", data.description);
    params.set("notice", "dry-run-update");
    params.set("rowCount", String(result.rowCount));
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  } catch {
    const params = listFormStateToSearchParams(form);
    params.set("error", "operation-failed");
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  }
}
