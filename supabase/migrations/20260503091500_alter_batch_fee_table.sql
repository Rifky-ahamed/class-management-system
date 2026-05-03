-- Step 1: Remove the old amount column
ALTER TABLE public.batch_fee
DROP COLUMN amount;

-- Step 2: Add teacher_salary and student_charge columns
ALTER TABLE public.batch_fee
ADD COLUMN teacher_salary numeric(10, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN student_charge numeric(10, 2) NOT NULL DEFAULT 0.00;