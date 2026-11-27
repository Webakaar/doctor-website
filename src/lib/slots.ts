import type {
  Appointment,
  BlockedSlot,
  BookingRulesConfig,
  BookingSession,
  DoctorSchedule,
  QueueState
} from "@/types/hospital";

export interface BookingWindowOption {
  session: BookingSession;
  label: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  bufferMinutes: number;
  minutesPerPatient: number;
  maxCapacity: number;
  bookedCount: number;
  heldCount: number;
  spotsRemaining: number;
  nextQueueNumber: number;
  currentServingNumber: number;
  available: boolean;
  reason?: "full" | "blocked" | "past" | "closed";
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatTime12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

export function formatSessionLabel(session?: BookingSession): string {
  return session === "evening" ? "Evening OPD Window" : "Morning OPD Window";
}

export function getDayOfWeekFromDate(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function inferSessionFromAppointment(appt: {
  session?: BookingSession;
  slotStart: string;
}): BookingSession {
  if (appt.session === "morning" || appt.session === "evening") {
    return appt.session;
  }
  return timeToMinutes(appt.slotStart) >= 13 * 60 ? "evening" : "morning";
}

export function isAppointmentBlockingSlot(
  appt: Appointment,
  now: Date = new Date()
): boolean {
  if (
    appt.status === "confirmed" ||
    appt.status === "serving" ||
    appt.status === "pending_confirmation" ||
    appt.status === "completed"
  ) {
    return true;
  }
  if (appt.status === "pending_payment") {
    if (!appt.holdExpiresAt) return true;
    return new Date(appt.holdExpiresAt).getTime() > now.getTime();
  }
  return false;
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function overlapMinutes(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): number {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}

export function deriveSessionWindowsFromSchedule(
  schedule: DoctorSchedule
): { session: BookingSession; label: string; startTime: string; endTime: string }[] {
  const startM = timeToMinutes(schedule.startTime);
  const endM = timeToMinutes(schedule.endTime);
  if (startM >= endM) return [];

  if (schedule.breakStart && schedule.breakEnd) {
    const bStart = timeToMinutes(schedule.breakStart);
    const bEnd = timeToMinutes(schedule.breakEnd);
    const segments: {
      session: BookingSession;
      label: string;
      startTime: string;
      endTime: string;
    }[] = [];
    if (bStart > startM) {
      segments.push({
        session: startM >= 13 * 60 ? "evening" : "morning",
        label: startM >= 13 * 60 ? "Evening OPD Window" : "Morning OPD Window",
        startTime: schedule.startTime,
        endTime: minutesToTime(Math.min(bStart, endM))
      });
    }
    if (bEnd < endM) {
      const nextSession: BookingSession =
        segments.some((s) => s.session === "morning") || bEnd >= 13 * 60
          ? "evening"
          : "morning";
      segments.push({
        session: nextSession,
        label:
          nextSession === "evening"
            ? "Evening OPD Window"
            : "Morning OPD Window",
        startTime: minutesToTime(Math.max(bEnd, startM)),
        endTime: schedule.endTime
      });
    }
    if (segments.length > 0) return segments;
  }

  // No explicit break configured:
  // If doctor works solely before 14:30 -> single morning window
  // If doctor starts >= 13:00 -> single evening window
  // If full day spanning past 14:30 -> split into morning (until 13:00) & evening (13:00..end)
  if (startM >= 13 * 60) {
    return [
      {
        session: "evening",
        label: "Evening OPD Window",
        startTime: schedule.startTime,
        endTime: schedule.endTime
      }
    ];
  }

  if (endM <= 14 * 60 + 30) {
    return [
      {
        session: "morning",
        label: "Morning OPD Window",
        startTime: schedule.startTime,
        endTime: schedule.endTime
      }
    ];
  }

  return [
    {
      session: "morning",
      label: "Morning OPD Window",
      startTime: schedule.startTime,
      endTime: "13:00"
    },
    {
      session: "evening",
      label: "Evening OPD Window",
      startTime: "13:00",
      endTime: schedule.endTime
    }
  ];
}

export function assignNextQueueNumber(params: {
  appointments: Appointment[];
  doctorId: string;
  appointmentDate: string;
  session: BookingSession;
}): number {
  const maxExisting = params.appointments.reduce((max, appt) => {
    if (
      appt.doctorId === params.doctorId &&
      appt.appointmentDate === params.appointmentDate &&
      inferSessionFromAppointment(appt) === params.session &&
      appt.status !== "cancelled" &&
      typeof appt.queueNumber === "number"
    ) {
      return Math.max(max, appt.queueNumber);
    }
    return max;
  }, 0);

  return maxExisting + 1;
}

export function generateDoctorQueueWindowsForDate(params: {
  doctorId: string;
  dateStr: string; // YYYY-MM-DD
  schedules: DoctorSchedule[];
  blockedSlots: BlockedSlot[];
  appointments: Appointment[];
  queueStates?: QueueState[];
  bookingRules?: Partial<BookingRulesConfig>;
  now?: Date;
}): BookingWindowOption[] {
  const {
    doctorId,
    dateStr,
    schedules,
    blockedSlots,
    appointments,
    queueStates = [],
    bookingRules,
    now = new Date()
  } = params;

  const minutesPerPatient = Math.max(
    5,
    bookingRules?.queueMinutesPerPatient ?? 15
  );
  const bufferMinutes = Math.max(0, bookingRules?.queueBufferMinutes ?? 15);

  const dayOfWeek = getDayOfWeekFromDate(dateStr);
  const schedule = schedules.find(
    (s) => s.doctorId === doctorId && s.dayOfWeek === dayOfWeek
  );

  if (!schedule || !schedule.isAvailable) {
    return [];
  }

  const dayBlocks = blockedSlots.filter(
    (b) => b.doctorId === doctorId && b.blockedDate === dateStr
  );
  if (dayBlocks.some((b) => b.isFullDay)) {
    return [];
  }

  const sessions = deriveSessionWindowsFromSchedule(schedule);
  if (sessions.length === 0) return [];

  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const dateAppointments = appointments.filter(
    (a) => a.doctorId === doctorId && a.appointmentDate === dateStr
  );

  return sessions.map((seg) => {
    const segStartM = timeToMinutes(seg.startTime);
    const segEndM = timeToMinutes(seg.endTime);
    const rawDuration = Math.max(0, segEndM - segStartM);

    const blockedOverlap = dayBlocks.reduce((acc, b) => {
      if (!b.startTime || !b.endTime) return acc;
      return (
        acc +
        overlapMinutes(
          segStartM,
          segEndM,
          timeToMinutes(b.startTime),
          timeToMinutes(b.endTime)
        )
      );
    }, 0);

    const effectiveDuration = Math.max(0, rawDuration - blockedOverlap);
    const state = queueStates.find(
      (q) =>
        q.doctorId === doctorId &&
        q.queueDate === dateStr &&
        q.session === seg.session
    );

    const scheduleOverride =
      seg.session === "morning"
        ? schedule.morningCapacityOverride
        : schedule.eveningCapacityOverride;

    const autoCapacity = Math.max(
      0,
      Math.floor(Math.max(0, effectiveDuration - bufferMinutes) / minutesPerPatient)
    );

    const maxCapacity =
      typeof state?.capacityOverride === "number" && state.capacityOverride >= 0
        ? state.capacityOverride
        : typeof scheduleOverride === "number" && scheduleOverride >= 0
        ? scheduleOverride
        : autoCapacity;

    const sessionAppointments = dateAppointments.filter(
      (a) => inferSessionFromAppointment(a) === seg.session
    );
    const activeBlocking = sessionAppointments.filter((a) =>
      isAppointmentBlockingSlot(a, now)
    );
    const bookedCount = activeBlocking.length;
    const heldCount = activeBlocking.filter(
      (a) => a.status === "pending_payment"
    ).length;

    const nextQueueNumber = assignNextQueueNumber({
      appointments: sessionAppointments,
      doctorId,
      appointmentDate: dateStr,
      session: seg.session
    });

    const isBlocked = effectiveDuration <= 0 || maxCapacity <= 0;
    const isPast =
      dateStr < todayStr ||
      (dateStr === todayStr && nowMinutes >= segEndM - minutesPerPatient);
    const isFull = bookedCount >= maxCapacity;

    let reason: BookingWindowOption["reason"];
    if (isBlocked) {
      reason = "blocked";
    } else if (isPast) {
      reason = "past";
    } else if (isFull) {
      reason = "full";
    }

    const spotsRemaining = Math.max(0, maxCapacity - bookedCount);

    return {
      session: seg.session,
      label: seg.label,
      startTime: seg.startTime,
      endTime: seg.endTime,
      durationMinutes: effectiveDuration,
      bufferMinutes,
      minutesPerPatient,
      maxCapacity,
      bookedCount,
      heldCount,
      spotsRemaining,
      nextQueueNumber,
      currentServingNumber: state?.currentServingNumber || 0,
      available: !isBlocked && !isPast && !isFull && !state?.isPaused,
      reason: state?.isPaused ? "closed" : reason
    };
  });
}

export function findConflictingAppointmentsForScheduleChange(params: {
  doctorId: string;
  dayOfWeek: number;
  newIsAvailable: boolean;
  newStartTime: string;
  newEndTime: string;
  newBreakStart?: string;
  newBreakEnd?: string;
  appointments: Appointment[];
  now?: Date;
}): Appointment[] {
  const {
    doctorId,
    dayOfWeek,
    newIsAvailable,
    newStartTime,
    newEndTime,
    newBreakStart,
    newBreakEnd,
    appointments,
    now = new Date()
  } = params;

  const todayStr = now.toISOString().slice(0, 10);
  const startM = timeToMinutes(newStartTime);
  const endM = timeToMinutes(newEndTime);
  const bStartM =
    newBreakStart && newBreakEnd ? timeToMinutes(newBreakStart) : null;
  const bEndM =
    newBreakStart && newBreakEnd ? timeToMinutes(newBreakEnd) : null;

  return appointments.filter((appt) => {
    if (appt.doctorId !== doctorId) return false;
    if (appt.appointmentDate < todayStr) return false;
    if (!["confirmed", "serving", "pending_confirmation"].includes(appt.status)) {
      return false;
    }
    if (getDayOfWeekFromDate(appt.appointmentDate) !== dayOfWeek) return false;
    if (!newIsAvailable) return true;

    const aStart = timeToMinutes(appt.slotStart);
    const aEnd = timeToMinutes(appt.slotEnd);
    if (aStart < startM || aEnd > endM) return true;
    if (
      bStartM !== null &&
      bEndM !== null &&
      rangesOverlap(aStart, aEnd, bStartM, bEndM)
    ) {
      return true;
    }
    return false;
  });
}

export function findConflictingAppointmentsForBlock(params: {
  doctorId: string;
  blockedDate: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  appointments: Appointment[];
}): Appointment[] {
  const { doctorId, blockedDate, isFullDay, startTime, endTime, appointments } =
    params;
  return appointments.filter((appt) => {
    if (appt.doctorId !== doctorId) return false;
    if (appt.appointmentDate !== blockedDate) return false;
    if (!["confirmed", "serving", "pending_confirmation"].includes(appt.status)) {
      return false;
    }
    if (isFullDay) return true;
    if (!startTime || !endTime) return false;
    return rangesOverlap(
      timeToMinutes(appt.slotStart),
      timeToMinutes(appt.slotEnd),
      timeToMinutes(startTime),
      timeToMinutes(endTime)
    );
  });
}

export function evaluateCancellationEligibility(params: {
  appointment: Appointment;
  rules: BookingRulesConfig;
  now?: Date;
}): {
  canCancel: boolean;
  refundEligible: boolean;
  hoursUntilAppointment: number;
  reason?: string;
} {
  const { appointment, rules, now = new Date() } = params;

  if (["cancelled", "completed", "no_show", "serving"].includes(appointment.status)) {
    return {
      canCancel: false,
      refundEligible: false,
      hoursUntilAppointment: 0,
      reason: `Appointment is already ${appointment.status.replace("_", " ")}.`
    };
  }

  const apptDateTime = new Date(
    `${appointment.appointmentDate}T${appointment.slotStart}:00`
  );
  const diffHours =
    (apptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 0) {
    return {
      canCancel: false,
      refundEligible: false,
      hoursUntilAppointment: diffHours,
      reason: "Past appointments cannot be cancelled online."
    };
  }

  const withinWindow = diffHours >= rules.cancellationWindowHours;
  if (!withinWindow) {
    return {
      canCancel: false,
      refundEligible: false,
      hoursUntilAppointment: diffHours,
      reason: `Online cancellation is available up to ${rules.cancellationWindowHours} hours before the booking window.`
    };
  }

  return {
    canCancel: true,
    refundEligible:
      appointment.paymentStatus === "paid" && rules.refundEligibleWithinWindow,
    hoursUntilAppointment: diffHours
  };
}
