create table public.requests (
  id uuid not null default gen_random_uuid(),
  requester_type text not null,
  teacher_id uuid null,
  student_id uuid null,
  category text not null default 'general'::text,
  subject text not null,
  message text not null,
  status text not null default 'pending'::text,
  priority text not null default 'normal'::text,
  response text null,
  responded_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint requests_pkey primary key (id),
  constraint requests_teacher_id_fkey foreign key (teacher_id)
    references teachers (id) on delete cascade,
  constraint requests_student_id_fkey foreign key (student_id)
    references student (id) on delete cascade,
  constraint requests_requester_type_check check (
    requester_type = any (array['teacher'::text, 'student'::text])
  ),
  constraint requests_teacher_or_student check (
    (
      (requester_type = 'teacher'::text)
      and (teacher_id is not null)
      and (student_id is null)
    )
    or (
      (requester_type = 'student'::text)
      and (student_id is not null)
      and (teacher_id is null)
    )
  ),
  constraint requests_category_check check (
    category = any (
      array['leave'::text, 'payment'::text, 'technical'::text,
            'schedule'::text, 'general'::text, 'other'::text]
    )
  ),
  constraint requests_status_check check (
    status = any (
      array['pending'::text, 'in_progress'::text, 'resolved'::text, 'rejected'::text]
    )
  ),
  constraint requests_priority_check check (
    priority = any (
      array['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]
    )
  )
) tablespace pg_default;

create index if not exists requests_teacher_id_idx
  on public.requests using btree (teacher_id) tablespace pg_default;

create index if not exists requests_student_id_idx
  on public.requests using btree (student_id) tablespace pg_default;

create index if not exists requests_status_idx
  on public.requests using btree (status) tablespace pg_default;

create trigger requests_updated_at
  before update on requests
  for each row execute function update_updated_at_column();
