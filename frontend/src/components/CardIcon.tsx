import type { LucideIcon } from "lucide-react";

export function CardIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="cv-card-icon" aria-hidden="true">
      <Icon size={20} strokeWidth={1.6} />
    </span>
  );
}
