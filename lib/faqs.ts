import "server-only";
import { SITE } from "@/lib/site";
import { idleSeconds } from "@/lib/auth/flags";
import { NAV } from "@/lib/nav";

export type Faq = { id: string; q: string; a: string; steps?: string[]; links?: { label: string; href: string }[] };
export type FaqCategory = { id: string; title: string; faqs: Faq[] };

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const f = (q: string, a: string, links?: Faq["links"]): Faq => ({ id: slug(q), q, a, links });

export function getFaqs(): FaqCategory[] {
  const idleMin = Math.round(idleSeconds() / 60);
  const idle = idleMin % 60 === 0 ? `${idleMin / 60} ${idleMin === 60 ? "hour" : "hours"}` : `${idleMin} minutes`;
  const where = [SITE.address, SITE.hours].filter(Boolean).join(". ");

  return [
    {
      id: "getting-started", title: "Getting started",
      faqs: [
        f("Who can order lesson books through this system?",
          "Organisations affiliated with HHES: churches, schools and universities. Each account represents one organisation. It registers once, HHES approves it, and its representative then places the orders."),
        f("How do I register my organisation?",
          "Choose Register Organisation, enter your organisation's official name and type, the contact person's name and email, and create a password. You can also continue with Google. After you submit, HHES reviews the registration.",
          [{ label: "Register Organisation", href: NAV.register }, { label: "Ordering Guide", href: NAV.orderingGuide }]),
        f("Why can't I sign in after registering?",
          "New accounts must be approved by HHES first. Until then you'll see an \"Awaiting approval\" message when you try to sign in. We email you as soon as your account is approved."),
        f("How long does approval take?",
          "HHES reviews each registration and emails you the result. If you haven't heard back and your quarter's deadline is getting close, contact us so we can look at it straight away.",
          [{ label: "Contact Centre", href: NAV.contact }]),
        f("My registration was rejected. What now?",
          "The email we sent explains why. Contact HHES, and once the details are sorted out we can review it again. You don't need to register a second time.",
          [{ label: "Contact Centre", href: NAV.contact }]),
        f("Can several people from our organisation use one account?",
          "Each organisation has one account, held by its contact person. If the representative changes, update the contact name in Organisation Profile. To change the sign-in email, use Change next to your email there. Share the login only with people authorised to order for your organisation."),
        f("Can I sign in with Google?",
          "Yes. Choose Continue with Google on the register or sign-in page. New organisations then enter their organisation's name and type, and HHES approves them in the same way. If you signed up with Google, you can add a password later in Organisation Profile."),
        f("What are the password rules?",
          "At least 10 characters, with upper and lower case letters and a number. Common passwords, and passwords containing your name, email or organisation's name, are refused. A strength meter shows how you're doing, and most browsers can suggest a strong password for you."),
        f("I forgot my password.",
          "Choose Forgot password? on the sign-in page and enter your email. We send a link to set a new one. The link works once and expires after a while, so request a new one if it stops working.",
          [{ label: "Reset your password", href: NAV.forgotPassword }]),
      ],
    },
    {
      id: "quarters", title: "Quarters, deadlines and prices",
      faqs: [
        f("When can I place an order?",
          "HHES opens an order window each quarter, with an opening date and a deadline. Your dashboard shows the current window and how many days remain, and we email you when a new quarter opens."),
        f("What happens when the deadline passes?",
          "The deadline ends at 11:59 PM Nairobi time on the day. After that, new orders, changes and payments are no longer accepted. Shortly before the deadline we email a reminder to organisations that haven't ordered and paid yet."),
        f("Can HHES extend the deadline for my organisation?",
          "In exceptional cases, yes. Contact HHES before the deadline and explain why. If an extension is granted, your dashboard shows your new date, and it applies to ordering, changes and payment.",
          [{ label: "Contact Centre", href: NAV.contact }]),
        f("Which lesson books can I order?",
          "Six categories: Adults, Adults Double Quarter, Kindergarten, Primary, Cornerstone and Realtime. You can order any combination of them each quarter."),
        f("Are prices the same for everyone?",
          "Yes. Prices are the same for every church, school and university, and they're fixed for the whole quarter. The catalogue shows them in Kenya shillings per unit."),
        f("What do Available, Low Stock and Out of Stock mean?",
          "They show how many books of a category are left after everyone's orders. Low Stock means only a few remain, and the order form tells you how many. Out of Stock means none are left to order. If another organisation cancels, those books become available again."),
        f("Is there a minimum or maximum order?",
          "You must order at least one book. There's no other minimum. The most you can order in a category is what is currently in stock."),
        f("Can I place more than one order in a quarter?",
          "No. Each organisation places one order per quarter. If you need to change it, edit your existing order instead."),
      ],
    },
    {
      id: "orders", title: "Placing and changing orders",
      faqs: [
        f("How do I place an order?",
          "Open Place Order, enter a quantity for each category you need, and press Submit Order. You go straight to payment, and we email you a confirmation with your order reference.",
          [{ label: "Ordering Guide", href: NAV.orderingGuide }]),
        f("How do I know my order went through?",
          "It appears in My Orders and on your dashboard with a reference like HHES-A1B2C3D4, and we email you a confirmation. Your order is secured once it's paid."),
        f("Can I change my order after submitting it?",
          "Yes. Use Edit Order while the quarter is open and until HHES marks your order ready for pickup. If you've already paid, you pay the extra for a higher total, or a refund is arranged for a lower one. We email you after every change."),
        f("Why can't I edit my order?",
          "Orders can't be edited once they're ready for pickup, collected or cancelled, or after the quarter's deadline has passed. Contact HHES if you need help with an order that's locked.",
          [{ label: "Contact Centre", href: NAV.contact }]),
        f("Can I cancel an order?",
          "Yes, until it has been collected. Choose Cancel Order in My Orders and confirm. If you had paid, a refund follows. After cancelling you can't place another order for the same quarter. Contact HHES if you need one."),
      ],
    },
    {
      id: "payments", title: "Paying with M-Pesa",
      faqs: [
        f("How do I pay for my order?",
          "Payment is by M-Pesa. After you submit your order, confirm the Safaricom number to pay with and press Send payment request. A prompt for the exact amount appears on that phone. Enter your M-Pesa PIN to approve it. The page updates by itself, and we email you a receipt."),
        f("Which M-Pesa number can I use?",
          "Any Safaricom M-Pesa number you control, not only your organisation's. Your saved number is filled in for you, and you can tick a box to remember a different one."),
        f("I didn't receive the payment prompt.",
          "Check that the phone is on and has network, then wait a moment. You can resend the request after about 90 seconds, or choose a different number. Please don't tap repeatedly: a second request is blocked while one is waiting."),
        f("My payment failed. Do I lose my order?",
          "No. Your order stays saved and waiting for payment. The page tells you what happened (cancelled, wrong PIN, not enough balance or timed out) and you can retry. Please pay before the deadline."),
        f("I paid, but my order still shows unpaid.",
          "Give it a few minutes. The page and your dashboard update by themselves, and we check with M-Pesa for you. If it still hasn't updated, HHES confirms the payment manually. You don't need to pay again. If you're worried, contact us with your M-Pesa receipt number.",
          [{ label: "Contact Centre", href: NAV.contact }]),
        f("Can I pay in instalments, by bank transfer or in cash?",
          "No. Each order is paid in one M-Pesa payment for the amount due, and M-Pesa is the only payment method. HHES doesn't accept cash at the counter."),
        f("Does HHES see my M-Pesa PIN?",
          "Never. You enter your PIN on your own phone, and Safaricom handles the payment. HHES only receives confirmation that it succeeded, together with its receipt number."),
        f("Where can I find my M-Pesa receipt number?",
          "On your order in My Orders, on the confirmation screen after paying, and in the payment email we send you."),
      ],
    },
    {
      id: "refunds", title: "Refunds",
      faqs: [
        f("When would I get a refund?",
          "When you cancel an order you've paid for, or you reduce the quantities on a paid order so the new total is lower."),
        f("How do refunds work?",
          "HHES finance processes the refund through the Safaricom portal. Until then your order shows Refund pending, and you're notified when it has been processed. If you think a refund is outstanding, contact us with your order reference.",
          [{ label: "Contact Centre", href: NAV.contact }]),
        f("What if I increase my order after paying?",
          "You pay only the difference. The payment screen shows the extra amount due."),
      ],
    },
    {
      id: "pickup", title: "Pickup",
      faqs: [
        f("How do I get my books?",
          `In person at the HHES centre. Delivery isn't offered.${where ? ` ${where}.` : ""}`),
        f("How will I know my order is ready?",
          "We email you, and a notice appears on the bell icon in your top bar, when your order is marked ready for pickup. Only paid orders are prepared."),
        f("Can someone else collect on our behalf?",
          "Yes, a person your organisation sends can collect. Make sure they know the books are for your organisation and bring the order reference. If you have special arrangements, contact HHES first.",
          [{ label: "Contact Centre", href: NAV.contact }]),
      ],
    },
    {
      id: "account", title: "Account and security",
      faqs: [
        f("How do I update my organisation's details?",
          "In Organisation Profile you can change the contact person, phone number, location, default M-Pesa number and profile picture. Your organisation's name and type are set by HHES, so contact us if they need changing."),
        f("How do I change my sign-in email?",
          "Open Organisation Profile and choose Change next to your email. Enter your password and the new address. We send confirmation links to both your old and new address, and you open both to finish."),
        f("How long do I stay signed in?",
          `If you tick Remember me you stay signed in for 30 days. Otherwise you're signed out after about ${idle} of inactivity, to protect your account.`),
        f("Why was I signed out?",
          "Most likely inactivity. You're also signed out on your other devices when you change your password."),
        f("Is my information safe?",
          "Passwords are never stored in a readable form. Payments are handled by Safaricom, and HHES never sees your PIN. Only HHES staff and your own organisation can see your orders. Our Privacy Policy has the details.",
          [{ label: "Privacy Policy", href: NAV.privacy }]),
      ],
    },
    {
      id: "records", title: "Records and reports",
      faqs: [
        f("Where can I see my past orders?",
          "In My Orders (current and past) and in Reports, which also shows quarter-on-quarter totals, a category breakdown and a full audit trail of your latest order."),
        f("Can I download my order history?",
          "Yes. Reports lets you filter your orders and download them as CSV or PDF for your own procurement records."),
      ],
    },
  ];
}