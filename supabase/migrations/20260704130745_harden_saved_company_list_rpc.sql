create or replace function public.save_company_list(
  p_id uuid,
  p_name text,
  p_description text,
  p_filters jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_row_count integer := jsonb_array_length(coalesce(p_items, '[]'::jsonb));
begin
  if p_id is null then
    insert into public.saved_company_lists (name, description, filters, row_count)
    values (p_name, nullif(p_description, ''), coalesce(p_filters, '{}'::jsonb), v_row_count)
    returning id into v_id;
  else
    update public.saved_company_lists
    set
      name = p_name,
      description = nullif(p_description, ''),
      filters = coalesce(p_filters, '{}'::jsonb),
      row_count = v_row_count
    where id = p_id
    returning id into v_id;

    if v_id is null then
      return null;
    end if;

    delete from public.saved_company_list_items where list_id = v_id;
  end if;

  insert into public.saved_company_list_items (list_id, company_id, position, snapshot)
  select
    v_id,
    (item ->> 'company_id')::uuid,
    coalesce((item ->> 'position')::integer, ordinality::integer),
    item -> 'snapshot'
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as payload(item, ordinality);

  return v_id;
end;
$$;

revoke execute on function public.save_company_list(uuid, text, text, jsonb, jsonb) from public;
revoke execute on function public.save_company_list(uuid, text, text, jsonb, jsonb) from anon;
revoke execute on function public.save_company_list(uuid, text, text, jsonb, jsonb) from authenticated;
grant execute on function public.save_company_list(uuid, text, text, jsonb, jsonb) to service_role;
