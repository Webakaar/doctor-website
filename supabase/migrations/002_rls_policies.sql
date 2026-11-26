-- Grant schema & table privileges so service_role / authenticated / anon roles can access tables (RLS enforces row access)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

GRANT SELECT ON
  public.services, public.doctors, public.doctor_services,
  public.doctor_schedules, public.blocked_slots, public.website_settings
  TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.profiles, public.appointments, public.appointment_status_history,
  public.payments, public.notification_logs, public.enquiries,
  public.doctor_schedules, public.blocked_slots
  TO authenticated;

GRANT INSERT ON public.enquiries TO anon;

-- Row Level Security Policies for Supabase PostgreSQL

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

-- Helper functions to read role from profiles linked to auth.uid()
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
CREATE POLICY "Public read published services"
  ON public.services FOR SELECT USING (is_published = TRUE OR public.current_user_role() IN ('super_admin', 'staff'));

CREATE POLICY "Public read visible doctors"
  ON public.doctors FOR SELECT USING ((is_active = TRUE AND is_visible = TRUE) OR public.current_user_role() IN ('super_admin', 'staff'));

CREATE POLICY "Public read doctor_services"
  ON public.doctor_services FOR SELECT USING (TRUE);

CREATE POLICY "Public read doctor_schedules"
  ON public.doctor_schedules FOR SELECT USING (TRUE);

CREATE POLICY "Public read blocked_slots"
  ON public.blocked_slots FOR SELECT USING (TRUE);

CREATE POLICY "Public read website_settings"
  ON public.website_settings FOR SELECT USING (TRUE);

-- Profiles: own profile or admin/staff
CREATE POLICY "Profiles self or admin read"
  ON public.profiles FOR SELECT
  USING (auth_user_id = auth.uid() OR public.current_user_role() IN ('super_admin', 'staff'));

CREATE POLICY "Profiles self update"
  ON public.profiles FOR UPDATE
  USING (auth_user_id = auth.uid() OR public.current_user_role() = 'super_admin');

-- Appointments: patient sees own, doctor sees assigned, admin/staff sees all
CREATE POLICY "Appointments scoped read"
  ON public.appointments FOR SELECT
  USING (
    public.current_user_role() IN ('super_admin', 'staff')
    OR patient_id = public.current_profile_id()
    OR doctor_id = public.current_doctor_id()
  );

CREATE POLICY "Appointments scoped update"
  ON public.appointments FOR UPDATE
  USING (
    public.current_user_role() IN ('super_admin', 'staff')
    OR patient_id = public.current_profile_id()
    OR doctor_id = public.current_doctor_id()
  );

-- Payments: patient sees own appointment payments, admin/staff sees all
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
CREATE POLICY "Doctors manage own schedules"
  ON public.doctor_schedules FOR ALL
  USING (doctor_id = public.current_doctor_id() OR public.current_user_role() IN ('super_admin', 'staff'));

CREATE POLICY "Doctors manage own blocked slots"
  ON public.blocked_slots FOR ALL
  USING (doctor_id = public.current_doctor_id() OR public.current_user_role() IN ('super_admin', 'staff'));

-- Enquiries: anyone can insert, admin/staff can read/update
CREATE POLICY "Public insert enquiries"
  ON public.enquiries FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admin read enquiries"
  ON public.enquiries FOR SELECT USING (public.current_user_role() IN ('super_admin', 'staff'));

-- Notification logs & status history: admin/staff
CREATE POLICY "Admin read notification logs"
  ON public.notification_logs FOR SELECT USING (public.current_user_role() IN ('super_admin', 'staff'));

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
