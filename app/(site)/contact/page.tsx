import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/site/PageHero";
import { ContactForm } from "@/components/site/ContactForm";
import { ContactInfo } from "@/components/site/ContactInfo";
import { SITE } from "@/lib/site";
import { TOPIC_VALUES, type ContactValues } from "@/lib/contact";
import { pageMeta } from "@/lib/seo";


export const metadata = pageMeta({ title: "Contact Centre", path: "/contact",
  description: "Contact HHES Kenya about registering, ordering, M-Pesa payments, refunds or collecting your lesson books. Send a message, call, or visit us." });

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;

  // A signed-in organisation doesn't have to retype its details
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const prefill: Partial<ContactValues> = {};
  if (user) {
    const { data: org } = await sb.from("organisations").select("name,contact_name,contact_email,phone").eq("user_id", user.id).maybeSingle();
    if (org) Object.assign(prefill, { name: org.contact_name, email: org.contact_email, phone: org.phone ?? "", organisation: org.name });
    else if (user.email) prefill.email = user.email;
  }

  // ?topic=payments pre-selects the topic (ignored if it isn't a known value)
  const t = typeof sp.topic === "string" ? sp.topic : "";
  if (TOPIC_VALUES.includes(t)) prefill.topic = t as ContactValues["topic"];

  return (
    <>
      <PageHero crumb="Contact Centre" title="Contact Centre"
        intro="Questions about registering, ordering, paying with M-Pesa or collecting your books? Send us a message or reach us directly. We're glad to help." />

      <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <section className="rounded-card border border-line bg-surface p-6 sm:p-10">
          <h2 className="font-sans text-2xl font-semibold text-ink">Send us a message</h2>
          <p className="mt-2 text-[15px] text-muted">Fill in the form and we'll reply by email.</p>
          <p className="mt-5 flex gap-3 rounded-field bg-panel px-4 py-3.5 text-sm leading-relaxed text-muted">
            <Lightbulb size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <span>Writing about an order? Include your <strong className="font-medium text-ink">order reference</strong>. About a payment? Include your <strong className="font-medium text-ink">M-Pesa receipt number</strong>. It helps us answer faster.</span>
          </p>
          <div className="mt-8"><ContactForm prefill={prefill} hours={SITE.hours} /></div>
        </section>
        <ContactInfo />
      </div>
    </>
  );
}