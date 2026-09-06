import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  good: "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  medium: "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  risk: "border-red-200/80 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300",
  neutral: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
} as const;

const dots = {
  good: "bg-emerald-500",
  medium: "bg-amber-500",
  risk: "bg-red-500",
  neutral: "bg-slate-400",
} as const;

export function Badge({
  className,
  variant = "neutral",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { readonly variant?: keyof typeof variants }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums",
        variants[variant],
        className
      )}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dots[variant])} aria-hidden="true" />
      {children}
    </div>
  );
}
