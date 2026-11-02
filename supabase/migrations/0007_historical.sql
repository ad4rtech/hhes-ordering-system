alter table orders add column if not exists payment_method text not null default 'mpesa'
  check (payment_method in ('mpesa','historical_cash'));
alter table orders add column if not exists import_batch uuid;

-- Migrated organisations have no M-Pesa number until they register
alter table organisations alter column mpesa_phone drop not null;

-- Same rules as before, plus: historical orders are read-only
create or replace function enforce_order_rules() returns trigger as $$
begin
  if old.is_historical then
    raise exception 'Historical records are read-only';
  end if;

  if old.status in ('collected','cancelled') and new.status <> old.status then
    raise exception 'Order is % and can no longer change status', old.status;
  end if;

  if new.status in ('ready_for_pickup','collected')
     and new.payment_status <> 'paid' and not new.is_historical then
    raise exception 'BR-10: order must be fully paid before %', new.status;
  end if;

  if new.status = 'ready_for_pickup' and old.status not in ('paid','ready_for_pickup') then
    raise exception 'Order must be paid before it can be marked ready for pickup';
  end if;

  if new.status is distinct from old.status then
    insert into order_status_history(order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status,
            coalesce(auth.uid(), nullif(current_setting('app.actor', true), '')::uuid));
  end if;
  return new;
end; $$ language plpgsql;

create or replace function block_historical_item_changes() returns trigger as $$
declare h boolean;
begin
  select is_historical into h from orders where id = old.order_id;
  if h then raise exception 'Historical records are read-only'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end; $$ language plpgsql;

create trigger trg_historical_items before update or delete on order_items
  for each row execute function block_historical_item_changes();

-- One transaction for the whole batch: all validated rows go in, or none do
create or replace function import_historical(p_admin uuid, p_batch uuid, p_rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r jsonb; it jsonb; v_org uuid; v_q uuid; v_order uuid; v_ci uuid;
  imported int := 0; skipped int := 0; q_created int := 0; o_created int := 0;
begin
  for r in select * from jsonb_array_elements(p_rows) loop
    -- quarter: reuse by name, or create it closed
    select id into v_q from quarters where lower(name) = lower(r->>'quarter_name');
    if v_q is null then
      insert into quarters(name, open_date, deadline_date, status, created_by, closed_at)
      values (r->>'quarter_name', (r->>'quarter_open')::date, (r->>'quarter_deadline')::date,
              'closed', p_admin, now())
      returning id into v_q;
      q_created := q_created + 1;
    elsif exists (select 1 from quarters where id = v_q and status <> 'closed') then
      raise exception 'Quarter % is not closed', r->>'quarter_name';
    end if;

    -- organisation: by id, else by email, else a new inactive shell
    v_org := (r->'org'->>'id')::uuid;
    if v_org is null then
      select id into v_org from organisations
       where lower(contact_email) = lower(r->'org'->>'contact_email');
    end if;
    if v_org is null then
      insert into organisations(name, type, contact_name, contact_email, phone, status)
      values (r->'org'->>'name', r->'org'->>'type',
              coalesce(r->'org'->>'contact_name', r->'org'->>'name'),
              r->'org'->>'contact_email', r->'org'->>'phone', 'inactive')
      returning id into v_org;
      o_created := o_created + 1;
    end if;

    -- fill in catalogue prices for categories that have none yet, then lock them
    for it in select * from jsonb_array_elements(r->'items') loop
      if (it->>'unit_price')::numeric > 0 then
        update catalogue_items
           set price_kes = (it->>'unit_price')::numeric, is_locked = true
         where quarter_id = v_q and category_slug = it->>'slug'
           and price_kes = 0 and not is_locked;
      end if;
    end loop;

    v_order := null;
    insert into orders(organisation_id, quarter_id, status, total_amount_kes, amount_paid_kes,
                       payment_status, payment_method, is_historical, import_batch,
                       submitted_at, collected_at, created_by, collected_by)
    values (v_org, v_q, 'collected', (r->>'total')::numeric, (r->>'total')::numeric,
            'paid', 'historical_cash', true, p_batch,
            (r->>'submitted_at')::timestamptz, (r->>'submitted_at')::timestamptz, p_admin, p_admin)
    on conflict (organisation_id, quarter_id) do nothing
    returning id into v_order;

    if v_order is null then
      skipped := skipped + 1;
      continue;
    end if;

    for it in select * from jsonb_array_elements(r->'items') loop
      select id into v_ci from catalogue_items
       where quarter_id = v_q and category_slug = it->>'slug';
      insert into order_items(order_id, catalogue_item_id, category_slug, quantity, unit_price_kes)
      values (v_order, v_ci, it->>'slug', (it->>'quantity')::int, (it->>'unit_price')::numeric);
    end loop;

    insert into order_status_history(order_id, from_status, to_status, changed_by)
    values (v_order, null, 'collected', p_admin);
    imported := imported + 1;
  end loop;

  return jsonb_build_object('imported', imported, 'skipped', skipped,
                            'quarters_created', q_created, 'organisations_created', o_created);
end $$;

revoke all on function import_historical(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function import_historical(uuid, uuid, jsonb) to service_role;