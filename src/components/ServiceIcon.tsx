import {
  Baby,
  BellRing,
  Bone,
  Brain,
  CalendarCheck,
  CreditCard,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope
} from "lucide-react";

const ICON_MAP = {
  HeartPulse,
  Bone,
  Baby,
  Brain,
  Sparkles,
  Stethoscope,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  BellRing
};

export function ServiceIcon({
  name,
  className = "h-6 w-6"
}: {
  name: string;
  className?: string;
}) {
  const IconComponent =
    ICON_MAP[name as keyof typeof ICON_MAP] || Stethoscope;
  return <IconComponent className={className} />;
}
