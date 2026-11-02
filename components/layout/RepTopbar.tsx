"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, Building2, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { RepBell } from "./RepBell";
import { createClient } from "@/lib/supabase/client";
import { clearRememberCookies } from "@/lib/auth/remember";
import { useSessionGuard } from "@/lib/auth/useSessionGuard";
import { notifyNext } from "@/lib/notify";
import { cn } from "@/lib/cn";
import { NAV } from "@/lib/nav";
import { REP_WIDTH } from "@/lib/rep/layout";

export type QuarterPill = { text: string; tone: "open" | "late" | "upcoming" | "none" };

const LINKS = [
  { href: "/rep/dashboard", label: "Dashboard", match: (p: string) => p.startsWith("/rep/dashboard") },
  { href: "/rep/order/place", label: "Place Order", match: (p: string) => p.startsWith("/rep/order/place") },
  { href: "/rep/orders", label: "My Orders", match: (p: string) => p.startsWith("/rep/orders") || (p.startsWith("/rep/order/") && !p.startsWith("/rep/order/place")) },
  { href: "/rep/catalogue", label: "Catalogue", match: (p: string) => p.startsWith("/rep/catalogue") },
  { href: "/rep/reports", label: "Reports", match: (p: string) => p.startsWith("/rep/reports") },
];

const PILL: Record<QuarterPill["tone"], string> = {
  open: "bg-positive text-white",
  late: "bg-attention text-white",
  upcoming: "bg-primary-soft text-primary",
  none: "border border-line bg-canvas text-muted",
};

function Pill({ pill }: { pill: QuarterPill }) {
  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold", PILL[pill.tone])}>
      {(pill.tone === "open" || pill.tone === "late") && <span className="size-2 rounded-full bg-white" aria-hidden />}
      {pill.text}
    </span>
  );
}

function UserMenu({ orgName, contactName, avatarUrl }: { orgName: string; contactName: string; avatarUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  async function signOut() {
    await createClient().auth.signOut();
    clearRememberCookies();
    notifyNext("auth.logout.success");
    router.replace(NAV.login);
    router.refresh();
  }

  const item = "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-ink hover:bg-canvas";
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
        className="flex items-center gap-3 rounded-field py-1 pl-2 pr-1 hover:bg-canvas">
        <span className="hidden text-right md:block">
          <span className="block max-w-[200px] truncate text-base font-semibold leading-tight text-ink">{orgName}</span>
          <span className="block text-sm leading-tight text-muted">{contactName}</span>
        </span>
        <Avatar url={avatarUrl} name={contactName || orgName} className="size-11 text-sm" />
        <ChevronDown size={16} className="text-muted" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-field border border-line bg-surface py-1 shadow-lg">
          <Link role="menuitem" href="/rep/profile" className={item}><Building2 size={16} aria-hidden /> Organisation Profile</Link>
          <button role="menuitem" type="button" onClick={signOut} className={cn(item, "border-t border-line")}><LogOut size={16} aria-hidden /> Sign out</button>
        </div>
      )}
    </div>
  );
}

export function RepTopbar({ orgName, contactName, avatarUrl, userId, unread, pill }: {
  orgName: string; contactName: string; avatarUrl: string | null; userId: string; unread: number; pill: QuarterPill;
}) {
  useSessionGuard("org_rep", NAV.login);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className={`flex h-[76px] items-center gap-6 lg:gap-8 ${REP_WIDTH}`}>
        <Logo />
        <nav className="hidden h-full items-stretch gap-8 lg:flex" aria-label="Main">
          {LINKS.map((l) => {
            const active = l.match(pathname);
            return (
              <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                className={cn("relative flex items-center text-[15px] transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5",
                  active ? "font-semibold text-ink after:bg-ink" : "text-muted hover:text-ink after:bg-transparent")}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <span className="hidden md:block"><Pill pill={pill} /></span>
          <RepBell userId={userId} initial={unread} />
          <span className="hidden h-9 w-px bg-line sm:block" />
          <UserMenu orgName={orgName} contactName={contactName} avatarUrl={avatarUrl} />
          <button type="button" className="flex size-10 items-center justify-center rounded-field text-ink hover:bg-canvas lg:hidden"
            onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="border-t border-line bg-surface px-5 py-3 lg:hidden" aria-label="Main mobile">
          <div className="px-3 py-2 md:hidden"><Pill pill={pill} /></div>
          {[...LINKS, { href: "/rep/profile", label: "Profile", match: (p: string) => p.startsWith("/rep/profile") }].map((l) => (
            <Link key={l.href} href={l.href} className={cn("block rounded-field px-3 py-2.5 text-[15px]", l.match(pathname) ? "bg-primary-soft font-medium text-primary" : "text-ink hover:bg-canvas")}>{l.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}