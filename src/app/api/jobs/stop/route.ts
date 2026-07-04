import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { revalidateAppPath } from "@/lib/revalidate";
import { buildRedirectUrl, parseJobIdForm } from "@/lib/validation";

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = parseJobIdForm(form);
  if (!parsed.success) {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/jobs", { error: "invalid-job" }), 303);
  }

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("crawl_jobs").update({ status: "skipped", finished_at: new Date().toISOString() }).eq("id", parsed.data.id);
    if (error) {
      return NextResponse.redirect(buildRedirectUrl(request.url, "/jobs", { error: "operation-failed" }), 303);
    }
  }
  revalidateAppPath("/jobs");
  return NextResponse.redirect(buildRedirectUrl(request.url, "/jobs", hasSupabaseConfig() ? { notice: "updated" } : { notice: "dry-run" }), 303);
}
