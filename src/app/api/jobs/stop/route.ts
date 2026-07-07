import { NextResponse } from "next/server";
import { markJobStopped } from "@/lib/job-actions";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { revalidateAppPath } from "@/lib/revalidate";
import { buildRedirectUrl, parseJobIdForm } from "@/lib/validation";

export async function POST(request: Request) {
  const form = await request.formData();
  return stopJobRedirect(request.url, form);
}

export async function stopJobRedirect(
  requestUrl: string,
  form: FormData,
  dependencies: {
    hasConfig?: () => boolean;
    stop?: (id: string) => Promise<boolean>;
    revalidate?: typeof revalidateAppPath;
    logError?: (message: string, error: unknown) => void;
  } = {},
) {
  const parsed = parseJobIdForm(form);
  if (!parsed.success) {
    return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", { error: "invalid-job" }), 303);
  }

  const hasConfig = dependencies.hasConfig ?? hasSupabaseConfig;
  const stop = dependencies.stop ?? ((id: string) => markJobStopped(getSupabaseAdmin(), id));
  const revalidate = dependencies.revalidate ?? revalidateAppPath;
  const logError = dependencies.logError ?? console.error;

  if (!hasConfig()) {
    revalidate("/jobs");
    return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", { notice: "dry-run" }), 303);
  }

  try {
    const updated = await stop(parsed.data.id);
    revalidate("/jobs");
    return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", updated ? { notice: "updated" } : { error: "invalid-job-state" }), 303);
  } catch (error) {
    logError("stopJobRedirect failed", error);
    return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", { error: "operation-failed" }), 303);
  }
}
