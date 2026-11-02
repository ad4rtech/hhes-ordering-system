import { Layout, H, P, Cta, Details } from "./_components";

export default function QuarterOpened(p: { contactName: string; quarterName: string; opensOn: string; deadline: string; orderUrl: string }) {
  return (
    <Layout preview={`${p.quarterName} ordering is open`}>
      <H>{p.quarterName} ordering is open</H>
      <P>Hello {p.contactName}, you can now order lesson books for the quarter.</P>
      <Details rows={[["Orders close", p.deadline]]} />
      <P>Place your order and pay by M-Pesa before the deadline. Late orders can't be accepted.</P>
      <Cta href={p.orderUrl}>Place your order</Cta>
    </Layout>
  );
}