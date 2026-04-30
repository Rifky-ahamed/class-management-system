create table public.batch (
  id uuid not null default gen_random_uuid(),
  name text not null,
  class_id uuid not null,
  description text null,
  start_date date null,
  end_date date null,
  max_students integer null default 30,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  subject_id uuid null,
  teacher_id uuid null,
  constraint batch_pkey primary key (id),
  constraint batch_class_id_fkey foreign key (class_id)
    references class (id) on delete cascade,
  constraint batch_subject_id_fkey foreign key (subject_id)
    references subject (id) on delete cascade,
  constraint batch_teacher_id_fkey foreign key (teacher_id)
    references teachers (id) on delete cascade
) tablespace pg_default;

create trigger batch_updated_at
  before update on batch
  for each row execute function update_updated_at_column();
