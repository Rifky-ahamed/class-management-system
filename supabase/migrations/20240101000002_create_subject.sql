create table public.subject (
  id uuid not null default gen_random_uuid(),
  name text not null,
  code text null,
  description text null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint subject_pkey primary key (id),
  constraint subject_code_key unique (code)
) tablespace pg_default;

create trigger subject_updated_at
  before update on subject
  for each row execute function update_updated_at_column();
