import type { Metadata } from "next";
import Link from "next/link";
import { Ban, ClipboardList, Smartphone, UserCheck } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { PageHero } from "@/components/site/PageHero";
import { PageToc } from "@/components/site/PageToc";
import { Callout } from "@/components/site/Callout";
import { B, Bullets, Table, Topic } from "@/components/site/Prose";
import { LEGAL, PRIVACY, legalAddress, legalName, privacyEmail } from "@/lib/policies";
import { SITE } from "@/lib/site";
import { fmtDate } from "@/lib/utils/format";
import { NAV } from "@/lib/nav";
import { pageMeta } from "@/lib/seo";



export const metadata = pageMeta({ title: "Privacy Policy", path: "/privacy",
  description: "How HHES Kenya collects, uses, shares and protects the personal information of organisations and their representatives who use its lesson ordering system." });

const TOC = [
  { id: "who", label: "Who we are" },
  { id: "collect", label: "What we collect" },
  { id: "use", label: "How we use it" },
  { id: "share", label: "Who we share it with" },
  { id: "mpesa", label: "M-Pesa payments" },
  { id: "cookies", label: "Cookies" },
  { id: "keep", label: "How long we keep it" },
  { id: "security", label: "Keeping it safe" },
  { id: "transfers", label: "Data outside Kenya" },
  { id: "rights", label: "Your rights" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact and complaints" },
];

const GLANCE = [
  { icon: ClipboardList, title: "Only what we need", body: "We collect the details needed to approve organisations, take orders, process payments and keep records." },
  { icon: Ban, title: "Never sold", body: "We don't sell your data, and we don't use it for advertising." },
  { icon: Smartphone, title: "Your PIN stays yours", body: "You approve M-Pesa payments on your own phone. HHES never sees your PIN." },
  { icon: UserCheck, title: "You're in control", body: "You can see, correct and ask about your data, and update most details yourself." },
];

export default function PrivacyPage() {
  const name = legalName();
  const email = privacyEmail();
  const missing = [
    !LEGAL.legalName && "the full legal name", !LEGAL.registeredAddress && "the registered address", !email && "a privacy contact email",
    !PRIVACY.odpcRegistration && "the ODPC registration number", !PRIVACY.databaseRegion && "the database region",
    PRIVACY.retentionYears === null && "the records retention period",
  ].filter(Boolean) as string[];

  return (
    <>
      <PageHero crumb="Privacy Policy" title="Privacy Policy" updated={fmtDate(PRIVACY.lastUpdated)}
        intro="How HHES Kenya collects, uses, shares and protects the personal information of organisations and their representatives who use the lesson ordering system." />

      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 sm:py-16">
        {process.env.NODE_ENV !== "production" && missing.length > 0 && (
          <p className="mb-10 rounded-field border border-dashed border-line-strong px-5 py-4 text-sm leading-relaxed text-muted">
            <B>Admin note (development only):</B> still to confirm in <code className="font-mono">lib/policies.ts</code>: {missing.join("; ")}. The page uses safe general wording until then.
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
            <Topic first id="who" title="Who we are">
              <p>This policy explains how <B>{name}</B> ("HHES", "we", "us") handles personal information when you use our online lesson ordering system and this website. HHES is the organisation responsible for deciding why and how your information is used, which Kenya's Data Protection Act, 2019 calls the <B>data controller</B>.</p>
              <div className="rounded-field border border-line bg-surface px-5 py-4 text-[15px]">
                <p className="font-medium text-ink">{name}</p>
                <p className="mt-1">{legalAddress()}</p>
                {email && <p className="mt-1">Email: <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a></p>}
                {PRIVACY.odpcRegistration && <p className="mt-1">Registered with the Office of the Data Protection Commissioner, number {PRIVACY.odpcRegistration}</p>}
              </div>
              <p>The system is used by organisations (churches, schools and universities) and their representatives, and by HHES staff who run it. This policy applies to all of them, and to people who send us a message through the website.</p>
            </Topic>

            <Topic id="collect" title="What we collect">
              <Table head={["What", "Examples", "Where it comes from"]} rows={[
                ["Organisation details", "Organisation name and type, location, general phone number", "You, when you register or edit your profile"],
                ["Contact person", "Name, email address, profile picture, default M-Pesa number", "You. If you sign in with Google, also your name and email from Google"],
                ["Sign-in details", "Your password (we keep it only in scrambled form and cannot read it), sign-in times and session information", "You, and our sign-in provider"],
                ["Orders", "Quantities, prices, totals, order reference and dates; any changes, cancellation and pickup", "You and HHES staff"],
                ["Payments", "The phone number paid from, amount, M-Pesa receipt number, date and time, and the result Safaricom reports", "You and Safaricom"],
                ["Messages", "What you send through the Contact Centre: name, email, optional phone and organisation, topic and message", "You"],
                ["Staff actions", "Who approved a registration, granted a deadline extension, confirmed a payment or marked an order collected, with times and reasons", "HHES staff"],
                ["Technical data", "IP address and browser details in hosting and security logs. When you send a contact message we also store a one-way scrambled form of your IP address to limit spam", "Collected automatically"],
                ["Past records", "Historical orders imported from HHES's earlier records, with the organisation's name and contact details if they were included", "HHES"],
              ]} />
              <p>You don't have to give us any of this, but without it we can't register your organisation, take orders or process payments.</p>
            </Topic>

            <Topic id="use" title="How we use it">
              <Table head={["Why", "What we use", "Our lawful basis"]} rows={[
                ["Register your organisation and manage your account", "Organisation details, contact person, sign-in details", "Carrying out the service you asked for. HHES's legitimate interest in checking that organisations are genuinely affiliated"],
                ["Take, change, pack and hand over orders, and manage stock", "Orders", "Performing our agreement with you"],
                ["Take payment, match M-Pesa receipts and process refunds", "Payments, orders", "Performing our agreement with you. Legal obligations to keep financial records"],
                ["Send order confirmations, receipts, reminders and pickup notices, by email and in the system", "Contact details, orders", "Performing our agreement with you. Our legitimate interest in keeping you informed"],
                ["Answer your messages", "Messages", "Your request. Our legitimate interest in replying"],
                ["Keep the service secure, stop spam and fraud, and fix problems", "Technical data, sign-in details", "Our legitimate interest in protecting the service and its users"],
                ["Plan procurement and report on demand by category and quarter", "Orders (mostly as totals)", "Our legitimate interest in running the service well"],
                ["Keep records for accounting, audit and legal claims", "Orders, payments, staff actions", "Legal obligations. Our legitimate interest in being able to resolve disputes"],
                ["Sign you in with Google, if you choose it", "Name and email from Google", "Your consent. You choose to use it each time"],
              ]} />
              <p>We don't sell your information and we don't use it for advertising. Reminder and notification emails are about your own orders and the quarter's deadlines.</p>
            </Topic>

            <Topic id="share" title="Who we share it with">
              <p>Within HHES, only authorised staff can see organisations' data, and each organisation can see only its own orders and payments. We use the following providers to run the service. Each receives only what it needs:</p>
              <Table head={["Provider", "What it does for us", "Information involved"]} rows={[
                ["Supabase", "Database, sign-in, storage of profile pictures and live updates", "Account, order and payment records"],
                ["Vercel", "Hosts this website and processes requests to it", "Requests, IP addresses and logs"],
                ["Resend", "Delivers our emails", "Recipient email address and the content of the email"],
                ["Safaricom (M-Pesa)", "Takes and confirms M-Pesa payments", "Phone number, amount and receipt number"],
                ["Google", "Sign-in, only if you choose Continue with Google", "Your name and email address"],
              ]} />
              <p>Supabase, Vercel and Resend act on our instructions. Safaricom and Google run their own services and handle your information under their own privacy notices.</p>
              <p>We may also disclose information when the law requires it, for example to a court, a regulator or the police, or to protect people's safety or our legal rights.</p>
            </Topic>

            <Topic id="mpesa" title="M-Pesa payments">
              <Bullets items={[
                <>When you press <B>Send payment request</B>, we send Safaricom your phone number and the amount due, so it can show the prompt on your phone.</>,
                <>You enter your <B>M-Pesa PIN on your own phone</B>. It goes to Safaricom and never reaches HHES.</>,
                <>Safaricom tells us whether the payment worked and gives us the <B>receipt number</B>. We keep this confirmation message as an audit record. It includes the phone number used.</>,
                <>In the system, phone numbers are partly hidden, for example 0712***678.</>,
              ]} />
            </Topic>

            <Topic id="cookies" title="Cookies and similar technologies">
              <p>We only use cookies that the service needs to work.</p>
              <Table head={["Cookie", "Purpose", "How long it lasts"]} rows={[
                [<span key="1" className="font-mono text-sm">sb-…-auth-token</span>, "Keeps you signed in (set by our sign-in provider, Supabase)", "While you're signed in"],
                [<span key="2" className="font-mono text-sm">sb-…-auth-token-code-verifier</span>, "Completes sign-in with Google securely", "A few minutes, until sign-in finishes"],
                [<span key="3" className="font-mono text-sm">hhes_mode, hhes_seen</span>, "Remember your \"Remember me\" choice and your last activity, so we can sign you out after a period of inactivity", "The browser session, or 30 days if you chose Remember me"],
              ]} />
              <p>We don't use advertising or analytics cookies, and we don't track you across other websites. If that changes, we'll update this page first. You can delete cookies in your browser at any time, but you'll then be signed out.</p>
            </Topic>

            <Topic id="keep" title="How long we keep it">
              <Bullets items={[
                <><B>Order, payment and staff-action records</B> are part of HHES's financial and audit records, so they aren't deleted in the ordinary course.{PRIVACY.retentionYears ? <> We keep them for at least <B>{PRIVACY.retentionYears} years</B>.</> : <> We keep them for as long as our accounting, audit and legal obligations require.</>}</>,
                <><B>Your account details</B> are kept while your organisation uses the system. If HHES deactivates an account, the record stays so that past orders remain accurate.</>,
                <><B>Contact messages</B> are kept as long as we need them to deal with your enquiry and to keep a record of what we told you.</>,
                <><B>Profile pictures</B> are deleted when you remove them.</>,
                <><B>Sign-in sessions</B> end automatically after inactivity or when you sign out. Our hosting and email providers keep logs for limited periods under their own settings.</>,
              ]} />
              <p>If you ask us to delete your information, we'll delete or anonymise what we can. We may have to keep order and payment records, and we'll tell you if so.</p>
            </Topic>

            <Topic id="security" title="Keeping it safe">
              <Bullets items={[
                <>Connections to this website are encrypted (HTTPS).</>,
                <>Passwords are stored only in scrambled form, must be strong, and you're signed out after inactivity. Changing your password signs you out on your other devices.</>,
                <>Access is limited by role. Each organisation sees only its own information, and HHES administrators use their wider access to run the service. Their actions are recorded.</>,
                <>M-Pesa credentials are kept on our servers and never reach your browser, and we never see your PIN.</>,
                <>Administrator accounts are created by invitation, using single-use links.</>,
              ]} />
              <p>No system is completely secure. If a security incident affects your information, we'll tell you and the Data Protection Commissioner as the law requires.</p>
            </Topic>

            <Topic id="transfers" title="Data outside Kenya">
              <p>Our database is hosted by Supabase{PRIVACY.databaseRegion ? <> in <B>{PRIVACY.databaseRegion}</B></> : ""}, and some other providers, such as those that host this website and send our emails, may process information in other countries. We choose providers that apply appropriate safeguards, and we share only what each one needs to do its job.</p>
            </Topic>

            <Topic id="rights" title="Your rights">
              <p>Under Kenya's Data Protection Act, 2019 you have the right, in the circumstances the Act sets out, to:</p>
              <Bullets items={[
                <>be <B>told</B> how your information is used (this policy does that);</>,
                <><B>see</B> the personal information we hold about you;</>,
                <>ask us to <B>correct</B> information that is wrong or misleading;</>,
                <>ask us to <B>delete</B> information that is false or misleading, or that we no longer have a lawful reason to keep;</>,
                <><B>object</B> to some or all of the ways we use your information;</>,
                <>ask for a <B>copy</B> of the information you gave us in a usable format.</>,
              ]} />
              <p><B>Doing it yourself.</B> Signed-in organisations can update their contact person, phone, location and default M-Pesa number in Organisation Profile, change their sign-in email, remove their picture, and download their order history as CSV or PDF from Reports.</p>
              <p><B>Asking us.</B> For anything else, write to us at {email ? <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a> : "the Contact Centre"} and tell us what you'd like. We may ask you to confirm who you are before acting on a request about an account. We'll reply as quickly as we can, and within the time the law allows. We'll tell you if we can't do what you ask, and why.</p>
            </Topic>

            <Topic id="children" title="Children">
              <p>The system is for organisations and their adult representatives. We don't knowingly collect information from children.</p>
            </Topic>

            <Topic id="changes" title="Changes to this policy">
              <p>We'll update this page when our practices change, and change the "Last updated" date above. For significant changes, we'll let organisations know, for example by email or a notice in the system.</p>
            </Topic>

            <Topic id="contact" title="Contact and complaints">
              <p>Questions about this policy or your information? Contact us{email ? <> at <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a></> : ""} or through the Contact Centre{SITE.phone ? <>, or call {SITE.phone}</> : ""}.</p>
              <p>If you're not happy with how we've handled your information, you also have the right to complain to Kenya's <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Office of the Data Protection Commissioner</a>. We'd appreciate the chance to put things right first.</p>
              <Callout title="This policy doesn't replace the law"><p>It explains how we handle your information in practice. Your rights under the laws of Kenya apply whether or not they're repeated here.</p></Callout>
              <div className="flex flex-wrap gap-3">
                <Link href={NAV.contact} className={buttonStyles()}>Contact Centre</Link>
                <Link href={NAV.terms} className={buttonStyles({ variant: "outline" })}>Terms of Service</Link>
                <Link href={NAV.faqs} className={buttonStyles({ variant: "outline" })}>FAQs</Link>
              </div>
            </Topic>
          </div>
        </div>
      </div>
    </>
  );
}