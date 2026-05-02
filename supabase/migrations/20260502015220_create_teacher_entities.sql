create table public.assignments (
  id uuid not null default gen_random_uuid(),
  batch_id uuid not null,
  teacher_id uuid not null,
  title text not null,
  description text,
  due_date timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint assignments_pkey primary key (id),
  constraint assignments_batch_id_fkey foreign key (batch_id) references batch (id) on delete cascade,
  constraint assignments_teacher_id_fkey foreign key (teacher_id) references teachers (id) on delete cascade
) tablespace pg_default;

create trigger assignments_updated_at
  before update on assignments
  for each row execute function update_updated_at_column();

create table public.study_materials (
  id uuid not null default gen_random_uuid(),
  batch_id uuid not null,
  teacher_id uuid not null,
  title text not null,
  description text,
  file_url text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint study_materials_pkey primary key (id),
  constraint study_materials_batch_id_fkey foreign key (batch_id) references batch (id) on delete cascade,
  constraint study_materials_teacher_id_fkey foreign key (teacher_id) references teachers (id) on delete cascade
) tablespace pg_default;

create trigger study_materials_updated_at
  before update on study_materials
  for each row execute function update_updated_at_column();

create table public.exam_marks (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  batch_id uuid not null,
  teacher_id uuid not null,
  exam_name text not null,
  marks_obtained numeric not null,
  total_marks numeric not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint exam_marks_pkey primary key (id),
  constraint exam_marks_student_id_fkey foreign key (student_id) references student (id) on delete cascade,
  constraint exam_marks_batch_id_fkey foreign key (batch_id) references batch (id) on delete cascade,
  constraint exam_marks_teacher_id_fkey foreign key (teacher_id) references teachers (id) on delete cascade
) tablespace pg_default;

create trigger exam_marks_updated_at
  before update on exam_marks
  for each row execute function update_updated_at_column();

create table public.notices (
  id uuid not null default gen_random_uuid(),
  title text not null,
  content text not null,
  target_audience text not null default 'all'::text,
  target_batch_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint notices_pkey primary key (id),
  constraint notices_target_audience_check check (
    target_audience = any (array['all'::text, 'teachers'::text, 'students'::text, 'batch'::text])
  ),
  constraint notices_target_batch_id_fkey foreign key (target_batch_id) references batch (id) on delete cascade
) tablespace pg_default;

create trigger notices_updated_at
  before update on notices
  for each row execute function update_updated_at_column();
