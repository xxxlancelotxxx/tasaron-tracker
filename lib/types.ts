// EVM (Earned Value Management) tipleri — Excel'deki "Follow-up Report" modeline dayalı

export interface EvmLine {
  readonly work_item_id: string;
  readonly item_code: string;
  readonly description: string;
  readonly unit: string;
  readonly total_quantity: number;
  readonly planned_mh: number;
  readonly earned_mh: number;
  readonly spent_mh: number;
  readonly cpi: number | null;
  readonly spi: number | null;
}

export interface WeeklyProgress {
  readonly week_number: number;
  readonly week_start: string;
  readonly planned: number;
  readonly earned: number;
  readonly spent: number;
}

export interface TimesheetRow {
  readonly id: string;
  readonly project_id: string;
  readonly subcontractor_id: string;
  readonly work_item_id: string | null;
  readonly tarih: string;
  readonly isci_sayisi: number;
  readonly adam_saat: number;
  readonly kategori: string;
  readonly direk_indirek: string;
  readonly durum: 'taslak' | 'onay_bekliyor' | 'onaylandi' | 'reddedildi';
  readonly notlar: string | null;
  readonly created_at: string;
}

export interface Subcontractor {
  readonly id: string;
  readonly company_name: string;
}

export interface WorkItem {
  readonly id: string;
  readonly item_code: string;
  readonly description: string;
  readonly unit: string;
  readonly planlanan_mh: number;
}

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly code: string | null;
}

export interface DashboardSummary {
  readonly totalPlanned: number;
  readonly totalEarned: number;
  readonly totalSpent: number;
  readonly cpi: number | null;
  readonly spi: number | null;
  readonly physicalProgress: number | null;
  readonly totalSpentMH: number;
  readonly onayBekleyen: number;
}

export function divider(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}

export function formatMH(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
}

export function formatRatio(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(2);
}

export function cpiTone(cpi: number | null): 'good' | 'medium' | 'risk' | 'neutral' {
  if (cpi === null) return 'neutral';
  if (cpi < 0.9) return 'risk';
  if (cpi > 1.1) return 'good';
  return 'medium';
}

export function spiTone(spi: number | null): 'good' | 'medium' | 'risk' | 'neutral' {
  if (spi === null) return 'neutral';
  if (spi < 0.85) return 'risk';
  if (spi > 1.05) return 'good';
  return 'medium';
}
