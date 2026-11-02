import Link from "next/link";
import { Building2, MapPin, User, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const Meta = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) => (
  <div className="px-6 py-5 sm:px-8">
    <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
    <p className="mt-2 flex items-center gap-2.5 text-lg font-medium text-ink"><Icon size={20} className="text-primary" aria-hidden /> {children}</p>
  </div>
);

export function OrderIntro({ org }: { org: { name: string; contact_name: string; location: string | null } }) {
  return (
    <section className="grid divide-y divide-line rounded-card border border-line bg-surface md:grid-cols-[auto_auto_1fr] md:divide-x md:divide-y-0">
      <Meta icon={Building2} label="Ordering for">{org.name}</Meta>
      <Meta icon={MapPin} label="Location">
        {org.location ?? <span className="text-base text-muted">Not set yet · <Link href="/rep/profile" className="font-medium text-primary hover:underline">add it</Link></span>}
      </Meta>
      <Meta icon={User} label="Authorised rep">{org.contact_name}</Meta>
    </section>
  );
}