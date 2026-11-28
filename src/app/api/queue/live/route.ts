import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { generateId, mutateDb, readDb } from "@/lib/db";
import {
  generateDoctorQueueWindowsForDate,
  inferSessionFromAppointment
} from "@/lib/slots";
import type { BookingSession, QueueState } from "@/types/hospital";

function getTodayDateStr(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

function canOperateQueue(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  targetDoctorId?: string
): boolean {
  if (!user) return false;
  if (
    user.role === "super_admin" ||
    user.role === "reception" ||
    hasAdminPermission(user, "manage_queue") ||
    hasAdminPermission(user, "manage_appointments")
  ) {
    return true;
  }
  if (user.role === "doctor" && user.doctorId) {
    return !targetDoctorId || targetDoctorId === user.doctorId;
  }
  return false;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") || getTodayDateStr();
  const doctorIdFilter = searchParams.get("doctorId");
  const scope = searchParams.get("scope"); // "patient" | "staff"

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
  }

  const [db, user] = await Promise.all([readDb(), getCurrentUser()]);
  const rules = db.websiteSettings.bookingSettings;

  const activeDoctors = db.doctors.filter(
    (d) =>
      d.isActive &&
      (!doctorIdFilter || d.id === doctorIdFilter) &&
      (scope !== "doctor" || user?.doctorId === d.id)
  );

  const doctorBoards = activeDoctors.map((doc) => {
    const windows = generateDoctorQueueWindowsForDate({
      doctorId: doc.id,
      dateStr,
      schedules: db.doctorSchedules,
      blockedSlots: db.blockedSlots,
      appointments: db.appointments,
      queueStates: db.queueStates,
      bookingRules: rules
    });

    return {
      doctorId: doc.id,
      doctorName: doc.fullName,
      specialty: doc.specialty,
      photoUrl: doc.photoUrl,
      windows
    };
  });

  // Return ordered patient queue & daily summary only to authenticated Reception/Admin/Doctor staff
  let queueItems: unknown[] = [];
  let daySummary: {
    totalBookings: number;
    morningBookings: number;
    eveningBookings: number;
    waitingCount: number;
    completedCount: number;
    cancelledCount: number;
    totalCapacity: number;
  } | null = null;

  if (canOperateQueue(user, doctorIdFilter || undefined)) {
    const docIdScope =
      user?.role === "doctor" && user.doctorId
        ? user.doctorId
        : doctorIdFilter || null;

    const allDayAppointments = db.appointments.filter(
      (a) => a.appointmentDate === dateStr && a.status !== "pending_payment"
    );
    const scopedDayAppointments = docIdScope && user?.role === "doctor"
      ? allDayAppointments.filter((a) => a.doctorId === docIdScope)
      : allDayAppointments;
    const activeDayAppointments = scopedDayAppointments.filter(
      (a) => a.status !== "cancelled"
    );

    const capacityDoctors =
      user?.role === "doctor" && user.doctorId
        ? db.doctors.filter((d) => d.isActive && d.id === user.doctorId)
        : db.doctors.filter((d) => d.isActive);

    const totalCapacity = capacityDoctors.reduce((sum, doc) => {
      const wins = generateDoctorQueueWindowsForDate({
        doctorId: doc.id,
        dateStr,
        schedules: db.doctorSchedules,
        blockedSlots: db.blockedSlots,
        appointments: db.appointments,
        queueStates: db.queueStates,
        bookingRules: rules
      });
      return sum + wins.reduce((wSum, w) => wSum + w.maxCapacity, 0);
    }, 0);

    daySummary = {
      totalBookings: activeDayAppointments.length,
      morningBookings: activeDayAppointments.filter(
        (a) => inferSessionFromAppointment(a) === "morning"
      ).length,
      eveningBookings: activeDayAppointments.filter(
        (a) => inferSessionFromAppointment(a) === "evening"
      ).length,
      waitingCount: activeDayAppointments.filter((a) =>
        ["confirmed", "serving", "pending_confirmation"].includes(a.status)
      ).length,
      completedCount: activeDayAppointments.filter(
        (a) => a.status === "completed"
      ).length,
      cancelledCount: scopedDayAppointments.filter(
        (a) => a.status === "cancelled"
      ).length,
      totalCapacity
    };

    queueItems = allDayAppointments
      .filter((a) => !docIdScope || a.doctorId === docIdScope)
      .map((a) => {
        const doc = db.doctors.find((d) => d.id === a.doctorId);
        const svc = db.services.find((s) => s.id === a.serviceId);
        return {
          ...a,
          session: inferSessionFromAppointment(a),
          doctorName: doc?.fullName || "Unknown",
          serviceName: svc?.name || "Consultation"
        };
      })
      .sort((a, b) => (a.queueNumber || 9999) - (b.queueNumber || 9999));
  }

  // If authenticated patient (or patient scope), return live queue progress per appointment
  let patientProgress: unknown[] = [];
  if (user && (user.role === "patient" || scope === "patient")) {
    const minutesPerPatient = Math.max(5, rules.queueMinutesPerPatient ?? 15);
    const mine = db.appointments.filter(
      (a) =>
        a.patientId === user.id ||
        a.patientEmail.toLowerCase() === user.email.toLowerCase()
    );

    patientProgress = mine.map((appt) => {
      const sess = inferSessionFromAppointment(appt);
      const qState = db.queueStates.find(
        (q) =>
          q.doctorId === appt.doctorId &&
          q.queueDate === appt.appointmentDate &&
          q.session === sess
      );
      const currentServing = qState?.currentServingNumber || 0;
      const myNum = appt.queueNumber || 0;

      const sessionQueue = db.appointments.filter(
        (other) =>
          other.doctorId === appt.doctorId &&
          other.appointmentDate === appt.appointmentDate &&
          inferSessionFromAppointment(other) === sess &&
          ["confirmed", "serving", "pending_confirmation", "completed"].includes(
            other.status
          )
      );

      const waitingAhead =
        myNum > 0
          ? sessionQueue.filter(
              (o) =>
                (o.queueNumber || 0) > currentServing &&
                (o.queueNumber || 0) < myNum &&
                ["confirmed", "pending_confirmation"].includes(o.status)
            ).length
          : 0;

      const aheadTotal =
        myNum > 0
          ? appt.status === "serving" || appt.status === "completed"
            ? 0
            : Math.max(0, waitingAhead + (currentServing < myNum && currentServing > 0 ? 1 : 0))
          : 0;

      const estimatedWaitMinutes = aheadTotal * minutesPerPatient;
      const progressPercent =
        appt.status === "completed" || appt.status === "serving"
          ? 100
          : myNum > 0
          ? Math.min(100, Math.round((currentServing / myNum) * 100))
          : 0;

      return {
        appointmentId: appt.id,
        bookingRef: appt.bookingRef,
        doctorId: appt.doctorId,
        appointmentDate: appt.appointmentDate,
        session: sess,
        queueNumber: appt.queueNumber ?? null,
        status: appt.status,
        currentServingNumber: currentServing,
        isPaused: Boolean(qState?.isPaused),
        totalInSession: sessionQueue.length,
        patientsAhead: aheadTotal,
        estimatedWaitMinutes,
        progressPercent
      };
    });
  }

  return NextResponse.json({
    date: dateStr,
    minutesPerPatient: rules.queueMinutesPerPatient ?? 15,
    bufferMinutes: rules.queueBufferMinutes ?? 15,
    daySummary,
    doctorBoards,
    queueItems,
    patientProgress,
    updatedAt: new Date().toISOString()
  });
}

const queueActionSchema = z.object({
  action: z.enum([
    "call_next",
    "set_serving",
    "set_appointment_status",
    "toggle_pause",
    "set_capacity"
  ]),
  doctorId: z.string().min(1),
  queueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  session: z.enum(["morning", "evening"]),
  servingNumber: z.number().int().min(0).max(500).optional(),
  appointmentId: z.string().optional(),
  status: z
    .enum(["confirmed", "serving", "completed", "no_show", "cancelled"])
    .optional(),
  isPaused: z.boolean().optional(),
  capacityOverride: z.number().int().min(0).max(500).nullable().optional()
});

function upsertQueueState(
  db: { queueStates: QueueState[] },
  doctorId: string,
  queueDate: string,
  session: BookingSession
): QueueState {
  let state = db.queueStates.find(
    (q) =>
      q.doctorId === doctorId &&
      q.queueDate === queueDate &&
      q.session === session
  );
  if (!state) {
    state = {
      id: generateId(),
      doctorId,
      queueDate,
      session,
      currentServingNumber: 0,
      isPaused: false,
      updatedAt: new Date().toISOString()
    };
    db.queueStates.push(state);
  }
  return state;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = queueActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid queue action." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (!canOperateQueue(user, data.doctorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    data.action === "set_capacity" &&
    user?.role !== "super_admin" &&
    !hasAdminPermission(user, "manage_doctors") &&
    !hasAdminPermission(user, "manage_queue") &&
    user?.role !== "reception"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const outcome = await mutateDb((db) => {
    const nowIso = new Date().toISOString();
    const state = upsertQueueState(
      db,
      data.doctorId,
      data.queueDate,
      data.session
    );

    const sessionAppts = db.appointments
      .filter(
        (a) =>
          a.doctorId === data.doctorId &&
          a.appointmentDate === data.queueDate &&
          inferSessionFromAppointment(a) === data.session
      )
      .sort((a, b) => (a.queueNumber || 9999) - (b.queueNumber || 9999));

    if (data.action === "call_next") {
      // Complete any currently serving appointment in this session
      for (const a of sessionAppts) {
        if (a.status === "serving") {
          a.status = "completed";
          a.updatedAt = nowIso;
          db.appointmentStatusHistory.push({
            id: generateId(),
            appointmentId: a.id,
            previousStatus: "serving",
            newStatus: "completed",
            changedBy: user?.id,
            changedByName: user?.fullName,
            note: "Automatically completed when calling next queue token.",
            createdAt: nowIso
          });
        }
      }

      const nextWaiting = sessionAppts.find(
        (a) =>
          ["confirmed", "pending_confirmation"].includes(a.status) &&
          (a.queueNumber || 0) > state.currentServingNumber
      );

      if (nextWaiting && typeof nextWaiting.queueNumber === "number") {
        const prevStatus = nextWaiting.status;
        nextWaiting.status = "serving";
        nextWaiting.updatedAt = nowIso;
        state.currentServingNumber = nextWaiting.queueNumber;
        db.appointmentStatusHistory.push({
          id: generateId(),
          appointmentId: nextWaiting.id,
          previousStatus: prevStatus,
          newStatus: "serving",
          changedBy: user?.id,
          changedByName: user?.fullName,
          note: `Called Token #${nextWaiting.queueNumber} by ${user?.fullName || "Reception"}.`,
          createdAt: nowIso
        });
      } else {
        const maxQueued = sessionAppts.reduce(
          (m, a) => Math.max(m, a.queueNumber || 0),
          0
        );
        state.currentServingNumber = Math.min(
          Math.max(maxQueued, state.currentServingNumber + 1),
          state.currentServingNumber + 1
        );
      }
      state.updatedAt = nowIso;
      return { queueState: state };
    }

    if (data.action === "set_serving") {
      const targetNum = Math.max(0, data.servingNumber ?? 0);
      state.currentServingNumber = targetNum;
      state.updatedAt = nowIso;

      for (const a of sessionAppts) {
        if (a.queueNumber === targetNum && a.status !== "cancelled") {
          const prev = a.status;
          a.status = "serving";
          a.updatedAt = nowIso;
          db.appointmentStatusHistory.push({
            id: generateId(),
            appointmentId: a.id,
            previousStatus: prev,
            newStatus: "serving",
            changedBy: user?.id,
            changedByName: user?.fullName,
            note: `Current serving token set to #${targetNum}.`,
            createdAt: nowIso
          });
        } else if (a.status === "serving" && a.queueNumber !== targetNum) {
          a.status = "completed";
          a.updatedAt = nowIso;
        }
      }

      return { queueState: state };
    }

    if (data.action === "set_appointment_status" && data.appointmentId && data.status) {
      const appt = sessionAppts.find((a) => a.id === data.appointmentId);
      if (!appt) {
        return { error: "Appointment not found in queue.", status: 404 as const };
      }
      const prevStatus = appt.status;
      if (data.status === "serving" && typeof appt.queueNumber === "number") {
        for (const other of sessionAppts) {
          if (other.id !== appt.id && other.status === "serving") {
            other.status = "completed";
            other.updatedAt = nowIso;
          }
        }
        state.currentServingNumber = appt.queueNumber;
        state.updatedAt = nowIso;
      }
      appt.status = data.status;
      appt.updatedAt = nowIso;
      db.appointmentStatusHistory.push({
        id: generateId(),
        appointmentId: appt.id,
        previousStatus: prevStatus,
        newStatus: data.status,
        changedBy: user?.id,
        changedByName: user?.fullName,
        note: `Queue status updated to ${data.status}.`,
        createdAt: nowIso
      });
      return { queueState: state, appointment: appt };
    }

    if (data.action === "toggle_pause") {
      state.isPaused = data.isPaused ?? !state.isPaused;
      state.updatedAt = nowIso;
      return { queueState: state };
    }

    if (data.action === "set_capacity") {
      state.capacityOverride =
        data.capacityOverride === null ? undefined : data.capacityOverride;
      state.updatedAt = nowIso;
      return { queueState: state };
    }

    return { error: "Unsupported queue action.", status: 400 as const };
  });

  if ("error" in outcome) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }

  return NextResponse.json(outcome);
}

export const PATCH = POST;
