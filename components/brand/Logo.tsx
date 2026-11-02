import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV } from "@/lib/nav";

export function Logo({ size = "md", label = "HHES Kenya", className }: { size?: "md" | "sm"; label?: string; className?: string }) {
  return (
    <Link href={NAV.home} className={cn("inline-flex items-center gap-3", className)} aria-label={`${label} home`}>
      <span className={cn("flex items-center justify-center rounded-xl bg-primary text-white", size === "md" ? "size-11" : "size-8 rounded-lg")}>
        <BookOpen size={size === "md" ? 22 : 16} aria-hidden />
      </span>
      <span className={cn("font-display font-bold text-ink", size === "md" ? "text-2xl" : "text-xl")}>{label}</span>
    </Link>
  );
}