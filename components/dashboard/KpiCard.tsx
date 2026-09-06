import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "blue" | "emerald" | "amber" | "red" | "slate";

const cardBg: Record<Tone, string> = {
  blue: "bg-gradient-to-br from-blue-50 to-blue-50/30 border-blue-200/60 dark:from-blue-950/40 dark:to-blue-950/10 dark:border-blue-900/50",
  emerald: "bg-gradient-to-br from-emerald-50 to-emerald-50/30 border-emerald-200/60 dark:from-emerald-950/40 dark:to-emerald-950/10 dark:border-emerald-900/50",
  amber: "bg-gradient-to-br from-amber-50 to-amber-50/30 border-amber-200/60 dark:from-amber-950/40 dark:to-amber-950/10 dark:border-amber-900/50",
  red: "bg-gradient-to-br from-red-50 to-red-50/30 border-red-200/60 dark:from-red-950/40 dark:to-red-950/10 dark:border-red-900/50",
  slate: "bg-gradient-to-br from-slate-50 to-slate-50/30 border-slate-200/60 dark:from-slate-800/50 dark:to-slate-900 dark:border-slate-700/50",
};

const iconBg: Record<Tone, string> = {
  blue: "bg-blue-600/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400",
  emerald: "bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400",
  amber: "bg-amber-600/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400",
  red: "bg-red-600/10 text-red-600 dark:bg-red-400/15 dark:text-red-400",
  slate: "bg-slate-600/10 text-slate-500 dark:bg-slate-400/10 dark:text-slate-400",
};

const trendTones = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
  flat: "text-slate-500 dark:text-slate-400",
} as const;

export function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
  trend,
}: {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
  readonly icon: LucideIcon;
  readonly tone?: Tone;
  readonly trend?: "up" | "down" | null;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendTone = trend === "up" ? trendTones.up : trend === "down" ? trendTones.down : trendTones.flat;

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-shadow hover:shadow-md",
        cardBg[tone]
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <span className={cn("shrink-0 rounded-lg p-2", iconBg[tone])} aria-hidden="true">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-3 text-[32px] font-bold leading-none tracking-tight tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
      {detail && (
        <p className={cn("mt-2 flex items-center gap-1.5 text-[13px] font-medium", trendTone)}>
          <TrendIcon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span className="truncate">{detail}</span>
        </p>
      )}
    </div>
  );
}
