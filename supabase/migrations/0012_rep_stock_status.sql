-- The rep-safe catalogue: price + a stock STATUS based on what's left after everyone's orders.
-- No numbers are exposed and nothing from other organisations' orders leaks.
create or replace view catalogue_public as
with ordered as (
  select o.quarter_id, oi.category_slug, sum(oi.quantity) as qty
  from orders o
  join order_items oi on oi.order_id = o.id
  where o.status <> 'cancelled'
  group by o.quarter_id, oi.category_slug
)
select
  ci.id, ci.quarter_id, ci.category_name, ci.category_slug, ci.price_kes,
  case
    when ci.stock_quantity - coalesce(od.qty, 0) <= 0 then 'out'
    when (ci.stock_quantity - coalesce(od.qty, 0))::numeric / nullif(ci.stock_quantity, 0) <= 0.20 then 'low'
    else 'available'
  end as stock_status
from catalogue_items ci
join quarters q on q.id = ci.quarter_id
left join ordered od on od.quarter_id = ci.quarter_id and od.category_slug = ci.category_slug
where q.status = 'published' and my_org_is_approved();

grant select on catalogue_public to authenticated;