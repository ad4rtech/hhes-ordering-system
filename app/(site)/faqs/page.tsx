import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/PageHero";
import { FaqBrowser } from "@/components/site/FaqBrowser";
import { buttonStyles } from "@/components/ui/Button";
import { getFaqs } from "@/lib/faqs";
import { NAV } from "@/lib/nav";
import { pageMeta } from "@/lib/seo";



export const metadata = pageMeta({ title: "FAQs", path: "/faqs",
  description: "Answers to common questions about registering, ordering lesson books, paying with M-Pesa, refunds and pickup with HHES Kenya." });

export default function FaqsPage() {
  const categories = getFaqs();

  // Lets search engines show the questions directly in results
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categories.flatMap((c) => c.faqs).map((x) => ({
      "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a.replace(/\n\n/g, " ") },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <PageHero crumb="FAQs" title="Frequently asked questions"
        intro="Quick answers about registering, ordering, paying with M-Pesa, refunds and collecting your lesson books." />

      <div className="mx-auto max-w-[900px] px-5 py-14 sm:px-8 sm:py-16">
        <FaqBrowser categories={categories} />

        <section className="mt-16 rounded-card border border-line bg-panel px-6 py-10 text-center sm:px-10">
          <h2 className="font-sans text-2xl font-semibold text-ink">Still need help?</h2>
          <p className="mx-auto mt-3 max-w-[480px] text-base leading-relaxed text-muted">Can't find your answer? Send us a message and include your order reference or M-Pesa receipt number if you have one.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={NAV.contact} className={buttonStyles()}>Contact Centre</Link>
            <Link href={NAV.orderingGuide} className={buttonStyles({ variant: "outline" })}>Read the Ordering Guide</Link>
          </div>
        </section>
      </div>
    </>
  );
}