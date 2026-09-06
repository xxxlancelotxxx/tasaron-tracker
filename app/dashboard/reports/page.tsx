import { createClient } from "@/lib/supabase/server";
import { Download, FileText } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EvmTable } from "@/components/dashboard/EvmTable";
import { PrintButton } from "@/components/reports/PrintButton";
import type { EvmLine } from "@/lib/types";
import { formatMH, formatRatio } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("evm_summary")
    .select("work_item_id, item_code, description, unit, total_quantity, planned_mh, earned_mh, spent_mh, cpi, spi")
    .order("item_code");

  const lines = (data ?? []) as EvmLine[];
  const totalPlanned = lines.reduce((s, l) => s + Number(l.planned_mh || 0), 0);
  const totalEarned = lines.reduce((s, l) => s + Number(l.earned_mh || 0), 0);
  const totalSpent = lines.reduce((s, l) => s + Number(l.spent_mh || 0), 0);

  return (
    <>
      <Topbar title="Raporlar" subtitle="EVM raporunu HTML / PDF / Excel olarak dışa aktar" />
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Haftalık EVM Raporu</CardTitle>
            <CardDescription>
              CPI {formatRatio(totalSpent > 0 ? totalEarned / totalSpent : null)} · SPI {formatRatio(totalPlanned > 0 ? totalEarned / totalPlanned : null)} · Toplam Adam-Saat {formatMH(totalSpent)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2.5">
            <a href="/api/export/evm?format=xlsx" download>
              <Button variant="outline"><Download className="h-3.5 w-3.5" strokeWidth={2} />Excel (.xlsx)</Button>
            </a>
            <a href="/api/export/evm?format=csv" download>
              <Button variant="outline"><Download className="h-3.5 w-3.5" strokeWidth={2} />CSV</Button>
            </a>
            <a href="/api/export/evm?format=html" target="_blank">
              <Button variant="outline"><FileText className="h-3.5 w-3.5" strokeWidth={2} />HTML Görünüm</Button>
            </a>
            <PrintButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rapor Önizleme</CardTitle>
          </CardHeader>
          <EvmTable lines={lines} />
        </Card>
      </main>
    </>
  );
}
