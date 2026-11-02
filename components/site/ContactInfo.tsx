import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { SITE, mapsHref, telHref, waHref } from "@/lib/site";
import { NAV } from "@/lib/nav";

const Card = ({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) => (
  <section className="rounded-card border border-line bg-surface p-6">
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-white"><Icon size={20} aria-hidden /></span>
      <h2 className="font-sans text-lg font-semibold text-ink">{title}</h2>
    </div>
    <div className="mt-4 space-y-2 text-[15px] leading-relaxed text-muted">{children}</div>
  </section>
);

const link = "font-medium text-primary hover:underline";

export function ContactInfo() {
  return (
    <div className="space-y-5">
      <Card icon={MapPin} title="Visit us">
        <p className="text-ink">{SITE.address}</p>
        {SITE.hours && <p className="flex items-start gap-2"><Clock size={16} className="mt-1 shrink-0" aria-hidden /> {SITE.hours}</p>}
        <a href={mapsHref(SITE.address)} target="_blank" rel="noopener noreferrer" className={link}>Get directions</a>
      </Card>
      {SITE.phone && (
        <Card icon={Phone} title="Call us">
          <a href={telHref(SITE.phone)} className="text-lg font-semibold text-ink hover:text-primary">{SITE.phone}</a>
          {SITE.hours && <p>Best during office hours.</p>}
        </Card>
      )}
      {SITE.email && (
        <Card icon={Mail} title="Email us">
          <a href={`mailto:${SITE.email}`} className="break-all font-semibold text-ink hover:text-primary">{SITE.email}</a>
        </Card>
      )}
      {SITE.whatsapp && (
        <Card icon={MessageCircle} title="WhatsApp">
          <a href={waHref(SITE.whatsapp)} target="_blank" rel="noopener noreferrer" className={link}>Chat with us on WhatsApp</a>
        </Card>
      )}
      <section className="rounded-card border border-line bg-panel p-6">
        <h2 className="font-sans text-lg font-semibold text-ink">Looking for a quick answer?</h2>
        <ul className="mt-3 space-y-2 text-[15px]">
          <li><Link href={NAV.orderingGuide} className={link}>Ordering Guide</Link> <span className="text-muted">: step by step</span></li>
          <li><Link href={NAV.faqs} className={link}>FAQs</Link> <span className="text-muted">: common questions</span></li>
          <li><Link href={NAV.help} className={link}>Help and Support</Link> <span className="text-muted">: fixing problems</span></li>
        </ul>
      </section>
    </div>
  );
}