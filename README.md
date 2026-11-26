# BookMyDoc India — Multispeciality Hospital & Appointment Platform

A Next.js App Router hospital website, doctor directory, appointment slot booking system, Razorpay payment checkout, promo coupon engine, AI symptom triage assistant, and multi-role admin/doctor/patient portal backed by Supabase PostgreSQL & Storage.

## Features

- **Public Hospital Website**: Dynamic services directory with SEO medical specialty pages, doctor profiles, interactive 7-day slot explorer, contact enquiries, and floating AI symptom triage assistant.
- **Appointment Booking & Payments**: 7-step booking flow with server-side slot locking, temporary payment holds, Razorpay integration, promo coupon discounts, and automatic cancellation/refund eligibility checks.
- **Promo Coupons**: Admin CRUD for flat or capped percentage coupons with validity windows, minimum fee checks, usage tracking, and failed-payment rollback.
- **Role-Based Portals**: Patient dashboard, Doctor schedule & appointment portal, and Admin/Staff panel (`/admin`) with granular permissions.
- **Notifications**: Nodemailer SMTP email confirmations (plus MSG91 SMS/WhatsApp hooks) with admin notification settings and delivery logs.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- Supabase (`@supabase/supabase-js`)
- Razorpay, Nodemailer, Zod, Lucide Icons, Vitest

## Environment Setup

1. Copy `.env.example` to `.env.local` and configure your Supabase, Auth secret, Razorpay, and SMTP variables.
2. Run the SQL schema in `supabase/complete_setup.sql` inside your Supabase SQL Editor.
3. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

## Verification

```bash
npx tsc --noEmit
npm test
```
