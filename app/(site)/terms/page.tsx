import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CircleCheck, KeyRound, Smartphone } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { PageHero } from "@/components/site/PageHero";
import { PageToc } from "@/components/site/PageToc";
import { Callout } from "@/components/site/Callout";
import { B, Bullets, Topic } from "@/components/site/Prose";
import { LEGAL, TERMS, legalAddress, legalName } from "@/lib/policies";
import { SITE } from "@/lib/site";
import { fmtDate } from "@/lib/utils/format";
import { NAV } from "@/lib/nav";
import { pageMeta } from "@/lib/seo";


export const metadata = pageMeta({ title: "Terms of Service", path: "/terms",
  description: "The terms for using HHES Kenya's online lesson ordering system: accounts, quarterly ordering, M-Pesa payment, cancellations, pickup and your responsibilities." });
  
const TOC = [
  { id: "about", label: "1. About these terms" },
  { id: "account", label: "2. Your account" },
  { id: "ordering", label: "3. Ordering and prices" },
  { id: "payment", label: "4. Payment" },
  { id: "changes", label: "5. Changes and cancellations" },
  { id: "pickup", label: "6. Pickup" },
  { id: "use", label: "7. Acceptable use" },
  { id: "service", label: "8. Our service and content" },
  { id: "suspension", label: "9. Suspension and ending" },
  { id: "availability", label: "10. Availability" },
  { id: "liability", label: "11. Our responsibility" },
  { id: "privacy", label: "12. Privacy" },
  { id: "updates", label: "13. Changes to these terms" },
  { id: "law", label: "14. Governing law" },
  { id: "general", label: "15. General" },
  { id: "contact", label: "16. Contact us" },
];

const GLANCE = [
  { icon: Building2, title: "Approved organisations only", body: "Accounts are for affiliated churches, schools and universities, and HHES approves each one." },
  { icon: CircleCheck, title: "Firm once paid", body: "Your order is secured when its M-Pesa payment is confirmed. You can still change it until it's ready for pickup." },
  { icon: Smartphone, title: "Pay with M-Pesa", body: "One M-Pesa payment per order. No cash, bank transfers or instalments." },
  { icon: KeyRound, title: "Keep your login safe", body: "Your organisation is responsible for everything done through its account." },
];

export default function TermsPage() {
  const name = legalName();
  const email = SITE.email;
  const dev = process.env.NODE_ENV !== "production";
  const defaults = [
    TERMS.disputeCity === null && "court location (using the courts of Kenya)",
    TERMS.uncollectedHoldDays === null && "how long uncollected orders are held (no promise made)",
    !LEGAL.legalName && "the full legal name",
  ].filter(Boolean) as string[];

  return (
    <>
      <PageHero crumb="Terms of Service" title="Terms of Service" updated={fmtDate(TERMS.lastUpdated)}
        intro="The terms for using HHES Kenya's online lesson ordering system. Please read them before you register or place an order." />

      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 sm:py-16">
        {dev && defaults.length > 0 && (
          <p className="mb-10 rounded-field border border-dashed border-line-strong px-5 py-4 text-sm leading-relaxed text-muted">
            <B>Admin note (development only):</B> default wording is in use for: {defaults.join("; ")}. Set them in <code className="font-mono">lib/policies.ts</code> when HHES decides.
          </p>
        )}

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
            <Topic first id="about" title="1. About these terms">
              <p>These terms are an agreement between <B>{name}</B> ("HHES", "we", "us"), of {legalAddress()}, and the organisation that registers to use our online lesson ordering system and this website ("you" or "your organisation"). They cover the whole service: registering, browsing the catalogue, ordering, paying, changing or cancelling orders, and collecting books.</p>
              <p>By registering, signing in or placing an order, you agree to these terms, together with our <Link href={NAV.privacy} className="text-primary hover:underline">Privacy Policy</Link> and <Link href={NAV.returnPolicy} className="text-primary hover:underline">Return Policy</Link>, which form part of them. If you don't agree, please don't use the service.</p>
              <p>The system is for affiliated <B>churches, schools and universities</B>. The person who registers confirms that they're authorised to act for the organisation and to bind it to these terms.</p>
            </Topic>

            <Topic id="account" title="2. Your account">
              <Bullets items={[
                <>Each organisation has <B>one account</B>, held by a named contact person. Keep the contact details up to date.</>,
                <>You must give <B>accurate and complete information</B> when you register and afterwards.</>,
                <>HHES <B>reviews and approves</B> every registration. You can't sign in, see prices or place orders until it's approved, and HHES may refuse a registration.</>,
                <>Keep your password secret and choose a strong one. Your organisation is <B>responsible for everything done through its account</B>, including by anyone you share it with.</>,
                <>Tell us straight away if you think someone has used your account without permission, and change your password.</>,
                <>Your organisation's name and type are set by HHES when it approves you. Contact us if they need to change.</>,
              ]} />
            </Topic>

            <Topic id="ordering" title="3. Quarters, ordering and prices">
              <Bullets items={[
                <><B>Order windows.</B> HHES opens an order window each quarter, with an opening date and a deadline. Ordering, changes and payment close at <B>11:59 PM Nairobi time</B> on the deadline day. After that the system won't accept new orders, changes or payments.</>,
                <><B>Extensions.</B> HHES may grant an extension to a particular organisation. It's entirely HHES's choice, it's recorded with a reason, and it applies only to the organisation it's granted to.</>,
                <><B>One order per quarter.</B> Each organisation places one order per quarter, for at least one book. To change it, edit the order instead of placing a new one.</>,
                <><B>Stock.</B> You can order up to the stock available, and stock is allocated <B>first come, first served</B> as orders are placed. Availability shown is a guide that can change as others order. While your order waits for payment its books are set aside for you, but HHES only packs paid orders, and an order that isn't paid by the deadline doesn't go ahead.</>,
                <><B>Prices.</B> Prices are in Kenya shillings, are the same for every organisation, are set by HHES for each quarter, and are fixed once the quarter is published. Your total is the quantities you order multiplied by the prices shown when you place the order.</>,
                <><B>Order references.</B> Every order gets a reference (like HHES-A1B2C3D4). Please quote it when you contact us.</>,
              ]} />
            </Topic>

            <Topic id="payment" title="4. Payment">
              <Bullets items={[
                <><B>M-Pesa only.</B> Each order is paid in a single M-Pesa payment for the amount due, plus any top-up if you increase an order you've already paid for. HHES doesn't accept cash at the counter, bank transfers or instalments.</>,
                <><B>How it works.</B> You confirm a Safaricom number and approve a prompt on that phone with your PIN. You must be allowed to use the number you pay from, and you must never share your PIN. We never see it.</>,
                <><B>Confirmation.</B> An order is paid when Safaricom confirms the payment to us. If the confirmation doesn't reach us automatically, HHES may check the payment on its Paybill statement and confirm it manually, and you can help by sending your M-Pesa receipt number.</>,
                <><B>Failed payments.</B> If a payment fails or times out, your order stays saved and you can retry before the deadline. You're not charged for a failed payment.</>,
                <><B>Mistakes.</B> If you pay twice or pay too much, tell us. The extra amount is refunded.</>,
                <><B>Safaricom's terms.</B> Your use of M-Pesa is also governed by Safaricom's own terms and tariffs, which HHES doesn't control.</>,
              ]} />
            </Topic>

            <Topic id="changes" title="5. Changes, cancellations and refunds">
              <Bullets items={[
                <><B>Changing an order.</B> While the quarter is open, you can edit an order until HHES marks it ready for pickup. If you've paid and the new total is higher, you pay the difference. If it's lower, the difference is refunded.</>,
                <><B>Cancelling.</B> You can cancel an order until it has been collected. If you had paid, you're refunded what you paid.</>,
                <><B>Refunds.</B> HHES finance processes refunds through the Safaricom portal, back through M-Pesa. Until then your order shows "Refund pending", and you're notified when it's done.</>,
              ]} />
              <Callout tone="warn" title="Cancelling closes your order for the quarter">
                <p>After you cancel, you can't place another order for the same quarter unless HHES agrees. Contact us if you need one.</p>
              </Callout>
              <p>More detail is in our <Link href={NAV.returnPolicy} className="text-primary hover:underline">Return Policy</Link>.</p>
            </Topic>

            <Topic id="pickup" title="6. Pickup">
              <Bullets items={[
                <>Books are <B>collected in person</B> at the HHES centre ({SITE.address}{SITE.hours ? `, ${SITE.hours}` : ""}). We don't deliver.</>,
                <>We tell you when a paid order is ready. Anyone you send must know the books are for your organisation and should bring the order reference.</>,
                <>Please check the books and quantities when you collect them. When HHES marks the order <B>collected</B>, it's complete and locked in our records. Problems with collected books are handled as set out in the Return Policy.</>,
                TERMS.uncollectedHoldDays
                  ? <>HHES holds a paid, packed order for <B>{TERMS.uncollectedHoldDays} days</B> after telling you it's ready. If you can't collect in that time, contact us before it passes.</>
                  : <>Please collect promptly once your order is ready. If you can't, contact us so we can arrange a time.</>,
              ]} />
            </Topic>

            <Topic id="use" title="7. Acceptable use">
              <p>You agree that you and your representatives will not:</p>
              <Bullets items={[
                <>give false or misleading information, or pretend to be another organisation or person;</>,
                <>use another organisation's account, or let someone outside your organisation use yours;</>,
                <>use the service to commit fraud, for example by paying with an M-Pesa number you aren't allowed to use;</>,
                <>try to get around limits such as deadlines, stock or the one-order rule, or place orders you don't intend to collect;</>,
                <>access, change or interfere with parts of the system or other people's data that you're not meant to reach, or probe or attack its security;</>,
                <>use bots, scraping or other automated means to use the service, or overload it;</>,
                <>send spam or abusive messages through the Contact Centre.</>,
              ]} />
            </Topic>

            <Topic id="service" title="8. Our service and content">
              <p>The website and the ordering system belong to HHES (or its licensors). We give your organisation a limited, non-transferable right to use them for its own lesson book ordering, as these terms allow. The lesson books and their content belong to their owners and publishers, and these terms don't transfer any rights in them. Please don't copy, resell or reuse the system or its content without our permission.</p>
            </Topic>

            <Topic id="suspension" title="9. Suspension and ending your account">
              <p>HHES may refuse a registration, or suspend or deactivate an account, if:</p>
              <Bullets items={[
                <>information given was false or misleading;</>,
                <>these terms have been broken;</>,
                <>the account has been misused, or we reasonably suspect fraud or a security risk;</>,
                <>the organisation is no longer affiliated with HHES; or</>,
                <>the law requires it.</>,
              ]} />
              <p>When we can, we'll tell you why and tell you what it means for any open order. A deactivated organisation can't sign in or place orders, but its records stay in the system (see the Privacy Policy). You can stop using the service at any time, and you can ask us to close your account by contacting us.</p>
            </Topic>

            <Topic id="availability" title="10. Availability and changes to the service">
              <p>We aim to keep the service available, but we can't promise it will always be uninterrupted or error-free. It may be unavailable during maintenance or because of problems outside our control, including internet, hosting, email or Safaricom M-Pesa outages. We may improve, change or stop parts of the service, and we'll give reasonable notice of significant changes where we can.</p>
            </Topic>

            <Topic id="liability" title="11. Our responsibility to you">
              <p>Nothing in these terms limits or excludes any liability that can't be limited or excluded by law, including liability for fraud or fraudulent misrepresentation, or for death or personal injury caused by negligence. Nor does it take away rights you have under Kenyan law.</p>
              {TERMS.limitLiability ? (
                <>
                  <p>Subject to that, to the fullest extent the law allows:</p>
                  <Bullets items={[
                    <>HHES is <B>not liable</B> for indirect or consequential loss, or for loss of profit, income or opportunity, arising from your use of the service; and</>,
                    <>HHES's total liability for any claim relating to an order is <B>limited to the amount you paid for that order</B>.</>,
                  ]} />
                </>
              ) : (
                <p>HHES will take reasonable care in running the service and in handling your orders and payments.</p>
              )}
              <p>You're responsible for the accuracy of the quantities you order and for the actions of anyone using your account.</p>
            </Topic>

            <Topic id="privacy" title="12. Privacy">
              <p>We handle personal information as described in our <Link href={NAV.privacy} className="text-primary hover:underline">Privacy Policy</Link>. By using the service you confirm that you've read it, and that you have the right to give us the personal details of the people you register, such as your contact person.</p>
            </Topic>

            <Topic id="updates" title="13. Changes to these terms">
              <p>We may update these terms. When we do, we'll change the "Last updated" date above, and for significant changes we'll tell organisations, for example by email or a notice in the system. If you keep using the service after a change takes effect, you accept the updated terms. Changes don't affect orders you've already placed.</p>
            </Topic>

            <Topic id="law" title="14. Governing law and disputes">
              <p>These terms are governed by the <B>laws of Kenya</B>. If you have a complaint, please contact us first so that we can try to put it right. If it can't be settled by talking, the matter may be taken to {TERMS.disputeCity ? <>the <B>courts of {TERMS.disputeCity}, Kenya</B></> : <>the <B>courts of Kenya</B></>}.</p>
            </Topic>

            <Topic id="general" title="15. General">
              <Bullets items={[
                <>These terms, the Privacy Policy and the Return Policy are the whole agreement between us about the service.</>,
                <>If part of these terms turns out to be unenforceable, the rest still applies.</>,
                <>If we don't enforce a term straight away, that doesn't mean we've given it up.</>,
                <>You can't transfer your account or your rights under these terms to anyone else.</>,
                <>We'll send notices to your contact email address or show them in the system, so please keep that address up to date.</>,
              ]} />
            </Topic>

            <Topic id="contact" title="16. Contact us">
              <p>Questions about these terms? Contact us through the Contact Centre{email ? <> or at <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a></> : ""}{SITE.phone ? <>, or call {SITE.phone}</> : ""}.</p>
              <div className="flex flex-wrap gap-3">
                <Link href={NAV.contact} className={buttonStyles()}>Contact Centre</Link>
                <Link href={NAV.privacy} className={buttonStyles({ variant: "outline" })}>Privacy Policy</Link>
                <Link href={NAV.returnPolicy} className={buttonStyles({ variant: "outline" })}>Return Policy</Link>
              </div>
            </Topic>
          </div>
        </div>
      </div>
    </>
  );
}