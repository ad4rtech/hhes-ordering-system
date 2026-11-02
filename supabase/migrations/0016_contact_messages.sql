create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  organisation text,
  topic text not null,
  message text not null,
  user_id uuid references auth.users(id) on delete set null, -- set when sent while signed in
  ip_hash text,                                               -- one-way hash, never the address itself
  created_at timestamptz not null default now()
);
create index contact_messages_recent on contact_messages (created_at desc);
create index contact_messages_email on contact_messages (email, created_at desc);
create index contact_messages_ip on contact_messages (ip_hash, created_at desc);

alter table contact_messages enable row level security;
-- Visitors can't read or write this table directly: only our server writes, and admins can read.
create policy "admins read contact messages" on contact_messages for select using (is_admin());