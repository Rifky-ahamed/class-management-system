create table public.teacher_salary (
  id uuid not null default gen_random_uuid(),
  teacher_id uuid not null,
  amount numeric(10, 2) not null,
  currency text not null default 'LKR'::text,
  effective_from date not null default current_date,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint teacher_salary_pkey primary key (id),
  constraint teacher_salary_teacher_id_fkey foreign key (teacher_id)
    references teachers (id) on delete cascade
) tablespace pg_default;

create trigger teacher_salary_updated_at
  before update on teacher_salary
  for each row execute function update_updated_at_column();
