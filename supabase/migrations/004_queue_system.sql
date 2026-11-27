-- ============================================================================
-- Incremental Migration: Queue-Based Appointment System & Live Queue States
-- Run this SQL query in your Supabase Dashboard -> SQL Editor.
-- ============================================================================

-- 1. Allow 'reception' role in profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'staff', 'doctor', 'reception', 'patient'));

-- 2. Add optional per-session capacity overrides on doctor_schedules
ALTER TABLE public.doctor_schedules
  ADD COLUMN IF NOT EXISTS morning_capacity_override INTEGER,
  ADD COLUMN IF NOT EXISTS evening_capacity_override INTEGER;

-- 3. Upgrade appointments from fixed time slots to Morning/Evening queue windows
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS session TEXT NOT NULL CHECK (session IN ('morning', 'evening')) DEFAULT 'morning',
  ADD COLUMN IF NOT EXISTS queue_number INTEGER;

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'pending_payment', 'pending_confirmation', 'confirmed', 'serving', 'cancelled', 'completed', 'no_show'
  ));

-- Replace old single-slot uniqueness constraint with unique queue token per doctor+date+session
DROP INDEX IF EXISTS public.idx_unique_active_appointment_slot;
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doctor_date_session_queue
  ON public.appointments (doctor_id, appointment_date, session, queue_number)
  WHERE queue_number IS NOT NULL AND status <> 'cancelled';

-- 4. Create live queue_states table (real-time current serving token & overrides)
CREATE TABLE IF NOT EXISTS public.queue_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  queue_date DATE NOT NULL,
  session TEXT NOT NULL CHECK (session IN ('morning', 'evening')),
  current_serving_number INTEGER NOT NULL DEFAULT 0,
  capacity_override INTEGER,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doctor_id, queue_date, session)
);

-- 5. Privileges & RLS for queue_states
GRANT ALL PRIVILEGES ON TABLE public.queue_states TO postgres, service_role;
GRANT SELECT ON TABLE public.queue_states TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.queue_states TO authenticated;

ALTER TABLE public.queue_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read queue states" ON public.queue_states;
CREATE POLICY "Public read queue states"
  ON public.queue_states FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Staff reception doctor manage queue states" ON public.queue_states;
CREATE POLICY "Staff reception doctor manage queue states"
  ON public.queue_states FOR ALL
  USING (
    public.current_user_role() IN ('super_admin', 'staff', 'reception')
    OR doctor_id = public.current_doctor_id()
  );

-- 6. Enable Supabase Realtime publication on queue_states and appointments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pg_publication.pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'queue_states'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_states;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointments'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
  END IF;
END $$;
