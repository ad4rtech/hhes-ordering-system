import { Layout, H, P, Callout, OrderMeta, type OrderBase } from "./_components";
import { kes } from "@/lib/utils/format";

export default function OrderCancelled(p: OrderBase & { refundAmount: number }) {
  return (
    <Layout preview={`Order ${p.reference} cancelled`}>
      <H>Your order was cancelled</H>
      <P>Hello {p.contactName}, your order has been cancelled.</P>
      {p.refundAmount > 0 && <Callout>A refund of {kes(p.refundAmount)} is pending with HHES finance.</Callout>}
      <OrderMeta o={p} />
    </Layout>
  );
}