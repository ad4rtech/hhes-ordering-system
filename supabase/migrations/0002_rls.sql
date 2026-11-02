-- Helper functions (security definer so policies don't recurse into RLS)
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function my_org_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from organisations where user_id = auth.uid();
$$;

create or replace function my_org_is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from organisations where user_id = auth.uid() and status = 'approved');
$$;

-- Enable RLS everywhere
alter table profiles            enable row level security;
alter table organisations       enable row level security;
alter table quarters            enable row level security;
alter table catalogue_items     enable row level security;
alter table orders              enable row level security;
alter table order_items         enable row level security;
alter table mpesa_transactions  enable row level security;
alter table order_amendments    enable row level security;
alter table order_status_history enable row level security;
alter table deadline_overrides  enable row level security;

-- profiles
create policy "own profile read"  on profiles for select using (id = auth.uid() or is_admin());
create policy "admin manage profiles" on profiles for all using (is_admin()) with check (is_admin());

-- organisations
create policy "rep reads own org" on organisations for select using (user_id = auth.uid() or is_admin());
create policy "rep updates own contact details" on organisations for update
  using (user_id = auth.uid() and status = 'approved')
  with check (user_id = auth.uid() and status = 'approved');
create policy "admin manages orgs" on organisations for all using (is_admin()) with check (is_admin());
-- Registration inserts happen server-side with the service role.

-- quarters: approved reps may see published ones
create policy "reps read published quarters" on quarters for select
  using (is_admin() or (status = 'published' and my_org_is_approved()));
create policy "admin manages quarters" on quarters for all using (is_admin()) with check (is_admin());

-- catalogue_items: ADMIN ONLY (reps must never see stock numbers, BR-08)
create policy "admin manages catalogue" on catalogue_items for all using (is_admin()) with check (is_admin());

-- Rep-safe catalogue view: price + stock STATUS only
create or replace view catalogue_public as
select
  ci.id, ci.quarter_id, ci.category_name, ci.category_slug, ci.price_kes,
  case
    when ci.stock_quantity <= 0 then 'out'
    when ci.stock_quantity <= 20 then 'low'
    else 'available'
  end as stock_status
from catalogue_items ci
join quarters q on q.id = ci.quarter_id
where q.status = 'published' and my_org_is_approved();
grant select on catalogue_public to authenticated;

-- orders
create policy "rep reads own orders" on orders for select
  using (organisation_id = my_org_id() or is_admin());
create policy "admin manages orders" on orders for all using (is_admin()) with check (is_admin());
-- Rep INSERT/UPDATE go through route handlers (service role) so deadline,
-- lock and payment rules are enforced in one place.

-- order_items
create policy "rep reads own items" on order_items for select
  using (is_admin() or exists (select 1 from orders o where o.id = order_id and o.organisation_id = my_org_id()));
create policy "admin manages items" on order_items for all using (is_admin()) with check (is_admin());

-- mpesa_transactions: read-only for users, writes via service role only
create policy "rep reads own payments" on mpesa_transactions for select
  using (is_admin() or exists (select 1 from orders o where o.id = order_id and o.organisation_id = my_org_id()));

-- amendments + status history
create policy "read own amendments" on order_amendments for select
  using (is_admin() or exists (select 1 from orders o where o.id = order_id and o.organisation_id = my_org_id()));
create policy "read own history" on order_status_history for select
  using (is_admin() or exists (select 1 from orders o where o.id = order_id and o.organisation_id = my_org_id()));

-- deadline_overrides: append-only (BR-06). No UPDATE/DELETE policy exists for anyone.
create policy "admin reads overrides" on deadline_overrides for select using (is_admin());
create policy "admin inserts overrides" on deadline_overrides for insert with check (is_admin());
revoke update, delete on deadline_overrides from authenticated, anon;