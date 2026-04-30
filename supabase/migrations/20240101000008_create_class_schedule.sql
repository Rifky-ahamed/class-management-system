create table public.class_schedule (
  id uuid not null default gen_random_uuid(),
  batch_id uuid not null,
  teacher_id uuid null,
  day_of_week smallint not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  room text null,
  notes text null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint class_schedule_pkey primary key (id),
  constraint class_schedule_batch_id_fkey foreign key (batch_id)
    references batch (id) on delete cascade,
  constraint class_schedule_teacher_id_fkey foreign key (teacher_id)
    references teachers (id) on delete set null,
  constraint class_schedule_day_of_week_check check (
    day_of_week >= 0 and day_of_week <= 6
  ),
  constraint class_schedule_time_check check (end_time > start_time)
) tablespace pg_default;

create trigger class_schedule_updated_at
  before update on class_schedule
  for each row execute function update_updated_at_column();
