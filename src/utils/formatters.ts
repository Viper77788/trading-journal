export function formatCurrency(value: number, showSign = false): string {
  const num = Number.isFinite(value) ? value : 0;
  const absFormatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (num > 0) {
    return showSign ? `+$${absFormatted}` : `$${absFormatted}`;
  }
  if (num < 0) {
    return `-$${absFormatted}`;
  }
  return '$0.00';
}

export function formatCompactCurrency(value: number): string {
  const num = Number.isFinite(value) ? value : 0;
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 10_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  }
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatPercent(value: number, decimals = 1, showSign = false): string {
  const num = Number.isFinite(value) ? value : 0;
  const prefix = showSign && num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(decimals)}%`;
}

export function formatRMultiple(value: number): string {
  const num = Number.isFinite(value) ? value : 0;
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(2)}R`;
}

export function getTodayDateISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftDateISO(dateIso: string, deltaDays: number): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const ny = dt.getUTCFullYear();
  const nm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(dt.getUTCDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function formatReadableDate(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  if (!y || !m || !d) return dateIso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
