-- ============================================================================
-- Incremental Migration: Promo Coupons & Appointment Discounts
-- Run this SQL query in your Supabase Dashboard -> SQL Editor.
-- ============================================================================

-- 1. Create coupons table
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

-- 2. Add coupon discount columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS original_fee NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- 3. Grant PostgreSQL privileges & enable RLS
GRANT ALL PRIVILEGES ON TABLE public.coupons TO postgres, service_role;
GRANT SELECT ON TABLE public.coupons TO anon, authenticated;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
CREATE POLICY "Public read active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = TRUE OR public.current_user_role() IN ('super_admin', 'staff'));

DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;
CREATE POLICY "Admin manage coupons"
  ON public.coupons FOR ALL
  USING (public.current_user_role() IN ('super_admin', 'staff'));
