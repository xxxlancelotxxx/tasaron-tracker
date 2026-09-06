"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import type { WeeklyProgress } from "@/lib/types";

function formatTooltipValue(value: ValueType): string {
  return typeof value === "number" ? value.toFixed(2) : String(value);
}

export function EvmTrendChart({ data }: { readonly data: readonly WeeklyProgress[] }) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 px-6 text-center dark:border-slate-700">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Henüz grafik verisi yok</p>
        <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">
          Haftalık ilerleme verisi oluştuğunda PV, EV, AC ve performans oranları burada görünecek.
        </p>
      </div>
    );
  }

  const chartData = data.map((week) => ({
    week: `H${week.week_number}`,
    planned: week.planned,
    earned: week.earned,
    spent: week.spent,
    spi: week.planned > 0 ? week.earned / week.planned : null,
    cpi: week.spent > 0 ? week.earned / week.spent : null,
  }));

  return (
    <div aria-label="Haftalık kümülatif planlanan, kazanılan ve harcanan adam-saat ile SPI ve CPI grafiği" className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={4} />
          <YAxis yAxisId="mh" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} width={42} />
          <YAxis yAxisId="ratio" orientation="right" domain={[0, "auto"]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} width={34} />
          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
              fontSize: "12px",
              padding: "8px 12px",
            }}
            labelStyle={{ fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}
            formatter={(value: ValueType, name: NameType) => [formatTooltipValue(value), String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} iconType="plainline" iconSize={14} />
          <Line yAxisId="mh" type="monotone" dataKey="planned" name="Planlanan MH" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls />
          <Line yAxisId="mh" type="monotone" dataKey="earned" name="Kazanılan MH" stroke="#16a34a" strokeWidth={2} dot={false} connectNulls />
          <Line yAxisId="mh" type="monotone" dataKey="spent" name="Harcanan MH" stroke="#dc2626" strokeWidth={2} dot={false} connectNulls />
          <Line yAxisId="ratio" type="monotone" dataKey="spi" name="SPI" stroke="#d97706" strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls />
          <Line yAxisId="ratio" type="monotone" dataKey="cpi" name="CPI" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="2 3" dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
