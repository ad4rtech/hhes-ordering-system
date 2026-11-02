"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Dialog({ open, onClose, title, description, footer, side, children }: {
  open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; footer?: ReactNode; side?: boolean; children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }} // click on the backdrop
      className={cn(
        "bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/40",
        side ? "my-0 ml-auto mr-0 h-dvh max-h-dvh w-full max-w-[540px] rounded-none" : "m-auto w-[calc(100%-2rem)] max-w-md rounded-card border border-line",
      )}
    >
      {open && (
        <div className={cn("flex flex-col", side ? "h-full" : "max-h-[85dvh]")}>
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div>
              <h2 className="font-sans text-lg font-semibold leading-snug">{title}</h2>
              {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label="Close"
              className="-mr-2 flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink">
              <X size={18} />
            </button>
          </div>
          {children && <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>}
          {footer && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}