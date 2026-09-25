import type { Currency, TimeFormat } from '../types/settings';

const EUR_RATE = 0.92;

export function truncateMiddle(value: string, start = 6, end = 4): string {
  if (value.length <= start + end + 1) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

export function formatNumber(value: number, maxFraction = 0): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFraction }).format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatMoney(usd: number, currency: Currency = 'USD', options: {compact?: boolean;} = {}): string {
  const amount = currency === 'EUR' ? usd * EUR_RATE : usd;
  const large = Math.abs(amount) >= 1000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: options.compact ? 'compact' : 'standard',
    maximumFractionDigits: options.compact ? 1 : large ? 0 : 2,
    minimumFractionDigits: options.compact ? 0 : large ? 0 : 2
  }).format(amount);
}

export function formatAmount(amount: string | number, symbol: string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return `${formatNumber(n, n < 1 ? 8 : 4)} ${symbol}`;
}

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(ts);
}

export function formatMonthYear(ts: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(ts);
}

export function formatTime(ts: number, timeFormat: TimeFormat = '24h'): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: timeFormat === '12h' ? 'h12' : 'h23',
    timeZone: 'UTC'
  }).format(ts);
}

export function formatDateTime(ts: number, timeFormat: TimeFormat = '24h'): string {
  return `${formatDate(ts)} · ${formatTime(ts, timeFormat)} UTC`;
}

export function formatRelative(ts: number, now = Date.now()): string {
  const minutes = Math.round(Math.max(0, now - ts) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(ts);
}