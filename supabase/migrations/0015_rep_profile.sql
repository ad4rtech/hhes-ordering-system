-- Approved organisations may manage their own profile picture (admins already could)
create policy "reps upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and my_org_is_approved());
create policy "reps update own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and my_org_is_approved())
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and my_org_is_approved());
create policy "reps delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and my_org_is_approved());

-- Only HHES (admins) and the server may change the fields HHES controls
create or replace function protect_org_columns() returns trigger
language plpgsql as $$
begin
  -- auth.uid() is null for server-side (service role) calls, which are allowed
  if auth.uid() is not null and not is_admin() then
    if new.name is distinct from old.name
       or new.type is distinct from old.type
       or new.status is distinct from old.status
       or new.user_id is distinct from old.user_id
       or new.contact_email is distinct from old.contact_email
       or new.approved_by is distinct from old.approved_by
       or new.approved_at is distinct from old.approved_at
       or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'Only HHES can change these details';
    end if;
  end if;
  return new;
end $$;

create trigger trg_protect_org before update on organisations
  for each row execute function protect_org_columns();