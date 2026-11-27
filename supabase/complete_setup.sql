-- ============================================================================
-- AuraCare Hospital Website & Booking Platform
-- Complete Idempotent Supabase PostgreSQL Setup (Tables + Indexes + RLS + Storage)
-- Paste and run this entire script once in your Supabase Dashboard -> SQL Editor.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (common user profile & role reference)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'staff', 'doctor', 'reception', 'patient')) DEFAULT 'patient',
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  password_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Services (hospital services & specialities)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  short_description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Stethoscope',
  image_url TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Doctors
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  photo_url TEXT NOT NULL DEFAULT '',
  qualification TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  specialty TEXT NOT NULL,
  biography TEXT NOT NULL DEFAULT '',
  consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500,
  slot_duration_mins INTEGER NOT NULL DEFAULT 30 CHECK (slot_duration_mins IN (15, 20, 30, 45, 60)),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Doctor <-> Services relationship
CREATE TABLE IF NOT EXISTS public.doctor_services (
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, service_id)
);

-- 5. Doctor weekly working hours & availability
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  break_start TEXT,
  break_end TEXT,
  slot_duration_mins INTEGER NOT NULL DEFAULT 15,
  morning_capacity_override INTEGER,
  evening_capacity_override INTEGER,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (doctor_id, day_of_week)
);

-- 6. Blocked slots (breaks, holidays, leave, unavailable periods)
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  is_full_day BOOLEAN NOT NULL DEFAULT FALSE,
  reason TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('break', 'holiday', 'leave', 'blocked')) DEFAULT 'blocked',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT NOT NULL UNIQUE,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  reason_for_visit TEXT NOT NULL DEFAULT '',
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  appointment_date DATE NOT NULL,
  session TEXT NOT NULL CHECK (session IN ('morning', 'evening')) DEFAULT 'morning',
  queue_number INTEGER,
  slot_start TEXT NOT NULL,
  slot_end TEXT NOT NULL,
  consultation_fee NUMERIC(10, 2) NOT NULL,
  original_fee NUMERIC(10, 2),
  coupon_code TEXT,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN (
    'pending_payment', 'pending_confirmation', 'confirmed', 'serving', 'cancelled', 'completed', 'no_show'
  )) DEFAULT 'pending_payment',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  hold_expires_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure assigned queue token numbers remain unique per doctor, date, and session
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doctor_date_session_queue
  ON public.appointments (doctor_id, appointment_date, session, queue_number)
  WHERE queue_number IS NOT NULL AND status <> 'cancelled';

-- 8. Appointment status history
CREATE TABLE IF NOT EXISTS public.appointment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Payments (Razorpay order/payment references & status)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  booking_ref TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')) DEFAULT 'created',
  refund_id TEXT,
  refund_status TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Notification logs (Email, SMS, WhatsApp dispatch tracking)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  event TEXT NOT NULL,
  recipient_ref TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'simulated')),
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Enquiries (Contact Us submissions)
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'in_progress', 'resolved')) DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Website settings (singleton configuration)
CREATE TABLE IF NOT EXISTS public.website_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  hospital_name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  emergency_phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  working_hours TEXT NOT NULL,
  map_link TEXT NOT NULL DEFAULT '',
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT NOT NULL,
  hero_cta_text TEXT NOT NULL DEFAULT 'Book Doctor',
  about_intro TEXT NOT NULL,
  about_mission TEXT NOT NULL,
  about_vision TEXT NOT NULL,
  about_philosophy TEXT NOT NULL,
  about_facilities TEXT NOT NULL,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  why_choose_us JSONB NOT NULL DEFAULT '[]'::jsonb,
  facilities_highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  testimonials JSONB NOT NULL DEFAULT '[]'::jsonb,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  footer_text TEXT NOT NULL,
  seo_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  booking_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  notification_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Password reset tokens (server-only access)
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- 14. Promo coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'flat')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  max_discount_amount NUMERIC(10, 2),
  min_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Live Queue States (real-time current serving token & overrides)
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

-- ============================================================================
-- Storage Bucket for Doctor Portraits, Service Images & Hospital Logo
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('hospital-assets', 'hospital-assets', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Schema & Table Privileges (required alongside RLS in PostgreSQL)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, service_role;

GRANT SELECT ON
  public.services, public.doctors, public.doctor_services,
  public.doctor_schedules, public.blocked_slots, public.website_settings,
  public.coupons, public.queue_states
  TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.profiles, public.appointments, public.appointment_status_history,
  public.payments, public.notification_logs, public.enquiries,
  public.doctor_schedules, public.blocked_slots, public.queue_states
  TO authenticated;

GRANT INSERT ON public.enquiries TO anon;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_states ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS UUID AS $$
  SELECT d.id
  FROM public.doctors d
  JOIN public.profiles p ON p.id = d.profile_id
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Public read access for published catalog & settings
DROP POLICY IF EXISTS "Public read published services" ON public.services;
CREATE POLICY "Public read published services"
  ON public.services FOR SELECT USING (is_published = TRUE OR public.current_user_role() IN ('super_admin', 'staff'));

DROP POLICY IF EXISTS "Public read visible doctors" ON public.doctors;
CREATE POLICY "Public read visible doctors"
  ON public.doctors FOR SELECT USING ((is_active = TRUE AND is_visible = TRUE) OR public.current_user_role() IN ('super_admin', 'staff'));

DROP POLICY IF EXISTS "Public read doctor_services" ON public.doctor_services;
CREATE POLICY "Public read doctor_services"
  ON public.doctor_services FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public read doctor_schedules" ON public.doctor_schedules;
CREATE POLICY "Public read doctor_schedules"
  ON public.doctor_schedules FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public read blocked_slots" ON public.blocked_slots;
CREATE POLICY "Public read blocked_slots"
  ON public.blocked_slots FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public read website_settings" ON public.website_settings;
CREATE POLICY "Public read website_settings"
  ON public.website_settings FOR SELECT USING (TRUE);

-- Profiles: own profile or admin/staff
DROP POLICY IF EXISTS "Profiles self or admin read" ON public.profiles;
CREATE POLICY "Profiles self or admin read"
  ON public.profiles FOR SELECT
  USING (auth_user_id = auth.uid() OR public.current_user_role() IN ('super_admin', 'staff'));

DROP POLICY IF EXISTS "Profiles self update" ON public.profiles;
CREATE POLICY "Profiles self update"
  ON public.profiles FOR UPDATE
  USING (auth_user_id = auth.uid() OR public.current_user_role() = 'super_admin');

-- Appointments: patient sees own, doctor sees assigned, admin/staff sees all
DROP POLICY IF EXISTS "Appointments scoped read" ON public.appointments;
CREATE POLICY "Appointments scoped read"
  ON public.appointments FOR SELECT
  USING (
    public.current_user_role() IN ('super_admin', 'staff')
    OR patient_id = public.current_profile_id()
    OR doctor_id = public.current_doctor_id()
  );

DROP POLICY IF EXISTS "Appointments scoped update" ON public.appointments;
CREATE POLICY "Appointments scoped update"
  ON public.appointments FOR UPDATE
  USING (
    public.current_user_role() IN ('super_admin', 'staff')
    OR patient_id = public.current_profile_id()
    OR doctor_id = public.current_doctor_id()
  );

-- Payments: patient sees own appointment payments, admin/staff sees all
DROP POLICY IF EXISTS "Payments scoped read" ON public.payments;
CREATE POLICY "Payments scoped read"
  ON public.payments FOR SELECT
  USING (
    public.current_user_role() IN ('super_admin', 'staff')
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = payments.appointment_id
        AND a.patient_id = public.current_profile_id()
    )
  );

-- Doctors can manage own availability & blocked slots
DROP POLICY IF EXISTS "Doctors manage own schedules" ON public.doctor_schedules;
CREATE POLICY "Doctors manage own schedules"
  ON public.doctor_schedules FOR ALL
  USING (doctor_id = public.current_doctor_id() OR public.current_user_role() IN ('super_admin', 'staff'));

DROP POLICY IF EXISTS "Doctors manage own blocked slots" ON public.blocked_slots;
CREATE POLICY "Doctors manage own blocked slots"
  ON public.blocked_slots FOR ALL
  USING (doctor_id = public.current_doctor_id() OR public.current_user_role() IN ('super_admin', 'staff'));

-- Enquiries: anyone can insert, admin/staff can read
DROP POLICY IF EXISTS "Public insert enquiries" ON public.enquiries;
CREATE POLICY "Public insert enquiries"
  ON public.enquiries FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admin read enquiries" ON public.enquiries;
CREATE POLICY "Admin read enquiries"
  ON public.enquiries FOR SELECT USING (public.current_user_role() IN ('super_admin', 'staff'));

-- Notification logs & status history: admin/staff
DROP POLICY IF EXISTS "Admin read notification logs" ON public.notification_logs;
CREATE POLICY "Admin read notification logs"
  ON public.notification_logs FOR SELECT USING (public.current_user_role() IN ('super_admin', 'staff'));

DROP POLICY IF EXISTS "Scoped read appointment history" ON public.appointment_status_history;
CREATE POLICY "Scoped read appointment history"
  ON public.appointment_status_history FOR SELECT
  USING (
    public.current_user_role() IN ('super_admin', 'staff')
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_status_history.appointment_id
        AND (a.patient_id = public.current_profile_id() OR a.doctor_id = public.current_doctor_id())
    )
  );

-- Coupons: public read active, admin/staff manage all
DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
CREATE POLICY "Public read active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = TRUE OR public.current_user_role() IN ('super_admin', 'staff'));

DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;
CREATE POLICY "Admin manage coupons"
  ON public.coupons FOR ALL
  USING (public.current_user_role() IN ('super_admin', 'staff'));

-- Queue states: public read, admin/staff/reception/doctor manage
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

-- Enable Supabase Realtime on queue_states & appointments
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
