import { Layout, H, P } from "./_components";

export default function RegistrationReceived({ contactName, orgName }: { contactName: string; orgName: string }) {
  return (
    <Layout preview="We've received your registration">
      <H>Registration received</H>
      <P>Hello {contactName},</P>
      <P>Thank you for registering <b>{orgName}</b>. An HHES admin will review your details and you'll get an email as soon as your account is approved.</P>
      <P muted>You won't be able to log in until then.</P>
    </Layout>
  );
}