"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  HardHat,
  FileText,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Proje Özeti", icon: LayoutDashboard },
  { href: "/dashboard/timesheets", label: "Günlük Puantaj", icon: Clock },
  { href: "/dashboard/items", label: "İş Kalemleri (EVM)", icon: BarChart3 },
  { href: "/dashboard/subcontractors", label: "Taşeronlar", icon: HardHat },
  { href: "/dashboard/reports", label: "Raporlar", icon: FileText },
] as const;

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.4)]">
        <Building2 className="h-5 w-5 text-white" strokeWidth={2} />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-semibold text-white">Teknik Ofis</div>
        <div className="truncate text-[11px] text-slate-400">GES İnşaat · Moskova</div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-800/80 bg-slate-950 lg:flex">
      <div className="flex h-16 items-center border-b border-slate-800/80 px-5">
        <Brand />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Ana gezinme">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Modüller
        </p>
        {navItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
                active
                  ? "bg-blue-600/10 font-medium text-white"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-500 transition-opacity",
                  active ? "opacity-100" : "opacity-0"
                )}
                aria-hidden="true"
              />
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                )}
                strokeWidth={2}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[11px] font-semibold text-slate-200">
            TO
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-xs font-medium text-slate-200">Teknik Ofis</div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Onay yetkisi aktif
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-20 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white/90 px-3 py-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/90"
      aria-label="Mobil gezinme"
    >
      {navItems.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-blue-600/10 text-blue-700 dark:text-blue-300"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
