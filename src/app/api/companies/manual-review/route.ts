import { NextResponse } from "next/server";
import { revalidateAppPath } from "@/lib/revalidate";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { buildRedirectUrl, uuidLikeSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const form = await request.formData();
  const parsedId = uuidLikeSchema.safeParse(form.get("id"));
  if (!parsedId.success) {
    return NextResponse.redirect(buildRedirectUrl(request.url, "/companies", { error: "invalid-company" }), 303);
  }
  const id = parsedId.data;
  const companyPath = `/companies/${id}`;

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
