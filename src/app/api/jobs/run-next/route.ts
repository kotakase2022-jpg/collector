import { NextResponse } from "next/server";
import { runNextCrawlJob } from "@/lib/etl/job-runner";
import { revalidateAppPath } from "@/lib/revalidate";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { buildRedirectUrl } from "@/lib/validation";

export async function POST(request: Request) {
  return runNextJobRedirect(request.url);
}

export async function runNextJobRedirect(
  requestUrl: string,
  dependencies: {
    hasConfig?: () => boolean;
    runJob?: typeof runNextCrawlJob;
    revalidate?: typeof revalidateAppPath;
  } = {},
) {
  const hasConfig = dependencies.hasConfig ?? hasSupabaseConfig;
  const runJob = dependencies.runJob ?? runNextCrawlJob;
  const revalidate = dependencies.revalidate ?? revalidateAppPath;

  if (!hasConfig()) {
    revalidate("/jobs");
    return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", { notice: "dry-run-run" }), 303);
  }

  try {
    const result = await runJob();
    revalidate("/jobs");
    if (!result) {
      return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", { notice: "no-pending-job" }), 303);
    }

    return NextResponse.redirect(
      buildRedirectUrl(requestUrl, "/jobs", {
        notice: result.run_status === "completed" ? "job-ran" : "job-failed",
        jobId: result.id,
        jobType: result.job_type,
      }),
      303,
    );
  } catch {
    return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", { error: "operation-failed" }), 303);
  }
}
