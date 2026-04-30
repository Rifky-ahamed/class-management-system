create table public.teachers (
  id uuid not null default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text null,
  dob date null,
  is_active boolean not null default true,
  is_registered boolean not null default false,
  force_password_reset boolean not null default true,
  last_login timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  subject_id uuid null,
  constraint teachers_pkey primary key (id),
  constraint teachers_email_key unique (email),
  constraint teachers_subject_id_fkey foreign key (subject_id)
    references subject (id) on delete set null
) tablespace pg_default;

create trigger teachers_updated_at
  before update on teachers
  for each row execute function update_updated_at_column();
