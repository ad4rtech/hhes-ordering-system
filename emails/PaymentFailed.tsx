import { Layout, H, P, Cta, Callout, OrderMeta, type OrderBase } from "./_components";
import { kes } from "@/lib/utils/format";

export default function PaymentFailed(p: OrderBase & { reason: string; amountDue: number; retryUrl: string }) {
  return (
    <Layout preview="Your M-Pesa payment wasn't completed">
      <H>Payment not completed</H>
      <P>Hello {p.contactName},</P>
      <Callout tone="warn">{p.reason}</Callout>
      <P>Your order is saved. Amount due: <b>{kes(p.amountDue)}</b>. Please retry before the quarter deadline.</P>
      <Cta href={p.retryUrl}>Retry payment</Cta>
      <OrderMeta o={p} />
    </Layout>
  );
}