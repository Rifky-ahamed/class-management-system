create table public.batch_fee (
  id uuid not null default gen_random_uuid(),
  batch_id uuid not null,
  amount numeric(10, 2) not null,
  currency text not null default 'LKR'::text,
  fee_type text not null default 'monthly'::text,
  description text null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint batch_fee_pkey primary key (id),
  constraint batch_fee_batch_id_fkey foreign key (batch_id)
    references batch (id) on delete cascade,
  constraint batch_fee_fee_type_check check (
    fee_type = any (array['monthly'::text, 'one_time'::text, 'per_session'::text])
  )
) tablespace pg_default;

create trigger batch_fee_updated_at
  before update on batch_fee
  for each row execute function update_updated_at_column();
