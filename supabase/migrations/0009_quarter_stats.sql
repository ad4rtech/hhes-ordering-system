create or replace function quarter_stats()
returns table (quarter_id uuid, orders bigint, paid_orders bigint, revenue_kes numeric, priced_categories bigint)
language sql stable as $$
  select
    q.id,
    coalesce(o.orders, 0), coalesce(o.paid_orders, 0), coalesce(o.revenue_kes, 0),
    (select count(*) from catalogue_items c where c.quarter_id = q.id and c.price_kes > 0)
  from quarters q
  left join (
    select quarter_id,
           count(*) filter (where status <> 'cancelled') as orders,
           count(*) filter (where status <> 'cancelled' and payment_status = 'paid') as paid_orders,
           coalesce(sum(amount_paid_kes - refund_amount_kes) filter (where status <> 'cancelled'), 0) as revenue_kes
    from orders group by quarter_id
  ) o on o.quarter_id = q.id
$$;
grant execute on function quarter_stats() to authenticated;