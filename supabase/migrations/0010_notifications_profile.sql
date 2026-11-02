-- Profile fields
alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists notification_prefs jsonb not null default '{}'::jsonb;

update profiles
   set first_name = split_part(full_name, ' ', 1),
       last_name  = nullif(btrim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), '')
 where first_name is null and full_name is not null;

-- In-app notifications: one row per admin
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in (
    'org_registration','critical_stock','order_cancelled','override_granted',
    'override_used','reminders_sent','payment_review','refund_due')),
  title text not null,
  body text not null,
  link text,
  action_label text,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index notifications_user_created on notifications (user_id, created_at desc);
create index notifications_unread on notifications (user_id) where read_at is null;
alter table notifications replica identity full;

alter table notifications enable row level security;
create policy "own notifications read" on notifications for select using (user_id = auth.uid());
create policy "own notifications update" on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notifications delete" on notifications for delete using (user_id = auth.uid());
-- The only thing a user may change on a notification is whether it's read
revoke update on notifications from authenticated;
grant update (read_at) on notifications to authenticated;
-- Rows are created by the server (service role) only

do $$ begin alter publication supabase_realtime add table notifications;
exception when duplicate_object then null; end $$;

-- Profile photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "admins read own avatar folder" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "admins upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and is_admin());
create policy "admins update own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and is_admin())
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and is_admin());
create policy "admins delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and is_admin());