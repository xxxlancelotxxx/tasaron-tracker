import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EvmTable } from "@/components/dashboard/EvmTable";
import type { EvmLine } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("evm_summary")
    .select("work_item_id, item_code, description, unit, total_quantity, planned_mh, earned_mh, spent_mh, cpi, spi")
    .order("item_code");

  const lines = (data ?? []) as EvmLine[];

  return (
    <>
      <Topbar title="İş Kalemleri (EVM)" subtitle="Kalem bazlı adam-saat ve kazanılan değer analizi" />
      <main className="mx-auto max-w-7xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Tüm İş Kalemleri</CardTitle>
            <CardDescription>Planlanan, kazanılan ve harcanan adam-saat · CPI/SPI otomatik</CardDescription>
          </CardHeader>
          <EvmTable lines={lines} />
        </Card>
      </main>
    </>
  );
}