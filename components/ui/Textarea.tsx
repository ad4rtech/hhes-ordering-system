import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { control } from "./Field";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "h-auto min-h-28 py-3 leading-relaxed", className)} {...props} />;
}