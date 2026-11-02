import { Layout, H, P, Cta } from "./_components";

export default function OrgApproved({ contactName, orgName, loginUrl }: { contactName: string; orgName: string; loginUrl: string }) {
  return (
    <Layout preview={`${orgName} is approved`}>
      <H>Your account is approved</H>
      <P>Hello {contactName},</P>
      <P><b>{orgName}</b> can now log in to place quarterly lesson orders and pay by M-Pesa.</P>
      <Cta href={loginUrl}>Log in</Cta>
    </Layout>
  );
}