import { Layout, H, P, Cta, Callout } from "./_components";
import { kes } from "@/lib/utils/format";

export default function DeadlineReminder(p: {
  contactName: string; quarterName: string; deadline: string; daysLeft: number;
  hasOrder: boolean; amountDue: number; actionUrl: string;
}) {
  const when = p.daysLeft === 0 ? "today" : p.daysLeft === 1 ? "tomorrow" : `in ${p.daysLeft} days`;
  return (
    <Layout preview={`${p.quarterName} orders close ${when}`}>
      <H>Orders close {when}</H>
      <P>Hello {p.contactName},</P>
      {p.hasOrder ? (
        <Callout tone="warn">Your order is placed but not fully paid. {kes(p.amountDue)} is still due by {p.deadline}.</Callout>
      ) : (
        <Callout tone="warn">We haven't received a {p.quarterName} order from you. Orders close on {p.deadline}.</Callout>
      )}
      <Cta href={p.actionUrl}>{p.hasOrder ? "Pay now" : "Place your order"}</Cta>
    </Layout>
  );
}