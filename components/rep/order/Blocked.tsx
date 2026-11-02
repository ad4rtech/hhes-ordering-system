import Link from "next/link";
import { CalendarX } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";

export function Blocked({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-panel text-muted"><CalendarX size={24} aria-hidden /></span>
      <h2 className="font-sans text-lg font-semibold text-ink">{title}</h2>
      <p className="max-w-md text-[15px] leading-relaxed text-muted">{body}</p>
      <Link href="/rep/dashboard" className={buttonStyles({ variant: "outline" })}>Back to dashboard</Link>
    </div>
  );
}