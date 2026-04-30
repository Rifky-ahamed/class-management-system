create table public.teacher_classes (
  id uuid not null default gen_random_uuid(),
  teacher_id uuid not null,
  class_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint teacher_classes_pkey primary key (id),
  constraint teacher_classes_unique unique (teacher_id, class_id),
  constraint teacher_classes_teacher_id_fkey foreign key (teacher_id)
    references teachers (id) on delete cascade,
  constraint teacher_classes_class_id_fkey foreign key (class_id)
    references class (id) on delete cascade
) tablespace pg_default;
