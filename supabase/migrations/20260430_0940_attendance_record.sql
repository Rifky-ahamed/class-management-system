create table public.attendance_record (
  id uuid not null default gen_random_uuid (),
  session_id uuid not null,
  student_id uuid not null,
  status text not null default 'absent'::text,
  note text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint attendance_record_pkey primary key (id),
  constraint attendance_record_unique unique (session_id, student_id),
  constraint attendance_record_session_id_fkey foreign KEY (session_id) references attendance_session (id) on delete CASCADE,
  constraint attendance_record_student_id_fkey foreign KEY (student_id) references student (id) on delete CASCADE,
  constraint attendance_record_status_check check (
    (
      status = any (
        array[
          'present'::text,
          'absent'::text,
          'late'::text,
          'excused'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger attendance_record_updated_at BEFORE
update on attendance_record for EACH row
execute FUNCTION update_updated_at_column ();