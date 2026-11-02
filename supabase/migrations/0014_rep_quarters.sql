-- Approved organisations can see every non-draft quarter (names and dates only),
-- so the compliance record can spot quarters they missed. Drafts stay hidden.
create policy "approved reps read non-draft quarters" on quarters for select
  using (status <> 'draft' and my_org_is_approved());