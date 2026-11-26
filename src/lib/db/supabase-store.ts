import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Appointment,
  AppointmentStatusHistory,
  BlockedSlot,
  Coupon,
  Doctor,
  DoctorSchedule,
  Enquiry,
  HospitalDatabase,
  NotificationLog,
  PaymentRecord,
  Service,
  UserProfile,
  WebsiteSettings
} from "@/types/hospital";
import { createSeedDatabase } from "@/lib/db/seed";
import { getSupabaseAdminClient } from "@/lib/db/supabase-client";

let seedInFlight: Promise<HospitalDatabase> | null = null;

async function syncTableById<T extends { id: string }>(
  supabase: SupabaseClient,
  table: string,
  prevRows: T[],
  nextRows: Record<string, unknown>[],
  nextIds: string[]
) {
  const nextIdSet = new Set(nextIds);
  const removedIds = prevRows
    .map((r) => r.id)
    .filter((id) => !nextIdSet.has(id));

  if (removedIds.length > 0) {
    const { error } = await supabase
      .from(table)
      .delete()
      .in("id", removedIds);
    if (error) throw new Error(`Supabase delete failed on ${table}: ${error.message}`);
  }

  if (nextRows.length > 0) {
    const { error } = await supabase
      .from(table)
      .upsert(nextRows, { onConflict: "id" });
    if (error) throw new Error(`Supabase upsert failed on ${table}: ${error.message}`);
  }
}

function mapSettingsFromRow(
  row: Record<string, unknown> | null,
  fallback: WebsiteSettings
): WebsiteSettings {
  if (!row) return fallback;
  return {
    id: String(row.id || "default"),
    hospitalName: String(row.hospital_name || fallback.hospitalName),
    tagline: String(row.tagline || fallback.tagline),
    logoUrl: String(row.logo_url || ""),
    phone: String(row.phone || fallback.phone),
    emergencyPhone: String(row.emergency_phone || fallback.emergencyPhone),
    email: String(row.email || fallback.email),
    address: String(row.address || fallback.address),
    workingHours: String(row.working_hours || fallback.workingHours),
    mapLink: String(row.map_link || fallback.mapLink),
    heroTitle: String(row.hero_title || fallback.heroTitle),
    heroSubtitle: String(row.hero_subtitle || fallback.heroSubtitle),
    heroCtaText: String(row.hero_cta_text || fallback.heroCtaText),
    aboutIntro: String(row.about_intro || fallback.aboutIntro),
    aboutMission: String(row.about_mission || fallback.aboutMission),
    aboutVision: String(row.about_vision || fallback.aboutVision),
    aboutPhilosophy: String(row.about_philosophy || fallback.aboutPhilosophy),
    aboutFacilities: String(row.about_facilities || fallback.aboutFacilities),
    certifications: Array.isArray(row.certifications)
      ? (row.certifications as string[])
      : fallback.certifications,
    whyChooseUs: Array.isArray(row.why_choose_us)
      ? (row.why_choose_us as WebsiteSettings["whyChooseUs"])
      : fallback.whyChooseUs,
    facilitiesHighlights: Array.isArray(row.facilities_highlights)
      ? (row.facilities_highlights as WebsiteSettings["facilitiesHighlights"])
      : fallback.facilitiesHighlights,
    testimonials: Array.isArray(row.testimonials)
      ? (row.testimonials as WebsiteSettings["testimonials"])
      : fallback.testimonials,
    socialLinks:
      (row.social_links as WebsiteSettings["socialLinks"]) ||
      fallback.socialLinks,
    footerText: String(row.footer_text || fallback.footerText),
    seoSettings:
      (row.seo_settings as WebsiteSettings["seoSettings"]) ||
      fallback.seoSettings,
    bookingSettings:
      (row.booking_settings as WebsiteSettings["bookingSettings"]) ||
      fallback.bookingSettings,
    notificationSettings:
      (row.notification_settings as WebsiteSettings["notificationSettings"]) ||
      fallback.notificationSettings,
    updatedAt: String(row.updated_at || fallback.updatedAt)
  };
}

function mapSettingsToRow(s: WebsiteSettings): Record<string, unknown> {
  return {
    id: s.id || "default",
    hospital_name: s.hospitalName,
    tagline: s.tagline,
    logo_url: s.logoUrl,
    phone: s.phone,
    emergency_phone: s.emergencyPhone,
    email: s.email,
    address: s.address,
    working_hours: s.workingHours,
    map_link: s.mapLink,
    hero_title: s.heroTitle,
    hero_subtitle: s.heroSubtitle,
    hero_cta_text: s.heroCtaText,
    about_intro: s.aboutIntro,
    about_mission: s.aboutMission,
    about_vision: s.aboutVision,
    about_philosophy: s.aboutPhilosophy,
    about_facilities: s.aboutFacilities,
    certifications: s.certifications,
    why_choose_us: s.whyChooseUs,
    facilities_highlights: s.facilitiesHighlights,
    testimonials: s.testimonials,
    social_links: s.socialLinks,
    footer_text: s.footerText,
    seo_settings: s.seoSettings,
    booking_settings: s.bookingSettings,
    notification_settings: s.notificationSettings,
    updated_at: s.updatedAt
  };
}

export async function readSupabaseDb(): Promise<HospitalDatabase> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not configured.");
  }

  const [
    profilesRes,
    servicesRes,
    doctorsRes,
    docServicesRes,
    schedulesRes,
    blockedRes,
    apptsRes,
    historyRes,
    paymentsRes,
    logsRes,
    enquiriesRes,
    settingsRes,
    tokensRes,
    couponsRes
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("services").select("*"),
    supabase.from("doctors").select("*"),
    supabase.from("doctor_services").select("*"),
    supabase.from("doctor_schedules").select("*"),
    supabase.from("blocked_slots").select("*"),
    supabase.from("appointments").select("*"),
    supabase.from("appointment_status_history").select("*"),
    supabase.from("payments").select("*"),
    supabase.from("notification_logs").select("*"),
    supabase.from("enquiries").select("*"),
    supabase.from("website_settings").select("*").eq("id", "default").maybeSingle(),
    supabase.from("password_reset_tokens").select("*"),
    supabase.from("coupons").select("*")
  ]);

  const firstErr = [
    profilesRes.error,
    servicesRes.error,
    doctorsRes.error,
    docServicesRes.error,
    schedulesRes.error,
    blockedRes.error,
    apptsRes.error,
    historyRes.error,
    paymentsRes.error,
    logsRes.error,
    enquiriesRes.error,
    settingsRes.error,
    tokensRes.error
  ].find(Boolean);

  if (firstErr) {
    throw new Error(`Supabase query error: ${firstErr.message}`);
  }

  // First-time (or interrupted) bootstrap: seed doctor profiles, services, schedules & website settings
  if (!settingsRes.data) {
    if (!seedInFlight) {
      seedInFlight = (async () => {
        const seed = createSeedDatabase();
        const emptySnapshot: HospitalDatabase = {
          ...seed,
          profiles: [],
          services: [],
          doctors: [],
          doctorSchedules: [],
          blockedSlots: [],
          appointments: [],
          appointmentStatusHistory: [],
          payments: [],
          notificationLogs: [],
          enquiries: [],
          coupons: [],
          passwordResetTokens: []
        };
        await writeSupabaseDb(emptySnapshot, seed);
        return seed;
      })().finally(() => {
        seedInFlight = null;
      });
    }
    return seedInFlight;
  }

  const fallbackSeed = createSeedDatabase();
  const docServicePairs = (docServicesRes.data || []) as {
    doctor_id: string;
    service_id: string;
  }[];

  const profiles: UserProfile[] = (profilesRes.data || []).map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    phone: r.phone || "",
    role: r.role,
    permissions: r.permissions || {},
    passwordHash: r.password_hash || "",
    isActive: Boolean(r.is_active),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));

  const services: Service[] = (servicesRes.data || []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    shortDescription: r.short_description,
    fullDescription: r.full_description,
    iconName: r.icon_name || "Stethoscope",
    imageUrl: r.image_url || "",
    isPublished: Boolean(r.is_published),
    displayOrder: Number(r.display_order || 0),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));

  const doctors: Doctor[] = (doctorsRes.data || []).map((r) => ({
    id: r.id,
    profileId: r.profile_id || undefined,
    slug: r.slug,
    fullName: r.full_name,
    photoUrl: r.photo_url || "",
    qualification: r.qualification,
    experienceYears: Number(r.experience_years || 0),
    specialty: r.specialty,
    biography: r.biography || "",
    consultationFee: Number(r.consultation_fee || 0),
    slotDurationMins: (Number(r.slot_duration_mins) || 30) as Doctor["slotDurationMins"],
    serviceIds: docServicePairs
      .filter((p) => p.doctor_id === r.id)
      .map((p) => p.service_id),
    isActive: Boolean(r.is_active),
    isVisible: Boolean(r.is_visible),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));

  const doctorSchedules: DoctorSchedule[] = (schedulesRes.data || []).map((r) => ({
    id: r.id,
    doctorId: r.doctor_id,
    dayOfWeek: Number(r.day_of_week),
    startTime: r.start_time,
    endTime: r.end_time,
    breakStart: r.break_start || undefined,
    breakEnd: r.break_end || undefined,
    slotDurationMins: Number(r.slot_duration_mins || 30),
    isAvailable: Boolean(r.is_available)
  }));

  const blockedSlots: BlockedSlot[] = (blockedRes.data || []).map((r) => ({
    id: r.id,
    doctorId: r.doctor_id,
    blockedDate: r.blocked_date,
    startTime: r.start_time || undefined,
    endTime: r.end_time || undefined,
    isFullDay: Boolean(r.is_full_day),
    reason: r.reason || "",
    type: r.type,
    createdAt: r.created_at
  }));

  const appointments: Appointment[] = (apptsRes.data || []).map((r) => ({
    id: r.id,
    bookingRef: r.booking_ref,
    patientId: r.patient_id || undefined,
    patientName: r.patient_name,
    patientPhone: r.patient_phone,
    patientEmail: r.patient_email,
    reasonForVisit: r.reason_for_visit || "",
    doctorId: r.doctor_id,
    serviceId: r.service_id,
    appointmentDate: r.appointment_date,
    slotStart: r.slot_start,
    slotEnd: r.slot_end,
    originalFee:
      r.original_fee !== null && r.original_fee !== undefined
        ? Number(r.original_fee)
        : undefined,
    couponCode: r.coupon_code || undefined,
    discountAmount:
      r.discount_amount !== null && r.discount_amount !== undefined
        ? Number(r.discount_amount)
        : undefined,
    consultationFee: Number(r.consultation_fee || 0),
    status: r.status,
    paymentStatus: r.payment_status,
    holdExpiresAt: r.hold_expires_at || undefined,
    cancellationReason: r.cancellation_reason || undefined,
    cancelledAt: r.cancelled_at || undefined,
    cancelledBy: r.cancelled_by || undefined,
    notes: r.notes || "",
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));

  const appointmentStatusHistory: AppointmentStatusHistory[] = (
    historyRes.data || []
  ).map((r) => ({
    id: r.id,
    appointmentId: r.appointment_id,
    previousStatus: r.previous_status || undefined,
    newStatus: r.new_status,
    changedBy: r.changed_by || undefined,
    changedByName: r.changed_by_name || undefined,
    note: r.note || "",
    createdAt: r.created_at
  }));

  const payments: PaymentRecord[] = (paymentsRes.data || []).map((r) => ({
    id: r.id,
    appointmentId: r.appointment_id,
    bookingRef: r.booking_ref,
    razorpayOrderId: r.razorpay_order_id,
    razorpayPaymentId: r.razorpay_payment_id || undefined,
    razorpaySignature: r.razorpay_signature || undefined,
    amount: Number(r.amount || 0),
    currency: r.currency || "INR",
    status: r.status,
    refundId: r.refund_id || undefined,
    refundStatus: r.refund_status || undefined,
    rawPayload: r.raw_payload || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));

  const notificationLogs: NotificationLog[] = (logsRes.data || []).map((r) => ({
    id: r.id,
    appointmentId: r.appointment_id || undefined,
    channel: r.channel,
    event: r.event,
    recipientRef: r.recipient_ref,
    providerMessageId: r.provider_message_id || undefined,
    status: r.status,
    errorMessage: r.error_message || undefined,
    sentAt: r.sent_at
  }));

  const enquiries: Enquiry[] = (enquiriesRes.data || []).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    subject: r.subject,
    message: r.message,
    status: r.status,
    createdAt: r.created_at
  }));

  const websiteSettings = mapSettingsFromRow(
    (settingsRes.data as Record<string, unknown> | null) || null,
    fallbackSeed.websiteSettings
  );

  const passwordResetTokens = (tokensRes.data || []).map((r) => ({
    token: String(r.token),
    email: String(r.email),
    expiresAt: String(r.expires_at)
  }));

  const coupons: Coupon[] =
    couponsRes.error && couponsRes.error.code === "PGRST205"
      ? []
      : (couponsRes.data || []).map((r) => ({
          id: r.id,
          code: r.code,
          description: r.description || "",
          discountType: r.discount_type,
          discountValue: Number(r.discount_value || 0),
          maxDiscountAmount:
            r.max_discount_amount !== null &&
            r.max_discount_amount !== undefined
              ? Number(r.max_discount_amount)
              : undefined,
          minFeeAmount: Number(r.min_fee_amount || 0),
          usageLimit:
            r.usage_limit !== null && r.usage_limit !== undefined
              ? Number(r.usage_limit)
              : undefined,
          usedCount: Number(r.used_count || 0),
          validFrom: r.valid_from || undefined,
          validUntil: r.valid_until || undefined,
          isActive: Boolean(r.is_active),
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));

  return {
    profiles,
    services,
    doctors,
    doctorSchedules,
    blockedSlots,
    appointments,
    appointmentStatusHistory,
    payments,
    notificationLogs,
    enquiries,
    coupons,
    websiteSettings,
    passwordResetTokens
  };
}

export async function writeSupabaseDb(
  prev: HospitalDatabase,
  next: HospitalDatabase
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not configured.");
  }

  // 1. Profiles
  await syncTableById(
    supabase,
    "profiles",
    prev.profiles,
    next.profiles.map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.fullName,
      phone: p.phone,
      role: p.role,
      permissions: p.permissions,
      password_hash: p.passwordHash,
      is_active: p.isActive,
      created_at: p.createdAt,
      updated_at: p.updatedAt
    })),
    next.profiles.map((p) => p.id)
  );

  // 2. Services
  await syncTableById(
    supabase,
    "services",
    prev.services,
    next.services.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      category: s.category,
      short_description: s.shortDescription,
      full_description: s.fullDescription,
      icon_name: s.iconName,
      image_url: s.imageUrl,
      is_published: s.isPublished,
      display_order: s.displayOrder,
      created_at: s.createdAt,
      updated_at: s.updatedAt
    })),
    next.services.map((s) => s.id)
  );

  // 3. Doctors
  await syncTableById(
    supabase,
    "doctors",
    prev.doctors,
    next.doctors.map((d) => ({
      id: d.id,
      profile_id: d.profileId || null,
      slug: d.slug,
      full_name: d.fullName,
      photo_url: d.photoUrl,
      qualification: d.qualification,
      experience_years: d.experienceYears,
      specialty: d.specialty,
      biography: d.biography,
      consultation_fee: d.consultationFee,
      slot_duration_mins: d.slotDurationMins,
      is_active: d.isActive,
      is_visible: d.isVisible,
      created_at: d.createdAt,
      updated_at: d.updatedAt
    })),
    next.doctors.map((d) => d.id)
  );

  // 4. Doctor <-> Services join table (skip rewrite if unchanged; upsert idempotently)
  const prevPairsKey = prev.doctors
    .map((d) => `${d.id}:${d.serviceIds.slice().sort().join(",")}`)
    .sort()
    .join("|");
  const nextPairsKey = next.doctors
    .map((d) => `${d.id}:${d.serviceIds.slice().sort().join(",")}`)
    .sort()
    .join("|");

  if (next.doctors.length > 0 && prevPairsKey !== nextPairsKey) {
    const doctorIds = next.doctors.map((d) => d.id);
    if (prev.doctors.length > 0) {
      await supabase.from("doctor_services").delete().in("doctor_id", doctorIds);
    }
    const pairs = next.doctors.flatMap((d) =>
      d.serviceIds.map((sid) => ({ doctor_id: d.id, service_id: sid }))
    );
    if (pairs.length > 0) {
      const { error } = await supabase
        .from("doctor_services")
        .upsert(pairs, { onConflict: "doctor_id,service_id" });
      if (error) throw new Error(`Supabase doctor_services error: ${error.message}`);
    }
  }

  // 5. Schedules & Blocked Slots
  await syncTableById(
    supabase,
    "doctor_schedules",
    prev.doctorSchedules,
    next.doctorSchedules.map((s) => ({
      id: s.id,
      doctor_id: s.doctorId,
      day_of_week: s.dayOfWeek,
      start_time: s.startTime,
      end_time: s.endTime,
      break_start: s.breakStart || null,
      break_end: s.breakEnd || null,
      slot_duration_mins: s.slotDurationMins,
      is_available: s.isAvailable
    })),
    next.doctorSchedules.map((s) => s.id)
  );

  await syncTableById(
    supabase,
    "blocked_slots",
    prev.blockedSlots,
    next.blockedSlots.map((b) => ({
      id: b.id,
      doctor_id: b.doctorId,
      blocked_date: b.blockedDate,
      start_time: b.startTime || null,
      end_time: b.endTime || null,
      is_full_day: b.isFullDay,
      reason: b.reason,
      type: b.type,
      created_at: b.createdAt
    })),
    next.blockedSlots.map((b) => b.id)
  );

  // 6. Appointments, History & Payments
  await syncTableById(
    supabase,
    "appointments",
    prev.appointments,
    next.appointments.map((a) => ({
      id: a.id,
      booking_ref: a.bookingRef,
      patient_id: a.patientId || null,
      patient_name: a.patientName,
      patient_phone: a.patientPhone,
      patient_email: a.patientEmail,
      reason_for_visit: a.reasonForVisit,
      doctor_id: a.doctorId,
      service_id: a.serviceId,
      appointment_date: a.appointmentDate,
      slot_start: a.slotStart,
      slot_end: a.slotEnd,
      ...(a.originalFee !== undefined ? { original_fee: a.originalFee } : {}),
      ...(a.couponCode !== undefined ? { coupon_code: a.couponCode } : {}),
      ...(a.discountAmount !== undefined
        ? { discount_amount: a.discountAmount }
        : {}),
      consultation_fee: a.consultationFee,
      status: a.status,
      payment_status: a.paymentStatus,
      hold_expires_at: a.holdExpiresAt || null,
      cancellation_reason: a.cancellationReason || null,
      cancelled_at: a.cancelledAt || null,
      cancelled_by: a.cancelledBy || null,
      notes: a.notes,
      created_at: a.createdAt,
      updated_at: a.updatedAt
    })),
    next.appointments.map((a) => a.id)
  );

  await syncTableById(
    supabase,
    "appointment_status_history",
    prev.appointmentStatusHistory,
    next.appointmentStatusHistory.map((h) => ({
      id: h.id,
      appointment_id: h.appointmentId,
      previous_status: h.previousStatus || null,
      new_status: h.newStatus,
      changed_by: h.changedBy || null,
      changed_by_name: h.changedByName || null,
      note: h.note,
      created_at: h.createdAt
    })),
    next.appointmentStatusHistory.map((h) => h.id)
  );

  await syncTableById(
    supabase,
    "payments",
    prev.payments,
    next.payments.map((p) => ({
      id: p.id,
      appointment_id: p.appointmentId,
      booking_ref: p.bookingRef,
      razorpay_order_id: p.razorpayOrderId,
      razorpay_payment_id: p.razorpayPaymentId || null,
      razorpay_signature: p.razorpaySignature || null,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      refund_id: p.refundId || null,
      refund_status: p.refundStatus || null,
      raw_payload: p.rawPayload || {},
      created_at: p.createdAt,
      updated_at: p.updatedAt
    })),
    next.payments.map((p) => p.id)
  );

  // 7. Notification Logs & Enquiries
  await syncTableById(
    supabase,
    "notification_logs",
    prev.notificationLogs,
    next.notificationLogs.map((n) => ({
      id: n.id,
      appointment_id: n.appointmentId || null,
      channel: n.channel,
      event: n.event,
      recipient_ref: n.recipientRef,
      provider_message_id: n.providerMessageId || null,
      status: n.status,
      error_message: n.errorMessage || null,
      sent_at: n.sentAt
    })),
    next.notificationLogs.map((n) => n.id)
  );

  await syncTableById(
    supabase,
    "enquiries",
    prev.enquiries,
    next.enquiries.map((e) => ({
      id: e.id,
      name: e.name,
      phone: e.phone,
      email: e.email,
      subject: e.subject,
      message: e.message,
      status: e.status,
      created_at: e.createdAt
    })),
    next.enquiries.map((e) => e.id)
  );

  // 8. Website Settings
  const { error: settingsErr } = await supabase
    .from("website_settings")
    .upsert(mapSettingsToRow(next.websiteSettings), { onConflict: "id" });
  if (settingsErr) {
    throw new Error(`Supabase website_settings error: ${settingsErr.message}`);
  }

  // 9. Password reset tokens
  const prevTokens = prev.passwordResetTokens.map((t) => t.token);
  const nextTokens = next.passwordResetTokens.map((t) => t.token);
  const removedTokens = prevTokens.filter((t) => !nextTokens.includes(t));
  if (removedTokens.length > 0) {
    await supabase
      .from("password_reset_tokens")
      .delete()
      .in("token", removedTokens);
  }
  if (next.passwordResetTokens.length > 0) {
    await supabase.from("password_reset_tokens").upsert(
      next.passwordResetTokens.map((t) => ({
        token: t.token,
        email: t.email,
        expires_at: t.expiresAt
      })),
      { onConflict: "token" }
    );
  }

  // 10. Coupons (sync only if present or previously existed)
  if (prev.coupons.length > 0 || next.coupons.length > 0) {
    await syncTableById(
      supabase,
      "coupons",
      prev.coupons,
      next.coupons.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        discount_type: c.discountType,
        discount_value: c.discountValue,
        max_discount_amount: c.maxDiscountAmount ?? null,
        min_fee_amount: c.minFeeAmount,
        usage_limit: c.usageLimit ?? null,
        used_count: c.usedCount,
        valid_from: c.validFrom || null,
        valid_until: c.validUntil || null,
        is_active: c.isActive,
        created_at: c.createdAt,
        updated_at: c.updatedAt
      })),
      next.coupons.map((c) => c.id)
    );
  }
}
