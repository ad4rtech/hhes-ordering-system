import { Layout, H, P, Cta, Callout, Details, OrderMeta, Ref, type OrderBase } from "./_components";
import { kes } from "@/lib/utils/format";

export default function PaymentConfirmed(p: OrderBase & { receipt: string; amount: number; paidAt: string; amountDue: number; payUrl: string }) {
  return (
    <Layout preview={`Payment of ${kes(p.amount)} received`}>
      <H>Payment received</H>
      <P>Hello {p.contactName}, we've received your M-Pesa payment.</P>
      <Details rows={[["M-Pesa receipt", <Ref key="r">{p.receipt}</Ref>], ["Amount", kes(p.amount)], ["Time", p.paidAt]]} />
      {p.amountDue > 0 ? (
        <>
          <Callout tone="warn">A balance of {kes(p.amountDue)} is still due.</Callout>
          <Cta href={p.payUrl}>Pay the balance</Cta>
        </>
      ) : (
        <P>Your order is fully paid. We'll email you when it's ready for pickup.</P>
      )}
      <OrderMeta o={p} />
    </Layout>
  );
}