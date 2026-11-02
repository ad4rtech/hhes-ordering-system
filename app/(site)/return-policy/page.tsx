import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, CircleCheck, Package, Undo2 } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { PageHero } from "@/components/site/PageHero";
import { PageToc } from "@/components/site/PageToc";
import { Callout } from "@/components/site/Callout";
import { B, Bullets, Topic } from "@/components/site/Prose";
import { RETURNS } from "@/lib/policies";
import { SITE } from "@/lib/site";
import { fmtDate } from "@/lib/utils/format";
import { NAV } from "@/lib/nav";
import { pageMeta } from "@/lib/seo";


export const metadata = pageMeta({ title: "Return Policy", path: "/return-policy",
  description: "How cancellations, refunds and problems with lesson book orders are handled by HHES Kenya." });

const TOC = [
  { id: "summary", label: "At a glance" },
  { id: "cancelling", label: "Cancelling and refunds" },
  { id: "process", label: "How refunds are processed" },
  { id: "collected", label: "After you collect your books" },
  { id: "payments", label: "Payment problems" },
  { id: "need", label: "What to send us" },
  { id: "contact", label: "Contact us" },
];

const GLANCE = [
  { icon: Banknote, title: "Pay only for what you order", body: "Nothing is charged until you approve the M-Pesa prompt on your own phone." },
  { icon: Undo2, title: "Cancel before pickup", body: "Cancel any time until your order is collected. If you've paid, a refund follows." },
  { icon: CircleCheck, title: "Lower total, partial refund", body: "Reduce your quantities on a paid order and the difference is refunded." },
  { icon: Package, title: "After pickup, contact us", body: "Collected orders are locked. If something is wrong, HHES looks into it." },
];

const CASES: [string, string][] = [
  ["Order placed, not paid yet", "Nothing has been charged, so there's nothing to refund. You can edit or cancel at any time before pickup."],
  ["Paid, and HHES hasn't packed it yet", "Cancel the order and the full amount you paid is refunded."],
  ["Paid and packed, waiting for collection", "You can still cancel until the books are collected, and the amount you paid is refunded. HHES has already packed them, so please tell us as soon as you know."],
  ["You reduce the quantities on a paid order", "The difference between what you paid and your new total is refunded."],
  ["You increase the quantities on a paid order", "You pay only the extra amount on the payment screen. There's no refund involved."],
  ["A payment goes through after you cancelled", "This can happen if the M-Pesa prompt was still open on your phone. The system flags it for refund automatically."],
  ["The quarter closes before you pay", "The order doesn't go ahead and nothing is charged."],
];

export default function ReturnPolicyPage() {
  const R = RETURNS;
  const set = R.acceptsReturnsAfterCollection !== null;

  return (
    <>
      <PageHero crumb="Return Policy" title="Return Policy" updated={fmtDate(R.lastUpdated)}
        intro="How cancellations, refunds and problems with your lesson book orders are handled." />

      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 sm:py-16">
        <ul id="summary" className="grid scroll-mt-24 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GLANCE.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-card border border-line bg-surface p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-white"><Icon size={20} aria-hidden /></span>
              <h2 className="mt-4 font-sans text-lg font-semibold text-ink">{title}</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-14 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside><PageToc items={TOC} /></aside>

          <div className="max-w-[820px] space-y-14">
            <Topic first id="cancelling" title="Cancelling an order and getting your money back">
              <p>Orders are paid in advance with M-Pesa, so most "returns" are really cancellations made <B>before pickup</B>. Here is what happens in each situation.</p>
              <div className="overflow-x-auto rounded-card border border-line bg-surface">
                <table className="w-full min-w-[560px] text-left">
                  <thead className="bg-panel"><tr><th className="px-5 py-3.5 text-[15px] font-semibold text-ink">Situation</th><th className="px-5 py-3.5 text-[15px] font-semibold text-ink">What happens</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {CASES.map(([a, b]) => (
                      <tr key={a}><td className="w-[38%] px-5 py-4 align-top text-[15px] font-medium text-ink">{a}</td><td className="px-5 py-4 align-top text-[15px]">{b}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Callout tone="warn" title="Cancelling closes your order for the quarter">
                <p>After you cancel, you can't place another order for the same quarter. If you still need books, contact HHES.</p>
              </Callout>
            </Topic>

            <Topic id="process" title="How refunds are processed">
              <Bullets items={[
                <><B>Your order shows "Refund pending"</B> with the amount, as soon as a refund becomes due.</>,
                <><B>HHES finance sends the money back</B> through the Safaricom portal. Refunds are handled by our finance team, not automatically.</>,
                <><B>You're told when it's done.</B> The order is updated, and a notice appears on the bell in your top bar.</>,
              ]} />
              <p>Refunds go back through M-Pesa. If the number you paid with is no longer in use, contact us before the refund is processed.</p>
              <p>Haven't seen your refund? Contact us with your order reference and we'll check it straight away.</p>
            </Topic>

            <Topic id="collected" title="After you collect your books">
              <p>Once HHES marks an order as <B>collected</B>, it's complete and locked in our records. The system can't undo a pickup, so problems with collected books are handled by HHES directly.</p>

              {R.acceptsReturnsAfterCollection === true && (
                <>
                  <p>HHES accepts returns of collected books{R.windowDays ? <> within <B>{R.windowDays} days</B> of collection</> : ""}{R.condition ? <>, provided they are <B>{R.condition}</B></> : ""}.</p>
                  {R.returnCostBy && <p>{R.returnCostBy === "hhes" ? "HHES covers the cost of returns and replacements." : "Your organisation covers the cost of returning books."}</p>}
                  <p>To start a return, contact us with your order reference and tell us what you'd like to return and why.</p>
                </>
              )}
              {R.acceptsReturnsAfterCollection === false && (
                <p>HHES doesn't accept returns of books that have been collected. If something is wrong with your books, such as damaged copies or quantities that don't match your order, contact us so HHES can look into it.</p>
              )}
              {!set && (
                <>
                  <p>Each situation is different, so HHES looks at problems with collected books <B>case by case</B>. If something is wrong, such as damaged books or quantities that don't match your order, contact us as soon as you notice, with your order reference and a description of what you received.</p>
                  <Callout tone="tip" title="Check your books when you collect them"><p>Opening the packs at the counter and checking the categories and quantities against your order is the quickest way to put any problem right.</p></Callout>
                  {process.env.NODE_ENV !== "production" && (
                    <p className="rounded-field border border-dashed border-line-strong px-4 py-3 text-sm">
                      <B>Admin note (development only):</B> HHES hasn't set its book-return terms yet. Edit <code className="font-mono">lib/policies.ts</code> and this section will update.
                    </p>
                  )}
                </>
              )}
            </Topic>

            <Topic id="payments" title="Payment problems">
              <Bullets items={[
                <><B>Paid twice or too much.</B> If more than the amount due is received, the extra is flagged for refund automatically. If you notice it first, contact us with both M-Pesa receipt numbers.</>,
                <><B>Money left your M-Pesa but your order shows unpaid.</B> Wait a few minutes, as the page updates by itself. If it doesn't, contact us with your M-Pesa receipt number. HHES checks the payment and confirms it, and you don't need to pay again.</>,
                <><B>The prompt failed but you were charged.</B> Send us the M-Pesa message you received and we'll check it against our records.</>,
              ]} />
            </Topic>

            <Topic id="need" title="What to send us">
              <p>The more of this you include, the faster we can help:</p>
              <Bullets items={[
                <>Your <B>organisation's name</B> and a contact phone number.</>,
                <>The <B>order reference</B> (like HHES-A1B2C3D4).</>,
                <>For anything about money: the <B>M-Pesa receipt number</B> and the amount.</>,
                <>A short description of what went wrong or what you'd like us to do.</>,
              ]} />
            </Topic>

            <Topic id="contact" title="Contact us">
              <p>Send us a message and we'll reply by email{SITE.hours ? <>, or visit during office hours ({SITE.hours})</> : ""}. This policy doesn't affect any rights you have under the laws of Kenya, and we may update it from time to time. The current version is always on this page.</p>
              <div className="flex flex-wrap gap-3">
                <Link href={NAV.contact} className={buttonStyles()}>Contact Centre</Link>
                <Link href={NAV.faqs} className={buttonStyles({ variant: "outline" })}>FAQs</Link>
                <Link href={NAV.orderingGuide} className={buttonStyles({ variant: "outline" })}>Ordering Guide</Link>
              </div>
            </Topic>
          </div>
        </div>
      </div>
    </>
  );
}