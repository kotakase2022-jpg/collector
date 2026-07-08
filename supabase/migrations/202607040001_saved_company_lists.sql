create table if not exists public.saved_company_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  description text,
  filters jsonb not null default '{}'::jsonb,
  row_count integer not null default 0 check (row_count >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saved_company_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.saved_company_lists(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (list_id, company_id)
);

create index if not exists saved_company_lists_updated_at_idx on public.saved_company_lists(updated_at desc);
create index if not exists saved_company_list_items_list_position_idx on public.saved_company_list_items(list_id, position asc);
create index if not exists saved_company_list_items_company_id_idx on public.saved_company_list_items(company_id);

drop trigger if exists set_saved_company_lists_updated_at on public.saved_company_lists;
create trigger set_saved_company_lists_updated_at
before update on public.saved_company_lists
for each row execute function public.set_updated_at();

alter table public.saved_company_lists enable row level security;
alter table public.saved_company_list_items enable row level security;

grant select, insert, update, delete on public.saved_company_lists to service_role;
grant select, insert, update, delete on public.saved_company_list_items to service_role;
