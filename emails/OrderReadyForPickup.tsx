import { Layout, H, P, Callout, Details, OrderTable, OrderMeta, type OrderBase } from "./_components";

export default function OrderReadyForPickup(p: OrderBase & { address: string; hours: string; phone: string }) {
  return (
    <Layout preview="Your lesson books are ready for pickup">
      <H>Your order is ready</H>
      <P>Hello {p.contactName}, your books are ready to collect.</P>
      <OrderTable lines={p.lines} total={p.total} />
      <Details rows={[["Collect at", p.address], ["Hours", p.hours], ["Phone", p.phone]]} />
      <Callout>Please bring your order reference when you collect.</Callout>
      <OrderMeta o={p} />
    </Layout>
  );
}