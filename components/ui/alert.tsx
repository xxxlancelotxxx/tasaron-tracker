import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  danger: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
} as const;

export function Alert({ className, tone = "info", ...props }: HTMLAttributes<HTMLDivElement> & { readonly tone?: keyof typeof tones }) {
  return <div role="alert" className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", tones[tone], className)} {...props} />;
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("font-semibold leading-tight", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-0.5 text-[13px] opacity-90", className)} {...props} />;
}