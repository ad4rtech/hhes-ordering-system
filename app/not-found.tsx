import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { buttonStyles } from "@/components/ui/Button";
import { NAV } from "@/lib/nav";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-chrome px-5 py-16 text-center">
      <Logo />
      <p className="mt-14 font-display text-7xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">We can't find that page</h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted">The address may be mistyped, or the page may have moved. Here are some places to start.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={NAV.home} className={buttonStyles()}>Go to the home page</Link>
        <Link href={NAV.orderingGuide} className={buttonStyles({ variant: "outline" })}>Ordering Guide</Link>
        <Link href={NAV.contact} className={buttonStyles({ variant: "outline" })}>Contact Centre</Link>
      </div>
    </main>
  );
}