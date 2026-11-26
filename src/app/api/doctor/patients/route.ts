import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "doctor" || !user.doctorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDb();
  // Doctors only see patients who have an appointment assigned to them (Section 4.3 & 8)
  const myAppointments = db.appointments
    .filter((a) => a.doctorId === user.doctorId)
    .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));

  const patientRecords = myAppointments.map((appt) => {
    const service = db.services.find((s) => s.id === appt.serviceId);
    return {
      appointmentId: appt.id,
      bookingRef: appt.bookingRef,
      patientName: appt.patientName,
      patientPhone: appt.patientPhone,
      patientEmail: appt.patientEmail,
      serviceName: service?.name || "Consultation",
      reasonForVisit: appt.reasonForVisit,
      appointmentDate: appt.appointmentDate,
      slotStart: appt.slotStart,
      slotEnd: appt.slotEnd,
      status: appt.status,
      notes: appt.notes
    };
  });

  return NextResponse.json({ patients: patientRecords });
}
