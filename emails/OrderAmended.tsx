import { Layout, H, P, Cta, Callout, OrderTable, OrderMeta, type OrderBase } from "./_components";
import { kes } from "@/lib/utils/format";

export default function OrderAmended(p: OrderBase & { adjustment: string; amountDue: number; refundAmount: number; payUrl: string }) {
  return (
    <Layout preview={`Order ${p.reference} updated`}>
      <H>Your order was updated</H>
      <P>Hello {p.contactName}, here is your updated order.</P>
      <OrderTable lines={p.lines} total={p.total} />
      {p.adjustment === "top_up_required" && (
        <>
          <Callout tone="warn">Additional payment of {kes(p.amountDue)} is required.</Callout>
          <Cta href={p.payUrl}>Pay the difference</Cta>
        </>
      )}
      {p.adjustment === "refund_due" && (
        <Callout>Your new total is lower than what you paid. A refund of {kes(p.refundAmount)} will be processed by HHES finance.</Callout>
      )}
      <OrderMeta o={p} />
    </Layout>
  );
}