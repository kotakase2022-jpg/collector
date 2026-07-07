import { NextResponse } from "next/server";
import { revalidateAppPath } from "@/lib/revalidate";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { buildRedirectUrl, uuidLikeSchema } from "@/lib/validation";

type RecrawlCompanyRedirectDependencies = {
  hasConfig: typeof hasSupabaseConfig;
  scheduleRecrawl: (id: string) => Promise<unknown | null>;
  revalidate: typeof revalidateAppPath;
  logError?: (message: string, error: unknown) => void;
};

const defaultDependencies: RecrawlCompanyRedirectDependencies = {
  hasConfig: hasSupabaseConfig,
  scheduleRecrawl: scheduleRecrawlJob,
  revalidate: revalidateAppPath,
};

export async function POST(request: Request) {
  const form = await request.formData();
  return recrawlCompanyRedirect(request.url, form);
}

export async function recrawlCompanyRedirect(requestUrl: string, form: FormData, dependencies: RecrawlCompanyRedirectDependencies = defaultDependencies) {
  const parsedId = uuidLikeSchema.safeParse(form.get("id"));
  if (!parsedId.success) {
    return NextResponse.redirect(buildRedirectUrl(requestUrl, "/companies", { error: "invalid-company" }), 303);
  }
  const id = parsedId.data;
  const companyPath = `/companies/${id}`;

  const configured = dependencies.hasConfig();
  if (configured) {
    const error = await dependencies.scheduleRecrawl(id);
    if (error) {
      (dependencies.logError ?? console.error)("recrawlCompanyRedirect failed", error);
      return NextResponse.redirect(buildRedirectUrl(requestUrl, companyPath, { error: "operation-failed" }), 303);
    }
  }

  dependencies.revalidate(companyPath);
  dependencies.revalidate("/jobs");
  return NextResponse.redirect(buildRedirectUrl(requestUrl, companyPath, configured ? { notice: "recrawl" } : { notice: "dry-run" }), 303);
}

async function scheduleRecrawlJob(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("crawl_jobs").insert({
    company_id: id,
    job_type: "crawl_official_site",
    status: "pending",
    priority: 25,
    attempts: 0,
    scheduled_at: new Date().toISOString(),
  });
  return error ?? null;
}
