"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

// Shows the photo if the file exists, otherwise the fallback. The parent must be `relative`.
export function PhotoSlot({ src, alt, fallback, sizes, priority, className }: {
  src: string; alt: string; fallback: ReactNode; sizes: string; priority?: boolean; className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} onError={() => setFailed(true)} className={cn("object-cover", className)} />;
}