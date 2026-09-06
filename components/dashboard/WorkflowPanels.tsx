import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EvmLine } from "@/lib/types";
import { cpiTone, formatRatio, spiTone } from "@/lib/types";

const SPI_ALERT_LIMIT = 0.85;
const CPI_ALERT_LIMIT = 0.9;

type CriticalItem = EvmLine & {
  readonly spiAlert: boolean;
  readonly cpiAlert: boolean;
};

function criticalItems(lines: readonly EvmLine[]): readonly CriticalItem[] {
  return lines
    .map((line) => ({
      ...line,
      spiAlert: line.spi !== null && line.spi < SPI_ALERT_LIMIT,
      cpiAlert: line.cpi !== null && line.cpi < CPI_ALERT_LIMIT,
    }))
    .filter((line) => line.spiAlert || line.cpiAlert)
    .sort((a, b) => Math.min(a.spi ?? Infinity, a.cpi ?? Infinity) - Math.min(b.spi ?? Infinity, b.cpi ?? Infinity));
}

export function CriticalItemsPanel({ lines }: { readonly lines: readonly EvmLine[] }) {
  const items = criticalItems(lines);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 rounded-lg bg-red-50 p-1.5 text-red-600 ring-1 ring-inset ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900" aria-hidden="true">
              <AlertTriangle className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <CardTitle>Kritik İş Kalemleri</CardTitle>
              <CardDescription className="mt-0.5">SPI &lt; {SPI_ALERT_LIMIT.toFixed(2)} veya CPI &lt; {CPI_ALERT_LIMIT.toFixed(2)}</CardDescription>
            </div>
          </div>
          <Badge variant={items.length > 0 ? "risk" : "good"}>{items.length} sinyal</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 px-4 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} aria-hidden="true" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Kritik performans sinyali yok</p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Tüm iş kalemleri eşiklerin üzerinde.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800" aria-label="Kritik iş kalemleri listesi">
            {items.slice(0, 5).map((item) => (
              <li key={item.work_item_id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] font-medium text-slate-400">{item.item_code}</p>
                  <p className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-100">{item.description}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {item.spiAlert && <Badge variant={spiTone(item.spi)}>SPI {formatRatio(item.spi)}</Badge>}
                  {item.cpiAlert && <Badge variant={cpiTone(item.cpi)}>CPI {formatRatio(item.cpi)}</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PendingTimesheetsPanel({ count }: { readonly count: number }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 rounded-lg bg-amber-50 p-1.5 text-amber-600 ring-1 ring-inset ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900" aria-hidden="true">
            <ClipboardCheck className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <CardTitle>Teknik Ofis Aksiyonları</CardTitle>
            <CardDescription className="mt-0.5">Onay akışında bekleyen puantaj kayıtları</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-semibold leading-none tracking-tight tabular-nums text-slate-900 dark:text-white">{count}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Onay bekleyen kayıt</p>
          </div>
          <Link
            href="/dashboard/timesheets"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 text-[13px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Puantajları incele
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
