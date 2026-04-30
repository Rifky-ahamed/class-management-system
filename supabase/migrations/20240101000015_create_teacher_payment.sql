create table public.teacher_payment (
  id uuid not null default gen_random_uuid(),
  teacher_id uuid not null,
  amount numeric(10, 2) not null,
  currency text not null default 'LKR'::text,
  month integer not null,
  year integer not null,
  status text not null default 'pending'::text,
  paid_amount numeric(10, 2) not null default 0,
  paid_date date null,
  payment_method text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint teacher_payment_pkey primary key (id),
  constraint teacher_payment_unique unique (teacher_id, month, year),
  constraint teacher_payment_teacher_id_fkey foreign key (teacher_id)
    references teachers (id) on delete cascade,
  constraint teacher_payment_month_check check (month >= 1 and month <= 12),
  constraint teacher_payment_status_check check (
    status = any (array['pending'::text, 'paid'::text, 'partial'::text])
  )
) tablespace pg_default;

create trigger teacher_payment_updated_at
  before update on teacher_payment
  for each row execute function update_updated_at_column();
