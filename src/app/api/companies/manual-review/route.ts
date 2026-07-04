import { NextResponse } from "next/server";
import { revalidateAppPath } from "@/lib/revalidate";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { buildRedirectUrl } from "@/lib/validation";

export async function POST(request: Request) {
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const companyPath = companyDetailPath(id);

  if (!companyPath) {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/companies", { error: "invalid-company" }), 303);
  }

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("crawl_jobs").insert({
      company_id: id,
      job_type: "verify_data",
      status: "pending",
      priority: 10,
      attempts: 0,
      scheduled_at: new Date().toISOString(),
    });
    if (error) {
      return NextResponse.redirect(buildRedirectUrl(request.url, companyPath, { error: "operation-failed" }), 303);
    }
  }

  revalidateAppPath(companyPath);
  revalidateAppPath("/jobs");
  return NextResponse.redirect(buildRedirectUrl(request.url, companyPath, hasSupabaseConfig() ? { notice: "manual-review" } : { notice: "dry-run" }), 303);
}

function companyDetailPath(id: string) {
  return /^[0-9a-fA-F-]{36}$/.test(id) ? `/companies/${id}` : null;
}
