import { Text } from "@react-email/components";
import { Layout, H, P, Details } from "./_components";

export default function ContactMessage(p: {
  name: string; email: string; phone: string; organisation: string; topicLabel: string; signedIn: boolean; message: string;
}) {
  return (
    <Layout preview={`${p.topicLabel} from ${p.name}`}>
      <H>New message from the Contact page</H>
      <Details rows={[
        ["From", p.name], ["Email", p.email], ["Phone", p.phone || "-"], ["Organisation", p.organisation || "-"],
        ["Topic", p.topicLabel], ["Signed in", p.signedIn ? "Yes, an existing organisation account" : "No"],
      ]} />
      <Text style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: "24px", margin: "8px 0 16px", padding: "14px 16px", background: "#F1F6FA", borderRadius: 8 }}>{p.message}</Text>
      <P muted>Reply to this email to answer {p.name} directly.</P>
    </Layout>
  );
}