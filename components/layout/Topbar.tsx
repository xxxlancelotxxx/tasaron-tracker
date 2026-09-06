import { Building2 } from "lucide-react";

export function Topbar({ title, subtitle }: { readonly title: string; readonly subtitle?: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 md:flex dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          <Building2 className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
          Nagatino-2 Hotel
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          TO
        </div>
      </div>
    </header>
  );
}
