import { Layout, H, P, Callout } from "./_components";

export default function OrgRejected({ contactName, orgName, reason }: { contactName: string; orgName: string; reason: string }) {
  return (
    <Layout preview="An update on your registration">
      <H>We couldn't approve your registration</H>
      <P>Hello {contactName},</P>
      <P>We weren't able to approve <b>{orgName}</b> at this time.</P>
      <Callout tone="warn">Reason: {reason}</Callout>
      <P muted>If you think this is a mistake, please contact HHES.</P>
    </Layout>
  );
}