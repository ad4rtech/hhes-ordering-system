import Link from "next/link";
import { Building2, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { buttonStyles } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { NAV } from "@/lib/nav";

export async function SiteHeader() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  const home = user ? (user.app_metadata?.role === "admin" ? NAV.adminDashboard : NAV.repDashboard) : null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-chrome/90 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-5 sm:gap-8" aria-label="Main">
          <Link href={NAV.orderingGuide} className="hidden text-[15px] text-muted hover:text-ink sm:inline">Ordering Guide</Link>
          {home ? (
            <Link href={home} className={buttonStyles({ size: "sm" })}><LayoutDashboard size={16} aria-hidden /> Go to Dashboard</Link>
          ) : (
            <Link href={NAV.login} className={buttonStyles({ size: "sm" })}><Building2 size={16} aria-hidden /> Organisation Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}