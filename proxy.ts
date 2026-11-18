import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC = [
  "/", "/login", "/register", "/forgot-password", "/reset-password", "/set-password",
  "/auth/callback", "/auth/confirm", "/admin/login",
  "/ordering-guide", "/contact", "/faqs", "/return-policy", "/help", "/privacy", "/terms",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Safaricom calls this unauthenticated; the route validates the payload itself.
  if (pathname.startsWith("/api/payments/callback")) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  let { data: { user } } = await supabase.auth.getUser(); // also refreshes the session

  // API routes enforce their own auth; the proxy only keeps cookies fresh.
  if (pathname.startsWith("/api/")) return response;

  // "Remember me": no flag cookie means the browser was closed without it (or 30 days passed)
  if (user && pathname !== "/auth/callback" && !request.cookies.has("hhes_remember") && !request.cookies.has("hhes_session")) {
    await supabase.auth.signOut();
    user = null;
  }

  const go = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = params ? new URLSearchParams(params).toString() : "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c)); // keep refreshed or cleared auth cookies
    return redirect;
  };

  const loginFor = pathname.startsWith("/admin") ? "/admin/login" : "/login";
  if (!user) return PUBLIC.includes(pathname) ? response : go(loginFor);

  const role = user.app_metadata?.role as "admin" | "org_rep" | undefined;
  const home = role === "admin" ? "/admin/dashboard" : "/rep/dashboard";

  if (pathname === "/") return go(home);

  if (role === "admin") {
    if (pathname.startsWith("/rep") || pathname === "/admin/login") return go("/admin/dashboard");
    return response;
  }

  // org_rep (or a user with no role yet)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") return go("/rep/dashboard");

  if (pathname.startsWith("/rep")) {
    const { data: org } = await supabase
      .from("organisations").select("status").eq("user_id", user.id).maybeSingle();
    if (!org) return go("/register/complete");                                   // signed in with Google, not registered yet
    if (org.status !== "approved") return go("/login", { reason: org.status });  // BR-09
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)"],
};