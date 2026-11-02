import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { buttonStyles } from "@/components/ui/Button";
import { NAV } from "@/lib/nav";

export function PublicHeader() {
  return (
    <header className="border-b border-line bg-chrome">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-4 sm:gap-7">
          <Link href={NAV.orderingGuide} className="hidden text-[15px] text-muted hover:text-ink sm:inline">Ordering Guide</Link>
          <Link href={NAV.getStarted} className={buttonStyles({ variant: "outline", size: "sm" })}>
            <ArrowLeft size={16} aria-hidden /> Back to Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}