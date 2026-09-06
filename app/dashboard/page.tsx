import { createClient } from "@/lib/supabase/server";
import { Banknote, CalendarRange, Clock, FileCheck, Percent, Timer, HardHat, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EvmTable } from "@/components/dashboard/EvmTable";
import { EvmTrendChart } from "@/components/dashboard/EvmTrendChart";
import { CriticalItemsPanel, PendingTimesheetsPanel } from "@/components/dashboard/WorkflowPanels";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { EvmLine, WeeklyProgress } from "@/lib/types";
import { formatMH, formatRatio } from "@/lib/types";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────
   DEMO DATA — Supabase baglantisi yokken kullanilacak
   ───────────────────────────────────────────────────────────── */

const DEMO_LINES: EvmLine[] = [
  { work_item_id: "1", item_code: "033113.55", description: "Temel Kazısı ve Hafriyat", unit: "m³", total_quantity: 4200, planned_mh: 3360, earned_mh: 3200, spent_mh: 3840, cpi: 0.83, spi: 0.95 },
  { work_item_id: "2", item_code: "042220", description: "Beton Dökümü (C30/37)", unit: "m³", total_quantity: 2800, planned_mh: 11200, earned_mh: 9800, spent_mh: 10500, cpi: 0.93, spi: 0.88 },
  { work_item_id: "3", item_code: "092320.10", description: "Donatı Montajı (B500C)", unit: "ton", total_quantity: 850, planned_mh: 5950, earned_mh: 5600, spent_mh: 5100, cpi: 1.10, spi: 0.94 },
  { work_item_id: "4", item_code: "033113.85", description: "Kalıp Kurulumu (Temel)", unit: "m²", total_quantity: 6400, planned_mh: 6400, earned_mh: 7040, spent_mh: 6100, cpi: 1.15, spi: 1.10 },
  { work_item_id: "5", item_code: "071110", description: "Tuğla Duvar Örme (20cm)", unit: "m²", total_quantity: 12000, planned_mh: 4800, earned_mh: 3360, spent_mh: 4480, cpi: 0.75, spi: 0.70 },
  { work_item_id: "6", item_code: "212200", description: "MEP Tesisat (Su-Kanalizasyon)", unit: "m", total_quantity: 3500, planned_mh: 2800, earned_mh: 2520, spent_mh: 2380, cpi: 1.06, spi: 0.90 },
  { work_item_id: "7", item_code: "221100", description: "Elektrik Tesisatı (Güç)", unit: "m", total_quantity: 4200, planned_mh: 2100, earned_mh: 1890, spent_mh: 1995, cpi: 0.95, spi: 0.90 },
  { work_item_id: "8", item_code: "263100", description: "Cephe Kaplaması (Granit)", unit: "m²", total_quantity: 5600, planned_mh: 5600, earned_mh: 4480, spent_mh: 5040, cpi: 0.89, spi: 0.80 },
  { work_item_id: "9", item_code: "312100", description: "Asansör Kurulumu (6 Adet)", unit: "adet", total_quantity: 6, planned_mh: 3600, earned_mh: 2160, spent_mh: 2520, cpi: 0.86, spi: 0.60 },
  { work_item_id: "10", item_code: "413100", description: "İç Cephe Sıva ve Boya", unit: "m²", total_quantity: 18000, planned_mh: 3600, earned_mh: 2880, spent_mh: 3060, cpi: 0.94, spi: 0.80 },
];

const DEMO_WEEKLY: WeeklyProgress[] = [
  { week_number: 1, week_start: "2026-07-06", planned: 3200, earned: 2880, spent: 3040 },
  { week_number: 2, week_start: "2026-07-13", planned: 6800, earned: 5920, spent: 6400 },
  { week_number: 3, week_start: "2026-07-20", planned: 10800, earned: 9600, spent: 9800 },
  { week_number: 4, week_start: "2026-07-27", planned: 15200, earned: 13440, spent: 14400 },
  { week_number: 5, week_start: "2026-08-03", planned: 20000, earned: 17600, spent: 19200 },
  { week_number: 6, week_start: "2026-08-10", planned: 25200, earned: 22400, spent: 24000 },
  { week_number: 7, week_start: "2026-08-17", planned: 30800, earned: 27600, spent: 29200 },
  { week_number: 8, week_start: "2026-08-24", planned: 36800, earned: 32400, spent: 34800 },
];

const DEMO_PENDING_COUNT = 7;

const DEMO_PROJECT = {
  name: "Nagatino-2 Hotel & Residence",
  client: "GES İnşaat Moskova",
  location: "Nagatino, Moskova",
  contractDate: "2026-01-15",
  plannedEnd: "2027-06-30",
  totalContract: "48.5M ₽",
};

/* ─────────────────────────────────────────────────────────────
   HELPER: haftalik progress'i kümülatif'e cevir
   ───────────────────────────────────────────────────────────── */

type WeeklyProgressRow = {
  readonly week_number: number;
  readonly week_start: string;
  readonly planlanan_maliyet_pv: number | null;
  readonly kazanilan_deger_ev: number | null;
  readonly fiili_maliyet_ac: number | null;
};

function normalizeWeeklyProgress(rows: readonly WeeklyProgressRow[]): readonly WeeklyProgress[] {
  const cumulative = { planned: 0, earned: 0, spent: 0 };
  return rows.map((row) => {
    cumulative.planned += Number(row.planlanan_maliyet_pv ?? 0);
    cumulative.earned += Number(row.kazanilan_deger_ev ?? 0);
    cumulative.spent += Number(row.fiili_maliyet_ac ?? 0);
    return {
      week_number: row.week_number,
      week_start: row.week_start,
      planned: cumulative.planned,
      earned: cumulative.earned,
      spent: cumulative.spent,
    };
  });
}

/* ─────────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  let lines: EvmLine[] = DEMO_LINES;
  let weeklyProgress: readonly WeeklyProgress[] = DEMO_WEEKLY;
  let pendingCount = DEMO_PENDING_COUNT;
  let isDemo = true;

  try {
    const supabase = await createClient();
    const [{ data: evm }, { data: weekly }, { count }] = await Promise.all([
      supabase.from("evm_summary").select("work_item_id, item_code, description, unit, total_quantity, planned_mh, earned_mh, spent_mh, cpi, spi").order("item_code"),
      supabase.from("weekly_progress").select("week_number, week_start, planlanan_maliyet_pv, kazanilan_deger_ev, fiili_maliyet_ac").order("week_number"),
      supabase.from("timesheets").select("id", { count: "exact", head: true }).eq("durum", "onay_bekliyor"),
    ]);

    if (evm && evm.length > 0) {
      lines = evm as EvmLine[];
      isDemo = false;
    }
    if (weekly && weekly.length > 0) {
      weeklyProgress = normalizeWeeklyProgress(weekly as unknown as WeeklyProgressRow[]);
      isDemo = false;
    }
    if (count !== null && count !== undefined) {
      pendingCount = count;
      isDemo = false;
    }
  } catch {
    // Supabase baglantisi yok — demo verisi kullanilacak
  }

  /* KPI hesaplamalari */
  const totalPlanned = lines.reduce((s, l) => s + Number(l.planned_mh || 0), 0);
  const totalEarned = lines.reduce((s, l) => s + Number(l.earned_mh || 0), 0);
  const totalSpent = lines.reduce((s, l) => s + Number(l.spent_mh || 0), 0);
  const cpi = totalSpent > 0 ? totalEarned / totalSpent : null;
  const spi = totalPlanned > 0 ? totalEarned / totalPlanned : null;
  const physical = totalEarned > 0 && totalPlanned > 0 ? (totalEarned / totalPlanned) * 100 : null;
  const completedItems = lines.filter((l) => l.cpi !== null && l.spi !== null && l.cpi! >= 0.9 && l.spi! >= 0.85).length;
  const totalItems = lines.length;

  return (
    <>
      <Topbar title="Proje Özeti" subtitle="Nagatino-2 Hotel · Follow-up Report" />

      <main className="mx-auto max-w-[1400px] space-y-6 p-5 sm:p-6 lg:p-8">

        {/* Demo badge */}
        {isDemo && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Demo verisi görüntüleniyor — Supabase bağlantısı kurulduğunda gerçek veriler yüklenecek
          </div>
        )}

        {/* ── PROJECT HERO ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
                  <HardHat className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">{DEMO_PROJECT.name}</h2>
                  <p className="text-[13px] text-slate-500">{DEMO_PROJECT.client} · {DEMO_PROJECT.location}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  Devam Ediyor
                </span>
                <span className="text-[12px] text-slate-400">Sözleşme: {DEMO_PROJECT.contractDate}</span>
                <span className="text-[12px] text-slate-400">·</span>
                <span className="text-[12px] text-slate-400">Bitiş: {DEMO_PROJECT.plannedEnd}</span>
                <span className="text-[12px] text-slate-400">·</span>
                <span className="text-[12px] font-medium text-slate-600">{DEMO_PROJECT.totalContract}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Genel Tamamlanma</p>
                <p className="mt-0.5 text-3xl font-bold tabular-nums text-slate-900">{physical !== null ? `%${physical.toFixed(1)}` : "—"}</p>
              </div>
              <Progress value={physical ?? 0} className="h-2 w-40" />
            </div>
          </div>
        </div>

        {/* ── KPI ROW ── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="CPI (Maliyet)"
            value={formatRatio(cpi)}
            detail={cpi === null ? "Veri yok" : cpi < 0.9 ? "Maliyet aşımı" : cpi > 1.1 ? "Verimli" : "Hedefte"}
            icon={Banknote}
            tone={cpi === null ? "slate" : cpi < 0.9 ? "red" : cpi > 1.1 ? "emerald" : "amber"}
            trend={cpi === null ? null : cpi < 0.9 ? "down" : "up"}
          />
          <KpiCard
            label="SPI (Takvim)"
            value={formatRatio(spi)}
            detail={spi === null ? "Veri yok" : spi < 0.85 ? "Gecikme var" : spi > 1.05 ? "Önde" : "Hedefte"}
            icon={CalendarRange}
            tone={spi === null ? "slate" : spi < 0.85 ? "red" : spi > 1.05 ? "emerald" : "amber"}
            trend={spi === null ? null : spi < 0.85 ? "down" : "up"}
          />
          <KpiCard
            label="Toplam Adam-Saat"
            value={formatMH(totalSpent)}
            detail={`Plan: ${formatMH(totalPlanned)} MH`}
            icon={Timer}
            tone="blue"
          />
          <KpiCard
            label="Bekleyen Puantaj"
            value={String(pendingCount)}
            detail={`${completedItems}/${totalItems} kalem hedefte`}
            icon={FileCheck}
            tone={pendingCount > 5 ? "amber" : "emerald"}
            trend={pendingCount > 5 ? "down" : pendingCount === 0 ? "up" : null}
          />
        </div>

        {/* ── PROGRESS SUMMARY BAR ── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp className="h-4 w-4" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">Proje İlerleme Özeti</p>
                  <p className="text-[12px] text-slate-500">Kümülatif kazanılan / planlanan adam-saat karşılaştırması</p>
                </div>
              </div>
              <div className="hidden items-center gap-5 sm:flex">
                <div className="text-center">
                  <p className="text-[11px] font-medium text-slate-400">Planlanan</p>
                  <p className="text-sm font-bold tabular-nums text-blue-600">{formatMH(totalPlanned)}</p>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="text-center">
                  <p className="text-[11px] font-medium text-slate-400">Kazanılan</p>
                  <p className="text-sm font-bold tabular-nums text-emerald-600">{formatMH(totalEarned)}</p>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="text-center">
                  <p className="text-[11px] font-medium text-slate-400">Harcanan</p>
                  <p className="text-sm font-bold tabular-nums text-red-600">{formatMH(totalSpent)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── EVM CHART ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>EVM Haftalık Trendi</CardTitle>
                <CardDescription>Kümülatif PV, EV, AC ve SPI/CPI performans çizelgesi</CardDescription>
              </div>
              <div className="flex gap-3 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" /> PV</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-600" /> EV</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> AC</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EvmTrendChart data={weeklyProgress} />
          </CardContent>
        </Card>

        {/* ── WORKFLOW PANELS ── */}
        <div className="grid gap-5 lg:grid-cols-2">
          <CriticalItemsPanel lines={lines} />
          <PendingTimesheetsPanel count={pendingCount} />
        </div>

        {/* ── EVM TABLE ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>İş Kalemleri — EVM Detayı</CardTitle>
                <CardDescription>CPI = Kazanılan ÷ Harcanan · SPI = Kazanılan ÷ Planlanan</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <CheckCircle2 className="h-3 w-3" /> CPI &gt; 1.1
                </span>
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-700 ring-1 ring-inset ring-red-200">
                  <AlertTriangle className="h-3 w-3" /> CPI &lt; 0.9
                </span>
              </div>
            </div>
          </CardHeader>
          <EvmTable lines={lines} />
        </Card>
      </main>
    </>
  );
}
