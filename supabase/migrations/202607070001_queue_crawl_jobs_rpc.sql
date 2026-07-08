create unique index if not exists crawl_jobs_active_company_type_uidx
  on public.crawl_jobs(company_id, job_type)
  where company_id is not null and status in ('pending', 'running');

create or replace function public.queue_crawl_jobs(p_jobs jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  with input_jobs as (
    select
      (job ->> 'company_id')::uuid as company_id,
      job ->> 'job_type' as job_type,
      coalesce((job ->> 'priority')::integer, 100) as priority,
      coalesce((job ->> 'scheduled_at')::timestamptz, now()) as scheduled_at
    from jsonb_array_elements(coalesce(p_jobs, '[]'::jsonb)) as job
  ),
  valid_jobs as (
    select distinct on (company_id, job_type)
      company_id,
      job_type,
      priority,
      scheduled_at
    from input_jobs
    where company_id is not null
      and job_type in (
        'seed_import',
        'enrich_gbizinfo',
        'enrich_edinet',
        'discover_official_url',
        'crawl_official_site',
        'extract_company_profile',
        'verify_data'
      )
    order by company_id, job_type, priority asc, scheduled_at asc
  ),
  inserted as (
    insert into public.crawl_jobs (company_id, job_type, status, priority, scheduled_at)
    select company_id, job_type, 'pending', priority, scheduled_at
    from valid_jobs
    on conflict do nothing
    returning 1
  )
  select count(*) into inserted_count from inserted;

  return inserted_count;
end;
$$;

revoke execute on function public.queue_crawl_jobs(jsonb) from public;
revoke execute on function public.queue_crawl_jobs(jsonb) from anon;
revoke execute on function public.queue_crawl_jobs(jsonb) from authenticated;
grant execute on function public.queue_crawl_jobs(jsonb) to service_role;
