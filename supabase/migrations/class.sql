CREATE TABLE class (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade INT NOT NULL CHECK (grade BETWEEN 6 AND 11),
  class_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO class (grade, class_name) VALUES
(6,  'Grade 6'),
(7,  'Grade 7'),
(8,  'Grade 8'),
(9,  'Grade 9'),
(10, 'Grade 10'),
(11, 'Grade 11');