create table public.student_batch (
  student_id uuid not null,
  batch_id uuid not null,
  enrolled_at timestamp with time zone not null default now(),
  constraint student_batch_pkey primary key (student_id, batch_id),
  constraint student_batch_student_fkey foreign key (student_id)
    references student (id) on delete cascade,
  constraint student_batch_batch_fkey foreign key (batch_id)
    references batch (id) on delete cascade
) tablespace pg_default;
