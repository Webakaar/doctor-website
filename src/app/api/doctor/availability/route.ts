import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { generateId, mutateDb, readDb } from "@/lib/db";
import {
  findConflictingAppointmentsForBlock,
  findConflictingAppointmentsForScheduleChange
} from "@/lib/slots";

function resolveTargetDoctorId(
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  requestedDoctorId?: string | null
): string | null {
  if (hasAdminPermission(user, "manage_doctors") && requestedDoctorId) {
    return requestedDoctorId;
  }
  if (user.role === "doctor" && user.doctorId) {
    if (requestedDoctorId && requestedDoctorId !== user.doctorId) return null;
    return user.doctorId;
  }
  return null;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const doctorId = resolveTargetDoctorId(user, searchParams.get("doctorId"));
  if (!doctorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDb();
  const schedules = db.doctorSchedules
    .filter((s) => s.doctorId === doctorId)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const blockedSlots = db.blockedSlots
    .filter((b) => b.doctorId === doctorId)
    .sort((a, b) => a.blockedDate.localeCompare(b.blockedDate));

  return NextResponse.json({ doctorId, schedules, blockedSlots });
}

const updateScheduleSchema = z.object({
  action: z.enum(["save_schedules", "add_block", "delete_block"]),
  doctorId: z.string().optional(),
  force: z.boolean().optional(),
  schedules: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        breakStart: z.string().optional(),
        breakEnd: z.string().optional(),
        slotDurationMins: z.number().int().min(10).max(120),
        isAvailable: z.boolean()
      })
    )
    .optional(),
  block: z
    .object({
      blockedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      isFullDay: z.boolean(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      reason: z.string().min(2),
      type: z.enum(["break", "holiday", "leave", "blocked"])
    })
    .optional(),
  blockId: z.string().optional()
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid availability payload." },
      { status: 400 }
    );
  }

  const targetDoctorId = resolveTargetDoctorId(user, parsed.data.doctorId);
  if (!targetDoctorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.action === "save_schedules" && parsed.data.schedules) {
    const incoming = parsed.data.schedules;
    const outcome = await mutateDb((db) => {
      const conflicts = incoming.flatMap((sched) =>
        findConflictingAppointmentsForScheduleChange({
          doctorId: targetDoctorId,
          dayOfWeek: sched.dayOfWeek,
          newIsAvailable: sched.isAvailable,
          newStartTime: sched.startTime,
          newEndTime: sched.endTime,
          newBreakStart: sched.breakStart,
          newBreakEnd: sched.breakEnd,
          appointments: db.appointments
        })
      );

      if (conflicts.length > 0 && !parsed.data.force) {
        return {
          conflictWarning: true as const,
          conflicts: conflicts.map((c) => ({
            id: c.id,
            bookingRef: c.bookingRef,
            patientName: c.patientName,
            appointmentDate: c.appointmentDate,
            slotStart: c.slotStart
          }))
        };
      }

      db.doctorSchedules = db.doctorSchedules.filter(
        (s) => s.doctorId !== targetDoctorId
      );
      incoming.forEach((s) => {
        db.doctorSchedules.push({
          id: generateId(),
          doctorId: targetDoctorId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          breakStart: s.breakStart || undefined,
          breakEnd: s.breakEnd || undefined,
          slotDurationMins: s.slotDurationMins,
          isAvailable: s.isAvailable
        });
      });

      return { conflictWarning: false as const };
    });

    if (outcome.conflictWarning) {
      return NextResponse.json(
        {
          warning:
            "This schedule change overlaps existing confirmed appointments. Confirm to proceed anyway (existing appointments remain active until manually rescheduled/cancelled).",
          conflicts: outcome.conflicts
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  }

  if (parsed.data.action === "add_block" && parsed.data.block) {
    const blk = parsed.data.block;
    const outcome = await mutateDb((db) => {
      const conflicts = findConflictingAppointmentsForBlock({
        doctorId: targetDoctorId,
        blockedDate: blk.blockedDate,
        isFullDay: blk.isFullDay,
        startTime: blk.startTime,
        endTime: blk.endTime,
        appointments: db.appointments
      });

      if (conflicts.length > 0 && !parsed.data.force) {
        return {
          conflictWarning: true as const,
          conflicts: conflicts.map((c) => ({
            id: c.id,
            bookingRef: c.bookingRef,
            patientName: c.patientName,
            appointmentDate: c.appointmentDate,
            slotStart: c.slotStart
          }))
        };
      }

      const item = {
        id: generateId(),
        doctorId: targetDoctorId,
        blockedDate: blk.blockedDate,
        isFullDay: blk.isFullDay,
        startTime: blk.isFullDay ? undefined : blk.startTime,
        endTime: blk.isFullDay ? undefined : blk.endTime,
        reason: blk.reason.trim(),
        type: blk.type,
        createdAt: new Date().toISOString()
      };
      db.blockedSlots.push(item);

      return { conflictWarning: false as const, block: item };
    });

    if (outcome.conflictWarning) {
      return NextResponse.json(
        {
          warning:
            "This blocked period conflicts with existing confirmed appointments. Confirm to save the block anyway.",
          conflicts: outcome.conflicts
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ block: outcome.block }, { status: 201 });
  }

  if (parsed.data.action === "delete_block" && parsed.data.blockId) {
    await mutateDb((db) => {
      db.blockedSlots = db.blockedSlots.filter(
        (b) =>
          !(b.id === parsed.data.blockId && b.doctorId === targetDoctorId)
      );
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
