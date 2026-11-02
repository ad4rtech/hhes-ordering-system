import type { ReactElement } from "react";
import { render } from "@react-email/components";
import RegistrationReceived from "@/emails/RegistrationReceived";
import OrgApproved from "@/emails/OrgApproved";
import OrgRejected from "@/emails/OrgRejected";
import QuarterOpened from "@/emails/QuarterOpened";
import DeadlineReminder from "@/emails/DeadlineReminder";
import OrderSubmitted from "@/emails/OrderSubmitted";
import PaymentConfirmed from "@/emails/PaymentConfirmed";
import PaymentFailed from "@/emails/PaymentFailed";
import OrderAmended from "@/emails/OrderAmended";
import OrderCancelled from "@/emails/OrderCancelled";
import OrderReadyForPickup from "@/emails/OrderReadyForPickup";
import OrderCollected from "@/emails/OrderCollected";

const o = {
  contactName: "Jane Doe", orgName: "Test SDA Church", quarterName: "Q4 2026", reference: "HHES-A1B2C3D4", total: 3500,
  lines: [
    { label: "Adults Lesson", quantity: 10, unit: 250 },
    { label: "Primary", quantity: 5, unit: 200 },
  ],
};
const url = "http://localhost:3000/rep/order/demo/pay";

const samples: Record<string, ReactElement> = {
  RegistrationReceived: <RegistrationReceived contactName={o.contactName} orgName={o.orgName} />,
  OrgApproved: <OrgApproved contactName={o.contactName} orgName={o.orgName} loginUrl="http://localhost:3000/login" />,
  OrgRejected: <OrgRejected contactName={o.contactName} orgName={o.orgName} reason="We couldn't verify your church affiliation." />,
  QuarterOpened: <QuarterOpened contactName={o.contactName} quarterName="Q1 2027" opensOn="1 January 2027" deadline="31 January 2027" orderUrl={url} />,
  DeadlineReminder: <DeadlineReminder contactName={o.contactName} quarterName="Q4 2026" deadline="31 October 2026" daysLeft={3} hasOrder={false} amountDue={0} actionUrl={url} />,
  DeadlineReminderUnpaid: <DeadlineReminder contactName={o.contactName} quarterName="Q4 2026" deadline="31 October 2026" daysLeft={1} hasOrder amountDue={3500} actionUrl={url} />,
  OrderSubmitted: <OrderSubmitted {...o} payUrl={url} />,
  PaymentConfirmed: <PaymentConfirmed {...o} receipt="TEST8K2LQ9" amount={3500} paidAt="4 Oct 2026, 10:42" amountDue={0} payUrl={url} />,
  PaymentFailed: <PaymentFailed {...o} reason="Request cancelled by user" amountDue={3500} retryUrl={url} />,
  OrderAmendedTopUp: <OrderAmended {...o} adjustment="top_up_required" amountDue={400} refundAmount={0} payUrl={url} />,
  OrderAmendedRefund: <OrderAmended {...o} adjustment="refund_due" amountDue={0} refundAmount={400} payUrl={url} />,
  OrderCancelled: <OrderCancelled {...o} refundAmount={3500} />,
  OrderReadyForPickup: <OrderReadyForPickup {...o} address="HHES Centre, Nairobi" hours="Mon-Fri, 8:00AM - 5:00PM" phone="+254 700 000 000" />,
  OrderCollected: <OrderCollected {...o} receipts={["TEST8K2LQ9"]} collectedAt="6 Oct 2026, 14:05" />,
};

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const t = new URL(req.url).searchParams.get("t");
  if (!t || !samples[t]) {
    const links = Object.keys(samples).map((k) => `<li><a href="?t=${k}">${k}</a></li>`).join("");
    return new Response(`<h2>Email previews</h2><ul>${links}</ul>`, { headers: { "Content-Type": "text/html" } });
  }
  return new Response(await render(samples[t]), { headers: { "Content-Type": "text/html" } });
}