create table public.student (
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
  constraint student_pkey primary key (id),
  constraint student_email_key unique (email)
) tablespace pg_default;
