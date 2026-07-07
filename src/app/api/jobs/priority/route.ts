import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { revalidateAppPath } from "@/lib/revalidate";
import { buildRedirectUrl, parseJobIdForm, parseJobPriorityForm } from "@/lib/validation";

type JobPriorityRedirectDependencies = {
  hasConfig: typeof hasSupabaseConfig;
  updatePriority: (id: string, priority: number) => Promise<unknown | null>;
  revalidate: typeof revalidateAppPath;
  logError?: (message: string, error: unknown) => void;
};

const defaultDependencies: JobPriorityRedirectDependencies = {
  hasConfig: hasSupabaseConfig,
  updatePriority: updateJobPriority,
  revalidate: revalidateAppPath,
};

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    console.error("jobPriorityRedirect form parse failed", error);
    return NextResponse.redirect(buildRedirectUrl(request.url, "/jobs", { error: "operation-failed" }), 303);
  }
  return jobPriorityRedirect(request.url, form);
}

export async function jobPriorityRedirect(requestUrl: string, form: FormData, dependencies: JobPriorityRedirectDependencies = defaultDependencies) {
  const parsed = parseJobPriorityForm(form);
  if (!parsed.success) {
    const id = parseJobIdForm(form);
    return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", { error: id.success ? "invalid-priority" : "invalid-job" }), 303);
  }

  const configured = dependencies.hasConfig();
  if (configured) {
    const error = await dependencies.updatePriority(parsed.data.id, parsed.data.priority);
    if (error) {
      (dependencies.logError ?? console.error)("jobPriorityRedirect failed", error);
      return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", { error: "operation-failed" }), 303);
    }
  }
  dependencies.revalidate("/jobs");
  return NextResponse.redirect(buildRedirectUrl(requestUrl, "/jobs", configured ? { notice: "updated" } : { notice: "dry-run" }), 303);
}

async function updateJobPriority(id: string, priority: number) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("crawl_jobs").update({ priority }).eq("id", id);
  return error ?? null;
}
