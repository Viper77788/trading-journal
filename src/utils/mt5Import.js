/**
 * Convert MT5's "YYYY.MM.DD HH:MM:SS" (GMT+3) into an ISO string adjusted to UTC-4 (EST).
 * MT5 brokers typically use GMT+3; offset difference is -7 hours.
 */
export function mt5DateTimeToIso(value) {
  if (!value) return '';
  const s = String(value).trim();
  const m = s.match(/^(\d{4})[.\-](\d{2})[.\-](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return s;
  const [, y, mo, d, h, mi, se] = m;
  const gmt3Ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(se || 0)) - 3 * 60 * 60 * 1000;
  const estMs = gmt3Ms - 4 * 60 * 60 * 1000;
  const est = new Date(estMs);
  const pad = (n) => String(n).padStart(2, '0');
  return `${est.getUTCFullYear()}-${pad(est.getUTCMonth() + 1)}-${pad(est.getUTCDate())}T${pad(est.getUTCHours())}:${pad(est.getUTCMinutes())}:${pad(est.getUTCSeconds())}`;
}

/**
 * Extract YYYY-MM-DD from an MT5 timestamp, after converting GMT+3 to EST.
 */
export function mt5DateToIso(value) {
  if (!value) return '';
  const iso = mt5DateTimeToIso(value);
  return iso ? iso.slice(0, 10) : String(value).trim().slice(0, 10);
}

export function mt5NumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Reads an MT5 "ReportHistory-*.xlsx" workbook (as an ArrayBuffer) and returns
 * an array of trade payloads ready to save to Firestore.
 */
export function parseMt5ReportWorkbook(arrayBuffer, XLSX) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });

  const positionsHeaderIdx = rows.findIndex((r) => String(r[0]).trim() === 'Positions');
  if (positionsHeaderIdx === -1) {
    throw new Error('Could not find a "Positions" section in this file — is it an MT5 Trade History Report?');
  }

  const trades = [];
  for (let i = positionsHeaderIdx + 2; i < rows.length; i++) {
    const row = rows[i];
    const openTime = row[0];
    const positionId = row[1];
    const symbol = row[2];
    if (!openTime || !positionId || !symbol) break;

    const type = String(row[3] || '').toLowerCase();
    const entryPrice = mt5NumberOrNull(row[5]);
    const stopLoss = mt5NumberOrNull(row[6]);
    const takeProfit = mt5NumberOrNull(row[7]);
    const closeTime = row[8];
    const closePrice = mt5NumberOrNull(row[9]);
    const commission = mt5NumberOrNull(row[10]) || 0;
    const swap = mt5NumberOrNull(row[11]) || 0;
    const grossProfit = mt5NumberOrNull(row[12]) || 0;
    const netProfit = grossProfit + commission + swap;

    let rr = null;
    if (entryPrice !== null && stopLoss !== null && takeProfit !== null && entryPrice !== stopLoss) {
      rr = Math.abs(takeProfit - entryPrice) / Math.abs(entryPrice - stopLoss);
      rr = Math.round(rr * 100) / 100;
    }

    trades.push({
      mt5PositionId: String(positionId),
      tradeDate: mt5DateToIso(openTime),
      openTime: mt5DateTimeToIso(openTime),
      closeTime: mt5DateTimeToIso(closeTime),
      pair: String(symbol),
      direction: type === 'sell' ? 'Short' : 'Long',
      entryPrice,
      stopLoss,
      takeProfit,
      profitLoss: Math.round(netProfit * 100) / 100,
      rr,
      tradeResult: netProfit > 0 ? 'Win' : netProfit < 0 ? 'Loss' : 'Breakeven',
      tradingViewLink: '',
      setup: [],
      planFollowed: false,
      previous4HourDirection: false,
      previousWeeklyDirection: false,
      previousDailyDirection: false,
      previous1HourDirection: false,
      leftSideRangeClean: false,
      confidenceScore: 5,
      emotionBeforeTrade: '',
      emotionAfterTrade: '',
      mistakes: '',
      lessons: '',
      comments: `Imported from MT5 — Position #${positionId}, closed ${mt5DateToIso(closeTime)} @ ${closePrice ?? '?'}.`,
      screenshotUrl: '',
    });
  }
  return trades;
}
