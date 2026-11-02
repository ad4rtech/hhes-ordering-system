"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Toaster as Sonner } from "sonner";
import { CheckCircle2, Info, Loader2, TriangleAlert, XCircle } from "lucide-react";
import { flushNextToast } from "@/lib/notify";

export function Toaster() {
  const pathname = usePathname();
  useEffect(() => { flushNextToast(); }, [pathname]); // toasts queued with notifyNext() appear after the redirect

  return (
    <Sonner
      position="top-right" closeButton visibleToasts={3} gap={12} offset={20} mobileOffset={12}
      icons={{
        success: <CheckCircle2 size={20} />, error: <XCircle size={20} />,
        warning: <TriangleAlert size={20} />, info: <Info size={20} />,
        loading: <Loader2 size={20} className="animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "relative flex w-full items-start gap-3 rounded-card border border-line bg-surface p-4 pr-10 font-sans shadow-[0_12px_32px_-12px_rgb(17_24_39/0.25)]",
          content: "min-w-0 flex-1",
          title: "text-[15px] font-medium leading-snug text-ink",
          description: "mt-1 text-sm leading-relaxed text-muted",
          closeButton: "absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink",
          actionButton: "ml-2 shrink-0 rounded-field bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover",
          success: "border-success/30 [&_[data-icon]]:text-success",
          error: "border-danger/30 [&_[data-icon]]:text-danger",
          warning: "border-warning/30 [&_[data-icon]]:text-warning",
          info: "border-primary/30 [&_[data-icon]]:text-primary",
          loading: "[&_[data-icon]]:text-primary",
        },
      }}
    />
  );
}