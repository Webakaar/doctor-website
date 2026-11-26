import type {
  Appointment,
  BlockedSlot,
  BookingRulesConfig,
  DoctorSchedule
} from "@/types/hospital";

export interface TimeSlotOption {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  available: boolean;
  reason?: "booked" | "held" | "blocked" | "break" | "past";
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

export function getDayOfWeekFromDate(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isAppointmentBlockingSlot(
  appt: Appointment,
  now: Date = new Date()
): boolean {
  if (
    appt.status === "confirmed" ||
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

export function generateDoctorSlotsForDate(params: {
  doctorId: string;
  dateStr: string; // YYYY-MM-DD
  schedules: DoctorSchedule[];
  blockedSlots: BlockedSlot[];
  appointments: Appointment[];
  fallbackDurationMins?: number;
  now?: Date;
}): TimeSlotOption[] {
  const {
    doctorId,
    dateStr,
    schedules,
    blockedSlots,
    appointments,
    fallbackDurationMins = 30,
    now = new Date()
  } = params;

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

  const startMins = timeToMinutes(schedule.startTime);
  const endMins = timeToMinutes(schedule.endTime);
  const duration = schedule.slotDurationMins || fallbackDurationMins;
  if (duration <= 0 || startMins >= endMins) return [];

  const breakStartMins =
    schedule.breakStart && schedule.breakEnd
      ? timeToMinutes(schedule.breakStart)
      : null;
  const breakEndMins =
    schedule.breakStart && schedule.breakEnd
      ? timeToMinutes(schedule.breakEnd)
      : null;

  const dateAppointments = appointments.filter(
    (a) => a.doctorId === doctorId && a.appointmentDate === dateStr
  );

  // Check local today time to avoid booking past slots
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: TimeSlotOption[] = [];

  for (let cur = startMins; cur + duration <= endMins; cur += duration) {
    const slotEnd = cur + duration;
    const startTime = minutesToTime(cur);
    const endTime = minutesToTime(slotEnd);

    if (
      breakStartMins !== null &&
      breakEndMins !== null &&
      rangesOverlap(cur, slotEnd, breakStartMins, breakEndMins)
    ) {
      slots.push({ startTime, endTime, available: false, reason: "break" });
      continue;
    }

    const isBlocked = dayBlocks.some((b) => {
      if (!b.startTime || !b.endTime) return false;
      return rangesOverlap(
        cur,
        slotEnd,
        timeToMinutes(b.startTime),
        timeToMinutes(b.endTime)
      );
    });
    if (isBlocked) {
      slots.push({ startTime, endTime, available: false, reason: "blocked" });
      continue;
    }

    const activeAppt = dateAppointments.find(
      (a) =>
        isAppointmentBlockingSlot(a, now) &&
        rangesOverlap(
          cur,
          slotEnd,
          timeToMinutes(a.slotStart),
          timeToMinutes(a.slotEnd)
        )
    );

    if (activeAppt) {
      slots.push({
        startTime,
        endTime,
        available: false,
        reason: activeAppt.status === "pending_payment" ? "held" : "booked"
      });
      continue;
    }

    if (dateStr < todayStr || (dateStr === todayStr && cur <= nowMinutes + 15)) {
      slots.push({ startTime, endTime, available: false, reason: "past" });
      continue;
    }

    slots.push({ startTime, endTime, available: true });
  }

  return slots;
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
    if (!["confirmed", "pending_confirmation"].includes(appt.status)) {
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
    if (!["confirmed", "pending_confirmation"].includes(appt.status)) {
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

  if (["cancelled", "completed", "no_show"].includes(appointment.status)) {
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
      reason: `Online cancellation is available up to ${rules.cancellationWindowHours} hours before the appointment.`
    };
  }

  return {
    canCancel: true,
    refundEligible:
      appointment.paymentStatus === "paid" && rules.refundEligibleWithinWindow,
    hoursUntilAppointment: diffHours
  };
}
