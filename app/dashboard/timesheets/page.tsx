import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approveTimesheet, rejectTimesheet, submitTimesheet } from "./actions";
import { formatMH } from "@/lib/types";

export const dynamic = "force-dynamic";

type TimesheetRow = {
  id: string;
  tarih: string;
  isci_sayisi: number;
  adam_saat: number;
  kategori: string;
  direk_indirek: string;
  durum: string;
  subcontractors: { company_name: string } | null;
  work_items: { item_code: string; description: string } | null;
};

type DocumentRow = { readonly timesheet_id: string | null; readonly name: string };

type ProjectOption = { readonly id: string; readonly name: string };
type SubcontractorOption = { readonly id: string; readonly company_name: string };
type WorkItemOption = { readonly id: string; readonly item_code: string; readonly description: string };

const durumTone: Record<string, "good" | "medium" | "risk" | "neutral"> = {
  onaylandi: "good",
  onay_bekliyor: "medium",
  reddedildi: "risk",
  taslak: "neutral",
};

const durumLabel: Record<string, string> = {
  onaylandi: "Onaylandı",
  onay_bekliyor: "Onay Bekliyor",
  reddedildi: "Reddedildi",
  taslak: "Taslak",
};

export default async function TimesheetsPage() {
  const supabase = await createClient();

  const [sheets, subs, items, projects, documents] = await Promise.all([
    supabase.from("timesheets").select("id, tarih, isci_sayisi, adam_saat, kategori, direk_indirek, durum, subcontractors(company_name), work_items(item_code, description)").order("tarih", { ascending: false }).limit(100),
    supabase.from("subcontractors").select("id, company_name").order("company_name"),
    supabase.from("work_items").select("id, item_code, description").order("item_code"),
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("documents").select("timesheet_id, name").not("timesheet_id", "is", null),
  ]);

  const rows = (sheets.data ?? []) as unknown as TimesheetRow[];
  const subList = (subs.data ?? []) as SubcontractorOption[];
  const itemList = (items.data ?? []) as WorkItemOption[];
  const projList = (projects.data ?? []) as ProjectOption[];
  const documentRows = (documents.data ?? []) as DocumentRow[];
  const documentCount = new Map<string, number>();
  for (const document of documentRows) {
    if (document.timesheet_id) documentCount.set(document.timesheet_id, (documentCount.get(document.timesheet_id) ?? 0) + 1);
  }

  const onayBekliyor = rows.filter((r) => r.durum === "onay_bekliyor").length;
  const onaylandi = rows.filter((r) => r.durum === "onaylandi").length;
  const reddedildi = rows.filter((r) => r.durum === "reddedildi").length;

  return (
    <>
      <Topbar title="Günlük Puantaj" subtitle="Taşeronların adam-saat girişleri ve onay akışı" />
      <main className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="p-5"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">Onay Bekliyor</p><p className="mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-amber-600 dark:text-amber-400">{onayBekliyor}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">Onaylandı</p><p className="mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">{onaylandi}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">Reddedildi</p><p className="mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-red-600 dark:text-red-400">{reddedildi}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Puantaj Kayıtları</CardTitle>
              <CardDescription>Teknik ofis onay verdiğinde kayıt EVM&apos;e yansır</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Taşeron</TableHead>
                    <TableHead>İş Kalemi</TableHead>
                    <TableHead className="text-right">İşçi</TableHead>
                    <TableHead className="text-right">Adam-Saat</TableHead>
                  <TableHead>Belge</TableHead>
                  <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="tabular-nums">{r.tarih}</TableCell>
                      <TableCell className="font-medium">{r.subcontractors?.company_name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-slate-500">{r.work_items ? `${r.work_items.item_code} · ${r.work_items.description}` : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.isci_sayisi}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatMH(Number(r.adam_saat))}</TableCell>
                      <TableCell className="text-xs text-slate-500">{documentCount.get(r.id) ?? 0} dosya</TableCell>
                      <TableCell><Badge variant={durumTone[r.durum] ?? "neutral"}>{durumLabel[r.durum] ?? r.durum}</Badge></TableCell>
                      <TableCell className="text-right">
                        {r.durum === "onay_bekliyor" && (
                          <div className="flex justify-end gap-2">
                            <form action={approveTimesheet}><input type="hidden" name="id" value={r.id} /><Button variant="outline" className="h-7 px-2 text-xs text-emerald-700">Onayla</Button></form>
                            <form action={rejectTimesheet}><input type="hidden" name="id" value={r.id} /><Button variant="outline" className="h-7 px-2 text-xs text-red-700">Red</Button></form>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-slate-500">Henüz puantaj kaydı yok.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Yeni Puantaj Girişi</CardTitle>
            <CardDescription>Taşeron bilgisayardan adam-saat girer</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={submitTimesheet} className="space-y-4">
              <div>
                <label htmlFor="ts-project" className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">Proje</label>
                <Select id="ts-project" name="project_id" required>
                  {projList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </div>
              <div>
                <label htmlFor="ts-sub" className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">Taşeron</label>
                <Select id="ts-sub" name="subcontractor_id" required>
                  {subList.map((s) => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                </Select>
              </div>
              <div>
                <label htmlFor="ts-item" className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">İş Kalemi</label>
                <Select id="ts-item" name="work_item_id">
                  <option value="">— Seç —</option>
                  {itemList.map((i) => <option key={i.id} value={i.id}>{i.item_code} · {i.description}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ts-date" className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">Tarih</label>
                  <input id="ts-date" name="tarih" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="ts-workers" className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">İşçi Sayısı</label>
                  <input id="ts-workers" name="isci_sayisi" type="number" min="0" required className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ts-mh" className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">Adam-Saat</label>
                  <input id="ts-mh" name="adam_saat" type="number" step="0.5" min="0" required className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="ts-cat" className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">Kategori</label>
                  <Select id="ts-cat" name="kategori">
                    <option>Türk</option><option>Expat</option><option>Yerel</option>
                  </Select>
                </div>
              </div>
              <div>
                <label htmlFor="ts-kind" className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">Direk / Endirek</label>
                <Select id="ts-kind" name="direk_indirek">
                  <option>Direkt</option><option>Endirekt</option>
                </Select>
              </div>
              <div>
                <label htmlFor="ts-evidence" className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">Kanıt Belgesi <span className="font-normal text-slate-400">(opsiyonel)</span></label>
                <input id="ts-evidence" name="evidence" type="file" accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg" className="block w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 transition file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:file:bg-slate-800 dark:file:text-slate-300" />
                <p className="mt-1.5 text-[11px] text-slate-400">PDF, Excel veya görsel · maksimum 25 MB</p>
              </div>
              <Button className="w-full" type="submit">Gönder (Onay Bekliyor)</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
