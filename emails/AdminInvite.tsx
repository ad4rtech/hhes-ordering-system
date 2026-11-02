import { Layout, H, P, Cta } from "./_components";

export default function AdminInvite({ name, invitedBy, link }: { name: string; invitedBy: string; link: string }) {
  return (
    <Layout preview="You've been invited to the HHES admin portal">
      <H>You're invited</H>
      <P>Hello {name},</P>
      <P><b>{invitedBy}</b> added you as an administrator of the HHES Kenya lesson ordering system. Set a password to activate your account.</P>
      <Cta href={link}>Accept invitation</Cta>
      <P muted>The link works once and expires after a while. If it stops working, ask {invitedBy} to resend the invitation.</P>
    </Layout>
  );
}