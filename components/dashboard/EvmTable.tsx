import { BarChart3 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { EvmLine } from "@/lib/types";
import { formatMH, formatRatio, cpiTone, spiTone } from "@/lib/types";

export function EvmTable({ lines }: { readonly lines: readonly EvmLine[] }) {
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <span className="rounded-lg bg-slate-100 p-2.5 text-slate-400 dark:bg-slate-800" aria-hidden="true">
          <BarChart3 className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Henüz veri yok</p>
        <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">
          Taşeronlar puantaj girdikçe EVM değerleri burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Kalem Kodu</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead className="text-right">Birim</TableHead>
            <TableHead className="text-right">Planlanan MH</TableHead>
            <TableHead className="text-right">Kazanılan MH</TableHead>
            <TableHead className="text-right">Harcanan MH</TableHead>
            <TableHead className="text-right">CPI</TableHead>
            <TableHead className="text-right">SPI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.work_item_id}>
              <TableCell className="whitespace-nowrap font-mono text-xs text-slate-400">{line.item_code}</TableCell>
              <TableCell className="font-medium text-slate-800 dark:text-slate-100">{line.description}</TableCell>
              <TableCell className="text-right text-slate-400">{line.unit}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMH(Number(line.planned_mh))}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMH(Number(line.earned_mh))}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMH(Number(line.spent_mh))}</TableCell>
              <TableCell className="text-right">
                <Badge variant={cpiTone(line.cpi)}>{formatRatio(line.cpi)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={spiTone(line.spi)}>{formatRatio(line.spi)}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
