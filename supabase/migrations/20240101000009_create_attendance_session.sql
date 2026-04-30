create table public.attendance_session (
  id uuid not null default gen_random_uuid(),
  batch_id uuid not null,
  schedule_id uuid null,
  teacher_id uuid null,
  session_date date not null,
  notes text null,
  is_locked boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint attendance_session_pkey primary key (id),
  constraint attendance_session_unique unique (batch_id, session_date),
  constraint attendance_session_batch_id_fkey foreign key (batch_id)
    references batch (id) on delete cascade,
  constraint attendance_session_schedule_id_fkey foreign key (schedule_id)
    references class_schedule (id) on delete set null,
  constraint attendance_session_teacher_id_fkey foreign key (teacher_id)
    references teachers (id) on delete set null
) tablespace pg_default;

create trigger attendance_session_updated_at
  before update on attendance_session
  for each row execute function update_updated_at_column();
