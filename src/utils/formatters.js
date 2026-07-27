export const fmtMoney = (value) => {
  if (value === undefined || value === null) return '$0.00';
  const num = Number(value);
  if (isNaN(num)) return '$0.00';
  return num < 0 
    ? `-$${Math.abs(num).toFixed(2)}` 
    : `+$${num.toFixed(2)}`;
};

export const fmtDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
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

export function fmtDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}
