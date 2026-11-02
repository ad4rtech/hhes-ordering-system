import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { buttonStyles } from "@/components/ui/Button";
import { NAV } from "@/lib/nav";

export function AdminHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-[76px] max-w-[1152px] items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="hidden rounded-full bg-primary-soft px-3.5 py-1.5 text-sm font-medium text-ink sm:inline">Admin Portal</span>
        </div>
        <nav className="flex items-center gap-4 sm:gap-7">
          <Link href={NAV.itSupport} className="hidden items-center gap-2 text-[15px] text-muted hover:text-ink sm:inline-flex">
            <CircleHelp size={18} aria-hidden /> IT Support
          </Link>
          <Link href={NAV.login} className={buttonStyles({ variant: "outline", size: "sm" })}>
            Organisation Portal <ArrowRight size={16} aria-hidden />
          </Link>
        </nav>
      </div>
    </header>
  );
}