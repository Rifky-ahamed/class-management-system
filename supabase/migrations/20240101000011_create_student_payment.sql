create table public.student_payment (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  batch_id uuid not null,
  batch_fee_id uuid null,
  amount numeric(10, 2) not null,
  currency text not null default 'LKR'::text,
  month integer not null,
  year integer not null,
  status text not null default 'unpaid'::text,
  paid_amount numeric(10, 2) not null default 0,
  paid_date timestamp with time zone null,
  payment_method text null,
  reference_no text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint student_payment_pkey primary key (id),
  constraint student_payment_unique unique (student_id, batch_id, month, year),
  constraint student_payment_student_id_fkey foreign key (student_id)
    references student (id) on delete cascade,
  constraint student_payment_batch_id_fkey foreign key (batch_id)
    references batch (id) on delete cascade,
  constraint student_payment_batch_fee_id_fkey foreign key (batch_fee_id)
    references batch_fee (id) on delete set null,
  constraint student_payment_month_check check (month >= 1 and month <= 12),
  constraint student_payment_status_check check (
    status = any (array['unpaid'::text, 'paid'::text, 'partial'::text, 'waived'::text])
  ),
  constraint student_payment_payment_method_check check (
    payment_method = any (
      array['cash'::text, 'bank_transfer'::text, 'online'::text, 'other'::text]
    )
  )
) tablespace pg_default;

create trigger student_payment_updated_at
  before update on student_payment
  for each row execute function update_updated_at_column();
