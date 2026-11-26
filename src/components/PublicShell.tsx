import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { AiTriageAssistant } from "@/components/AiTriageAssistant";

export async function PublicShell({
  children
}: {
  children: React.ReactNode;
}) {
  const [db, user] = await Promise.all([readDb(), getCurrentUser()]);
  const settings = db.websiteSettings;
  const publishedServices = db.services
    .filter((s) => s.isPublished)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const activeDoctors = db.doctors.filter((d) => d.isActive && d.isVisible);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <PublicHeader
        hospitalName={settings.hospitalName}
        emergencyPhone={settings.emergencyPhone}
        logoUrl={settings.logoUrl}
        user={user}
      />
      <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
      <PublicFooter settings={settings} />
      <AiTriageAssistant
        services={publishedServices}
        doctors={activeDoctors}
        emergencyPhone={settings.emergencyPhone}
      />
    </div>
  );
}
