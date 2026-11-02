create extension if not exists "pgcrypto";

-- Profiles link auth users to a role and organisation
create table profiles (
  id uuid primary key references auth.users(id),
  role text not null check (role in ('admin','org_rep')),
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table organisations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id),
  name text not null,
  type text not null check (type in ('church','university','school')),
  contact_name text not null,
  contact_email text unique not null,
  phone text,
  mpesa_phone text not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','inactive')),
  rejection_reason text,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table quarters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  open_date date not null,
  deadline_date date not null,
  status text not null default 'draft' check (status in ('draft','published','closed')),
  created_by uuid references profiles(id),
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Only one published quarter at a time
create unique index one_published_quarter on quarters (status) where status = 'published';

create table catalogue_items (
  id uuid primary key default gen_random_uuid(),
  quarter_id uuid not null references quarters(id),
  category_name text not null,
  category_slug text not null check (category_slug in
    ('adults_lesson','adults_dq','kindergarten','primary','cornerstone','realtime')),
  price_kes numeric(10,2) not null check (price_kes >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_locked boolean default false,
  created_at timestamptz default now(),
  unique (quarter_id, category_slug)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null default
    'HHES-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  organisation_id uuid not null references organisations(id),
  quarter_id uuid not null references quarters(id),
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment','paid','ready_for_pickup','collected','cancelled')),
  total_amount_kes numeric(12,2) not null default 0,
  amount_paid_kes numeric(12,2) not null default 0,
  payment_status text not null default 'awaiting_payment'
    check (payment_status in ('awaiting_payment','paid','failed')),
  refund_due boolean default false,
  is_historical boolean default false,
  submitted_at timestamptz,
  collected_at timestamptz,
  created_by uuid references auth.users(id),
  collected_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organisation_id, quarter_id)          -- BR-02
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  catalogue_item_id uuid references catalogue_items(id),
  category_slug text not null,
  quantity integer not null check (quantity >= 0),
  unit_price_kes numeric(10,2) not null,
  created_at timestamptz default now(),
  unique (order_id, category_slug)
);

create table mpesa_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  checkout_request_id text unique not null,
  merchant_request_id text not null,
  phone_number text not null,
  amount_kes numeric(12,2) not null,
  result_code integer,
  result_desc text,
  mpesa_receipt_number text,
  transaction_date timestamptz,
  status text not null default 'pending' check (status in ('pending','success','failed','timeout')),
  raw_callback_payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_amendments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  amended_by uuid references auth.users(id),
  previous_data jsonb not null,
  new_data jsonb not null,
  payment_adjustment text check (payment_adjustment in ('none','top_up_required','refund_due')),
  amended_at timestamptz default now()
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz default now()
);

create table deadline_overrides (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id),
  quarter_id uuid not null references quarters(id),
  original_deadline date not null,
  new_deadline date not null,
  reason text not null check (length(trim(reason)) > 0),
  granted_by uuid not null references profiles(id),
  granted_at timestamptz default now()
);

-- Generic updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

do $$ declare t text; begin
  foreach t in array array['profiles','organisations','quarters','orders','mpesa_transactions'] loop
    execute format('create trigger trg_%I_updated before update on %I
                    for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- BR-10 at DB level + terminal states + status history
create or replace function enforce_order_rules() returns trigger as $$
begin
  if old.status in ('collected','cancelled') and new.status <> old.status then
    raise exception 'Order is % and can no longer change status', old.status;
  end if;

  if new.status in ('ready_for_pickup','collected')
     and new.payment_status <> 'paid' and not new.is_historical then
    raise exception 'BR-10: order must be paid before %', new.status;
  end if;

  if new.status = 'ready_for_pickup' and old.status not in ('paid','ready_for_pickup') then
    raise exception 'Order must be paid before ready_for_pickup';
  end if;

  if new.status is distinct from old.status then
    insert into order_status_history(order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end; $$ language plpgsql;

create trigger trg_order_rules before update on orders
  for each row execute function enforce_order_rules();

-- Seed helper: when a quarter is created, create its six catalogue rows
create or replace function seed_catalogue() returns trigger as $$
begin
  insert into catalogue_items(quarter_id, category_name, category_slug, price_kes, stock_quantity) values
    (new.id,'Adults Lesson','adults_lesson',0,0),
    (new.id,'Adults Lesson Double Quarter','adults_dq',0,0),
    (new.id,'Kindergarten','kindergarten',0,0),
    (new.id,'Primary','primary',0,0),
    (new.id,'Cornerstone','cornerstone',0,0),
    (new.id,'Realtime','realtime',0,0);
  return new;
end; $$ language plpgsql;

create trigger trg_seed_catalogue after insert on quarters
  for each row execute function seed_catalogue();