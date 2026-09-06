import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

type EvmRow = {
  item_code: string;
  description: string;
  unit: string;
  planned_mh: number;
  earned_mh: number;
  spent_mh: number;
  cpi: number | null;
  spi: number | null;
};

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const supabase = await createClient();

  const { data } = await supabase
    .from("evm_summary")
    .select("item_code, description, unit, planned_mh, earned_mh, spent_mh, cpi, spi")
    .order("item_code");

  const rows = (data ?? []) as EvmRow[];
  const totalPlanned = rows.reduce((s, r) => s + Number(r.planned_mh || 0), 0);
  const totalEarned = rows.reduce((s, r) => s + Number(r.earned_mh || 0), 0);
  const totalSpent = rows.reduce((s, r) => s + Number(r.spent_mh || 0), 0);
  const cpi = totalSpent > 0 ? (totalEarned / totalSpent).toFixed(3) : "—";
  const spi = totalPlanned > 0 ? (totalEarned / totalPlanned).toFixed(3) : "—";

  if (format === "html") {
    const body = rows.map((r) => `
      <tr>
        <td>${r.item_code}</td>
        <td>${r.description}</td>
        <td>${r.unit}</td>
        <td class="n">${r.planned_mh}</td>
        <td class="n">${r.earned_mh}</td>
        <td class="n">${r.spent_mh}</td>
        <td class="n">${r.cpi === null ? "—" : r.cpi.toFixed(2)}</td>
        <td class="n">${r.spi === null ? "—" : r.spi.toFixed(2)}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>EVM Raporu</title>
    <style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:40px;color:#0f172a}
    h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:16px}
    th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:13px}
    th{background:#f8fafc;font-size:11px;text-transform:uppercase;color:#64748b}
    .n{text-align:right;font-variant-numeric:tabular-nums}
    .kpi{border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px}
    .kpi b{font-size:24px;margin-right:24px}</style></head><body>
    <h1>Teknik Ofis — EVM Haftalık Raporu</h1>
    <div class="kpi"><b>CPI ${cpi}</b><b>SPI ${spi}</b><b>Toplam MH ${totalSpent.toLocaleString('tr-TR')}</b></div>
    <table><thead><tr><th>Kod</th><th>Açıklama</th><th>Birim</th><th>Planlanan MH</th><th>Kazanılan MH</th><th>Harcanan MH</th><th>CPI</th><th>SPI</th></tr></thead>
    <tbody>${body}</tbody></table></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (format === "xlsx") {
    const sheetData = [
      ["Kalem Kodu", "Açıklama", "Birim", "Planlanan MH", "Kazanılan MH", "Harcanan MH", "CPI", "SPI"],
      ...rows.map((r) => [
        r.item_code,
        r.description,
        r.unit,
        Number(r.planned_mh),
        Number(r.earned_mh),
        Number(r.spent_mh),
        r.cpi === null ? "" : Number(r.cpi.toFixed(2)),
        r.spi === null ? "" : Number(r.spi.toFixed(2)),
      ]),
      ["TOPLAM", "", "", totalPlanned, totalEarned, totalSpent, cpi, spi],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = [{ wch: 14 }, { wch: 42 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, "EVM");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = `evm_raporu_${new Date().toISOString().slice(0, 10)}.xlsx`;
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const header = "Kalem Kodu\tAçıklama\tBirim\tPlanlanan MH\tKazanılan MH\tHarcanan MH\tCPI\tSPI\n";
  const csvRows = rows.map((r) =>
    [r.item_code, r.description, r.unit, r.planned_mh, r.earned_mh, r.spent_mh, r.cpi === null ? "" : r.cpi.toFixed(2), r.spi === null ? "" : r.spi.toFixed(2)].join("\t")
  );
  const csv = header + csvRows.join("\n") + `\n\nTOPLAM\t\t\t${totalPlanned}\t${totalEarned}\t${totalSpent}\t${cpi}\t${spi}\n`;

  const filename = `evm_raporu_${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}