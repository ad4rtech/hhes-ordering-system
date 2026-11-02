-- Organisation location (shown on the order form; the profile page will let them edit it)
alter table organisations add column if not exists location text;

-- What an organisation may still order, per category.
-- Status only, plus a count when stock is low. Exclude their own order when editing it.
create or replace function rep_availability(p_exclude_order uuid default null)
returns table (category_slug text, price_kes numeric, status text, left_units integer)
language sql stable security definer set search_path = public as $$
  with q as (select id from quarters where status = 'published' limit 1),
  taken as (
    select oi.category_slug, sum(oi.quantity)::int as qty
    from orders o join order_items oi on oi.order_id = o.id
    where o.quarter_id = (select id from q) and o.status <> 'cancelled'
      and (p_exclude_order is null or o.id <> p_exclude_order)
    group by oi.category_slug
  ),
  calc as (
    select ci.category_slug, ci.price_kes, ci.stock_quantity,
           ci.stock_quantity - coalesce(t.qty, 0) as remaining
    from catalogue_items ci left join taken t on t.category_slug = ci.category_slug
    where ci.quarter_id = (select id from q)
  )
  select category_slug, price_kes,
    case when remaining <= 0 then 'out'
         when remaining::numeric / nullif(stock_quantity, 0) <= 0.20 then 'low'
         else 'available' end,
    case when remaining <= 0 then 0
         when remaining::numeric / nullif(stock_quantity, 0) <= 0.20 then remaining
         else null end
  from calc
  where my_org_is_approved();
$$;
revoke all on function rep_availability(uuid) from public, anon;
grant execute on function rep_availability(uuid) to authenticated;

-- Placing an order now respects stock
create or replace function place_order(p_user uuid, p_items jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare o organisations; q quarters; v_order uuid; ci record;
        qty int; total numeric := 0; any_qty boolean := false; remaining int;
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

  -- Orders for this quarter queue here, so two organisations can't both take the last books
  perform 1 from catalogue_items where quarter_id = q.id order by id for update;

  insert into orders(organisation_id, quarter_id, status, payment_status, total_amount_kes, submitted_at, created_by)
  values (o.id, q.id, 'awaiting_payment', 'awaiting_payment', 0, now(), p_user)
  returning id into v_order;

  for ci in select * from catalogue_items where quarter_id = q.id order by category_slug loop
    qty := coalesce((p_items->>ci.category_slug)::int, 0);
    if qty > 0 then
      any_qty := true;
      select ci.stock_quantity - coalesce(sum(oi.quantity), 0) into remaining
        from order_items oi join orders oo on oo.id = oi.order_id
       where oo.quarter_id = q.id and oo.status <> 'cancelled' and oi.category_slug = ci.category_slug;
      if remaining <= 0 then
        raise exception '% is out of stock', ci.category_name;
      elsif qty > remaining then
        raise exception 'Only % % of % left. Reduce the quantity and try again.', remaining,
          case when remaining = 1 then 'unit' else 'units' end, ci.category_name;
      end if;
    end if;
    insert into order_items(order_id, catalogue_item_id, category_slug, quantity, unit_price_kes)
    values (v_order, ci.id, ci.category_slug, qty, ci.price_kes);
    total := total + qty * ci.price_kes;
  end loop;

  if not any_qty then raise exception 'Order at least one lesson book'; end if;

  update orders set total_amount_kes = total where id = v_order;
  insert into order_status_history(order_id, from_status, to_status, changed_by) values (v_order, null, 'awaiting_payment', p_user);
  return v_order;
end $$;

-- ...and so does amending one: you can raise a quantity only up to what's left
create or replace function amend_order(p_user uuid, p_order_id uuid, p_items jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o orders; org organisations; prev jsonb; nxt jsonb; it record; chk record; qty int; remaining int;
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

  select jsonb_build_object('items', jsonb_object_agg(category_slug, quantity), 'total_amount_kes', o.total_amount_kes)
    into prev from order_items where order_id = o.id;

  for it in select * from order_items where order_id = o.id loop
    qty := coalesce((p_items->>it.category_slug)::int, 0);
    if qty <> it.quantity then changed := true; end if;
    new_total := new_total + qty * it.unit_price_kes;
  end loop;
  if not changed then raise exception 'No changes to save'; end if;
  if new_total <= 0 then raise exception 'Order at least one lesson book, or cancel the order'; end if;

  perform 1 from catalogue_items where quarter_id = o.quarter_id order by id for update;
  for chk in
    select oi.category_slug, oi.quantity, ci.stock_quantity, ci.category_name
      from order_items oi join catalogue_items ci on ci.id = oi.catalogue_item_id where oi.order_id = o.id
  loop
    qty := coalesce((p_items->>chk.category_slug)::int, 0);
    if qty > chk.quantity then
      select chk.stock_quantity - coalesce(sum(x.quantity), 0) into remaining
        from order_items x join orders oo on oo.id = x.order_id
       where oo.quarter_id = o.quarter_id and oo.status <> 'cancelled' and oo.id <> o.id and x.category_slug = chk.category_slug;
      if remaining <= 0 then
        raise exception '% is out of stock', chk.category_name;
      elsif qty > remaining then
        raise exception 'Only % % of % left. Reduce the quantity and try again.', remaining,
          case when remaining = 1 then 'unit' else 'units' end, chk.category_name;
      end if;
    end if;
  end loop;

  for it in select * from order_items where order_id = o.id loop
    update order_items set quantity = coalesce((p_items->>it.category_slug)::int, 0) where id = it.id;
  end loop;

  v_status := o.status; v_pay := o.payment_status; v_refund_due := o.refund_due; v_refund := o.refund_amount_kes;
  if o.amount_paid_kes > 0 then
    if new_total > o.amount_paid_kes then
      adj := 'top_up_required'; v_status := 'awaiting_payment'; v_pay := 'awaiting_payment'; v_refund_due := false; v_refund := 0;
    elsif new_total = o.amount_paid_kes then
      v_status := 'paid'; v_pay := 'paid'; v_refund_due := false; v_refund := 0;
    else
      adj := 'refund_due'; v_status := 'paid'; v_pay := 'paid'; v_refund_due := true; v_refund := o.amount_paid_kes - new_total;
    end if;
  end if;

  update orders set total_amount_kes = new_total, status = v_status, payment_status = v_pay,
                    refund_due = v_refund_due, refund_amount_kes = v_refund where id = o.id;

  select jsonb_build_object('items', jsonb_object_agg(category_slug, quantity), 'total_amount_kes', new_total)
    into nxt from order_items where order_id = o.id;

  insert into order_amendments(order_id, amended_by, previous_data, new_data, payment_adjustment)
  values (o.id, p_user, prev, nxt, adj);

  return jsonb_build_object('order_id', o.id, 'previous_total', o.total_amount_kes, 'new_total', new_total,
    'amount_paid', o.amount_paid_kes, 'payment_adjustment', adj,
    'amount_due', greatest(new_total - o.amount_paid_kes, 0), 'refund_amount', v_refund);
end $$;