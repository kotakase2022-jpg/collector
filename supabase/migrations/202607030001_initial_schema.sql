create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  corporate_number text unique,
  name text not null,
  name_kana text,
  postal_code text,
  address text,
  prefecture text,
  city text,
  official_url text,
  industry text,
  industry_code text,
  employee_count integer,
  employee_count_type text default 'unknown' check (employee_count_type in ('consolidated', 'standalone', 'unknown')),
  annual_revenue numeric,
  annual_revenue_currency text default 'JPY',
  annual_revenue_period text,
  annual_revenue_type text default 'unknown' check (annual_revenue_type in ('sales', 'operating_revenue', 'ordinary_revenue', 'estimated', 'unknown')),
  revenue_range text,
  data_confidence_score integer default 0 check (data_confidence_score between 0 and 100),
  coverage_score integer default 0 check (coverage_score between 0 and 100),
  status text default 'unknown' check (status in ('active', 'closed', 'merged', 'unknown')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.company_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_type text not null check (source_type in ('nta', 'gbizinfo', 'edinet', 'shokuba', 'official_site', 'third_party', 'search', 'llm_extraction')),
  source_url text,
  source_title text,
  fetched_at timestamptz not null default now(),
  raw_text text,
  raw_json jsonb,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  created_at timestamptz default now()
);

create table if not exists public.company_observations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  field_name text not null check (field_name in ('official_url', 'industry', 'employee_count', 'annual_revenue')),
  observed_value text,
  normalized_value text,
  source_id uuid references public.company_sources(id) on delete set null,
  source_type text not null check (source_type in ('official', 'reported', 'estimated', 'unknown')),
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  extraction_method text not null check (extraction_method in ('api', 'html_rule', 'pdf_rule', 'llm', 'manual')),
  is_selected boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  job_type text not null check (job_type in ('seed_import', 'enrich_gbizinfo', 'enrich_edinet', 'discover_official_url', 'crawl_official_site', 'extract_company_profile', 'verify_data')),
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'skipped')),
  priority integer default 100,
  attempts integer default 0,
  error_message text,
  scheduled_at timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.crawl_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.crawl_jobs(id) on delete cascade,
  level text not null check (level in ('debug', 'info', 'warn', 'error')),
  message text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists companies_name_idx on public.companies using gin (to_tsvector('simple', coalesce(name, '')));
create index if not exists companies_prefecture_idx on public.companies(prefecture);
create index if not exists companies_industry_idx on public.companies(industry);
create index if not exists companies_updated_at_idx on public.companies(updated_at desc);
create index if not exists company_sources_company_id_idx on public.company_sources(company_id);
create index if not exists company_observations_company_field_idx on public.company_observations(company_id, field_name, confidence_score desc, created_at desc);
create index if not exists crawl_jobs_status_priority_idx on public.crawl_jobs(status, priority asc, scheduled_at asc);
create index if not exists crawl_logs_job_id_idx on public.crawl_logs(job_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.company_sources enable row level security;
alter table public.company_observations enable row level security;
alter table public.crawl_jobs enable row level security;
alter table public.crawl_logs enable row level security;

grant select, insert, update, delete on public.companies to service_role;
grant select, insert, update, delete on public.company_sources to service_role;
grant select, insert, update, delete on public.company_observations to service_role;
grant select, insert, update, delete on public.crawl_jobs to service_role;
grant select, insert, update, delete on public.crawl_logs to service_role;
grant usage, select on all sequences in schema public to service_role;

