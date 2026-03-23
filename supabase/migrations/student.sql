-- ============================================
-- Student Profile Table (No Password Storage)
-- Passwords handled by Supabase Auth
-- ============================================

CREATE TABLE student (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id      UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, -- links to Supabase Auth
  student_code      VARCHAR(50) NOT NULL UNIQUE,
  name              VARCHAR(100) NOT NULL,
  email             VARCHAR(100) NOT NULL UNIQUE,
  username          VARCHAR(100) NOT NULL UNIQUE,
  phone             VARCHAR(20),
  dob               DATE,
  institute_id      INT,
  class_id          INT,

  -- Validation Flags
  is_registered     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT FALSE,

  -- Enhancement Flags
  force_password_reset  BOOLEAN NOT NULL DEFAULT TRUE,
  last_login            TIMESTAMP WITH TIME ZONE,

  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_student_auth_user_id ON student(auth_user_id);
CREATE INDEX idx_student_institute_id ON student(institute_id);
CREATE INDEX idx_student_class_id ON student(class_id);
CREATE INDEX idx_student_email ON student(email);

-- ============================================
-- Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_student_updated_at
  BEFORE UPDATE ON student
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();