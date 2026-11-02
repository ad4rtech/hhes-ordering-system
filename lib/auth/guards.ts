import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function getSession() {
  const h = await headers();
  const bearer = h.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const supabase = bearer
    ? createJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${bearer}` } }, auth: { persistSession: false } }
      )
    : await createClient();
  const { data: { user } } = await supabase.auth.getUser(bearer);
  return { supabase, user };
}

type Fail = { error: NextResponse; supabase?: undefined; user?: undefined };

export async function requireUser() {
  const { supabase, user } = await getSession();
  if (!user) return { error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) } as Fail;
  return { error: null, supabase, user };
}

export async function requireAdmin() {
  const s = await requireUser();
  if (s.error) return s;
  const { data: me } = await s.supabase.from("profiles").select("role").eq("id", s.user.id).single();
  if (me?.role !== "admin")
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as Fail;
  return s;
}