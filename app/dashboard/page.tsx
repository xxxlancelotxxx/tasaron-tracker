import { createClient } from "@/lib/supabase/server";
import { Banknote, CalendarRange, Percent, Timer } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EvmTable } from "@/components/dashboard/EvmTable";
import { EvmTrendChart } from "@/components/dashboard/EvmTrendChart";
import { CriticalItemsPanel, PendingTimesheetsPanel } from "@/components/dashboard/WorkflowPanels";
import type { EvmLine, WeeklyProgress } from "@/lib/types";
import { formatMH, formatRatio } from "@/lib/types";

export const dynamic = "force-dynamic";

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

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: evm, error: evmError }, { data: weekly, error: weeklyError }, { count: pendingCount, error: timesheetError }] = await Promise.all([
    supabase
      .from("evm_summary")
      .select("work_item_id, item_code, description, unit, total_quantity, planned_mh, earned_mh, spent_mh, cpi, spi")
      .order("item_code"),
    supabase
      .from("weekly_progress")
      .select("week_number, week_start, planlanan_maliyet_pv, kazanilan_deger_ev, fiili_maliyet_ac")
      .order("week_number"),
    supabase
      .from("timesheets")
      .select("id", { count: "exact", head: true })
      .eq("durum", "onay_bekliyor"),
  ]);

  const lines = (evm ?? []) as EvmLine[];
  const weeklyRows = (weekly ?? []) as unknown as WeeklyProgressRow[];
  const weeklyProgress = normalizeWeeklyProgress(weeklyRows);
  const dataError = evmError ?? weeklyError ?? timesheetError;

  const totalPlanned = lines.reduce((s, l) => s + Number(l.planned_mh || 0), 0);
  const totalEarned = lines.reduce((s, l) => s + Number(l.earned_mh || 0), 0);
  const totalSpent = lines.reduce((s, l) => s + Number(l.spent_mh || 0), 0);

  const cpi = totalSpent > 0 ? totalEarned / totalSpent : null;
  const spi = totalPlanned > 0 ? totalEarned / totalPlanned : null;
  const physical = totalEarned > 0 && totalPlanned > 0 ? (totalEarned / totalPlanned) * 100 : null;

  return (
    <>
      <Topbar title="Proje Özeti" subtitle="Follow-up Report · EVM ve teknik ofis aksiyonları" />
      <main className="mx-auto max-w-7xl space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="CPI (Maliyet Performansı)" value={formatRatio(cpi)} detail={cpi === null ? "Veri yok" : cpi < 0.9 ? "Maliyet aşımı" : cpi > 1.1 ? "Maliyet verimli" : "Hedef dahilinde"} icon={Banknote} tone={cpi === null ? "slate" : cpi < 0.9 ? "red" : cpi > 1.1 ? "emerald" : "amber"} trend={cpi === null ? null : cpi < 0.9 ? "down" : "up"} />
          <KpiCard label="SPI (Takvim Performansı)" value={formatRatio(spi)} detail={spi === null ? "Veri yok" : spi < 0.85 ? "Takvim gerisinde" : spi > 1.05 ? "Takvim önünde" : "Hedef dahilinde"} icon={CalendarRange} tone={spi === null ? "slate" : spi < 0.85 ? "red" : spi > 1.05 ? "emerald" : "amber"} trend={spi === null ? null : spi < 0.85 ? "down" : "up"} />
          <KpiCard label="Fiziki İlerleme" value={physical === null ? "—" : `%${physical.toFixed(1)}`} detail="Kazanılan / Planlanan MH" icon={Percent} tone="blue" />
          <KpiCard label="Toplam Adam-Saat (Spent)" value={formatMH(totalSpent)} detail={`Planlanan: ${formatMH(totalPlanned)} MH`} icon={Timer} tone="slate" />
        </div>

        {dataError && <Card><CardContent className="p-6 text-center text-sm text-red-600 dark:text-red-400">Veri yüklenemedi: {dataError.message}</CardContent></Card>}

        <Card>
          <CardHeader>
            <CardTitle>Proje EVM Trendi</CardTitle>
            <CardDescription>Haftalık kümülatif adam-saat görünümü · SPI ve CPI sağ eksende</CardDescription>
          </CardHeader>
          <CardContent><EvmTrendChart data={weeklyProgress} /></CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <CriticalItemsPanel lines={lines} />
          <PendingTimesheetsPanel count={pendingCount ?? 0} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>İş Kalemleri — Adam-Saat Bazlı EVM</CardTitle>
            <CardDescription>CPI = Kazanılan ÷ Fiilen Harcanan · SPI = Kazanılan ÷ Planlanan</CardDescription>
          </CardHeader>
          <EvmTable lines={lines} />
        </Card>
      </main>
    </>
  );
}
