import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { generateDoctorSlotsForDate } from "@/lib/slots";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  if (!doctorId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "doctorId and valid date (YYYY-MM-DD) are required." },
      { status: 400 }
    );
  }

  const db = await readDb();
  const doctor = db.doctors.find(
    (d) => d.id === doctorId && d.isActive && d.isVisible
  );
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
  }

  const slots = generateDoctorSlotsForDate({
    doctorId: doctor.id,
    dateStr: date,
    schedules: db.doctorSchedules,
    blockedSlots: db.blockedSlots,
    appointments: db.appointments,
    fallbackDurationMins: doctor.slotDurationMins
  });

  return NextResponse.json({
    doctorId: doctor.id,
    date,
    slots,
    consultationFee: doctor.consultationFee,
    slotDurationMins: doctor.slotDurationMins
  });
}
