import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Building2, Check, ChartColumn, FileCheck2, History, Laptop, ShieldCheck, SquarePen, type LucideIcon,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/site/PhotoSlot";
import { BooksFallback, HeroFallback } from "@/components/site/Fallbacks";
import { NAV } from "@/lib/nav";
import { absoluteUrl, pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMeta({
    title: "HHES Kenya | Digital quarterly lesson book ordering", absoluteTitle: true, path: "/",
    description: "Affiliated churches, schools and universities can place, pay for, track and amend quarterly lesson book orders online with Home Health Education Service Kenya.",
  }),
  openGraph: {
    title: "The new digital standard for quarterly book orders",
    description: "Place, pay for, track and manage your quarterly lesson book orders online with HHES Kenya.",
    siteName: "HHES Kenya", type: "website", locale: "en_KE",
  },
};

const ld = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization", "@id": `${absoluteUrl("/")}#org`, name: SITE.name, alternateName: SITE.short, url: absoluteUrl("/"),
      ...(SITE.phone ? { telephone: SITE.phone } : {}), ...(SITE.email ? { email: SITE.email } : {}),
      address: { "@type": "PostalAddress", streetAddress: SITE.address, addressCountry: "KE" },
    },
    { "@type": "WebSite", name: SITE.short, url: absoluteUrl("/"), inLanguage: "en-KE", publisher: { "@id": `${absoluteUrl("/")}#org` } },
  ],
};

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Laptop, title: "100% Online Ordering", body: "Place quarterly orders securely from your church, school, or university office without sending a representative physically." },
  { icon: History, title: "Digital Order History", body: "Every order receives a digital reference and remains available for review, reorders, and dispute resolution." },
  { icon: FileCheck2, title: "Zero Processing Errors", body: "Validated digital submissions replace handwritten forms and ensure book quantities are captured correctly every time." },
  { icon: SquarePen, title: "Flexible Modifications", body: "Organisations can amend or cancel submitted orders right up to pickup confirmation for better operational flexibility." },
  { icon: ChartColumn, title: "Real-Time Demand Planning", body: "HHES admin can see incoming demand by category before deadlines close and plan procurement with confidence." },
  { icon: ShieldCheck, title: "Digital Audit Trail", body: "Digital pickup confirmation creates a complete record from submission through fulfilment for full accountability." },
];

const BOOKS = ["Adults", "Adults Double Quarter", "Kindergarten and Primary", "Cornerstone and Realtime"];

const STEPS = [
  { title: "Register and Validate", body: "Create a secure account for your church, school, or university. HHES reviews and approves it before you begin ordering." },
  { title: "Submit Quarterly Demand", body: "Enter your required quantities and pay securely with M-Pesa. You can edit the order any time before pickup confirmation." },
  { title: "Digital Pickup Confirmation", body: "Confirm collection digitally to maintain a trusted record from submission through fulfilment." },
];

export default function WelcomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-[1200px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink">
            <Building2 size={14} className="text-primary" aria-hidden /> SDA Church-Affiliated Procurement
          </span>
          <h1 className="mx-auto mt-8 max-w-[880px] text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-6xl">
            The new digital standard for quarterly book orders.
          </h1>
          <p className="mx-auto mt-6 max-w-[660px] text-lg leading-relaxed text-muted">
            Say goodbye to pen and paper. Affiliated organisations can now place, track, and manage orders for Health, Religious, and Education books entirely online with zero processing errors.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href={NAV.register} className={buttonStyles()}>Register Organisation <ArrowRight size={16} aria-hidden /></Link>
            <Link href="#how-it-works" className={buttonStyles({ variant: "outline" })}>Learn How It Works</Link>
          </div>
          <div className="relative mt-14 aspect-[4/3] overflow-hidden rounded-card border border-line bg-panel shadow-sm sm:aspect-[16/7]">
            <PhotoSlot src="/landing/hero.jpg" alt="The HHES order tracker dashboard shown on an office screen"
              priority sizes="(min-width: 1280px) 1200px, 100vw" fallback={<HeroFallback />} />
          </div>
        </div>
      </section>

      {/* Why we are moving online */}
      <section className="bg-canvas px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto max-w-[680px] text-center">
            <h2 className="text-3xl font-bold text-ink sm:text-4xl">Why we are moving online</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              We're upgrading our systems to provide complete visibility, eliminate paperwork errors, and save every affiliated organisation the trip to the HHES centre.
            </p>
          </div>
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-card border border-line bg-surface p-7">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-white"><Icon size={22} aria-hidden /></span>
                <h3 className="mt-5 font-sans text-xl font-semibold text-ink">{title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Quarterly Lesson Books */}
      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-bold text-ink sm:text-4xl">Quarterly Lesson Books</h2>
            <p className="mt-5 max-w-[520px] text-lg leading-relaxed text-muted">
              Our digital catalogue includes all standard lesson book categories, allowing organisations to submit exact quarterly quantities before the deadline closes.
            </p>
            <ul className="mt-8 space-y-4">
              {BOOKS.map((b) => (
                <li key={b} className="flex items-center gap-3 text-base font-medium text-ink">
                  <span className="flex size-6 items-center justify-center rounded-full bg-positive text-white"><Check size={14} strokeWidth={3} aria-hidden /></span> {b}
                </li>
              ))}
            </ul>
            <Link href={NAV.catalogue} className={`${buttonStyles({ variant: "outline" })} mt-9`}>Browse Catalogue</Link>
            <p className="mt-3 text-sm text-muted">Prices are shown to approved organisations once signed in.</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-panel shadow-sm">
            <PhotoSlot src="/landing/books.jpg" alt="A stack of HHES quarterly lesson books on a wooden table"
              sizes="(min-width: 1024px) 560px, 100vw" fallback={<BooksFallback />} />
          </div>
        </div>
      </section>

      {/* Total control */}
      <section id="how-it-works" className="scroll-mt-20 bg-canvas px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto max-w-[680px] text-center">
            <h2 className="text-3xl font-bold text-ink sm:text-4xl">Total Control Over Your Orders</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              We've built operational flexibility directly into the platform. Amend or cancel your orders with confidence, then confirm pickup digitally for a complete audit trail.
            </p>
          </div>
          <ol className="mx-auto mt-14 max-w-[800px] divide-y divide-line rounded-card border border-line bg-surface px-6 sm:px-10">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-6 py-8">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-panel font-display text-lg font-bold text-ink">{i + 1}</span>
                <div>
                  <h3 className="font-sans text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-primary px-5 py-20 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[680px]">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to digitise your ordering?</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/90">Join affiliated organisations across Kenya in moving routine quarterly ordering fully online.</p>
          <Link href={NAV.register} className={`${buttonStyles({ variant: "outline" })} mt-9 border-transparent px-7`}>Get Started Now</Link>
        </div>
      </section>
    </>
  );
}