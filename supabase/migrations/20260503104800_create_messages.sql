create table public.messages (
  id uuid not null default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  student_id uuid not null references student(id) on delete cascade,
  sender_type text not null check (sender_type in ('teacher', 'student')),
  content text not null,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint messages_pkey primary key (id)
) tablespace pg_default;

-- Indexes for scalable querying
create index messages_teacher_id_idx on public.messages(teacher_id);
create index messages_student_id_idx on public.messages(student_id);
create index messages_created_at_idx on public.messages(created_at);

alter publication supabase_realtime add table public.messages;

-- Teachers can read/write their own conversations
create policy "teachers_select_messages"
on public.messages for select
using (
  teacher_id = (
    select id from public.teachers where email = auth.email()
  )
);

create policy "teachers_insert_messages"
on public.messages for insert
with check (
  teacher_id = (
    select id from public.teachers where email = auth.email()
  )
  and sender_type = 'teacher'
);

create policy "teachers_update_messages"
on public.messages for update
using (
  teacher_id = (
    select id from public.teachers where email = auth.email()
  )
);

-- Students can read/write their own conversations
create policy "students_select_messages"
on public.messages for select
using (
  student_id = (
    select id from public.student where email = auth.email()
  )
);

create policy "students_insert_messages"
on public.messages for insert
with check (
  student_id = (
    select id from public.student where email = auth.email()
  )
  and sender_type = 'student'
);

create policy "students_update_messages"
on public.messages for update
using (
  student_id = (
    select id from public.student where email = auth.email()
  )
);