import { Layout, H, P, Cta } from "./_components";
import { Rich } from "@/lib/notifications/rich";

export default function AdminAlert({ title, body, actionUrl, actionLabel, prefLabel, profileUrl }: {
  title: string; body: string; actionUrl?: string; actionLabel?: string; prefLabel: string; profileUrl: string;
}) {
  return (
    <Layout preview={title}>
      <H>{title}</H>
      <P><Rich text={body} /></P>
      {actionUrl && <Cta href={actionUrl}>{actionLabel ?? "Open"}</Cta>}
      <P muted>You're getting this email because alerts for “{prefLabel}” are turned on. <a href={profileUrl}>Change your preferences</a>.</P>
    </Layout>
  );
}