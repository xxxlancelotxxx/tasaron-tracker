import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMH } from "@/lib/types";

export const dynamic = "force-dynamic";

type SubRow = {
  id: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
};

type AggRow = {
  subcontractor_id: string;
  toplam_saat: number | null;
};

export default async function SubcontractorsPage() {
  const supabase = await createClient();

  const [subs, agg] = await Promise.all([
    supabase.from("subcontractors").select("id, company_name, contact_name, phone, email").order("company_name"),
    supabase.from("timesheets").select("subcontractor_id, adam_saat").eq("durum", "onaylandi"),
  ]);

  const subList = (subs.data ?? []) as SubRow[];
  const timesheets = (agg.data ?? []) as { subcontractor_id: string; adam_saat: number }[];

  const spentBySub = new Map<string, number>();
  for (const t of timesheets) {
    spentBySub.set(t.subcontractor_id, (spentBySub.get(t.subcontractor_id) ?? 0) + Number(t.adam_saat));
  }

  return (
    <>
      <Topbar title="Taşeronlar" subtitle="Firma listesi ve onaylanan adam-saat toplamları" />
      <main className="mx-auto max-w-5xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Taşeron Firmaları</CardTitle>
            <CardDescription>Onaylanan puantaj kayıtlarından toplam adam-saat</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead>Yetkili</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">Toplam Adam-Saat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subList.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.company_name}</TableCell>
                    <TableCell>{s.contact_name ?? "—"}</TableCell>
                    <TableCell className="tabular-nums text-slate-500">{s.phone ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatMH(spentBySub.get(s.id) ?? 0)}</TableCell>
                  </TableRow>
                ))}
                {subList.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-slate-500">Taşeron yok.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </>
  );
}