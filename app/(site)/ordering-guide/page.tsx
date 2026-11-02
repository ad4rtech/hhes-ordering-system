import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Check, CalendarClock, Smartphone, Store, Users } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { RepStatusBadge } from "@/components/rep/StatusBadge";
import { PageHero } from "@/components/site/PageHero";
import { PageToc } from "@/components/site/PageToc";
import { Callout } from "@/components/site/Callout";
import { NAV } from "@/lib/nav";
import { pageMeta } from "@/lib/seo";


export const metadata = pageMeta({ title: "Ordering Guide", path: "/ordering-guide",
  description: "A step-by-step guide for affiliated churches, schools and universities: register, order lesson books, pay with M-Pesa, amend or cancel, and collect from HHES." });

const ADDRESS = process.env.HHES_ADDRESS ?? "the HHES centre";
const HOURS = process.env.HHES_OFFICE_HOURS ?? "";
const PHONE = process.env.HHES_PHONE ?? "";

const TOC = [
  { id: "register", label: "1. Register" },
  { id: "approval", label: "2. Get approved" },
  { id: "quarter", label: "3. Check the quarter" },
  { id: "order", label: "4. Place your order" },
  { id: "pay", label: "5. Pay with M-Pesa" },
  { id: "changes", label: "6. Amend or cancel" },
  { id: "track", label: "7. Track your order" },
  { id: "collect", label: "8. Collect your books" },
  { id: "statuses", label: "Order statuses" },
  { id: "deadlines", label: "Deadlines" },
  { id: "refunds", label: "Payments and refunds" },
  { id: "help", label: "Need help?" },
];

const GLANCE = [
  { icon: Users, title: "Who can order", body: "Affiliated churches, schools and universities with an approved HHES account." },
  { icon: CalendarClock, title: "When", body: "Every quarter. HHES opens an order window with a fixed deadline." },
  { icon: Smartphone, title: "How you pay", body: "Online with M-Pesa, right after you place your order. No cash at the counter." },
  { icon: Store, title: "How you collect", body: "In person at the HHES centre. Delivery isn't offered." },
];

const STATUSES: { status: string; payment?: string; means: string; can: string }[] = [
  { status: "awaiting_payment", means: "Your order is saved and waiting for its M-Pesa payment.", can: "Pay now, edit, or cancel." },
  { status: "awaiting_payment", payment: "failed", means: "The last payment attempt wasn't completed. The order is still saved.", can: "Retry payment, edit, or cancel." },
  { status: "paid", means: "Payment received. HHES will pack your books.", can: "Edit or cancel." },
  { status: "ready_for_pickup", means: "Your books are packed and waiting for you at the HHES centre.", can: "Collect them, or cancel. It can't be edited any more." },
  { status: "collected", means: "You've collected the books. The order is complete and locked.", can: "View it in your order history." },
  { status: "cancelled", means: "The order was cancelled and won't be fulfilled.", can: "If you had paid, a refund follows. You can't place another order this quarter without contacting HHES." },
];

const b = (t: string) => <strong className="font-medium text-ink">{t}</strong>;

function Step({ n, id, title, children }: { n: number; id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-white">{n}</span>
        <h2 className="pt-1.5 text-2xl font-bold text-ink sm:text-[28px]">{title}</h2>
      </div>
      <div className="mt-5 space-y-4 text-base leading-relaxed text-muted sm:pl-[60px]">{children}</div>
    </section>
  );
}

function Topic({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-12">
      <h2 className="text-2xl font-bold text-ink sm:text-[28px]">{title}</h2>
      <div className="mt-5 space-y-4 text-base leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3"><Check size={18} className="mt-1 shrink-0 text-positive" aria-hidden /><span>{t}</span></li>
      ))}
    </ul>
  );
}

export default function OrderingGuidePage() {
  return (
    <>
      <PageHero crumb="Ordering Guide" title="How to order your quarterly lesson books"
        intro="Everything an organisation needs to register, place an order, pay with M-Pesa, make changes, and collect its books from HHES. It takes a few minutes to get started.">
        <Link href={NAV.register} className={buttonStyles()}>Register Organisation</Link>
        <Link href={NAV.login} className={buttonStyles({ variant: "outline" })}>Organisation Sign In</Link>
      </PageHero>

      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 sm:py-16">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
            <Step n={1} id="register" title="Register your organisation">
              <p>You only do this once. Choose <strong className="font-medium text-ink">Register Organisation</strong> and enter:</p>
              <Bullets items={[
                <>The organisation's {b("official name")}, so HHES can match it to its records.</>,
                <>Whether it is a {b("church, university or school")}.</>,
                <>The {b("contact person's name and email")}. HHES sends order confirmations, receipts and updates to this address, so use one that is checked often.</>,
                <>A {b("password")} of at least 10 characters with upper and lower case letters and a number. A strength meter helps, and your browser can suggest a strong one.</>,
              ]} />
              <p>Prefer to use a Google account? Choose {b("Continue with Google")}, then tell us your organisation's name and type.</p>
            </Step>

            <Step n={2} id="approval" title="Get approved and sign in">
              <p>HHES reviews every registration before access is given, so you can't sign in or see prices until your account is approved. We email you as soon as it is. If something needs fixing, the email explains why.</p>
              <p>Once approved, sign in with the {b("Organisation Sign In")} button. If you forget your password, use {b("Forgot password?")} to get a reset link.</p>
              <Callout title="Signing in before approval?">You'll see an "Awaiting approval" message. Nothing is wrong. Wait for HHES's email.</Callout>
            </Step>

            <Step n={3} id="quarter" title="Check the quarter and the catalogue">
              <p>Each quarter HHES opens an {b("order window")} with an open date and a deadline. Your dashboard shows it in a banner with the days remaining, which turns orange as the deadline nears. We also email you when a quarter opens, and again if the deadline is close and you haven't ordered and paid.</p>
              <p>The catalogue lists six categories: {b("Adults, Adults Double Quarter, Kindergarten, Primary, Cornerstone and Realtime")}.</p>
              <Bullets items={[
                <>{b("Prices are the same")} for every church, school and university, and they don't change during the quarter.</>,
                <>Each category shows {b("Available")}, {b("Low Stock")} or {b("Out of Stock")}, so you know what can still be ordered.</>,
              ]} />
            </Step>

            <Step n={4} id="order" title="Place your order">
              <p>Open {b("Place Order")} and enter a quantity for each category. Use whole numbers, and leave 0 for books you don't need. The summary shows your total items and the exact amount to pay.</p>
              <Bullets items={[
                <>You can order up to what is in stock. A Low Stock category shows how many are left, and an Out of Stock category can't be ordered.</>,
                <>Each organisation places {b("one order per quarter")}. To change it later, edit the order rather than placing another.</>,
                <>Press {b("Submit Order")}. You go straight to payment, and we email you a confirmation with your order reference (like HHES-A1B2C3D4).</>,
              ]} />
            </Step>

            <Step n={5} id="pay" title="Pay with M-Pesa">
              <p>Every order is paid online, so there is no cash to bring. After you submit:</p>
              <Bullets items={[
                <>{b("Confirm your number.")} Your saved M-Pesa number is filled in. Type a different Safaricom number if you need to, and tick the box to remember it.</>,
                <>{b("Send the payment request.")} A prompt for the exact order amount appears on that phone.</>,
                <>{b("Approve with your PIN.")} You enter the PIN on your own phone. HHES never sees or asks for it.</>,
                <>{b("That's it.")} The page updates by itself, shows your M-Pesa receipt number, and we email you a receipt.</>,
              ]} />
              <Callout tone="warn" title="If the payment doesn't go through">
                <p>You'll see why: cancelled, wrong PIN, not enough balance, or the prompt timed out. Your order stays saved. Press {b("Retry payment")}, or use a different number. If you wait about 90 seconds you can also resend the request. Please don't tap repeatedly.</p>
                <p>Paid but the order hasn't updated after a few minutes? HHES confirms it for you, and you don't need to pay again. If it still looks stuck, contact us with your M-Pesa receipt number.</p>
              </Callout>
              <p>Not ready to pay? Your order waits as {b("Awaiting Payment")}, and the {b("Pay now")} button on your dashboard brings you back. HHES only packs paid orders, and an order still unpaid when the quarter closes doesn't go ahead.</p>
            </Step>

            <Step n={6} id="changes" title="Amend or cancel your order">
              <p>{b("Editing.")} Choose {b("Edit Order")} on your dashboard or in My Orders. You can change quantities while the quarter is open and until HHES marks the order ready for pickup. We email you after every change.</p>
              <Bullets items={[
                <>If you've already paid and the new total is {b("higher")}, you pay the extra on the payment screen.</>,
                <>If the new total is {b("lower")}, the difference is refunded to you.</>,
              ]} />
              <p>{b("Cancelling.")} Choose {b("Cancel Order")} in My Orders and confirm. You can cancel until the order is collected. If you had paid, a refund follows (see Payments and refunds).</p>
              <Callout tone="warn" title="Cancelling closes your order for the quarter">After a cancellation you can't place a new order for the same quarter. If you need one, contact HHES.</Callout>
            </Step>

            <Step n={7} id="track" title="Track your order">
              <p>Your dashboard and My Orders show the current status and a timeline of everything that has happened. You're also told as things change, by email and by the bell icon in the top bar: payment received, ready for pickup, pickup confirmed, and refund processed.</p>
              <p>The {b("Reports")} page keeps your complete order history, quarter-on-quarter totals and an audit trail, and lets you download them as CSV or PDF for your own records.</p>
            </Step>

            <Step n={8} id="collect" title="Collect your books">
              <p>When your books are packed we tell you they're ready. Collect them in person at:</p>
              <div className="rounded-field border border-line bg-surface px-5 py-4 text-[15px]">
                <p className="font-medium text-ink">{ADDRESS}</p>
                {HOURS && <p className="mt-1">{HOURS}</p>}
                {PHONE && <p className="mt-1">Phone: {PHONE}</p>}
              </div>
              <p>Bring your order reference, and make sure the person collecting knows the books are for your organisation. HHES marks the order collected, you receive a pickup confirmation, and the order is locked as a permanent record.</p>
            </Step>

            <Topic id="statuses" title="Order statuses explained">
              <div className="overflow-x-auto rounded-card border border-line bg-surface">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="bg-panel">
                    <tr>{["Status", "What it means", "What you can do"].map((h) => <th key={h} className="px-5 py-3.5 text-[15px] font-semibold text-ink">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {STATUSES.map((s) => (
                      <tr key={`${s.status}-${s.payment ?? ""}`}>
                        <td className="px-5 py-4 align-top"><RepStatusBadge size="sm" status={s.status} payment={s.payment} /></td>
                        <td className="px-5 py-4 align-top text-[15px]">{s.means}</td>
                        <td className="px-5 py-4 align-top text-[15px]">{s.can}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Topic>

            <Topic id="deadlines" title="Deadlines and extensions">
              <p>Each quarter's deadline is firm. Ordering, payment and changes all close at {b("11:59 PM Nairobi time")} on the deadline day, and the system won't accept new orders or changes after that.</p>
              <p>If your organisation can't make it, contact HHES before the deadline. HHES can grant an {b("extension for your organisation")} on an exception basis and records the reason. When it does, your dashboard banner shows your new date, and that date applies to ordering, changes and payment.</p>
            </Topic>

            <Topic id="refunds" title="Payments and refunds">
              <Bullets items={[
                <>{b("M-Pesa is the only way to pay.")} The amount is exactly your order total, and cash isn't accepted at the counter.</>,
                <>Keep your M-Pesa receipt number. It's shown on your order and emailed to you.</>,
              ]} />
              <p>{b("When a refund applies.")} You cancel an order you have paid for, or you lower the quantities on a paid order.</p>
              <p>{b("How it works.")} HHES finance processes the refund through the Safaricom portal. Until then your order shows {b("Refund pending")}, and you get a notification when it has been processed. If you think a refund is outstanding, contact HHES with your order reference.</p>
            </Topic>

            <Topic id="help" title="Need help?">
              <p>Most questions are answered in the {b("FAQs")}. For anything else, our team is glad to help.</p>
              <div className="flex flex-wrap gap-3">
                <Link href={NAV.faqs} className={buttonStyles({ variant: "outline" })}>Read the FAQs</Link>
                <Link href={NAV.contact} className={buttonStyles({ variant: "outline" })}>Contact Centre</Link>
                <Link href={NAV.help} className={buttonStyles({ variant: "outline" })}>Help and Support</Link>
              </div>
            </Topic>
          </div>
        </div>
      </div>

      <section className="bg-primary px-5 py-16 text-center sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[640px]">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to place your first order?</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/90">Register your organisation today. It only takes a few minutes.</p>
          <Link href={NAV.register} className={`${buttonStyles({ variant: "outline" })} mt-8 border-transparent px-7`}>Register Organisation</Link>
        </div>
      </section>
    </>
  );
}