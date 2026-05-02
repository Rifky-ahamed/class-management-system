alter table public.student
add column user_id uuid references auth.users(id) on delete set null;

-- Optionally, create an index for faster lookups
create index if not exists idx_student_user_id on public.student(user_id);
