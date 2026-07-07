import { NextResponse } from "next/server";
import { revalidateAppPath } from "@/lib/revalidate";
import { updateSavedCompanyList } from "@/lib/lists";
import {
  buildRedirectUrl,
  companyFiltersToSearchParams,
  hasCompanyGenerationCriteria,
  listFormStateToSearchParams,
  listFormValidationErrorCode,
  parseListCreateForm,
  parseListIdForm,
} from "@/lib/validation";

type UpdateListRedirectDependencies = {
  updateSavedCompanyList: typeof updateSavedCompanyList;
  revalidateAppPath: typeof revalidateAppPath;
  logError?: (message: string, error: unknown) => void;
};

const defaultDependencies: UpdateListRedirectDependencies = {
  updateSavedCompanyList,
  revalidateAppPath,
};

export async function POST(request: Request) {
  return updateListRedirect(request);
}

export async function updateListRedirect(request: Request, dependencies: UpdateListRedirectDependencies = defaultDependencies) {
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
    params.set("error", listFormValidationErrorCode(parsed.error));
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  }
  const data = { ...parsed.data, id: id.data };

  if (!hasCompanyGenerationCriteria(data.filters)) {
    const params = listFormStateToSearchParams(form);
    params.set("error", "no-criteria");
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  }

  try {
    const result = await dependencies.updateSavedCompanyList(data);
    dependencies.revalidateAppPath("/lists");
    if (!result.id) {
      return NextResponse.redirect(buildRedirectUrl(request.url, "/lists", { error: "not-found" }), 303);
    }

    if (!result.dryRun) {
      dependencies.revalidateAppPath(`/lists/${result.id}`);
      return NextResponse.redirect(buildRedirectUrl(request.url, `/lists/${result.id}`, { notice: "updated" }), 303);
    }

    const params = companyFiltersToSearchParams(data.filters);
    params.set("listId", data.id);
    params.set("name", data.name);
    if (data.description) params.set("description", data.description);
    params.set("notice", "dry-run-update");
    params.set("rowCount", String(result.rowCount));
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  } catch (error) {
    (dependencies.logError ?? console.error)("updateListRedirect failed", error);
    const params = listFormStateToSearchParams(form);
    params.set("error", "operation-failed");
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  }
}
