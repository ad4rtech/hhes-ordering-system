create table notification_log (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id),
  quarter_id uuid not null references quarters(id),
  dedupe_key text not null,
  created_at timestamptz default now(),
  unique (organisation_id, quarter_id, dedupe_key)
);
-- RLS on with no policies: only the service role (our server) can touch it
alter table notification_log enable row level security;