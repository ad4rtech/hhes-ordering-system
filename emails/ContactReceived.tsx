import { Text } from "@react-email/components";
import { Layout, H, P } from "./_components";

export default function ContactReceived({ name, topicLabel, message, hours, phone }: {
  name: string; topicLabel: string; message: string; hours: string; phone: string;
}) {
  return (
    <Layout preview="We've received your message">
      <H>We've received your message</H>
      <P>Hello {name},</P>
      <P>Thank you for contacting HHES Kenya about <b>{topicLabel.toLowerCase()}</b>. We'll reply to this email address as soon as we can{hours ? ` during office hours (${hours})` : ""}.</P>
      <Text style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: "24px", margin: "8px 0 16px", padding: "14px 16px", background: "#F1F6FA", borderRadius: 8 }}>{message}</Text>
      {phone && <P muted>Something urgent about an order or payment? Call us on {phone}.</P>}
    </Layout>
  );
}