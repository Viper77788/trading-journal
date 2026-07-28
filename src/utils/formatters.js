export const fmtMoney = (value) => {
  if (value === undefined || value === null) return '$0.00';
  const num = Number(value);
  if (isNaN(num)) return '$0.00';
  return num < 0
    ? `-$${Math.abs(num).toFixed(2)}`
    : `+$${num.toFixed(2)}`;
};

export const fmtDate = (value, timezone = 'America/New_York') => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    if (timezone && timezone !== 'local') {
      options.timeZone = timezone;
    }
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
};

export const resultOf = (trade) => {
  if (trade.tradeResult && trade.tradeResult !== 'Auto') return trade.tradeResult;
  const pl = Number(trade.profitLoss);
  if (pl > 0) return 'Win';
  if (pl < 0) return 'Loss';
  return 'Breakeven';
};

export const setupArray = (trade) => {
  if (!trade.setup) return [];
  if (Array.isArray(trade.setup)) return trade.setup;
  if (typeof trade.setup === 'string') {
    return trade.setup.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

export const isYes = (value) => {
  return value === true || value === 'Yes' || value === 'yes';
};

export function fmtDateTime(value, timezone = 'America/New_York', dateStr = '') {
  if (!value) return '—';
  let dateObj = null;
  const valStr = String(value).trim();

  if (valStr.includes('T')) {
    dateObj = new Date(valStr);
  } else if (valStr.includes(':')) {
    const dStr = dateStr || '2026-01-01';
    dateObj = new Date(`${dStr}T${valStr}:00`);
  } else {
    dateObj = new Date(valStr);
  }

  if (!dateObj || Number.isNaN(dateObj.getTime())) return valStr;

  try {
    const options = { hour: '2-digit', minute: '2-digit', hour12: false };
    if (timezone && timezone !== 'local') {
      options.timeZone = timezone;
    }
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch {
    return valStr;
  }
}
