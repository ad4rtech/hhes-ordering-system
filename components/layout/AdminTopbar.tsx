"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, UserRound, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { clearRememberCookies } from "@/lib/auth/remember";
import { useSessionGuard } from "@/lib/auth/useSessionGuard";
import { useUnreadCount } from "@/lib/useUnreadCount";
import { notifyNext } from "@/lib/notify";
import { cn } from "@/lib/cn";
import { NAV } from "@/lib/nav";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/quarters", label: "Quarters" },
  { href: "/admin/catalogue", label: "Catalogue" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/organisations", label: "Organisations" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/profile", label: "Profile" },
];

function UserMenu({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
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
    router.replace(NAV.adminLogin);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
        className="flex items-center gap-3 rounded-field py-1 pl-2 pr-1 hover:bg-canvas">
        <span className="hidden text-right sm:block">
          <span className="block max-w-[160px] truncate text-[15px] font-semibold leading-tight text-ink">{name}</span>
          <span className="block text-sm leading-tight text-muted">Administrator</span>
        </span>
        <Avatar url={avatarUrl} name={name} className="size-10 text-sm" />
        <ChevronDown size={16} className="hidden text-muted sm:block" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-field border border-line bg-surface py-1 shadow-lg">
          <Link role="menuitem" href="/admin/profile" className="flex items-center gap-3 px-4 py-2.5 text-[15px] text-ink hover:bg-canvas"><UserRound size={16} aria-hidden /> Profile</Link>
          <button role="menuitem" type="button" onClick={signOut} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-ink hover:bg-canvas"><LogOut size={16} aria-hidden /> Sign out</button>
        </div>
      )}
    </div>
  );
}

export function AdminTopbar({ name, avatarUrl, userId, unread: initialUnread = 0 }: {
  name: string; avatarUrl: string | null; userId: string; unread?: number;
}) {
  useSessionGuard("admin", NAV.adminLogin);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unread = useUnreadCount(initialUnread, userId);
  useEffect(() => setMobileOpen(false), [pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-6 px-5 sm:px-6 xl:gap-10">
        <Logo label="HHES Admin" />
        <nav className="hidden items-center gap-6 lg:flex xl:gap-8" aria-label="Admin">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
              className={cn("text-[15px] transition-colors", active(l.href) ? "font-medium text-primary" : "text-muted hover:text-ink")}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <Link href="/admin/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
            className="relative flex size-10 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink">
            <Bell size={20} aria-hidden />
            {unread > 0 && <span className="absolute right-2.5 top-2 size-2 rounded-full bg-danger-solid" />}
          </Link>
          <span className="hidden h-8 w-px bg-line sm:block" />
          <UserMenu name={name} avatarUrl={avatarUrl} />
          <button type="button" className="flex size-10 items-center justify-center rounded-field text-ink hover:bg-canvas lg:hidden"
            onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="border-t border-line bg-surface px-5 py-3 lg:hidden" aria-label="Admin mobile">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className={cn("block rounded-field px-3 py-2.5 text-[15px]", active(l.href) ? "bg-primary-soft font-medium text-primary" : "text-ink hover:bg-canvas")}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}