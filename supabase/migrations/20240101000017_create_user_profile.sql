create table public.user_profile (
  id uuid not null,
  email character varying(100) not null,
  fullname character varying(100) not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_profile_pkey primary key (id),
  constraint user_profile_email_key unique (email),
  constraint user_profile_id_fkey foreign key (id)
    references auth.users (id) on delete cascade
) tablespace pg_default;

create trigger set_updated_at
  before update on user_profile
  for each row execute function update_updated_at_column();
