alter table orders add column if not exists refund_amount_kes numeric(12,2) not null default 0;

-- Status history now records who acted, even when the change comes via service role
create or replace function enforce_order_rules() returns trigger as $$
begin
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

-- Shared rule: is this org allowed to order/amend right now?
create or replace function ordering_open(p_org uuid, p_quarter_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare q quarters; ov date; eff date;
        today date := (now() at time zone 'Africa/Nairobi')::date;
begin
  select * into q from quarters where id = p_quarter_id;
  if not found or q.status <> 'published' then
    raise exception 'There is no active quarter open for ordering';
  end if;
  if today < q.open_date then
    raise exception 'Ordering for % opens on %', q.name, q.open_date;
  end if;
  select max(new_deadline) into ov from deadline_overrides
   where organisation_id = p_org and quarter_id = p_quarter_id;
  eff := greatest(q.deadline_date, coalesce(ov, q.deadline_date));
  if today > eff then
    raise exception 'The ordering deadline (%) has passed', eff;
  end if;
end $$;

create or replace function place_order(p_user uuid, p_items jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare o organisations; q quarters; v_order uuid; ci record;
        qty int; total numeric := 0; any_qty boolean := false;
begin
  perform set_config('app.actor', p_user::text, true);

  select * into o from organisations where user_id = p_user;
  if not found then raise exception 'No organisation is linked to this account'; end if;
  if o.status <> 'approved' then raise exception 'Your organisation is not approved'; end if;

  select * into q from quarters where status = 'published';
  if not found then raise exception 'There is no active quarter open for ordering'; end if;
  perform ordering_open(o.id, q.id);

  if exists (select 1 from orders where organisation_id = o.id and quarter_id = q.id) then
    raise exception 'Your organisation already has an order for %. Amend it instead.', q.name;
  end if;

  insert into orders(organisation_id, quarter_id, status, payment_status,
                     total_amount_kes, submitted_at, created_by)
  values (o.id, q.id, 'awaiting_payment', 'awaiting_payment', 0, now(), p_user)
  returning id into v_order;

  for ci in select * from catalogue_items where quarter_id = q.id loop
    qty := coalesce((p_items->>ci.category_slug)::int, 0);
    if qty > 0 then any_qty := true; end if;
    insert into order_items(order_id, catalogue_item_id, category_slug, quantity, unit_price_kes)
    values (v_order, ci.id, ci.category_slug, qty, ci.price_kes);
    total := total + qty * ci.price_kes;
  end loop;

  if not any_qty then raise exception 'Order at least one lesson book'; end if;

  update orders set total_amount_kes = total where id = v_order;
  insert into order_status_history(order_id, from_status, to_status, changed_by)
  values (v_order, null, 'awaiting_payment', p_user);
  return v_order;
end $$;

create or replace function amend_order(p_user uuid, p_order_id uuid, p_items jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o orders; org organisations; prev jsonb; nxt jsonb; it record; qty int;
        new_total numeric := 0; changed boolean := false; adj text := 'none';
        v_status text; v_pay text; v_refund_due boolean; v_refund numeric;
begin
  perform set_config('app.actor', p_user::text, true);

  select * into org from organisations where user_id = p_user;
  if not found or org.status <> 'approved' then raise exception 'Your organisation is not approved'; end if;

  select * into o from orders where id = p_order_id and organisation_id = org.id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.status in ('collected','cancelled') then
    raise exception 'This order is % and can no longer be changed', o.status;
  end if;
  if o.status = 'ready_for_pickup' then
    raise exception 'This order is ready for pickup and can no longer be amended. Contact HHES or cancel it.';
  end if;
  perform ordering_open(org.id, o.quarter_id);

  select jsonb_build_object('items', jsonb_object_agg(category_slug, quantity),
                            'total_amount_kes', o.total_amount_kes)
    into prev from order_items where order_id = o.id;

  for it in select * from order_items where order_id = o.id loop
    qty := coalesce((p_items->>it.category_slug)::int, 0);
    if qty <> it.quantity then changed := true; end if;
    new_total := new_total + qty * it.unit_price_kes;
  end loop;
  if not changed then raise exception 'No changes to save'; end if;
  if new_total <= 0 then raise exception 'Order at least one lesson book, or cancel the order'; end if;

  for it in select * from order_items where order_id = o.id loop
    update order_items set quantity = coalesce((p_items->>it.category_slug)::int, 0)
     where id = it.id;
  end loop;

  -- BR-12: reconcile the new total against what has already been paid
  v_status := o.status; v_pay := o.payment_status;
  v_refund_due := o.refund_due; v_refund := o.refund_amount_kes;
  if o.amount_paid_kes > 0 then
    if new_total > o.amount_paid_kes then
      adj := 'top_up_required'; v_status := 'awaiting_payment'; v_pay := 'awaiting_payment';
      v_refund_due := false; v_refund := 0;
    elsif new_total = o.amount_paid_kes then
      v_status := 'paid'; v_pay := 'paid'; v_refund_due := false; v_refund := 0;
    else
      adj := 'refund_due'; v_status := 'paid'; v_pay := 'paid';
      v_refund_due := true; v_refund := o.amount_paid_kes - new_total;
    end if;
  end if;

  update orders set total_amount_kes = new_total, status = v_status, payment_status = v_pay,
                    refund_due = v_refund_due, refund_amount_kes = v_refund
   where id = o.id;

  select jsonb_build_object('items', jsonb_object_agg(category_slug, quantity),
                            'total_amount_kes', new_total)
    into nxt from order_items where order_id = o.id;

  insert into order_amendments(order_id, amended_by, previous_data, new_data, payment_adjustment)
  values (o.id, p_user, prev, nxt, adj);

  return jsonb_build_object(
    'order_id', o.id, 'previous_total', o.total_amount_kes, 'new_total', new_total,
    'amount_paid', o.amount_paid_kes, 'payment_adjustment', adj,
    'amount_due', greatest(new_total - o.amount_paid_kes, 0), 'refund_amount', v_refund);
end $$;

create or replace function cancel_order(p_user uuid, p_order_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o orders; org organisations;
begin
  perform set_config('app.actor', p_user::text, true);

  select * into org from organisations where user_id = p_user;
  if not found or org.status <> 'approved' then raise exception 'Your organisation is not approved'; end if;

  select * into o from orders where id = p_order_id and organisation_id = org.id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.status in ('collected','cancelled') then
    raise exception 'This order is % and cannot be cancelled', o.status;
  end if;

  update orders set status = 'cancelled',
                    refund_due = (o.amount_paid_kes > 0),
                    refund_amount_kes = o.amount_paid_kes
   where id = o.id;

  return jsonb_build_object('reference', o.reference,
    'refund_due', o.amount_paid_kes > 0, 'refund_amount', o.amount_paid_kes);
end $$;

-- These functions run with elevated rights, so only our server (service role) may call them
revoke all on function ordering_open(uuid, uuid)       from public, anon, authenticated;
revoke all on function place_order(uuid, jsonb)        from public, anon, authenticated;
revoke all on function amend_order(uuid, uuid, jsonb)  from public, anon, authenticated;
revoke all on function cancel_order(uuid, uuid)        from public, anon, authenticated;
grant execute on function ordering_open(uuid, uuid)       to service_role;
grant execute on function place_order(uuid, jsonb)        to service_role;
grant execute on function amend_order(uuid, uuid, jsonb)  to service_role;
grant execute on function cancel_order(uuid, uuid)        to service_role;