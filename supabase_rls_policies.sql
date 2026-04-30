-- Only admins can see all users
create policy "Admins can read all profiles"
  on profiles for select
  using (auth.jwt() ->> 'role' = 'admin');

-- Teachers see only their own class students
create policy "Teachers see assigned students"
  on enrollments for select
  using (teacher_id = auth.uid());

-- Students see only their own data
create policy "Students see own data"
  on profiles for select
  using (id = auth.uid());
