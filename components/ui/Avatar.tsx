import { cn } from "@/lib/cn";

export function initialsOf(name: string) {
  const base = name.includes("@") ? name.split("@")[0] : name;
  return base.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "A";
}

export function Avatar({ url, name, className }: { url?: string | null; name: string; className?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={cn("rounded-full object-cover", className)} />
  ) : (
    <span aria-hidden className={cn("flex items-center justify-center rounded-full bg-primary-soft font-semibold text-primary", className)}>{initialsOf(name)}</span>
  );
}