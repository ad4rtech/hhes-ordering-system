alter table mpesa_transactions add column if not exists needs_review boolean not null default false;
alter table mpesa_transactions add column if not exists review_note text;
alter table mpesa_transactions add column if not exists last_checked_at timestamptz;

-- A receipt number can only ever be recorded once
create unique index if not exists mpesa_receipt_unique
  on mpesa_transactions (mpesa_receipt_number) where mpesa_receipt_number is not null;

create index if not exists mpesa_pending_idx
  on mpesa_transactions (created_at) where status = 'pending';