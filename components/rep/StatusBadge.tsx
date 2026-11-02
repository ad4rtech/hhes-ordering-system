import { CircleCheck, CircleX, Clock, Package, PackageCheck, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const MAP: Record<string, { label: string; icon: LucideIcon; cls: string }> = {
  awaiting_payment: { label: "Awaiting Payment", icon: Clock, cls: "bg-warning-soft text-warning" },
  payment_failed: { label: "Payment Failed", icon: TriangleAlert, cls: "bg-danger-soft text-danger" },
  paid: { label: "Paid", icon: CircleCheck, cls: "bg-primary text-white" },
  ready_for_pickup: { label: "Ready for Pickup", icon: Package, cls: "bg-attention text-white" },
  collected: { label: "Collected", icon: PackageCheck, cls: "bg-positive text-white" },
  cancelled: { label: "Cancelled", icon: CircleX, cls: "border border-line-strong bg-canvas text-muted" },
};

export const repStatusKey = (status: string, payment: string) => (status === "awaiting_payment" && payment === "failed" ? "payment_failed" : status);
export const repStatusLabel = (status: string, payment = "") => MAP[repStatusKey(status, payment)]?.label ?? status;

export function RepStatusBadge({ status, payment = "", size = "md" }: { status: string; payment?: string; size?: "md" | "sm" }) {
  const m = MAP[repStatusKey(status, payment)] ?? { label: status, icon: Clock, cls: "bg-canvas text-muted" };
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full font-medium", size === "md" ? "px-4 py-2 text-[15px]" : "px-3 py-1 text-[13px]", m.cls)}>
      <Icon size={size === "md" ? 18 : 14} aria-hidden /> {m.label}
    </span>
  );
}