"use client";

import { useState } from "react";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";

export function CategoryImage({ slug, alt, muted, compact }: { slug: string; alt: string; muted?: boolean; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex size-full items-center justify-center bg-gradient-to-br from-panel to-primary-softer text-primary/50" role="img" aria-label={alt}>
        <BookOpen size={compact ? 24 : 56} strokeWidth={1.5} aria-hidden />
      </div>
    );
  }
  return (
    <Image src={`/catalogue/${slug}.jpg`} alt={alt} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
      onError={() => setFailed(true)}
      className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.03]", muted && "grayscale")} />
  );
}