export type UserRole = "super_admin" | "staff" | "doctor" | "reception" | "patient";

export interface StaffPermissions {
  view_dashboard?: boolean;
  manage_doctors?: boolean;
  manage_services?: boolean;
  manage_appointments?: boolean;
  manage_queue?: boolean;
  manage_patients?: boolean;
  manage_payments?: boolean;
  manage_notifications?: boolean;
  manage_website?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  permissions: StaffPermissions;
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<UserProfile, "passwordHash"> & {
  doctorId?: string;
};

export interface Service {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  imageUrl: string;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  profileId?: string;
  slug: string;
  fullName: string;
  photoUrl: string;
  qualification: string;
  experienceYears: number;
  specialty: string;
  biography: string;
  consultationFee: number;
  slotDurationMins: 15 | 20 | 30 | 45 | 60;
  serviceIds: string[];
  isActive: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BookingSession = "morning" | "evening";

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0 (Sun) .. 6 (Sat)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  breakStart?: string; // HH:MM
  breakEnd?: string; // HH:MM
  slotDurationMins: number;
  morningCapacityOverride?: number;
  eveningCapacityOverride?: number;
  isAvailable: boolean;
}

export interface QueueState {
  id: string;
  doctorId: string;
  queueDate: string; // YYYY-MM-DD
  session: BookingSession;
  currentServingNumber: number;
  capacityOverride?: number;
  isPaused: boolean;
  updatedAt: string;
}

export type BlockedSlotType = "break" | "holiday" | "leave" | "blocked";

export interface BlockedSlot {
  id: string;
  doctorId: string;
  blockedDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  isFullDay: boolean;
  reason: string;
  type: BlockedSlotType;
  createdAt: string;
}

export type AppointmentStatus =
  | "pending_payment"
  | "pending_confirmation"
  | "confirmed"
  | "serving"
  | "cancelled"
  | "completed"
  | "no_show";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Appointment {
  id: string;
  bookingRef: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reasonForVisit: string;
  doctorId: string;
  serviceId: string;
  appointmentDate: string; // YYYY-MM-DD
  session?: BookingSession;
  queueNumber?: number;
  slotStart: string; // HH:MM (booking window start)
  slotEnd: string; // HH:MM (booking window end)
  originalFee?: number;
  couponCode?: string;
  discountAmount?: number;
  consultationFee: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  holdExpiresAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentStatusHistory {
  id: string;
  appointmentId: string;
  previousStatus?: AppointmentStatus;
  newStatus: AppointmentStatus;
  changedBy?: string;
  changedByName?: string;
  note: string;
  createdAt: string;
}

export type PaymentRecordStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  bookingRef: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: PaymentRecordStatus;
  refundId?: string;
  refundStatus?: string;
  rawPayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type NotificationChannel = "email" | "sms" | "whatsapp";

export type NotificationEvent =
  | "booking_received"
  | "payment_successful"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_status_updated"
  | "appointment_reminder"
  | "admin_alert"
  | "test_dispatch";

export interface NotificationLog {
  id: string;
  appointmentId?: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  recipientRef: string;
  providerMessageId?: string;
  status: "sent" | "failed" | "simulated";
  errorMessage?: string;
  sentAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "in_progress" | "resolved";
  createdAt: string;
}

export interface WhyChooseUsItem {
  title: string;
  description: string;
  icon: string;
}

export interface FacilityHighlight {
  title: string;
  description: string;
  badge: string;
}

export interface Testimonial {
  id: string;
  patientName: string;
  department: string;
  quote: string;
  rating: number;
  approved: boolean;
}

export interface NotificationChannelConfig {
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  senderName: string;
  senderEmail: string;

  smsEnabled: boolean;
  msg91AuthKey: string;
  msg91SenderId: string;
  msg91SmsTemplateId: string;

  whatsappEnabled: boolean;
  whatsappProvider: "msg91" | "meta_cloud";
  whatsappApiKey: string;
  whatsappIntegratedNumber: string;
  whatsappTemplateConfirmed: string;
  whatsappTemplateCancelled: string;
  whatsappVariableMapping: string;

  events: {
    bookingReceived: { email: boolean; sms: boolean; whatsapp: boolean; adminAlert: boolean };
    paymentSuccessful: { email: boolean; sms: boolean; whatsapp: boolean; adminAlert: boolean };
    appointmentConfirmed: { email: boolean; sms: boolean; whatsapp: boolean; adminAlert: boolean };
    appointmentCancelled: { email: boolean; sms: boolean; whatsapp: boolean; adminAlert: boolean };
    appointmentReminder: { email: boolean; sms: boolean; whatsapp: boolean; adminAlert: boolean };
  };
}

export interface BookingRulesConfig {
  bookingFlowOrder: "service_first" | "doctor_first";
  paymentMandatoryForConfirmation: boolean;
  requireManualApproval: boolean;
  slotHoldMinutes: number;
  queueMinutesPerPatient: number;
  queueBufferMinutes: number;
  cancellationWindowHours: number;
  refundEligibleWithinWindow: boolean;
  advanceBookingDays: number;
}

export interface WebsiteSettings {
  id: string;
  hospitalName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  address: string;
  workingHours: string;
  mapLink: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  aboutIntro: string;
  aboutMission: string;
  aboutVision: string;
  aboutPhilosophy: string;
  aboutFacilities: string;
  certifications: string[];
  whyChooseUs: WhyChooseUsItem[];
  facilitiesHighlights: FacilityHighlight[];
  testimonials: Testimonial[];
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  footerText: string;
  seoSettings: {
    homeTitle: string;
    homeDescription: string;
    aboutTitle: string;
    servicesTitle: string;
    doctorsTitle: string;
    contactTitle: string;
  };
  bookingSettings: BookingRulesConfig;
  notificationSettings: NotificationChannelConfig;
  updatedAt: string;
}

export type CouponDiscountType = "percent" | "flat";

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minFeeAmount: number;
  usageLimit?: number;
  usedCount: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalDatabase {
  profiles: UserProfile[];
  services: Service[];
  doctors: Doctor[];
  doctorSchedules: DoctorSchedule[];
  blockedSlots: BlockedSlot[];
  queueStates: QueueState[];
  appointments: Appointment[];
  appointmentStatusHistory: AppointmentStatusHistory[];
  payments: PaymentRecord[];
  notificationLogs: NotificationLog[];
  enquiries: Enquiry[];
  coupons: Coupon[];
  websiteSettings: WebsiteSettings;
  passwordResetTokens: {
    token: string;
    email: string;
    expiresAt: string;
  }[];
}
