import { readDb } from "@/lib/db";
import { ReceptionQueueClient } from "@/components/ReceptionQueueClient";

export const dynamic = "force-dynamic";

export default async function ReceptionPage() {
  const db = await readDb();
  const doctors = db.doctors.filter((d) => d.isActive);

  return (
    <ReceptionQueueClient
      doctors={doctors.map((d) => ({
        id: d.id,
        fullName: d.fullName,
        specialty: d.specialty
      }))}
    />
  );
}
