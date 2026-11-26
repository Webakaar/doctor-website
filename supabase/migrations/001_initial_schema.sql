-- Hospital Website & Doctor Appointment Booking Platform
-- Initial PostgreSQL Schema for Supabase

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (common user profile & role reference)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'staff', 'doctor', 'patient')) DEFAULT 'patient',
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
  start_time TEXT NOT NULL, -- HH:MM
  end_time TEXT NOT NULL,   -- HH:MM
  break_start TEXT,         -- HH:MM nullable
  break_end TEXT,           -- HH:MM nullable
  slot_duration_mins INTEGER NOT NULL DEFAULT 30,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (doctor_id, day_of_week)
);

-- 6. Blocked slots (breaks, holidays, leave, unavailable periods)
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TEXT, -- HH:MM when partial day
  end_time TEXT,   -- HH:MM when partial day
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
  slot_start TEXT NOT NULL, -- HH:MM
  slot_end TEXT NOT NULL,   -- HH:MM
  consultation_fee NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'pending_payment', 'pending_confirmation', 'confirmed', 'cancelled', 'completed', 'no_show'
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

-- Prevent duplicate active bookings for the same doctor, date, and slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_appointment_slot
  ON public.appointments (doctor_id, appointment_date, slot_start)
  WHERE status IN ('pending_payment', 'pending_confirmation', 'confirmed', 'completed');

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

-- 13. Password reset tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Public storage bucket for doctor portraits, service images & hospital logo
INSERT INTO storage.buckets (id, name, public)
VALUES ('hospital-assets', 'hospital-assets', TRUE)
ON CONFLICT (id) DO NOTHING;
