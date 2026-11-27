"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Loader2,
  Printer,
  ShieldCheck,
  Tag,
  UserCheck,
  XCircle
} from "lucide-react";
import type {
  Appointment,
  BookingRulesConfig,
  BookingSession,
  Doctor,
  PublicUser,
  Service
} from "@/types/hospital";
import type { BookingWindowOption } from "@/lib/slots";
import { formatSessionLabel, formatTime12h, inferSessionFromAppointment } from "@/lib/slots";
import { useQueueRealtime } from "@/hooks/useQueueRealtime";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge
} from "@/components/StatusBadge";
import {
  downloadAppointmentReceiptImage,
  printAppointmentReceipt
} from "@/lib/receipt";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

interface BookDoctorClientProps {
  hospitalName: string;
  hospitalPhone?: string;
  hospitalEmail?: string;
  hospitalAddress?: string;
  services: Service[];
  doctors: Doctor[];
  bookingRules: BookingRulesConfig;
  currentUser: PublicUser | null;
  initialServiceId?: string;
  initialDoctorId?: string;
  initialDate?: string;
  initialSession?: BookingSession;
  initialSlot?: string;
  initialReason?: string;
}

function getNextDays(count: number): { dateStr: string; label: string; dayName: string }[] {
  const days = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
    const label = d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short"
    });
    const dayName =
      i === 0
        ? "Today"
        : i === 1
        ? "Tomorrow"
        : d.toLocaleDateString("en-IN", { weekday: "short" });
    days.push({ dateStr, label, dayName });
  }
  return days;
}

export function BookDoctorClient({
  hospitalName,
  hospitalPhone,
  hospitalEmail,
  hospitalAddress,
  services,
  doctors,
  bookingRules,
  currentUser,
  initialServiceId,
  initialDoctorId,
  initialDate,
  initialSession,
  initialSlot,
  initialReason
}: BookDoctorClientProps) {
  const initialDocObj = doctors.find((d) => d.id === initialDoctorId);
  const resolvedInitialService =
    initialServiceId || initialDocObj?.serviceIds[0] || "";
  const resolvedInitialSession: BookingSession | "" =
    initialSession ||
    (initialSlot && Number(initialSlot.split(":")[0]) >= 13
      ? "evening"
      : initialSlot
      ? "morning"
      : "");

  const dateChoices = useMemo(
    () => getNextDays(Math.min(bookingRules.advanceBookingDays || 14, 14)),
    [bookingRules.advanceBookingDays]
  );

  const [step, setStep] = useState<number>(() => {
    if (initialDocObj && initialDate && resolvedInitialSession) return 4;
    if (initialDocObj) return 3;
    if (resolvedInitialService) return 2;
    return 1;
  });

  const [serviceId, setServiceId] = useState(resolvedInitialService);
  const [doctorId, setDoctorId] = useState(initialDocObj?.id || "");
  const [selectedDate, setSelectedDate] = useState(
    initialDate || dateChoices[1]?.dateStr || dateChoices[0]?.dateStr || ""
  );
  const [selectedSession, setSelectedSession] = useState<BookingSession | "">(
    resolvedInitialSession
  );

  const [windows, setWindows] = useState<BookingWindowOption[]>([]);
  const [windowsLoading, setWindowsLoading] = useState(false);

  const [patientName, setPatientName] = useState(currentUser?.fullName || "");
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || "");
  const [patientEmail, setPatientEmail] = useState(currentUser?.email || "");
  const [reasonForVisit, setReasonForVisit] = useState(initialReason || "");
  const [consentAccepted, setConsentAccepted] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [pendingBooking, setPendingBooking] = useState<{
    appointment: Appointment;
    doctorName: string;
    serviceName: string;
    requiresPayment: boolean;
    razorpayOrder: {
      orderId: string;
      amountPaise: number;
      currency: string;
      mode: "live" | "demo";
      keyId: string;
    } | null;
  } | null>(null);

  const [confirmedBooking, setConfirmedBooking] = useState<{
    appointment: Appointment;
    doctorName: string;
    serviceName: string;
    paymentId?: string;
  } | null>(null);

  const [paymentFailedMsg, setPaymentFailedMsg] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponCode: string;
    description: string;
    discountType: "percent" | "flat";
    discountValue: number;
    originalFee: number;
    discountAmount: number;
    finalFee: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const selectedWindowObj = windows.find((w) => w.session === selectedSession);
  const baseFee = selectedDoctor?.consultationFee ?? 0;
  const appliedDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const payableFee = appliedCoupon ? appliedCoupon.finalFee : baseFee;

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponError("");
  }, [doctorId]);

  const matchingDoctors = useMemo(() => {
    if (!serviceId) return doctors;
    return doctors.filter((d) => d.serviceIds.includes(serviceId));
  }, [doctors, serviceId]);

  const loadWindows = useMemo(
    () => async (silent = false) => {
      if (!doctorId || !selectedDate) {
        setWindows([]);
        return;
      }
      if (!silent) setWindowsLoading(true);
      try {
        const res = await fetch(
          `/api/slots?doctorId=${doctorId}&date=${selectedDate}`
        );
        const data = await res.json();
        setWindows(data.windows || []);
      } catch {
        if (!silent) setWindows([]);
      } finally {
        if (!silent) setWindowsLoading(false);
      }
    },
    [doctorId, selectedDate]
  );

  useEffect(() => {
    loadWindows(false);
  }, [loadWindows]);

  useQueueRealtime(() => loadWindows(true), {
    enabled: Boolean(doctorId && selectedDate && step === 3),
    key: `booking-${doctorId}-${selectedDate}`
  });

  async function handleApplyCoupon() {
    if (!doctorId) return;
    if (!couponInput.trim()) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    setCouponError("");
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput,
          doctorId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAppliedCoupon(null);
        setCouponError(data.error || "Invalid or expired coupon code.");
        return;
      }
      setAppliedCoupon(data);
      setCouponInput(data.couponCode);
    } catch {
      setCouponError("Unable to verify coupon right now.");
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  }

  async function handleCreateBookingHold() {
    setError("");
    setPaymentFailedMsg("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          serviceId: serviceId || selectedDoctor?.serviceIds[0],
          appointmentDate: selectedDate,
          session: selectedSession || "morning",
          patientName,
          patientPhone,
          patientEmail,
          reasonForVisit,
          couponCode: appliedCoupon?.couponCode || undefined,
          consentAccepted
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to reserve queue spot. Please try another window.");
        return;
      }

      if (!data.requiresPayment) {
        setConfirmedBooking({
          appointment: data.appointment,
          doctorName: data.doctorName,
          serviceName: data.serviceName
        });
        setStep(7);
        return;
      }

      setPendingBooking(data);
      setStep(6);

      if (data.razorpayOrder?.mode === "live") {
        await launchLiveRazorpay(data);
      }
    } catch {
      setError("Network error while creating booking.");
    } finally {
      setSubmitting(false);
    }
  }

  async function launchLiveRazorpay(bookingData: NonNullable<typeof pendingBooking>) {
    if (!bookingData.razorpayOrder) return;
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
        document.body.appendChild(script);
      });
    }

    const rzp = new window.Razorpay!({
      key: bookingData.razorpayOrder.keyId,
      amount: bookingData.razorpayOrder.amountPaise,
      currency: bookingData.razorpayOrder.currency,
      name: hospitalName,
      description: `Consultation: ${bookingData.doctorName}`,
      order_id: bookingData.razorpayOrder.orderId,
      prefill: {
        name: patientName,
        email: patientEmail,
        contact: patientPhone
      },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        await verifyPaymentOnServer(bookingData, response);
      },
      modal: {
        ondismiss: async () => {
          await handlePaymentFailure(
            bookingData,
            "Payment window closed before completion."
          );
        }
      }
    });
    rzp.open();
  }

  async function verifyPaymentOnServer(
    bookingData: NonNullable<typeof pendingBooking>,
    paymentPayload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }
  ) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: bookingData.appointment.id,
          ...paymentPayload
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment verification failed.");
        return;
      }
      setConfirmedBooking({
        appointment: data.appointment,
        doctorName: bookingData.doctorName,
        serviceName: bookingData.serviceName,
        paymentId: paymentPayload.razorpay_payment_id
      });
      setStep(7);
    } catch {
      setError("Unable to verify payment with server.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaymentFailure(
    bookingData: NonNullable<typeof pendingBooking>,
    reason: string
  ) {
    setSubmitting(true);
    try {
      await fetch("/api/payments/fail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: bookingData.appointment.id,
          razorpay_order_id: bookingData.razorpayOrder?.orderId,
          reason
        })
      });
      setPendingBooking(null);
      setPaymentFailedMsg(
        `${reason} Your temporary slot hold has been released and no confirmed appointment was created.`
      );
      setStep(5);
    } finally {
      setSubmitting(false);
    }
  }

  const stepsMeta = [
    { num: 1, label: "Problem / Dept" },
    { num: 2, label: "Doctor" },
    { num: 3, label: "Booking Window" },
    { num: 4, label: "Details" },
    { num: 5, label: "Review" },
    { num: 6, label: "Payment" },
    { num: 7, label: "Queue Token" }
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Stepper */}
      <div className="card-clinical mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {stepsMeta.map((s) => {
            const active = step === s.num;
            const done = step > s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? "bg-emerald-600 text-white"
                      : active
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {done ? "✓" : s.num}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    active ? "text-brand-700" : "text-slate-600"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {paymentFailedMsg && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <span>{paymentFailedMsg}</span>
        </div>
      )}

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div className="card-clinical p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">
            Step 1: Select Medical Service or Speciality
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose the department relevant to your consultation.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {services.map((svc) => {
              const selected = serviceId === svc.id;
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => {
                    setServiceId(svc.id);
                    setDoctorId("");
                    setSelectedSession("");
                    setStep(2);
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20"
                      : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                    {svc.category}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    {svc.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {svc.shortDescription}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Select Doctor */}
      {step === 2 && (
        <div className="card-clinical p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Step 2: Choose Your Doctor
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {selectedService
                  ? `Showing specialists for ${selectedService.name}`
                  : "Showing all available hospital specialists"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Change Service</span>
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {matchingDoctors.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  setDoctorId(doc.id);
                  if (!serviceId && doc.serviceIds[0]) {
                    setServiceId(doc.serviceIds[0]);
                  }
                  setSelectedSession("");
                  setStep(3);
                }}
                className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition ${
                  doctorId === doc.id
                    ? "border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20"
                    : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.photoUrl}
                  alt={doc.fullName}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900">{doc.fullName}</h3>
                  <p className="text-xs font-semibold text-brand-700">
                    {doc.specialty}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {doc.qualification} • {doc.experienceYears} yrs exp
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    ₹{doc.consultationFee} Consultation Fee
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Select Date & OPD Booking Window */}
      {step === 3 && (
        <div className="card-clinical min-w-0 overflow-hidden p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Step 3: Select Date &amp; OPD Booking Window
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Booking with <strong>{selectedDoctor?.fullName}</strong> (₹
                {selectedDoctor?.consultationFee}) • Queue token assigned after booking &amp; payment
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Change Doctor</span>
            </button>
          </div>

          <div className="mt-6">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-brand-600" />
              <span>Choose Appointment Date</span>
            </label>
            <div className="flex w-full max-w-full gap-2 overflow-x-auto pb-2">
              {dateChoices.map((d) => {
                const active = selectedDate === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.dateStr);
                      setSelectedSession("");
                    }}
                    className={`min-w-[88px] shrink-0 rounded-xl border px-3 py-2.5 text-center transition ${
                      active
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                    }`}
                  >
                    <span className="block text-[11px] opacity-80">
                      {d.dayName}
                    </span>
                    <span className="block text-sm font-bold">{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Clock className="h-3.5 w-3.5 text-brand-600" />
              <span>Available Booking Windows ({selectedDate})</span>
            </label>

            {windowsLoading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                <span>Checking live doctor queue capacity...</span>
              </div>
            ) : windows.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                Doctor is not available in OPD on this date. Please select another day.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {windows.map((win) => {
                  const chosen = selectedSession === win.session;
                  const statusLabel = !win.available
                    ? win.reason === "full"
                      ? "Queue Full"
                      : win.reason === "past"
                      ? "Window Closed"
                      : win.reason === "closed"
                      ? "Queue Paused"
                      : "Unavailable"
                    : "Available";

                  return (
                    <button
                      key={win.session}
                      type="button"
                      disabled={!win.available}
                      onClick={() => setSelectedSession(win.session)}
                      className={`rounded-2xl border p-5 text-left transition ${
                        !win.available
                          ? "cursor-not-allowed border-slate-200 bg-slate-100/80 opacity-70"
                          : chosen
                          ? "border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20"
                          : "border-slate-200 bg-white hover:border-brand-300 hover:bg-sky-50/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {win.label}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            !win.available
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <p className="mt-2 text-base font-bold text-brand-700">
                        {formatTime12h(win.startTime)} &ndash;{" "}
                        {formatTime12h(win.endTime)}
                      </p>

                      {win.available && (
                        <div className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                          <span>
                            Est. Next Token:{" "}
                            <strong className="text-slate-900">
                              #{win.nextQueueNumber}
                            </strong>
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              disabled={!selectedSession || !selectedWindowObj?.available}
              onClick={() => setStep(4)}
              className="btn-primary"
            >
              <span>Continue to Patient Details</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Patient Details */}
      {step === 4 && (
        <div className="card-clinical p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Step 4: Enter Patient Details
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Confirmation &amp; updates will be sent via Email, SMS, and WhatsApp.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Change Window</span>
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient's full name"
                className="input-clinical"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+91 98XXXXXXXX"
                className="input-clinical"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="patient@example.com"
                className="input-clinical"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Reason for Visit / Brief Symptoms (Optional)
              </label>
              <textarea
                rows={3}
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                placeholder="Briefly describe your concern for the doctor..."
                className="input-clinical"
              />
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              I confirm that the patient details are accurate and agree to the hospital&apos;s appointment cancellation policy (cancellations permitted up to{" "}
              {bookingRules.cancellationWindowHours} hours prior to slot time) and privacy terms.
            </span>
          </label>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!patientName.trim() || !patientPhone.trim() || !patientEmail.trim()) {
                  setError("Please fill in patient name, mobile number, and email.");
                  return;
                }
                if (!consentAccepted) {
                  setError("Please accept the appointment terms to continue.");
                  return;
                }
                setError("");
                setStep(5);
              }}
              className="btn-primary"
            >
              <span>Review Appointment</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Review Appointment */}
      {step === 5 && (
        <div className="card-clinical p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Step 5: Review Appointment &amp; Payment
            </h2>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Edit Details
            </button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Consultation Summary
              </p>
              <div className="flex justify-between">
                <span className="text-slate-600">Doctor</span>
                <span className="font-bold text-slate-900">
                  {selectedDoctor?.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Service</span>
                <span className="font-semibold text-slate-800">
                  {selectedService?.name || selectedDoctor?.specialty}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date</span>
                <span className="font-semibold text-slate-800">
                  {selectedDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Booking Window</span>
                <span className="text-right font-semibold text-brand-700">
                  {selectedWindowObj
                    ? `${selectedWindowObj.label} (${formatTime12h(
                        selectedWindowObj.startTime
                      )} – ${formatTime12h(selectedWindowObj.endTime)})`
                    : formatSessionLabel(selectedSession || "morning")}
                </span>
              </div>
              {selectedWindowObj && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Queue Token</span>
                  <span className="font-bold text-slate-900">
                    Assigned upon confirmation (Est. #{selectedWindowObj.nextQueueNumber})
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Tag className="h-3.5 w-3.5 text-brand-600" />
                  <span>Promo / Coupon Code</span>
                </p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    <div>
                      <span className="font-mono font-bold">
                        {appliedCoupon.couponCode}
                      </span>{" "}
                      applied — Saved ₹{appliedCoupon.discountAmount}
                      {appliedCoupon.description && (
                        <p className="mt-0.5 text-[11px] text-emerald-700">
                          {appliedCoupon.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="ml-2 font-semibold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponError) setCouponError("");
                      }}
                      placeholder="Enter code (e.g. CARE20)"
                      className="input-clinical flex-1 py-2 text-xs uppercase"
                    />
                    <button
                      type="button"
                      disabled={couponLoading}
                      onClick={handleApplyCoupon}
                      className="btn-secondary px-4 py-2 text-xs"
                    >
                      {couponLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">
                    {couponError}
                  </p>
                )}
              </div>

              {appliedCoupon && appliedDiscount > 0 && (
                <>
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-sm">
                    <span className="text-slate-600">Consultation Fee</span>
                    <span className="font-semibold text-slate-700">
                      ₹{baseFee}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>Discount ({appliedCoupon.couponCode})</span>
                    <span className="font-bold">-₹{appliedDiscount}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <span className="font-bold text-slate-900">Total Payable</span>
                <span className="font-extrabold text-brand-700">
                  ₹{payableFee}
                </span>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Patient Information
              </p>
              <p className="font-bold text-slate-900">{patientName}</p>
              <p className="text-slate-600">{patientPhone}</p>
              <p className="text-slate-600">{patientEmail}</p>
              {reasonForVisit && (
                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <strong>Reason:</strong> {reasonForVisit}
                </p>
              )}
              <div className="flex items-center gap-2 pt-2 text-xs text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                <span>
                  Slot is re-verified server-side and held for{" "}
                  {bookingRules.slotHoldMinutes} minutes during payment.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={handleCreateBookingHold}
              className="btn-primary px-6 py-3"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Reserving Slot...</span>
                </>
              ) : bookingRules.paymentMandatoryForConfirmation && payableFee > 0 ? (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Proceed to Razorpay Payment (₹{payableFee})</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Confirm Appointment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Razorpay Checkout (Test/Demo Simulator or Live Launchpad) */}
      {step === 6 && pendingBooking && (
        <div className="card-clinical border-brand-200 p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                Slot Held: {pendingBooking.appointment.bookingRef}
              </span>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Razorpay Secure Checkout
              </h2>
              <p className="text-xs text-slate-500">
                Order ID: {pendingBooking.razorpayOrder?.orderId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Amount</p>
              <p className="text-2xl font-extrabold text-slate-900">
                ₹{pendingBooking.appointment.consultationFee}
              </p>
            </div>
          </div>

          {pendingBooking.razorpayOrder?.mode === "live" ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-600">
                Complete your payment in the Razorpay popup window.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => launchLiveRazorpay(pendingBooking)}
                  className="btn-primary"
                >
                  Re-open Razorpay Checkout
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePaymentFailure(
                      pendingBooking,
                      "Payment cancelled by patient."
                    )
                  }
                  className="btn-secondary"
                >
                  Cancel Payment
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded-md bg-brand-600 px-2 py-0.5 text-[11px] font-bold uppercase text-white">
                    Razorpay Test Simulator
                  </span>
                  <h3 className="mt-2 text-base font-bold text-slate-900">
                    {hospitalName} — {pendingBooking.doctorName}
                  </h3>
                  <p className="text-xs text-slate-600">
                    Verify payment server-side via HMAC-SHA256 signature verification, or test failed/abandoned payment handling.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    verifyPaymentOnServer(pendingBooking, {
                      razorpay_order_id: pendingBooking.razorpayOrder!.orderId,
                      razorpay_payment_id: `pay_demo_${Date.now()}`,
                      razorpay_signature: "demo_checkout_verify"
                    })
                  }
                  className="btn-primary flex-1 py-3"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Complete Test Payment (₹{pendingBooking.appointment.consultationFee})</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    handlePaymentFailure(
                      pendingBooking,
                      "Simulated Razorpay payment failure / cancellation"
                    )
                  }
                  className="btn-secondary border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  Simulate Failed / Cancelled Payment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 7: Confirmation */}
      {step === 7 && confirmedBooking && (
        <div className="card-clinical border-emerald-200 p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
              {confirmedBooking.appointment.status === "confirmed"
                ? "Appointment Confirmed!"
                : "Booking Submitted"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Your booking reference is{" "}
              <strong className="font-mono text-brand-700">
                {confirmedBooking.appointment.bookingRef}
              </strong>
            </p>
            {typeof confirmedBooking.appointment.queueNumber === "number" && (
              <div className="mt-4 inline-flex flex-col items-center rounded-2xl border border-brand-200 bg-brand-50 px-6 py-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                  Assigned Queue Token Number
                </span>
                <span className="mt-0.5 font-mono text-3xl font-black text-[#06213e]">
                  #{confirmedBooking.appointment.queueNumber}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Doctor</p>
              <p className="font-bold text-slate-900">
                {confirmedBooking.doctorName}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Service</p>
              <p className="font-semibold text-slate-800">
                {confirmedBooking.serviceName}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Date &amp; Booking Window</p>
              <p className="font-semibold text-slate-900">
                {confirmedBooking.appointment.appointmentDate} •{" "}
                {formatSessionLabel(
                  inferSessionFromAppointment(confirmedBooking.appointment)
                )}{" "}
                ({formatTime12h(confirmedBooking.appointment.slotStart)} –{" "}
                {formatTime12h(confirmedBooking.appointment.slotEnd)})
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Patient</p>
              <p className="font-semibold text-slate-900">
                {confirmedBooking.appointment.patientName} (
                {confirmedBooking.appointment.patientPhone})
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Appointment Status</p>
              <div className="mt-1">
                <AppointmentStatusBadge
                  status={confirmedBooking.appointment.status}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Payment Status</p>
              <div className="mt-1 flex items-center gap-2">
                <PaymentStatusBadge
                  status={confirmedBooking.appointment.paymentStatus}
                />
                {confirmedBooking.paymentId && (
                  <span className="font-mono text-[11px] text-slate-500">
                    {confirmedBooking.paymentId}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Amount Paid</p>
              <p className="font-bold text-slate-900">
                ₹{confirmedBooking.appointment.consultationFee}
              </p>
            </div>
            {confirmedBooking.appointment.couponCode &&
              (confirmedBooking.appointment.discountAmount || 0) > 0 && (
                <div>
                  <p className="text-xs text-slate-500">Promo Coupon Applied</p>
                  <p className="font-semibold text-emerald-700">
                    <span className="font-mono">
                      {confirmedBooking.appointment.couponCode}
                    </span>{" "}
                    (Saved ₹{confirmedBooking.appointment.discountAmount})
                  </p>
                </div>
              )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() =>
                  printAppointmentReceipt({
                    hospitalName,
                    hospitalPhone,
                    hospitalEmail,
                    hospitalAddress,
                    appointment: confirmedBooking.appointment,
                    doctorName: confirmedBooking.doctorName,
                    serviceName: confirmedBooking.serviceName,
                    paymentId: confirmedBooking.paymentId
                  })
                }
                className="btn-secondary"
              >
                <Printer className="h-4 w-4" />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadAppointmentReceiptImage({
                    hospitalName,
                    hospitalPhone,
                    hospitalEmail,
                    hospitalAddress,
                    appointment: confirmedBooking.appointment,
                    doctorName: confirmedBooking.doctorName,
                    serviceName: confirmedBooking.serviceName,
                    paymentId: confirmedBooking.paymentId
                  })
                }
                className="btn-secondary border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
              >
                <Download className="h-4 w-4" />
                <span>Download Receipt</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link href="/patient" className="btn-secondary">
                Go to Patient Dashboard
              </Link>
              <Link href="/" className="btn-primary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
