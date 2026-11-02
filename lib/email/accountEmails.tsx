import { sendEmail } from "./send";
import RegistrationReceived from "@/emails/RegistrationReceived";
import OrgApproved from "@/emails/OrgApproved";
import OrgRejected from "@/emails/OrgRejected";

type Org = { contact_email: string; contact_name: string; name: string };

export const notifyRegistration = (o: Org) =>
  sendEmail({ to: o.contact_email, subject: "HHES registration received",
    react: <RegistrationReceived contactName={o.contact_name} orgName={o.name} /> });

export const notifyApproved = (o: Org) =>
  sendEmail({ to: o.contact_email, subject: "Your HHES account is approved",
    react: <OrgApproved contactName={o.contact_name} orgName={o.name} loginUrl={`${process.env.NEXT_PUBLIC_APP_URL}/login`} /> });

export const notifyRejected = (o: Org, reason: string) =>
  sendEmail({ to: o.contact_email, subject: "An update on your HHES registration",
    react: <OrgRejected contactName={o.contact_name} orgName={o.name} reason={reason} /> });