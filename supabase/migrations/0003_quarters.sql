-- Atomic publish: validates, locks prices, enforces one published quarter
create or replace function publish_quarter(p_quarter_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare q quarters; priced int;
begin
  if not is_admin() then raise exception 'Forbidden'; end if;

  select * into q from quarters where id = p_quarter_id for update;
  if not found then raise exception 'Quarter not found'; end if;
  if q.status <> 'draft' then raise exception 'Only draft quarters can be published'; end if;

  select count(*) into priced from catalogue_items
   where quarter_id = p_quarter_id and price_kes > 0;
  if priced < 6 then raise exception 'All six categories need a price above zero before publishing'; end if;

  if exists (select 1 from quarters where status = 'published') then
    raise exception 'Another quarter is already published. Close it first.';
  end if;

  update catalogue_items set is_locked = true where quarter_id = p_quarter_id;
  update quarters set status = 'published' where id = p_quarter_id;
end $$;

-- BR-07 at database level: locked prices can never change or be unlocked
create or replace function block_locked_price() returns trigger as $$
begin
  if old.is_locked and (new.price_kes <> old.price_kes or new.is_locked = false) then
    raise exception 'BR-07: prices are locked for a published quarter';
  end if;
  return new;
end $$ language plpgsql;

create trigger trg_block_locked_price before update on catalogue_items
  for each row execute function block_locked_price();