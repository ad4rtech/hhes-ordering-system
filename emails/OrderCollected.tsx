import { Layout, H, P, Details, OrderTable, OrderMeta, Ref, type OrderBase } from "./_components";

export default function OrderCollected(p: OrderBase & { receipts: string[]; collectedAt: string }) {
  return (
    <Layout preview="Pickup confirmed">
      <H>Pickup confirmed</H>
      <P>Hello {p.contactName}, thank you. Your order has been collected.</P>
      <OrderTable lines={p.lines} total={p.total} />
      <Details rows={[
        ["Collected", p.collectedAt],
        ...(p.receipts.length ? [["M-Pesa receipt(s)", <Ref key="r">{p.receipts.join(", ")}</Ref>] as [string, React.ReactNode]] : []),
      ]} />
      <OrderMeta o={p} />
    </Layout>
  );
}