import { NextResponse } from "next/server";
import { queueCoverageJobs } from "@/lib/etl/job-planner";
import { revalidateAppPath } from "@/lib/revalidate";
import { buildRedirectUrl, parseCoveragePlanForm } from "@/lib/validation";

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = parseCoveragePlanForm(form);
  if (!parsed.success) {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/jobs", { error: "invalid-plan-limit" }), 303);
  }

  try {
    const result = await queueCoverageJobs({ limit: parsed.data.limit });
    revalidateAppPath("/jobs");
    return NextResponse.redirect(
      buildRedirectUrl(request.url, "/jobs", {
        notice: result.dryRun ? "dry-run-coverage" : "coverage-planned",
        planned: String(result.planned.length),
        inserted: String(result.inserted),
      }),
      303,
    );
  } catch {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/jobs", { error: "operation-failed" }), 303);
  }
}
