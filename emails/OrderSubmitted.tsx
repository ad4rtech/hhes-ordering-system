import { Layout, H, P, Cta, Callout, OrderTable, OrderMeta, type OrderBase } from "./_components";
import { kes } from "@/lib/utils/format";

export default function OrderSubmitted(p: OrderBase & { payUrl: string }) {
  return (
    <Layout preview={`Order ${p.reference} received`}>
      <H>We've received your order</H>
      <P>Hello {p.contactName},</P>
      <OrderTable lines={p.lines} total={p.total} />
      <Callout tone="warn">Payment of {kes(p.total)} via M-Pesa is required before pickup.</Callout>
      <Cta href={p.payUrl}>Pay with M-Pesa</Cta>
      <OrderMeta o={p} />
    </Layout>
  );
}