import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { FLAG_MODE, FLAG_SEEN } from "@/lib/auth/flags";

const NEXT_ALLOWED = ["/reset-password", "/set-password"];
const TYPES = ["recovery", "invite", "email_change"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "";
  const next = searchParams.get("next") ?? "";
  const isEmail = type === "email_change";

  const supabase = await createClient();
  const { data: { user: before } } = await supabase.auth.getUser();
  const homeOf = (role: unknown) => (role === "admin" ? "/admin/profile" : "/rep/profile");

  const failPath = type === "invite" ? "/admin/login?error=invite"
    : isEmail ? (before ? `${homeOf(before.app_metadata?.role)}?email=failed` : "/login")
    : "/forgot-password?error=link";
  const fail = () => NextResponse.redirect(`${origin}${failPath}`);

  if (!tokenHash || !TYPES.includes(type) || (!isEmail && !NEXT_ALLOWED.includes(next))) return fail();

  const { error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });
  if (error) return fail();

  let dest = next;
  if (isEmail) {
    // With "secure email change" two links must be opened: after the first, the change is still pending
    const { data: { user } } = await supabase.auth.getUser();
    const pending = !!user?.new_email;
    if (user && !pending && user.email && user.app_metadata?.role !== "admin") {
      // keep the organisation's contact email in step with the new sign-in email
      await createAdminClient().from("organisations").update({ contact_email: user.email.toLowerCase() }).eq("user_id", user.id);
    }
    dest = `${homeOf(user?.app_metadata?.role)}?email=${pending ? "pending" : "updated"}`;
  }

  const res = NextResponse.redirect(`${origin}${dest}`);
  const hasFlag = (request.headers.get("cookie") ?? "").includes(`${FLAG_MODE}=`);
  if (!hasFlag) { // a fresh session from an email link lasts for the browser session only
    const opts = { path: "/", sameSite: "lax" as const, secure: origin.startsWith("https") };
    res.cookies.set(FLAG_MODE, "session", opts);
    res.cookies.set(FLAG_SEEN, String(Math.floor(Date.now() / 1000)), opts);
  }
  return res;
}