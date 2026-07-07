do $$
begin
  if exists (
    select 1
    from public.companies
    group by name, address
    having count(*) > 1
  ) then
    raise exception 'Cannot create companies_name_address_uidx: duplicate companies with the same name and address already exist';
  end if;
end;
$$;

create unique index if not exists companies_name_address_uidx
on public.companies(name, address) nulls not distinct;
