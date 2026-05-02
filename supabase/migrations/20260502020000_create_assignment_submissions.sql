create table public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student(id) ON DELETE CASCADE,
    
    status TEXT CHECK (status IN ('pending', 'submitted', 'graded')) DEFAULT 'pending',
    
    submission_content TEXT,
    file_url TEXT,
    
    marks_obtained NUMERIC,
    feedback TEXT,
    
    submitted_at TIMESTAMP,
    graded_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE (assignment_id, student_id)
);

create trigger assignment_submissions_updated_at
  before update on assignment_submissions
  for each row execute function update_updated_at_column();
