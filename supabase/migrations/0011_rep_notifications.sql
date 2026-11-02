-- Allow the rep-facing notification types next to the admin ones
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check check (type in (
  'org_registration','critical_stock','order_cancelled','override_granted',
  'override_used','reminders_sent','payment_review','refund_due',
  'quarter_opened','deadline_reminder','payment_received','payment_failed',
  'order_ready','order_collected','refund_processed'));

-- An organisation can see closed quarters it ordered in (for "Past Quarter Summary" and history)
create policy "reps read quarters they ordered in" on quarters for select
  using (exists (select 1 from orders o where o.quarter_id = quarters.id and o.organisation_id = my_org_id()));

-- ...and its own deadline extensions (so its countdown includes them)
create policy "reps read own extensions" on deadline_overrides for select
  using (organisation_id = my_org_id());