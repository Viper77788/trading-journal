import { DEFAULT_14_RULES } from '../constants/viperConstants';
import { computeRuleCompliance } from './viperAnalytics';

export const REVENGE_GAP_LABEL = 'Revenge Trading (< 15m gap)';

export const ACCOUNT_PROFILES = [
  {
    id: 'lucid-25k',
    name: '$25k Lucid Flex Account',
    accountType: 'Lucid Flex',
    startingBalance: 25000,
    dailyLossLimit: 600,
    maxDrawdown: 1500,
    prefixMatch: 'LFE',
  },
  {
    id: 'lucid-50k',
    name: '$50k Lucid Flex Account',
    accountType: 'Lucid Flex',
    startingBalance: 50000,
    dailyLossLimit: 1200,
    maxDrawdown: 2500,
    prefixMatch: 'LFE50',
  },
  {
    id: 'apex-25k',
    name: '$25k Apex Trader Funding',
    accountType: 'Apex',
    startingBalance: 25000,
    dailyLossLimit: 600,
    maxDrawdown: 1500,
    prefixMatch: 'APEX',
  },
  {
    id: 'apex-50k',
    name: '$50k Apex Trader Funding',
    accountType: 'Apex',
    startingBalance: 50000,
    dailyLossLimit: 1000,
    maxDrawdown: 2500,
    prefixMatch: 'PA-APEX',
  },
];

/**
 * Sample NinjaTrader Web Orders.csv content (with LFE05072050930002 account,
 * Central Time timestamps, Filled + Cancelled rows, and a <15m revenge trade gap).
 */
export const SAMPLE_NINJATRADER_ORDERS_CSV = `Order ID,Account,Contract,B/S,Quantity,Filled Qty,Order Type,Limit Price,Stop Price,avgPrice,Status,Timestamp,Fill Time
901001,LFE05072050930002,MGCZ6,Buy,2,2,Limit,2741.20,,2741.20,Filled,11/03/2026 08:12:04,11/03/2026 08:12:09
901002,LFE05072050930002,MGCZ6,Sell,2,0,Limit,2749.00,,,Cancelled,11/03/2026 08:12:15,
901003,LFE05072050930002,MGCZ6,Sell,2,2,Market,,,2738.10,Filled,11/03/2026 08:28:40,11/03/2026 08:28:41
901004,LFE05072050930002,MGCZ6,Buy,3,3,Market,,,2738.80,Filled,11/03/2026 08:35:10,11/03/2026 08:35:12
901005,LFE05072050930002,MGCZ6,Sell,3,3,Limit,2745.40,,2745.40,Filled,11/03/2026 08:54:20,11/03/2026 08:54:22
901006,LFE05072050930002,MGCZ6,Sell,2,2,Limit,2751.60,,2751.60,Filled,11/03/2026 09:32:00,11/03/2026 09:32:05
901007,LFE05072050930002,MGCZ6,Buy,2,2,Limit,2744.20,,2744.20,Filled,11/03/2026 10:04:15,11/03/2026 10:04:18
901008,LFE05072050930002,MGCZ6,Buy,2,2,Market,,,2744.90,Filled,11/03/2026 10:11:02,11/03/2026 10:11:05
901009,LFE05072050930002,MGCZ6,Sell,2,2,Stop,,2741.80,2741.80,Filled,11/03/2026 10:19:44,11/03/2026 10:19:45`;

/**
 * Splits a single CSV line respecting quoted fields.
 */
function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses NinjaTrader timestamp string (default Central Time CT) into a Date & structured parts.
 * Supports:
 * - MM/DD/YYYY HH:mm:ss(.SSS) (AM/PM)
 * - YYYY-MM-DD HH:mm:ss(.SSS)
 * - ISO strings
 */
export function parseNinjaTimestamp(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return null;
  const cleaned = rawStr.trim().replace(/^"|"$/g, '');
  if (!cleaned) return null;

  // Match MM/DD/YYYY HH:mm(:ss) (AM/PM)?
  const usMatch = cleaned.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(AM|PM|am|pm)?$/
  );
  if (usMatch) {
    const month = Number(usMatch[1]);
    const day = Number(usMatch[2]);
    let year = Number(usMatch[3]);
    if (year < 100) year += 2000;
    let hour = Number(usMatch[4]);
    const minute = Number(usMatch[5]);
    const second = Number(usMatch[6] || 0);
    const meridiem = usMatch[7]?.toUpperCase();

    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;

    const dt = new Date(year, month - 1, day, hour, minute, second);
    if (!Number.isNaN(dt.getTime())) {
      return dt;
    }
  }

  // Match YYYY-MM-DD HH:mm(:ss)
  const isoMatch = cleaned.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?/
  );
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const hour = Number(isoMatch[4]);
    const minute = Number(isoMatch[5]);
    const second = Number(isoMatch[6] || 0);
    const dt = new Date(year, month - 1, day, hour, minute, second);
    if (!Number.isNaN(dt.getTime())) {
      return dt;
    }
  }

  const fallback = new Date(cleaned);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Formats Date object into YYYY-MM-DD and HH:mm(:ss)
 */
export function formatDateTimeParts(dateObj) {
  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    return { date: '', time24: '00:00', timeWithSec: '00:00:00', display12h: '12:00 AM' };
  }
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const min = String(dateObj.getMinutes()).padStart(2, '0');
  const sec = String(dateObj.getSeconds()).padStart(2, '0');

  const h24 = dateObj.getHours();
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time24: `${hh}:${min}`,
    timeWithSec: `${hh}:${min}:${sec}`,
    display12h: `${h12}:${min}:${sec} ${ampm}`,
    displayShort12h: `${h12}:${min} ${ampm}`,
  };
}

/**
 * Adds hours to a Date instance (e.g. +1 hour to convert Chicago Time CT -> New York Time ET)
 */
export function addHours(dateObj, hours) {
  if (!dateObj) return null;
  return new Date(dateObj.getTime() + hours * 3600 * 1000);
}

/**
 * Converts a HH:mm (or HH:mm:ss) time string from CT to ET (+1h) or ET to CT (-1h).
 */
export function shiftTimeStringHours(timeStr = '08:30', deltaHours = 1) {
  if (!timeStr) return '';
  const parts = timeStr.split(':').map((n) => parseInt(n, 10));
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return timeStr;
  const totalMinutes = ((parts[0] + deltaHours) % 24 + 24) % 24 * 60 + parts[1];
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  if (parts.length >= 3 && !Number.isNaN(parts[2])) {
    return `${hh}:${mm}:${String(parts[2]).padStart(2, '0')}`;
  }
  return `${hh}:${mm}`;
}

/**
 * Determines Viper liquidity session window from Central Time (CT) & Eastern Time (ET)
 * Liquidity Windows:
 * - Asian/London Window: 1:00 AM–4:00 AM CT (2:00 AM–5:00 AM ET)
 * - NY Opening Window:   8:00 AM–11:00 AM CT (9:00 AM–12:00 PM ET)
 * Also supports checking if trader aligns to 1-4 AM / 8-11 AM in either CT or ET.
 */
export function resolveSessionWindowFromCT(ctDateObj) {
  if (!ctDateObj) return 'Outside Window';
  const ctMinutes = ctDateObj.getHours() * 60 + ctDateObj.getMinutes();

  // 1:00 AM - 4:00 AM CT (01:00 to 04:00 CT / 02:00 to 05:00 ET)
  if (ctMinutes >= 60 && ctMinutes <= 240) {
    return '1:00 AM–4:00 AM';
  }
  // 8:00 AM - 11:00 AM CT (08:00 to 11:00 CT / 09:00 to 12:00 ET)
  // Also cover 07:00-08:00 CT (which is 08:00-09:00 ET) so 8:00 AM ET and 8:00 AM CT both map cleanly
  if (ctMinutes >= 420 && ctMinutes <= 660) {
    return '8:00 AM–11:00 AM';
  }
  return 'Outside Window';
}

/**
 * Returns the contract point multiplier ($ per 1.00 point move per contract).
 * - MGC / MGCZ6 (Micro Gold): $10 per point ($1.00 per 0.1 tick)
 * - GC / GCZ6 (Standard Gold): $100 per point ($10.00 per 0.1 tick)
 */
export function getContractMultiplier(contractSymbol = 'MGCZ6') {
  const upper = String(contractSymbol || '').toUpperCase();
  if (upper.startsWith('MGC')) return 10;
  if (upper.startsWith('GC')) return 100;
  if (upper.startsWith('MNQ')) return 2;
  if (upper.startsWith('NQ')) return 20;
  if (upper.startsWith('MES')) return 5;
  if (upper.startsWith('ES')) return 50;
  return 10;
}

/**
 * Estimates round-trip futures commission per contract
 */
export function getEstimatedRoundTripCommission(contractSymbol = 'MGCZ6', qty = 1) {
  const upper = String(contractSymbol || '').toUpperCase();
  const perContractRoundTrip = upper.startsWith('MGC') ? 1.24 : upper.startsWith('GC') ? 4.6 : 1.5;
  return Math.round(perContractRoundTrip * qty * 100) / 100;
}

/**
 * Auto-detects account profile from NinjaTrader Account string (e.g. LFE05072050930002 -> Lucid Flex $25k)
 */
export function detectAccountProfile(rawAccountId = '') {
  const upper = String(rawAccountId || '').toUpperCase();
  if (upper.startsWith('LFE')) {
    return ACCOUNT_PROFILES[0]; // $25k Lucid Flex Account ($600 Daily Loss Cap)
  }
  if (upper.includes('APEX') || upper.startsWith('PA-')) {
    return ACCOUNT_PROFILES[2]; // $25k Apex
  }
  return ACCOUNT_PROFILES[0];
}

/**
 * Parses NinjaTrader Orders.csv text, filters for Status === 'Filled' with avgPrice present,
 * pairs Buy/Sell executions into round-trip trades via FIFO position matching,
 * converts Central Time (CT) & Eastern Time (ET) (+1h), maps to account size & $600 daily loss cap,
 * and flags any consecutive trade entered within < 15 minutes of the previous trade's Fill Time close.
 */
export function parseNinjaTraderOrdersCsv(csvText, options = {}) {
  const {
    accountProfileId = 'lucid-25k',
    sourceTimezone = 'CT', // 'CT' (Chicago default) or 'ET'
    includeCommissions = true,
    defaultRiskPerContract = 100, // $100 initial risk baseline per MGC contract for R-multiple calc
  } = options;

  const selectedProfile =
    ACCOUNT_PROFILES.find((p) => p.id === accountProfileId) || ACCOUNT_PROFILES[0];

  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      error: 'CSV file is empty or missing data rows.',
      totalRows: 0,
      filledOrdersCount: 0,
      skippedOrdersCount: 0,
      revengeTradesCount: 0,
      trades: [],
      detectedAccountIds: [],
    };
  }

  const rawHeaders = splitCsvLine(lines[0]).map((h) =>
    h.replace(/^"|"$/g, '').trim()
  );

  const findColIndex = (candidates) => {
    const lowerHeaders = rawHeaders.map((h) => h.toLowerCase().replace(/[\s_-]+/g, ''));
    for (const cand of candidates) {
      const normCand = cand.toLowerCase().replace(/[\s_-]+/g, '');
      const idx = lowerHeaders.findIndex((h) => h === normCand || h.includes(normCand));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colMap = {
    orderId: findColIndex(['Order ID', 'orderId', 'Id']),
    account: findColIndex(['Account', 'Account Name', 'AccountId']),
    contract: findColIndex(['Contract', 'Instrument', 'Product', 'Symbol']),
    side: findColIndex(['B/S', 'BS', 'Action', 'Side', 'Buy/Sell']),
    quantity: findColIndex(['Quantity', 'Order Qty', 'Qty']),
    filledQty: findColIndex(['Filled Qty', 'filledQty', 'Filled', 'Fill Qty']),
    avgPrice: findColIndex(['avgPrice', 'Avg Fill Price', 'Avg Price', 'Fill Price', 'Price']),
    status: findColIndex(['Status', 'Order State', 'State']),
    fillTime: findColIndex(['Fill Time', 'fillTime', 'Execution Time', 'Close Time']),
    timestamp: findColIndex(['Timestamp', 'Time', 'Order Time', 'Date']),
  };

  const filledOrders = [];
  let skippedOrdersCount = 0;
  const detectedAccountIdsSet = new Set();

  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 3) continue;

    const statusVal = colMap.status !== -1 ? (cols[colMap.status] || '').trim() : 'Filled';
    const isFilled = statusVal.toLowerCase() === 'filled';

    const rawAvgPrice = colMap.avgPrice !== -1 ? cols[colMap.avgPrice] : '';
    const cleanPriceStr = String(rawAvgPrice || '').replace(/[$,\s]/g, '');
    const avgPrice = parseFloat(cleanPriceStr);

    if (!isFilled || Number.isNaN(avgPrice) || avgPrice <= 0) {
      skippedOrdersCount += 1;
      continue;
    }

    const rawAccount =
      colMap.account !== -1 && cols[colMap.account]
        ? cols[colMap.account].trim()
        : 'LFE05072050930002';
    if (rawAccount) detectedAccountIdsSet.add(rawAccount);

    const rawContract =
      colMap.contract !== -1 && cols[colMap.contract]
        ? cols[colMap.contract].trim().toUpperCase()
        : 'MGCZ6';

    const rawSide =
      colMap.side !== -1 && cols[colMap.side] ? cols[colMap.side].trim().toLowerCase() : '';
    const side =
      rawSide === 'b' || rawSide.startsWith('buy')
        ? 'Buy'
        : rawSide === 's' || rawSide.startsWith('sell')
        ? 'Sell'
        : null;

    if (!side) {
      skippedOrdersCount += 1;
      continue;
    }

    const rawFilledQty =
      colMap.filledQty !== -1 && cols[colMap.filledQty] !== ''
        ? cols[colMap.filledQty]
        : colMap.quantity !== -1
        ? cols[colMap.quantity]
        : '1';
    const qty = Math.max(1, parseInt(String(rawFilledQty).replace(/[^\d]/g, ''), 10) || 1);

    const rawFillTime =
      colMap.fillTime !== -1 && cols[colMap.fillTime]
        ? cols[colMap.fillTime]
        : colMap.timestamp !== -1
        ? cols[colMap.timestamp]
        : '';
    const rawTimestamp =
      colMap.timestamp !== -1 && cols[colMap.timestamp]
        ? cols[colMap.timestamp]
        : rawFillTime;

    const parsedFillDt = parseNinjaTimestamp(rawFillTime) || parseNinjaTimestamp(rawTimestamp);
    if (!parsedFillDt) {
      skippedOrdersCount += 1;
      continue;
    }

    // Normalize to Central Time (CT) and Eastern Time (ET = CT + 1 hour)
    const ctDateObj =
      sourceTimezone === 'ET' ? addHours(parsedFillDt, -1) : parsedFillDt;
    const etDateObj =
      sourceTimezone === 'ET' ? parsedFillDt : addHours(parsedFillDt, 1);

    filledOrders.push({
      orderId:
        colMap.orderId !== -1 && cols[colMap.orderId]
          ? cols[colMap.orderId]
          : `ord-${i}`,
      account: rawAccount,
      contract: rawContract,
      side,
      qty,
      avgPrice,
      rawFillTime,
      rawTimestamp,
      ctDateObj,
      etDateObj,
      epochMs: ctDateObj.getTime(),
    });
  }

  // Sort filled orders chronologically by Fill Time
  filledOrders.sort((a, b) => a.epochMs - b.epochMs);

  // Pair Filled Buy/Sell orders into round-trip trades per Account + Contract via FIFO queue
  const openQueues = new Map();
  const reconstructedTrades = [];

  filledOrders.forEach((order) => {
    const key = `${order.account}__${order.contract}`;
    if (!openQueues.has(key)) {
      openQueues.set(key, []);
    }
    const queue = openQueues.get(key);

    let remainingQty = order.qty;

    while (remainingQty > 0 && queue.length > 0 && queue[0].side !== order.side) {
      const openLeg = queue[0];
      const matchedQty = Math.min(remainingQty, openLeg.remainingQty);

      const direction = openLeg.side === 'Buy' ? 'Long' : 'Short';
      const entryPrice = openLeg.avgPrice;
      const exitPrice = order.avgPrice;
      const pointDiff =
        direction === 'Long' ? exitPrice - entryPrice : entryPrice - exitPrice;
      const multiplier = getContractMultiplier(order.contract);
      const grossPnl = Math.round(pointDiff * multiplier * matchedQty * 100) / 100;
      const commissions = includeCommissions
        ? getEstimatedRoundTripCommission(order.contract, matchedQty)
        : 0;
      const netPnl = Math.round((grossPnl - commissions) * 100) / 100;

      const initialRisk = Math.max(50, defaultRiskPerContract * matchedQty);
      const rMultiple = Math.round((netPnl / initialRisk) * 100) / 100;

      const ctEntryParts = formatDateTimeParts(openLeg.ctDateObj);
      const etEntryParts = formatDateTimeParts(openLeg.etDateObj);
      const ctExitParts = formatDateTimeParts(order.ctDateObj);
      const etExitParts = formatDateTimeParts(order.etDateObj);

      const sessionWindow = resolveSessionWindowFromCT(openLeg.ctDateObj);
      const autoProfile = detectAccountProfile(order.account);
      const effectiveProfile = selectedProfile || autoProfile;

      reconstructedTrades.push({
        id: `nt-${openLeg.orderId}-${order.orderId}-${matchedQty}`,
        accountId: order.account,
        accountType: effectiveProfile.accountType,
        accountProfileName: effectiveProfile.name,
        accountStartingBalance: effectiveProfile.startingBalance,
        dailyLossLimit: effectiveProfile.dailyLossLimit,
        contract: order.contract,
        direction,
        quantity: matchedQty,
        entryPrice,
        stopLoss:
          direction === 'Long'
            ? Math.round((entryPrice - initialRisk / (multiplier * matchedQty)) * 100) / 100
            : Math.round((entryPrice + initialRisk / (multiplier * matchedQty)) * 100) / 100,
        exitPrice,
        grossPnl,
        commissions,
        netPnl,
        initialRisk,
        rMultiple,
        // Date & Time fields (CT and ET)
        date: ctEntryParts.date,
        time: ctEntryParts.time24, // CT HH:mm
        timeCT: ctEntryParts.timeWithSec,
        timeET: etEntryParts.timeWithSec,
        exitTimeCT: ctExitParts.timeWithSec,
        exitTimeET: etExitParts.timeWithSec,
        entryEpochMs: openLeg.epochMs,
        exitEpochMs: order.epochMs,
        rawEntryFillTime: openLeg.rawFillTime,
        rawExitFillTime: order.rawFillTime,
        sessionWindow,
        zoneInteraction:
          direction === 'Long' ? 'Support (#386641)' : 'Resistance (#BC4749)',
        source: 'NinjaTrader CSV',
      });

      openLeg.remainingQty -= matchedQty;
      remainingQty -= matchedQty;
      if (openLeg.remainingQty <= 0) {
        queue.shift();
      }
    }

    if (remainingQty > 0) {
      queue.push({
        ...order,
        remainingQty,
      });
    }
  });

  // Sort reconstructed trades chronologically by entry time
  reconstructedTrades.sort((a, b) => a.entryEpochMs - b.entryEpochMs);

  // Evaluate 15-Minute Revenge Trading Rule across consecutive trades & Running Account Balance
  let revengeTradesCount = 0;
  let runningBalance = selectedProfile.startingBalance;
  const dailyLossByDate = {};

  const finalizedTrades = reconstructedTrades.map((trade, idx) => {
    const prevTrade = idx > 0 ? reconstructedTrades[idx - 1] : null;
    let timeGapFromPrevMins = null;
    let isRevengeTrade = false;

    if (prevTrade && prevTrade.date === trade.date) {
      // Elapsed minutes between Fill Time of previous closed trade and Fill Time (entry) of next trade
      const diffMs = trade.entryEpochMs - prevTrade.exitEpochMs;
      const diffMins = Math.round((diffMs / 60000) * 10) / 10;
      timeGapFromPrevMins = diffMins;

      if (diffMins >= 0 && diffMins < 15) {
        isRevengeTrade = true;
        revengeTradesCount += 1;
      }
    }

    const leakTags = [];
    if (isRevengeTrade) {
      leakTags.push(REVENGE_GAP_LABEL);
    }
    if (trade.sessionWindow === 'Outside Window') {
      leakTags.push('Session Outside Window');
    }

    // Determine 14-rule checklist compliance
    let rulesChecked = DEFAULT_14_RULES.map((r) => r.id);
    if (trade.sessionWindow === 'Outside Window') {
      rulesChecked = rulesChecked.filter((id) => id !== 'r1');
    }
    if (isRevengeTrade) {
      // Uncheck Rule #14 (Zero Emotional / FOMO / Revenge Impulse) and Rule #4 / #12 cooldown discipline
      rulesChecked = rulesChecked.filter(
        (id) => id !== 'r14' && id !== 'r4' && id !== 'r3'
      );
    }

    const { score, grade } = computeRuleCompliance(
      rulesChecked,
      DEFAULT_14_RULES.length
    );

    runningBalance = Math.round((runningBalance + trade.netPnl) * 100) / 100;
    dailyLossByDate[trade.date] =
      (dailyLossByDate[trade.date] || 0) + trade.netPnl;
    const dayNet = dailyLossByDate[trade.date];
    const dayLossUsed = dayNet < 0 ? Math.abs(dayNet) : 0;
    const dailyCapUtilizationPct = Math.min(
      100,
      Math.round((dayLossUsed / selectedProfile.dailyLossLimit) * 100)
    );

    const gapNote =
      timeGapFromPrevMins !== null
        ? isRevengeTrade
          ? `🚨 REVENGE TRADE DETECTED: Entered ${timeGapFromPrevMins}m after previous trade closed (< 15m required cooldown).`
          : `Cooldown respected (${timeGapFromPrevMins}m after previous close).`
        : 'First execution of session.';

    return {
      ...trade,
      leakTags,
      rulesChecked,
      complianceScore: score,
      complianceGrade: grade,
      isRevengeTrade,
      timeGapFromPrevMins,
      accountBalanceAfter: runningBalance,
      dailyCapUtilizationPct,
      notes: `Imported from NinjaTrader (${trade.accountId}) • Qty: ${trade.quantity} • Fill CT: ${trade.timeCT} → ${trade.exitTimeCT} (ET: ${trade.timeET} → ${trade.exitTimeET}). ${gapNote}`,
    };
  });

  return {
    error: null,
    totalRows: lines.length - 1,
    filledOrdersCount: filledOrders.length,
    skippedOrdersCount,
    revengeTradesCount,
    trades: finalizedTrades,
    detectedAccountIds: Array.from(detectedAccountIdsSet),
    selectedProfile,
    endingBalance: runningBalance,
  };
}

/**
 * Evaluates an entire array of trades (including manually logged + CSV imported)
 * to ensure any consecutive trades within < 15 minutes on the same date are flagged.
 */
export function auditRevengeTradingGaps(trades = []) {
  const chronological = [...trades].sort((a, b) => {
    const dtA = `${a.date || ''}T${a.timeCT || a.time || '00:00'}`;
    const dtB = `${b.date || ''}T${b.timeCT || b.time || '00:00'}`;
    return dtA.localeCompare(dtB);
  });

  const auditedIds = new Map();

  for (let i = 0; i < chronological.length; i += 1) {
    const curr = chronological[i];
    const prev = i > 0 ? chronological[i - 1] : null;

    if (curr.timeGapFromPrevMins !== undefined && curr.timeGapFromPrevMins !== null) {
      auditedIds.set(curr.id, {
        timeGapFromPrevMins: curr.timeGapFromPrevMins,
        isRevengeTrade: curr.timeGapFromPrevMins >= 0 && curr.timeGapFromPrevMins < 15,
      });
      continue;
    }

    if (prev && prev.date === curr.date) {
      const prevCloseTime = prev.exitTimeCT || prev.timeCT || prev.time || '00:00';
      const currOpenTime = curr.timeCT || curr.time || '00:00';

      const toMins = (str) => {
        const p = String(str).split(':').map(Number);
        if (p.length < 2 || Number.isNaN(p[0]) || Number.isNaN(p[1])) return null;
        return p[0] * 60 + p[1] + (p[2] ? p[2] / 60 : 0);
      };

      const prevM = toMins(prevCloseTime);
      const currM = toMins(currOpenTime);
      if (prevM !== null && currM !== null) {
        const gap = Math.round((currM - prevM) * 10) / 10;
        auditedIds.set(curr.id, {
          timeGapFromPrevMins: gap,
          isRevengeTrade: gap >= 0 && gap < 15,
        });
      }
    }
  }

  return auditedIds;
}
