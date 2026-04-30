create table public.class (
  id uuid not null default gen_random_uuid(),
  class character varying(50) not null,
  description text null,
  max_students integer null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint class_pkey primary key (id)
) tablespace pg_default;

create trigger class_updated_at
  before update on class
  for each row execute function update_updated_at_column();
