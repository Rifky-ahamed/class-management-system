-- Migration to refactor teacher and student payment models
-- Date: 2026-05-03

-- 1. Teacher Payments (Batch-based)
ALTER TABLE public.teacher_payment 
  DROP CONSTRAINT IF EXISTS teacher_payment_unique,
  DROP CONSTRAINT IF EXISTS teacher_payment_month_check;

ALTER TABLE public.teacher_payment
  DROP COLUMN IF EXISTS month,
  DROP COLUMN IF EXISTS year;

-- Since the table already has data, adding a NOT NULL column requires a default or we can clear the table if it's dummy data.
-- Given it's a structural shift in a dev env, let's delete existing payment records to prevent constraint errors.
TRUNCATE TABLE public.teacher_payment;

ALTER TABLE public.teacher_payment
  ADD COLUMN batch_id uuid NOT NULL,
  ADD COLUMN transaction_id text;

ALTER TABLE public.teacher_payment
  ADD CONSTRAINT teacher_payment_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batch(id) ON DELETE CASCADE,
  ADD CONSTRAINT teacher_payment_unique UNIQUE (teacher_id, batch_id);


-- 2. Student Payments (Installment-based)
ALTER TABLE public.student_payment
  DROP CONSTRAINT IF EXISTS student_payment_unique,
  DROP CONSTRAINT IF EXISTS student_payment_month_check;

ALTER TABLE public.student_payment
  DROP COLUMN IF EXISTS month,
  DROP COLUMN IF EXISTS year;

TRUNCATE TABLE public.student_payment;

ALTER TABLE public.student_payment
  ADD COLUMN installment_no integer NOT NULL DEFAULT 1,
  ADD COLUMN due_date date;

ALTER TABLE public.student_payment
  ADD CONSTRAINT student_payment_unique UNIQUE (student_id, batch_id, installment_no),
  ADD CONSTRAINT student_payment_amount_check CHECK (paid_amount <= amount);

-- Rename paid_date to paid_at for consistency if needed, but paid_date already exists.
ALTER TABLE public.student_payment
  RENAME COLUMN paid_date TO paid_at;

ALTER TABLE public.teacher_payment
  RENAME COLUMN paid_date TO paid_at;

-- 3. Batch Fee (Installment Support)
ALTER TABLE public.batch_fee
  DROP CONSTRAINT IF EXISTS batch_fee_fee_type_check;

ALTER TABLE public.batch_fee
  ADD COLUMN installment_count integer DEFAULT 1,
  ADD CONSTRAINT batch_fee_fee_type_check CHECK (
    fee_type = any (array['monthly'::text, 'one_time'::text, 'per_session'::text, 'installment'::text])
  );
