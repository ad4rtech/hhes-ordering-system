import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth/org";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const fail = () => NextResponse.redirect(`${origin}/login?error=oauth`);
  if (!code || searchParams.get("error")) return fail();

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail();

  const go = (path: string) => {
    const res = NextResponse.redirect(`${origin}${path}`);
    res.cookies.set("hhes_remember", "1", {
      path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", secure: origin.startsWith("https"),
    });
    return res;
  };

  const admin = createAdminClient();
  const role = await ensureProfile(admin, user);
  if (role === "admin") return go("/admin/dashboard");

  const { data: org } = await admin.from("organisations").select("status").eq("user_id", user.id).maybeSingle();
  if (!org) return go("/register/complete");
  if (org.status === "approved") return go("/rep/dashboard");

  await supabase.auth.signOut();
  return go(`/login?reason=${org.status}`);
}