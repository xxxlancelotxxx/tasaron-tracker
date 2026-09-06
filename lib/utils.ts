import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null, decimals = 2): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: decimals }).format(value);
}