"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

export function ConfirmDialog({ open, onClose, title, description, confirmLabel, cancelLabel = "Cancel", tone = "primary", loading, onConfirm }: {
  open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; confirmLabel: string; cancelLabel?: string;
  tone?: "primary" | "danger"; loading?: boolean; onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </>} />
  );
}