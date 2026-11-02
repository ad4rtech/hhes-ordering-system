import "server-only";
import { SITE } from "@/lib/site";
import { idleSeconds } from "@/lib/auth/flags";
import { NAV } from "@/lib/nav";
import { slug, type Faq, type FaqCategory } from "@/lib/faqs";

const h = (q: string, a: string, steps?: string[], links?: Faq["links"]): Faq => ({ id: slug(q), q, a, steps, links });
const ask = (topic: string, label = "Contact us about this") => ({ label, href: `${NAV.contact}?topic=${topic}` });

// The six problems shown at the top of the page
export const POPULAR_TITLES = [
  "I can't sign in",
  "I didn't receive the M-Pesa prompt",
  "Money was taken from my M-Pesa but my order says unpaid",
  "The Place Order button is greyed out",
  "The password reset email didn't arrive",
  "I can't edit my order",
];

export function getHelp() {
  const idleMin = Math.round(idleSeconds() / 60);
  const idle = idleMin % 60 === 0 ? `${idleMin / 60} ${idleMin === 60 ? "hour" : "hours"}` : `${idleMin} minutes`;
  const pickup = [SITE.address, SITE.hours].filter(Boolean).join(", ");

  const categories: FaqCategory[] = [
    {
      id: "signing-in", title: "Signing in",
      faqs: [
        h("I can't sign in", "Work through these checks in order:", [
          "Make sure you're on the right page. Organisations use Organisation Sign In. The HHES administrator login is a separate page and won't accept organisation accounts.",
          "Use the email address you registered with, with no spaces before or after it.",
          "Choose Show password to check what you typed. Passwords are case-sensitive, so check that Caps Lock is off.",
          "Still not working? Use Forgot password? to choose a new one.",
          "After several wrong attempts the system pauses sign-in for a few minutes. Wait a little, then try once more.",
        ], [{ label: "Organisation Sign In", href: NAV.login }, { label: "Reset your password", href: NAV.forgotPassword }, ask("account")]),
        h("It says my registration is awaiting approval",
          "Nothing is wrong. HHES reviews every new registration before access is given, and we email you as soon as yours is approved. You can't see prices or place orders until then. If your quarter's deadline is close and you're still waiting, contact us so we can look at it.",
          undefined, [ask("registration")]),
        h("It says my registration wasn't approved, or my account is deactivated",
          "Either HHES couldn't approve the registration, or access to your account has been switched off. For a registration that wasn't approved, the email we sent explains why. In both cases HHES can look into it with you, and you don't need to register again.",
          undefined, [ask("registration")]),
        h("I keep being signed out",
          `This is for your protection. If you didn't tick Remember me, you're signed out after about ${idle} of inactivity. If you did, you stay signed in for 30 days.`, [
            "Tick Remember me when you sign in, but only on a computer that's yours.",
            "Changing your password signs you out on your other devices.",
            "Private windows, and browsers set to clear cookies when closed, end your session.",
            "Make sure cookies are allowed for this website.",
          ]),
        h("I signed in with Google and it asks for my organisation's details",
          "New accounts started with Google need your organisation's name and type, which Google can't supply. You only do this once. After you submit, HHES approves the registration the same way as any other."),
        h("Google sign-in isn't working", "Try these:", [
          "Make sure pop-ups and cookies aren't blocked for this website.",
          "Choose the Google account that uses the same email you registered with.",
          "If it still fails, sign in with your email and password, or reset your password.",
        ], [ask("account")]),
      ],
    },
    {
      id: "passwords-email", title: "Passwords and email",
      faqs: [
        h("The password reset email didn't arrive", "Check these:", [
          "Look in your spam, junk and promotions folders.",
          "Make sure you entered the email address you registered with, spelled correctly.",
          "Wait a few minutes. Email can be slow.",
          "Request it once and wait about a minute before asking again, as repeated requests are limited.",
          "For security we show the same message whether or not an account exists, so an address that was never registered receives nothing.",
        ], [{ label: "Reset your password", href: NAV.forgotPassword }]),
        h("My reset link says it has expired or is invalid",
          "Reset links work once and expire after a while, and a newer request cancels older links.", [
            "Request a new link.",
            "Open only the newest email, and use the link straight away.",
            "If it keeps failing, contact us and we'll help you get back in.",
          ], [{ label: "Request a new link", href: NAV.forgotPassword }, ask("account")]),
        h("My new password is being rejected",
          "Passwords need at least 10 characters, with upper and lower case letters and a number. They can't be a common password, and can't contain your name, email or organisation's name.", [
            "Try three or four unrelated words and a number. They're long and easy to remember.",
            "Let your browser suggest a strong password and save it for you.",
            "Wait for the strength meter to read Good or Strong before you submit.",
          ]),
        h("I'm not receiving emails from HHES",
          "We email order confirmations, payment receipts, deadline reminders and pickup notices.", [
            "Check your spam folder and mark our messages as not spam.",
            "Check that the email on your Organisation Profile is the right one.",
            "If your organisation uses a strict email filter, ask whoever manages it to allow messages from HHES.",
            "You don't miss anything meanwhile. The bell icon and My Orders show the same updates.",
          ], [ask("account")]),
      ],
    },
    {
      id: "ordering", title: "Ordering",
      faqs: [
        h("I can't see the catalogue or prices",
          "The catalogue is for approved organisations, and prices appear once HHES opens a quarter.", [
            "Sign in with your organisation's approved account.",
            "Check the banner on your dashboard. If it says no window is open, or that one opens on a later date, prices appear when the quarter opens. We email you when it does.",
          ]),
        h("The Place Order button is greyed out", "Hover over the button to see why. The usual reasons are:", [
          "No quarter is open yet, or the quarter opens on a later date.",
          "The deadline has passed. Contact HHES, who can grant an extension for your organisation.",
          "You already have an order this quarter. Use Edit Order instead.",
          "Your order for this quarter was cancelled. Contact HHES if you still need books.",
        ], [ask("ordering")]),
        h("A lesson book says Out of Stock",
          "That category has no books left after everyone's orders, so it can't be ordered right now. If another organisation cancels, the books become available again, and the page updates by itself. Set the quantity to 0 to order the rest. If you really need those books, contact HHES and ask.",
          undefined, [ask("ordering")]),
        h("It won't let me order the quantity I typed",
          "You can order up to what's left in stock, and for Low Stock categories the form tells you how many are left. Another organisation may have ordered in the meantime. The page updates live and lowers your quantity if it has to. Reduce the quantity, or contact HHES if you need more.",
          undefined, [ask("ordering")]),
        h("I can't edit my order",
          "Orders can be edited while the quarter is open and until HHES marks them ready for pickup.", [
            "Check the status. Orders that are ready for pickup, collected or cancelled are locked.",
            "After the deadline, editing is closed. Contact HHES if you need an exception.",
            "If you raise the total of an order you've already paid for, you pay only the difference.",
          ], [ask("ordering")]),
        h("I ordered the wrong quantities",
          "If your order isn't ready for pickup yet, choose Edit Order and correct it. If it's already packed, contact HHES straight away so we can see what's possible.",
          undefined, [{ label: "My Orders", href: "/rep/orders" }, ask("ordering")]),
        h("My order doesn't show up in My Orders", "Check these:", [
          "Make sure you're signed in with your organisation's own account. The name shows at the top right.",
          "Check the quarter filter in Order History.",
          "If you reached the payment page, the order is still saved as Awaiting Payment and appears on your dashboard.",
          "Still can't find it? Contact us with the time you placed it.",
        ], [ask("ordering")]),
      ],
    },
    {
      id: "payments", title: "M-Pesa payments",
      faqs: [
        h("I didn't receive the M-Pesa prompt", "The prompt usually arrives within seconds.", [
          "Check the number you entered is a Safaricom number registered for M-Pesa, written like 0712 345 678.",
          "Make sure the phone is on, has network and is unlocked.",
          "Wait up to a minute.",
          "Choose Resend request after about 90 seconds, or use a different number. A second request is blocked while one is waiting, so please don't tap repeatedly.",
          "Still nothing? Contact us with your order reference.",
        ], [ask("payments")]),
        h("I got the prompt but the payment failed", "The payment screen tells you why. Your order stays saved the whole time.", [
          "Cancelled: you dismissed the prompt. Press Retry payment when you're ready.",
          "Wrong PIN: retry and enter it carefully. Your PIN is managed by Safaricom, so they handle PIN resets, not HHES.",
          "Not enough balance: top up your M-Pesa and retry.",
          "Timed out: the prompt expired before it was approved. Retry to get a new one.",
        ], [ask("payments")]),
        h("Money was taken from my M-Pesa but my order says unpaid",
          "Please don't pay again. This usually sorts itself out within minutes.", [
            "Wait a few minutes. The page and your dashboard update by themselves, and we check with M-Pesa for any payment that hasn't confirmed.",
            "If it still shows unpaid after about ten minutes, contact us with your M-Pesa receipt number (it's in Safaricom's SMS) and your order reference.",
            "HHES checks the payment and confirms it on your order.",
          ], [ask("payments")]),
        h("I paid twice",
          "If more than the amount due is received, the extra is flagged for refund automatically. To speed it up, send us both M-Pesa receipt numbers and your order reference.",
          undefined, [ask("refunds")]),
        h("I can't find my M-Pesa receipt number", "It's in several places:", [
          "In My Orders, open the order and look at its payment details.",
          "In the payment email we sent you.",
          "In the M-Pesa SMS from Safaricom.",
          "In Reports, in the timeline of your latest order.",
        ]),
        h("The payment screen says the payment window has closed",
          "The ordering deadline passed before the order was paid, and unpaid orders don't go ahead after it. If your organisation needs an exception, contact HHES, who can grant an extension for your organisation.",
          undefined, [ask("payments")]),
        h("It says a payment request was just sent",
          "Only one request can wait at a time. Check your phone first. If nothing has arrived, you can resend after about 90 seconds."),
      ],
    },
    {
      id: "pickup-refunds", title: "Pickup and refunds",
      faqs: [
        h("My order is paid but not ready yet",
          "HHES packs paid orders and then marks them ready, and we email you and show it on your bell icon. If the quarter's deadline has passed and you still haven't heard, contact us with your order reference.",
          undefined, [ask("pickup")]),
        h("I can't collect during office hours",
          `${pickup ? `Books are collected at ${pickup}. ` : ""}If that doesn't work for you, contact HHES to arrange another time, or send a person your organisation authorises.`,
          undefined, [ask("pickup")]),
        h("My order says Refund pending",
          "It means a refund is due to you and HHES finance hasn't processed it yet. You're notified when it's done. If you think it has been too long, contact us with your order reference.",
          undefined, [{ label: "Return Policy", href: NAV.returnPolicy }, ask("refunds")]),
      ],
    },
    {
      id: "account-site", title: "Account and website",
      faqs: [
        h("I need to change our organisation's name or type",
          "HHES sets these when it approves your organisation, so they can't be changed from your profile. Contact HHES with the correct details.",
          undefined, [ask("account")]),
        h("I need to change the contact person or sign-in email", "Both are in Organisation Profile.", [
          "Change the contact name or phone number there and save.",
          "To change your sign-in email, choose Change next to it, then enter your password and the new address.",
          "We email confirmation links to your old and new address, and you open both to finish.",
          "If you've lost access to the old email, contact HHES.",
        ], [{ label: "Organisation Profile", href: "/rep/profile" }, ask("account")]),
        h("My profile picture won't upload",
          "Use a JPG, PNG or WebP image under 5 MB. We crop it to a square automatically."),
        h("My downloaded file looks wrong in Excel", "Our CSV files are UTF-8 with a header row.", [
          "In Excel, use Data, then From Text/CSV, and choose UTF-8 if characters look odd.",
          "Or use the PDF export on the Reports page.",
        ]),
        h("A page looks broken or won't load", "Try these:", [
          "Refresh the page.",
          "Check your internet connection. If you see an \"offline\" message, that's the cause.",
          "Use a recent version of Chrome, Edge, Firefox or Safari.",
          "Try a private window or another browser, as extensions can interfere.",
          "Still broken? Contact us with a screenshot and the time it happened.",
        ], [ask("other")]),
      ],
    },
  ];

  const byId = new Map(categories.flatMap((c) => c.faqs).map((x) => [x.id, x]));
  const popular = POPULAR_TITLES.map((t) => byId.get(slug(t))).filter((x): x is Faq => !!x).map((x) => ({ id: x.id, title: x.q }));
  return { categories, popular };
}