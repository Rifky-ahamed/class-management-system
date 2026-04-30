create table public.teacher_subjects (
  id uuid not null default gen_random_uuid(),
  teacher_id uuid not null,
  subject_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint teacher_subjects_pkey primary key (id),
  constraint teacher_subjects_unique unique (teacher_id, subject_id),
  constraint teacher_subjects_teacher_id_fkey foreign key (teacher_id)
    references teachers (id) on delete cascade,
  constraint teacher_subjects_subject_id_fkey foreign key (subject_id)
    references subject (id) on delete cascade
) tablespace pg_default;
