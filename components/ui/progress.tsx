import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Progress({ className, value = 0, ...props }: HTMLAttributes<HTMLDivElement> & { readonly value?: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800", className)} {...props}>
      <div
        className="h-full rounded-full bg-blue-600 transition-[width] duration-500 motion-reduce:transition-none"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}