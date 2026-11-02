import { Resend } from "resend";
import { render } from "@react-email/components";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export type Message = { to: string; subject: string; react: ReactElement; replyTo?: string };

async function payload(m: Message) {
  return {
    from: process.env.EMAIL_FROM!,
    to: m.to,
    subject: m.subject,
    html: await render(m.react),
    text: await render(m.react, { plainText: true }),
    ...(m.replyTo ? { replyTo: m.replyTo } : {}),
  };
}

// Never throws: a failed email must not break an order, payment or approval
export async function sendEmail(m: Message) {
  try {
    const { error } = await resend.emails.send(await payload(m));
    if (error) console.error("[email]", error);
  } catch (e) {
    console.error("[email]", e);
  }
}

export async function sendBatch(messages: Message[]) {
  for (let i = 0; i < messages.length; i += 100) {
    try {
      const chunk = await Promise.all(messages.slice(i, i + 100).map(payload));
      const { error } = await resend.batch.send(chunk);
      if (error) console.error("[email:batch]", error);
    } catch (e) {
      console.error("[email:batch]", e);
    }
  }
}