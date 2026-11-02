import { NextResponse, after } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/guards";
import { sendEmail } from "@/lib/email/send";
import ContactMessage from "@/emails/ContactMessage";
import ContactReceived from "@/emails/ContactReceived";
import { contactSchema, topicLabel } from "@/lib/contact";
import { SITE } from "@/lib/site";

const schema = contactSchema.extend({
  website: z.string().max(200).optional(),   // honeypot: real people never fill this in
  started: z.number().optional(),            // when the form appeared, to catch instant bot submissions
});

const log = (...args: unknown[]) => console.log("[contact]", ...args);

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  if (!raw) {
    log("REJECTED: body is not valid JSON");
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  log("received", {
    keys: Object.keys(raw),
    topic: raw.topic,
    website: raw.website ?? "(none)",
    started: raw.started ?? "(none)",
    messageLength: typeof raw.message === "string" ? raw.message.length : "(not a string)",
  });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    log("REJECTED: validation failed ->", JSON.stringify(parsed.error.flatten().fieldErrors));
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const v = parsed.data;

  // Spam traps: pretend it worked so bots learn nothing
  if (v.website) {
    // Autofill often drops the person's own email into the hidden field: treat that as human
    const looksLikeAutofill = v.website.trim().toLowerCase() === v.email;
    if (!looksLikeAutofill) {
      log(`SILENTLY DROPPED: honeypot filled with "${v.website}"`);
      return NextResponse.json({ ok: true });
    }
    log("honeypot matched the sender's own email: treating as browser autofill, continuing");
  }
  if (typeof v.started === "number") {
    const elapsed = Date.now() - v.started;
    if (elapsed < 3000) {
      log(`SILENTLY DROPPED: too fast, elapsed=${elapsed}ms (negative means the browser clock is ahead of the server)`);
      return NextResponse.json({ ok: true });
    }
    log(`timing ok, elapsed=${elapsed}ms`);
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  const ipHash = ip ? createHash("sha256").update(`${process.env.CONTACT_SALT ?? "hhes-contact"}:${ip}`).digest("hex").slice(0, 32) : null;

  const sb = createAdminClient();
  const since = new Date(Date.now() - 3600_000).toISOString();
  const [byEmail, byIp] = await Promise.all([
    sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("email", v.email).gte("created_at", since),
    ipHash ? sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since) : Promise.resolve({ count: 0, error: null }),
  ]);
  log("rate check", { byEmail: byEmail.count, byIp: byIp.count, hasIp: !!ipHash, emailErr: byEmail.error?.message, ipErr: byIp.error?.message });
  if ((byEmail.count ?? 0) >= 3 || (byIp.count ?? 0) >= 3) {
    log("REJECTED: rate limited (429)");
    return NextResponse.json({ error: "You've sent a few messages already. Please wait a while before sending another." }, { status: 429 });
  }

  const { user } = await getSession();
  const { error } = await sb.from("contact_messages").insert({
    name: v.name, email: v.email, phone: v.phone || null, organisation: v.organisation || null,
    topic: v.topic, message: v.message, user_id: user?.id ?? null, ip_hash: ipHash,
  });
  if (error) {
    log("FAILED: insert error ->", error.message, error.code ?? "");
    return NextResponse.json({ error: "Couldn't send your message. Please try again." }, { status: 500 });
  }
  log("SAVED to contact_messages", { email: v.email, signedIn: !!user });

  const label = topicLabel(v.topic);
  after(async () => {
    if (SITE.email) {
      log(`emailing HHES at ${SITE.email}`);
      await sendEmail({
        to: SITE.email, replyTo: v.email, subject: `[Contact] ${label} · ${v.name}`,
        react: <ContactMessage name={v.name} email={v.email} phone={v.phone} organisation={v.organisation} topicLabel={label} signedIn={!!user} message={v.message} />,
      });
    } else {
      log("SKIPPED HHES email: HHES_EMAIL is empty");
    }
    log(`emailing confirmation to ${v.email}`);
    await sendEmail({
      to: v.email, subject: "We've received your message to HHES Kenya",
      react: <ContactReceived name={v.name} topicLabel={label} message={v.message} hours={SITE.hours} phone={SITE.phone} />,
    });
    log("email step finished (any send errors appear above as [email] lines)");
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}