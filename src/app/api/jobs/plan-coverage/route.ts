import { NextResponse } from "next/server";
import { queueCoverageJobs } from "@/lib/etl/job-planner";
import { revalidateAppPath } from "@/lib/revalidate";
import { buildRedirectUrl, parseCoveragePlanForm } from "@/lib/validation";

type PlanCoverageRedirectDependencies = {
  queueCoverageJobs: typeof queueCoverageJobs;
  revalidate: typeof revalidateAppPath;
  logError?: (message: string, error: unknown) => void;
};

const defaultDependencies: PlanCoverageRedirectDependencies = {
  queueCoverageJobs,
  revalidate: revalidateAppPath,
};

export async function POST(request: Request) {
  const form = await request.formData();
  return planCoverageRedirect(request.url, form);
}

export async function planCoverageRedirect(requestUrl: string, form: FormData, dependencies: PlanCoverageRedirectDependencies = defaultDependencies) {
  const parsed = parseCoveragePlanForm(form);
  if (!parsed.success) {
    return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", { error: "invalid-plan-limit" }), 303);
  }

  try {
    const result = await dependencies.queueCoverageJobs({ limit: parsed.data.limit });
    dependencies.revalidate("/jobs");
    return NextResponse.redirect(
      buildRedirectUrl(requestUrl, "/jobs", {
        notice: result.dryRun ? "dry-run-coverage" : "coverage-planned",
        planned: String(result.planned.length),
        inserted: String(result.inserted),
      }),
      303,
    );
  } catch (error) {
    (dependencies.logError ?? console.error)("planCoverageRedirect failed", error);
    return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", { error: "operation-failed" }), 303);
  }
}
