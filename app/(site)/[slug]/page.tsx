import { notFound } from "next/navigation";

const KNOWN: Record<string, string> = {
  "ordering-guide": "Ordering Guide", contact: "Contact Centre", faqs: "FAQs",
  "return-policy": "Return Policy", help: "Help and Support", privacy: "Privacy Policy", terms: "Terms of Service",
};

export default async function ComingSoon({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = KNOWN[slug];
  if (!title) notFound();
  return (
    <div className="mx-auto max-w-[760px] px-5 py-24 text-center sm:px-8">
      <h1 className="text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
      <p className="mt-4 text-base text-muted">This page is coming soon.</p>
    </div>
  );
}