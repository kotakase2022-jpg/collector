import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { revalidateAppPath } from "@/lib/revalidate";
import { buildRedirectUrl } from "@/lib/validation";

export async function POST(request: Request) {
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  if (hasSupabaseConfig() && id) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("crawl_jobs").update({ status: "skipped", finished_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      return NextResponse.redirect(buildRedirectUrl(request.url, "/jobs", { error: "operation-failed" }), 303);
    }
  }
  revalidateAppPath("/jobs");
  return NextResponse.redirect(buildRedirectUrl(request.url, "/jobs", hasSupabaseConfig() ? { notice: "updated" } : { notice: "dry-run" }), 303);
}
