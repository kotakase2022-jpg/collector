import { NextResponse } from "next/server";
import { createSavedCompanyList } from "@/lib/lists";
import { revalidateAppPath } from "@/lib/revalidate";
import { buildRedirectUrl, companyFiltersToSearchParams, hasCompanyGenerationCriteria, listFormStateToSearchParams, listFormValidationErrorCode, parseListCreateForm } from "@/lib/validation";

type CreateListRedirectDependencies = {
  createSavedCompanyList: typeof createSavedCompanyList;
  revalidateAppPath: typeof revalidateAppPath;
  logError?: (message: string, error: unknown) => void;
};

const defaultDependencies: CreateListRedirectDependencies = {
  createSavedCompanyList,
  revalidateAppPath,
};

export async function POST(request: Request) {
  return createListRedirect(request);
}

export async function createListRedirect(request: Request, dependencies: CreateListRedirectDependencies = defaultDependencies) {
  const form = await request.formData();
  const parsed = parseListCreateForm(form);
  if (!parsed.success) {
    const params = listFormStateToSearchParams(form);
    params.set("error", listFormValidationErrorCode(parsed.error));
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  }
  if (!hasCompanyGenerationCriteria(parsed.data.filters)) {
    const params = listFormStateToSearchParams(form);
    params.set("error", "no-criteria");
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  }

  try {
    const result = await dependencies.createSavedCompanyList(parsed.data);
    dependencies.revalidateAppPath("/lists");
    if (result.id) {
      dependencies.revalidateAppPath(`/lists/${result.id}`);
      return NextResponse.redirect(buildRedirectUrl(request.url, `/lists/${result.id}`, { notice: "saved" }), 303);
    }

    const params = companyFiltersToSearchParams(parsed.data.filters);
    params.set("name", parsed.data.name);
    if (parsed.data.description) params.set("description", parsed.data.description);
    params.set("notice", result.dryRun ? "dry-run" : "saved");
    params.set("rowCount", String(result.rowCount));
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  } catch (error) {
    (dependencies.logError ?? console.error)("createListRedirect failed", error);
    const params = listFormStateToSearchParams(form);
    params.set("error", "operation-failed");
    return NextResponse.redirect(new URL(`/lists?${params.toString()}`, request.url), 303);
  }
}
