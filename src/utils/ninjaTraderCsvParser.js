import { DEFAULT_14_RULES, LIQUIDITY_WINDOWS } from '../constants/viperConstants';
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
 * Real NinjaTrader Orders.csv export for LFE05072050930002 ($25k Lucid Flex Account)
 * Note: Raw NinjaTrader CSV timestamps are exported in UTC / Server time.
 */
export const SAMPLE_NINJATRADER_ORDERS_CSV = `orderId,Account,Order ID,B/S,Contract,Product,Product Description,avgPrice,filledQty,Fill Time,lastCommandId,Status,_priceFormat,_priceFormatType,_tickSize,spreadDefinitionId,Version ID,Timestamp,Date,Quantity,Text,Type,Limit Price,Stop Price,decimalLimit,decimalStop,Filled Qty,Avg Fill Price,decimalFillAvg,Venue,Notional Value,Currency
721105890495,LFE05072050930002,721105890495, Sell,MGCZ6,MGC,E-Micro Gold,3916.3,10,11/02/2026 12:01:08,721105890495, Filled,-1,0,0.1,,721105890495,11/02/2026 12:01:00,11/2/26,10,Chart, Stop,,3916.4,,3916.4,10,3916.3,3916.3,,"391,630.00",USD
721105890503,LFE05072050930002,721105890503, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890503, Canceled,-1,0,0.1,,721105890503,11/02/2026 12:01:10,11/2/26,10,Chart, Stop,,3918.3,,3918.3,,,,,,USD
721105890506,LFE05072050930002,721105890506, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890506, Canceled,-1,0,0.1,,721105890506,11/02/2026 12:01:30,11/2/26,10,Chart, Limit,3910.1,,3910.1000000000004,,,,,,,USD
721105890509,LFE05072050930002,721105890509, Buy,MGCZ6,MGC,E-Micro Gold,3917.6,5,11/02/2026 12:04:02,721105890509, Filled,-1,0,0.1,,721105890509,11/02/2026 12:03:33,11/2/26,5,Chart, Stop,,3917.5,,3917.5,5,3917.6,3917.6,,"195,880.00",USD
721105890515,LFE05072050930002,721105890515, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890515, Canceled,-1,0,0.1,,721105890515,11/02/2026 12:03:40,11/2/26,5,Chart, Stop,,3918.3,,3918.3,,,,,,USD
721105890529,LFE05072050930002,721105890529, Buy,MGCZ6,MGC,E-Micro Gold,3918.1,5,11/02/2026 12:04:06,721105890529, Filled,-1,0,0.1,,721105890529,11/02/2026 12:04:06,11/2/26,5,Exit, Market,,,,,5,3918.1,3918.1,,"195,905.00",USD
721105890537,LFE05072050930002,721105890537, Sell,MGCZ6,MGC,E-Micro Gold,3916.6,5,11/02/2026 12:05:03,721105890537, Filled,-1,0,0.1,,721105890537,11/02/2026 12:05:03,11/2/26,5,Chart, Limit,3916.5,,3916.5,,5,3916.6,3916.6,,"195,830.00",USD
721105890543,LFE05072050930002,721105890543, Buy,MGCZ6,MGC,E-Micro Gold,3917.6,5,11/02/2026 12:05:57,721105890543, Filled,-1,0,0.1,,721105890543,11/02/2026 12:05:57,11/2/26,5,Exit, Market,,,,,5,3917.6,3917.6,,"195,880.00",USD
721105890551,LFE05072050930002,721105890551, Sell,MGCZ6,MGC,E-Micro Gold,3916.5,10,11/02/2026 12:07:17,721105890551, Filled,-1,0,0.1,,721105890551,11/02/2026 12:07:17,11/2/26,10,Chart, Market,,,,,10,3916.5,3916.5,,"391,650.00",USD
721105890557,LFE05072050930002,721105890557, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890557, Canceled,-1,0,0.1,,721105890557,11/02/2026 12:07:30,11/2/26,10,Chart, Limit,3910.1,,3910.1000000000004,,,,,,,USD
721105890560,LFE05072050930002,721105890560, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890560, Canceled,-1,0,0.1,,721105890560,11/02/2026 12:07:48,11/2/26,10,Chart, Stop,,3918.9,,3918.9,,,,,,USD
721105890566,LFE05072050930002,721105890566, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890566, Canceled,-1,0,0.1,,721105890566,11/02/2026 12:14:08,11/2/26,10,Chart, Stop,,3916.3,,3916.3,,,,,,USD
721105890575,LFE05072050930002,721105890575, Buy,MGCZ6,MGC,E-Micro Gold,3913.7,10,11/02/2026 12:16:48,721105890575, Filled,-1,0,0.1,,721105890575,11/02/2026 12:16:48,11/2/26,10,Exit, Market,,,,,10,3913.7,3913.7,,"391,370.00",USD
721105890583,LFE05072050930002,721105890583, Sell,NQZ6,NQ,E-Mini NASDAQ 100,,,,721105890583, Rejected,-2,0,0.25,,721105890583,11/02/2026 13:04:19,11/2/26,10,Chart, Market,,,,,,,,,,USD
721105890585,LFE05072050930002,721105890585, Sell,NQZ6,NQ,E-Mini NASDAQ 100,,,,721105890585, Canceled,-2,0,0.25,,721105890585,11/02/2026 13:04:33,11/2/26,1,Chart, Limit,28758.25,,28758.25,,,,,,,USD
721105890588,LFE05072050930002,721105890588, Buy,NQZ6,NQ,E-Mini NASDAQ 100,,,,721105890588, Canceled,-2,0,0.25,,721105890588,11/02/2026 13:04:42,11/2/26,1,Chart, Stop,,28810.50,,28810.5,,,,,,USD
721105890597,LFE05072050930002,721105890597, Sell,MGCZ6,MGC,E-Micro Gold,,,,721105890597, Canceled,-1,0,0.1,,721105890597,11/02/2026 15:36:09,11/2/26,10,Chart, Stop,,3905.2,,3905.2000000000003,,,,,,USD
721105890603,LFE05072050930002,721105890603, Sell,MGCZ6,MGC,E-Micro Gold,3905.1099999999997,10,11/02/2026 15:36:43,721105890603, Filled,-1,0,0.1,,721105890603,11/02/2026 15:36:17,11/2/26,10,Chart, Stop,,3905.2,,3905.2000000000003,10,3905.1,3905.1099999999997,,"390,511.00",USD
721105890612,LFE05072050930002,721105890612, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890612, Canceled,-1,0,0.1,,721105890612,11/02/2026 15:38:32,11/2/26,10,Chart, Stop,,3907.4,,3907.4,,,,,,USD
721105890615,LFE05072050930002,721105890615, Buy,MGCZ6,MGC,E-Micro Gold,3906.6,5,11/02/2026 15:39:48,721105890615, Filled,-1,0,0.1,,721105890615,11/02/2026 15:38:40,11/2/26,5,Chart, Stop,,3906.6,,3906.6000000000004,5,3906.6,3906.6,,"195,330.00",USD
721105890621,LFE05072050930002,721105890621, Buy,MGCZ6,MGC,E-Micro Gold,3907.6,5,11/02/2026 15:44:25,721105890621, Filled,-1,0,0.1,,721105890621,11/02/2026 15:38:46,11/2/26,5,Chart, Stop,,3907.5,,3907.5,5,3907.6,3907.6,,"195,380.00",USD
721105890636,LFE05072050930002,721105890636, Buy,MGCZ6,MGC,E-Micro Gold,3955.7,5,11/02/2026 19:40:53,721105890636, Filled,-1,0,0.1,,721105890636,11/02/2026 19:40:53,11/2/26,5,Mobile Ticket, Market,,,,,5,3955.7,3955.7,,"197,785.00",USD
721105890642,LFE05072050930002,721105890642, Sell,MGCZ6,MGC,E-Micro Gold,,,,721105890653, Canceled,-1,0,0.1,,721105890653,11/02/2026 19:45:32,11/2/26,1,Mobile Chart, Stop,,3946.4,,3946.4,,,,,,USD
721105890645,LFE05072050930002,721105890645, Sell,MGCZ6,MGC,E-Micro Gold,3951.1,5,11/02/2026 19:45:09,721105890645, Filled,-1,0,0.1,,721105890645,11/02/2026 19:45:09,11/2/26,5,Mobile Ticket, Market,,,,,5,3951.1,3951.1,,"197,555.00",USD
721105890660,LFE05072050930002,721105890660, Sell,MGCZ6,MGC,E-Micro Gold,,,,721105890675, Canceled,-1,0,0.1,,721105890675,11/02/2026 19:46:00,11/2/26,1,Mobile Chart, Stop,,3945.5,,3945.5,,,,,,USD
721105890682,LFE05072050930002,721105890682, Sell,MGCZ6,MGC,E-Micro Gold,,,,721105890682, Canceled,-1,0,0.1,,721105890682,11/02/2026 19:46:27,11/2/26,5,Mobile Chart, Stop,,3945.4,,3945.4,,,,,,USD
721105890688,LFE05072050930002,721105890688, Buy,MGCZ6,MGC,E-Micro Gold,3960.0,5,11/02/2026 20:00:40,721105890688, Filled,-1,0,0.1,,721105890688,11/02/2026 20:00:19,11/2/26,5,Mobile Chart, Stop,,3960.0,,3960.0,5,3960.0,3960.0,,"198,000.00",USD
721105890694,LFE05072050930002,721105890694, Sell,MGCZ6,MGC,E-Micro Gold,,,,721105890697, Canceled,-1,0,0.1,,721105890697,11/02/2026 20:27:56,11/2/26,5,Mobile Chart, Stop,,3962.8,,3962.8,,,,,,USD
721105890704,LFE05072050930002,721105890704, Sell,MGCZ6,MGC,E-Micro Gold,3975.3,5,11/02/2026 20:29:43,721105890704, Filled,-1,0,0.1,,721105890704,11/02/2026 20:29:43,11/2/26,5,Exit, Market,,,,,5,3975.3,3975.3,,"198,765.00",USD
721105890717,LFE05072050930002,721105890717, Sell,MGCZ6,MGC,E-Micro Gold,,,,721105890717, Canceled,-1,0,0.1,,721105890717,11/03/2026 10:11:33,11/3/26,5,Mobile Chart, Limit,3934.0,,3934.0,,,,,,,USD
721105890723,LFE05072050930002,721105890723, Sell,MGCZ6,MGC,E-Micro Gold,3933.2,5,11/03/2026 10:15:49,721105890723, Filled,-1,0,0.1,,721105890723,11/03/2026 10:12:01,11/3/26,5,Mobile Chart, Limit,3933.2,,3933.2,,5,3933.2,3933.2,,"196,660.00",USD
721105890726,LFE05072050930002,721105890726, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890738, Canceled,-1,0,0.1,,721105890738,11/03/2026 10:17:03,11/3/26,5,Mobile Chart, Stop,,3937.0,,3937.0,,,,,,USD
721105890748,LFE05072050930002,721105890748, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890748, Canceled,-1,0,0.1,,721105890748,11/03/2026 10:24:14,11/3/26,2,Chart, Stop,,3935.9,,3935.9,,,,,,USD
721105890754,LFE05072050930002,721105890754, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890754, Canceled,-1,0,0.1,,721105890754,11/03/2026 10:24:26,11/3/26,3,Chart, Stop,,3938.3,,3938.3,,,,,,USD
721105890763,LFE05072050930002,721105890763, Buy,MGCZ6,MGC,E-Micro Gold,3932.6,5,11/03/2026 10:35:25,721105890763, Filled,-1,0,0.1,,721105890763,11/03/2026 10:35:25,11/3/26,5,Exit, Market,,,,,5,3932.6,3932.6,,"196,630.00",USD
721105890779,LFE05072050930002,721105890779, Sell,MGCZ6,MGC,E-Micro Gold,3926.600000000001,7,11/03/2026 12:15:56,721105890779, Filled,-1,0,0.1,,721105890779,11/03/2026 12:15:56,11/3/26,7,Chart, Market,,,,,7,3926.6,3926.600000000001,,"274,862.00",USD
721105890785,LFE05072050930002,721105890785, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890785, Canceled,-1,0,0.1,,721105890785,11/03/2026 12:16:01,11/3/26,7,Chart, Stop,,3930.8,,3930.8,,,,,,USD
721105890791,LFE05072050930002,721105890791, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890791, Canceled,-1,0,0.1,,721105890791,11/03/2026 12:16:21,11/3/26,7,Chart, Stop,,3929.6,,3929.6000000000004,,,,,,USD
721105890794,LFE05072050930002,721105890794, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890814, Canceled,-1,0,0.1,,721105890814,11/03/2026 12:35:40,11/3/26,4,Chart, Stop,,3925.1,,3925.1,,,,,,USD
721105890800,LFE05072050930002,721105890800, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890810, Canceled,-1,0,0.1,,721105890810,11/03/2026 12:35:34,11/3/26,3,Chart, Stop,,3925.0,,3925.0,,,,,,USD
721105890803,LFE05072050930002,721105890803, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890803, Canceled,-1,0,0.1,,721105890803,11/03/2026 12:18:44,11/3/26,7,Chart, Limit,3916.7,,3916.7000000000003,,,,,,,USD
721105890824,LFE05072050930002,721105890824, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890824, Canceled,-1,0,0.1,,721105890824,11/03/2026 12:37:09,11/3/26,7,Chart, Stop,,3922.7,,3922.7000000000003,,,,,,USD
721105890833,LFE05072050930002,721105890833, Buy,MGCZ6,MGC,E-Micro Gold,3920.600000000001,7,11/03/2026 12:37:21,721105890833, Filled,-1,0,0.1,,721105890833,11/03/2026 12:37:21,11/3/26,7,Exit, Market,,,,,7,3920.6,3920.600000000001,,"274,442.00",USD
721105890841,LFE05072050930002,721105890841, Sell,MGCZ6,MGC,E-Micro Gold,,,,721105890841, Canceled,-1,0,0.1,,721105890841,11/03/2026 13:13:17,11/3/26,3,Chart, Stop,,3917.5,,3917.5,,,,,,USD
721105890847,LFE05072050930002,721105890847, Sell,MGCZ6,MGC,E-Micro Gold,3918.4,5,11/03/2026 13:15:29,721105890847, Filled,-1,0,0.1,,721105890847,11/03/2026 13:15:29,11/3/26,5,Chart, Market,,,,,5,3918.4,3918.4,,"195,920.00",USD
721105890853,LFE05072050930002,721105890853, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890853, Canceled,-1,0,0.1,,721105890853,11/03/2026 13:15:50,11/3/26,5,Chart, Stop,,3921.6,,3921.6000000000004,,,,,,USD
721105890859,LFE05072050930002,721105890859, Buy,MGCZ6,MGC,E-Micro Gold,3920.6,5,11/03/2026 13:16:54,721105890859, Filled,-1,0,0.1,,721105890859,11/03/2026 13:16:54,11/3/26,5,Exit, Market,,,,,5,3920.6,3920.6,,"196,030.00",USD
721105890867,LFE05072050930002,721105890867, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890867, Canceled,-1,0,0.1,,721105890867,11/03/2026 13:19:04,11/3/26,5,Chart, Stop,,3922.9,,3922.9,,,,,,USD
721105890873,LFE05072050930002,721105890873, Sell,MGCZ6,MGC,E-Micro Gold,3913.5,5,11/03/2026 16:02:21,721105890873, Filled,-1,0,0.1,,721105890873,11/03/2026 16:02:21,11/3/26,5,Mobile Ticket, Market,,,,,5,3913.5,3913.5,,"195,675.00",USD
721105890879,LFE05072050930002,721105890879, Buy,MGCZ6,MGC,E-Micro Gold,,,,721105890879, Canceled,-1,0,0.1,,721105890879,11/03/2026 16:02:41,11/3/26,5,Mobile Chart, Stop,,3919.9,,3919.9,,,,,,USD
721105890882,LFE05072050930002,721105890882, Sell,MGCZ6,MGC,E-Micro Gold,3911.4,5,11/03/2026 16:06:21,721105890882, Filled,-1,0,0.1,,721105890882,11/03/2026 16:03:15,11/3/26,5,Mobile Chart, Stop,,3911.4,,3911.4,5,3911.4,3911.4,,"195,570.00",USD
721105890891,LFE05072050930002,721105890891, Buy,MGCZ6,MGC,E-Micro Gold,3914.8,10,11/03/2026 16:20:36,721105890891, Filled,-1,0,0.1,,721105890891,11/03/2026 16:20:36,11/3/26,10,Exit, Market,,,,,10,3914.8,3914.8,,"391,480.00",USD
721105890901,LFE05072050930002,721105890901, Buy,MGCZ6,MGC,E-Micro Gold,3915.0,10,11/03/2026 16:20:48,721105890901, Filled,-1,0,0.1,,721105890901,11/03/2026 16:20:48,11/3/26,10,Chart, Market,,,,,10,3915.0,3915.0,,"391,500.00",USD
721105890907,LFE05072050930002,721105890907, Buy,MGCZ6,MGC,E-Micro Gold,3914.0,10,11/03/2026 16:21:25,721105890907, Filled,-1,0,0.1,,721105890907,11/03/2026 16:21:25,11/3/26,10,Chart, Market,,,,,10,3914.0,3914.0,,"391,400.00",USD
721105890913,LFE05072050930002,721105890913, Sell,MGCZ6,MGC,E-Micro Gold,3912.2,20,11/03/2026 16:23:44,721105890913, Filled,-1,0,0.1,,721105890913,11/03/2026 16:23:44,11/3/26,20,Exit, Market,,,,,20,3912.2,3912.2,,"782,440.00",USD
721105890923,LFE05072050930002,721105890923, Sell,MGCZ6,MGC,E-Micro Gold,3912.2,10,11/03/2026 16:23:46,721105890923, Filled,-1,0,0.1,,721105890923,11/03/2026 16:23:46,11/3/26,10,Chart, Market,,,,,10,3912.2,3912.2,,"391,220.00",USD
721105890929,LFE05072050930002,721105890929, Sell,MGCZ6,MGC,E-Micro Gold,3912.2,10,11/03/2026 16:23:47,721105890929, Filled,-1,0,0.1,,721105890929,11/03/2026 16:23:47,11/3/26,10,Chart, Market,,,,,10,3912.2,3912.2,,"391,220.00",USD
721105890936,LFE05072050930002,721105890936, Buy,MGCZ6,MGC,E-Micro Gold,3915.9,20,11/03/2026 16:30:49,721105890936, Filled,-1,0,0.1,,721105890936,11/03/2026 16:30:49,11/3/26,20,AutoLiq, Market,,,,,20,3915.9,3915.9,,"783,180.00",USD`;

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
 * Parses a raw NinjaTrader CSV timestamp string as UTC/Server time into UTC epoch milliseconds.
 */
export function parseNinjaTimestampUTC(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return null;
  const cleaned = rawStr.trim().replace(/^"|"$/g, '');
  if (!cleaned) return null;

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

    const utcMs = Date.UTC(year, month - 1, day, hour, minute, second);
    if (!Number.isNaN(utcMs)) {
      return utcMs;
    }
  }

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
    const utcMs = Date.UTC(year, month - 1, day, hour, minute, second);
    if (!Number.isNaN(utcMs)) {
      return utcMs;
    }
  }

  const fallback = Date.parse(cleaned);
  return Number.isNaN(fallback) ? null : fallback;
}

/**
 * Formats a shifted UTC epoch millisecond timestamp into date & 12-hour AM/PM time components.
 */
export function formatShiftedUtcParts(shiftedMs, tzSuffix = 'EST') {
  if (shiftedMs === null || shiftedMs === undefined || Number.isNaN(shiftedMs)) {
    return {
      date: '',
      time24: '09:30',
      timeWithSec: '09:30:00',
      formatted12h: `09:30 AM ${tzSuffix}`,
      formatted12hWithSec: `09:30:00 AM ${tzSuffix}`,
      hours24: 9,
      minutes: 30,
      totalMinutes: 570,
    };
  }
  const dt = new Date(shiftedMs);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  const h24 = dt.getUTCHours();
  const minNum = dt.getUTCMinutes();
  const secNum = dt.getUTCSeconds();

  const hh = String(h24).padStart(2, '0');
  const min = String(minNum).padStart(2, '0');
  const sec = String(secNum).padStart(2, '0');

  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = String(h24 % 12 || 12).padStart(2, '0');

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time24: `${hh}:${min}`,
    timeWithSec: `${hh}:${min}:${sec}`,
    formatted12h: `${h12}:${min} ${ampm} ${tzSuffix}`,
    formatted12hWithSec: `${h12}:${min}:${sec} ${ampm} ${tzSuffix}`,
    hours24: h24,
    minutes: minNum,
    totalMinutes: h24 * 60 + minNum + secNum / 60,
  };
}

/**
 * Converts a raw UTC timestamp into Chicago Central Time (CT) first,
 * and then shifts +1h to Eastern Time (ET) so that morning trades
 * (e.g. 5:45 AM / 11:45 AM) display accurately in 12-hour AM/PM EST format.
 *
 * @param {number} utcEpochMs - Raw timestamp parsed as UTC
 * @param {number} utcToCtOffsetHours - Offset from UTC to Chicago Central Time (default -6 for CST, or -5 for CDT)
 */
export function convertUtcToCtAndEt(utcEpochMs, utcToCtOffsetHours = -6) {
  const ctEpochMs = utcEpochMs + utcToCtOffsetHours * 3600 * 1000;
  const etEpochMs = ctEpochMs + 1 * 3600 * 1000; // ET is always +1h from Chicago Central Time (CT)

  const ctParts = formatShiftedUtcParts(ctEpochMs, 'CT');
  const etParts = formatShiftedUtcParts(etEpochMs, 'EST');

  return {
    ctEpochMs,
    etEpochMs,
    ctParts,
    etParts,
  };
}

/**
 * Formats any HH:mm(:ss) or 12h string strictly into 12-hour EST format with AM/PM,
 * e.g. "09:30 AM EST" or "11:44:25 AM EST".
 */
export function formatTime12hEST(rawTimeStr, includeSeconds = false, tzLabel = 'EST') {
  if (!rawTimeStr) return `09:30 AM ${tzLabel}`;
  const cleaned = String(rawTimeStr).trim();

  const ampmMatch = cleaned.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)(?:\s*(?:E[SD]?T|C[SD]?T))?$/i
  );
  if (ampmMatch) {
    const hh = String(Number(ampmMatch[1])).padStart(2, '0');
    const mm = ampmMatch[2];
    const ss = ampmMatch[3];
    const mer = ampmMatch[4].toUpperCase();
    if (includeSeconds && ss) {
      return `${hh}:${mm}:${ss} ${mer} ${tzLabel}`;
    }
    return `${hh}:${mm} ${mer} ${tzLabel}`;
  }

  const parts = cleaned.split(':').map((n) => parseInt(n, 10));
  if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    const h24 = ((parts[0] % 24) + 24) % 24;
    const min = String(parts[1]).padStart(2, '0');
    const sec =
      parts.length >= 3 && !Number.isNaN(parts[2])
        ? String(parts[2]).padStart(2, '0')
        : null;
    const mer = h24 >= 12 ? 'PM' : 'AM';
    const h12 = String(h24 % 12 || 12).padStart(2, '0');
    if (includeSeconds && sec) {
      return `${h12}:${min}:${sec} ${mer} ${tzLabel}`;
    }
    return `${h12}:${min} ${mer} ${tzLabel}`;
  }

  return `${cleaned} ${tzLabel}`;
}

/**
 * Shifts a 24h HH:mm(:ss) string by deltaHours (e.g., -1h to derive CT from ET)
 */
export function shiftTimeStringHours(timeStr = '09:30', deltaHours = 0) {
  if (!timeStr) return '09:30';
  const parts = String(timeStr).split(':').map((n) => parseInt(n, 10));
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return timeStr;
  const totalMinutes = (((parts[0] + deltaHours) % 24) + 24) % 24 * 60 + parts[1];
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  if (parts.length >= 3 && !Number.isNaN(parts[2])) {
    return `${hh}:${mm}:${String(parts[2]).padStart(2, '0')}`;
  }
  return `${hh}:${mm}`;
}

/**
 * Resolves the active Liquidity Window from CT totalMinutes (or ET totalMinutes):
 * - 1–4 AM CT / 2–5 AM ET (Asian/Early London): CT 01:00–04:00 (60..240m) / ET 02:00–05:00 (120..300m)
 * - 8–11 AM CT / 9–12 PM ET (New York Opening Window): CT 08:00–11:00 (480..660m) / ET 09:00–12:00 (540..720m)
 * - Outside Window (all other times)
 */
export function resolveLiquidityWindowFromCTMinutes(ctTotalMinutes) {
  if (ctTotalMinutes === null || ctTotalMinutes === undefined || Number.isNaN(ctTotalMinutes)) {
    return LIQUIDITY_WINDOWS.OUTSIDE;
  }
  if (ctTotalMinutes >= 60 && ctTotalMinutes <= 240) {
    return LIQUIDITY_WINDOWS.ASIAN_LONDON;
  }
  if (ctTotalMinutes >= 480 && ctTotalMinutes <= 660) {
    return LIQUIDITY_WINDOWS.NY_OPEN;
  }
  return LIQUIDITY_WINDOWS.OUTSIDE;
}

/**
 * Resolves the Liquidity Window from an ET 24h time string (e.g. "10:36" -> "8–11 AM CT / 9–12 PM ET")
 */
export function resolveLiquidityWindowFromTime24ET(time24ET = '09:30') {
  if (!time24ET) return LIQUIDITY_WINDOWS.OUTSIDE;
  const parts = String(time24ET).split(':').map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return LIQUIDITY_WINDOWS.OUTSIDE;
  }
  const etMins = parts[0] * 60 + parts[1];
  // 2:00 AM–5:00 AM ET (120..300m) === 1:00 AM–4:00 AM CT
  if (etMins >= 120 && etMins <= 300) {
    return LIQUIDITY_WINDOWS.ASIAN_LONDON;
  }
  // 9:00 AM–12:00 PM ET (540..720m) === 8:00 AM–11:00 AM CT
  if (etMins >= 540 && etMins <= 720) {
    return LIQUIDITY_WINDOWS.NY_OPEN;
  }
  return LIQUIDITY_WINDOWS.OUTSIDE;
}

/**
 * Normalizes any legacy or current sessionWindow string into the 3 canonical Liquidity Window labels:
 * - "1–4 AM CT / 2–5 AM ET"
 * - "8–11 AM CT / 9–12 PM ET"
 * - "Outside Window"
 */
export function normalizeLiquidityWindow(rawWindow, time24ET) {
  if (
    rawWindow === LIQUIDITY_WINDOWS.ASIAN_LONDON ||
    rawWindow === '1:00 AM–4:00 AM' ||
    rawWindow === '2:00 AM–5:00 AM'
  ) {
    return LIQUIDITY_WINDOWS.ASIAN_LONDON;
  }
  if (
    rawWindow === LIQUIDITY_WINDOWS.NY_OPEN ||
    rawWindow === '8:00 AM–11:00 AM' ||
    rawWindow === '9:00 AM–12:00 PM'
  ) {
    return LIQUIDITY_WINDOWS.NY_OPEN;
  }
  if (rawWindow === LIQUIDITY_WINDOWS.OUTSIDE) {
    return LIQUIDITY_WINDOWS.OUTSIDE;
  }
  return resolveLiquidityWindowFromTime24ET(time24ET);
}

/**
 * Returns the contract point multiplier ($ per 1.00 point move per contract).
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
 * Returns human-readable lot type ("Micro" or "Mini/Std")
 */
export function getContractLotType(contractSymbol = 'MGCZ6', productDesc = '') {
  const upper = String(contractSymbol || '').toUpperCase();
  const desc = String(productDesc || '').toLowerCase();
  if (upper.startsWith('M') || desc.includes('micro')) {
    return 'Micro';
  }
  return 'Mini/Std';
}

/**
 * Estimates round-trip futures commission per contract
 */
export function getEstimatedRoundTripCommission(contractSymbol = 'MGCZ6', qty = 1) {
  const upper = String(contractSymbol || '').toUpperCase();
  const perContractRoundTrip = upper.startsWith('MGC')
    ? 1.24
    : upper.startsWith('GC')
    ? 4.6
    : 1.5;
  return Math.round(perContractRoundTrip * qty * 100) / 100;
}

/**
 * Auto-detects account profile from NinjaTrader Account string (e.g. LFE05072050930002 -> $25k Lucid Flex)
 */
export function detectAccountProfile(rawAccountId = '') {
  const upper = String(rawAccountId || '').trim().toUpperCase();
  if (upper.startsWith('LFE')) {
    return ACCOUNT_PROFILES[0];
  }
  if (upper.includes('APEX') || upper.startsWith('PA-')) {
    return ACCOUNT_PROFILES[2];
  }
  return ACCOUNT_PROFILES[0];
}

/**
 * Parses NinjaTrader Orders.csv text:
 * - Strictly filters for `Status.trim() === 'Filled'`
 * - Reads raw CSV timestamps as UTC/Server time, converts them to Chicago Central Time (CT),
 *   and shifts +1h to Eastern Time (ET) in 12-hour AM/PM EST format
 * - Classifies each trade into its Liquidity Window:
 *   - "1–4 AM CT / 2–5 AM ET" (Asian/Early London)
 *   - "8–11 AM CT / 9–12 PM ET" (New York Opening Window)
 *   - "Outside Window"
 * - Extracts exact contract lot count (`10x`, `5x`, `7x`, `20x`)
 * - Flags any trade entered within < 15 minutes of the previous trade's exit Fill Time with
 *   `Revenge Trading (< 15m gap)`
 */
export function parseNinjaTraderOrdersCsv(csvText, options = {}) {
  const {
    accountProfileId = 'lucid-25k',
    utcToCtOffsetHours = -6, // Default UTC -> Chicago Central Time (UTC-6) and +1h to Eastern Time (UTC-5)
    includeCommissions = false,
    defaultRiskPerContract = 50,
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

  const findExactOrPartialColIndices = (candidates) => {
    const normHeaders = rawHeaders.map((h) =>
      h.toLowerCase().replace(/[\s_-]+/g, '')
    );
    const matchedIndices = [];
    candidates.forEach((cand) => {
      const normCand = cand.toLowerCase().replace(/[\s_-]+/g, '');
      normHeaders.forEach((h, idx) => {
        if (h === normCand && !matchedIndices.includes(idx)) {
          matchedIndices.push(idx);
        }
      });
    });
    if (matchedIndices.length > 0) return matchedIndices;

    candidates.forEach((cand) => {
      const normCand = cand.toLowerCase().replace(/[\s_-]+/g, '');
      normHeaders.forEach((h, idx) => {
        if (h.includes(normCand) && !matchedIndices.includes(idx)) {
          matchedIndices.push(idx);
        }
      });
    });
    return matchedIndices;
  };

  const firstNonEmptyFromCols = (cols, indices) => {
    for (const idx of indices) {
      if (idx >= 0 && idx < cols.length) {
        const val = String(cols[idx] ?? '').trim();
        if (val !== '') return val;
      }
    }
    return '';
  };

  const colIndices = {
    orderId: findExactOrPartialColIndices(['Order ID', 'orderId', 'Id']),
    account: findExactOrPartialColIndices(['Account', 'Account Name']),
    side: findExactOrPartialColIndices(['B/S', 'BS', 'Action', 'Side']),
    contract: findExactOrPartialColIndices(['Contract', 'Instrument', 'Symbol']),
    product: findExactOrPartialColIndices(['Product']),
    productDesc: findExactOrPartialColIndices(['Product Description', 'Description']),
    avgPrice: findExactOrPartialColIndices([
      'decimalFillAvg',
      'avgPrice',
      'Avg Fill Price',
      'Avg Price',
      'Fill Price',
    ]),
    filledQty: findExactOrPartialColIndices([
      'filledQty',
      'Filled Qty',
      'Quantity',
      'Qty',
    ]),
    quantity: findExactOrPartialColIndices(['Quantity', 'Filled Qty', 'filledQty']),
    fillTime: findExactOrPartialColIndices(['Fill Time', 'fillTime', 'Execution Time']),
    timestamp: findExactOrPartialColIndices(['Timestamp', 'Order Time', 'Date']),
    status: findExactOrPartialColIndices(['Status', 'Order State']),
    text: findExactOrPartialColIndices(['Text', 'Tag']),
    orderType: findExactOrPartialColIndices(['Type', 'Order Type']),
  };

  const filledOrders = [];
  let skippedOrdersCount = 0;
  const detectedAccountIdsSet = new Set();

  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 4) continue;

    const statusVal = firstNonEmptyFromCols(cols, colIndices.status);
    if (statusVal.trim() !== 'Filled' && statusVal.trim().toLowerCase() !== 'filled') {
      skippedOrdersCount += 1;
      continue;
    }

    const rawPriceStr = firstNonEmptyFromCols(cols, colIndices.avgPrice).replace(
      /[$,\s"]/g,
      ''
    );
    const avgPrice = parseFloat(rawPriceStr);
    if (Number.isNaN(avgPrice) || avgPrice <= 0) {
      skippedOrdersCount += 1;
      continue;
    }

    const rawAccount =
      firstNonEmptyFromCols(cols, colIndices.account) || 'LFE05072050930002';
    detectedAccountIdsSet.add(rawAccount);

    const rawContract = (
      firstNonEmptyFromCols(cols, colIndices.contract) || 'MGCZ6'
    ).toUpperCase();
    const rawProduct = (
      firstNonEmptyFromCols(cols, colIndices.product) || rawContract
    ).toUpperCase();
    const rawProductDesc = firstNonEmptyFromCols(cols, colIndices.productDesc);

    const rawSide = firstNonEmptyFromCols(cols, colIndices.side)
      .trim()
      .toLowerCase();
    const side =
      rawSide === 'buy' || rawSide === 'b'
        ? 'Buy'
        : rawSide === 'sell' || rawSide === 's'
        ? 'Sell'
        : null;

    if (!side) {
      skippedOrdersCount += 1;
      continue;
    }

    const rawQtyStr =
      firstNonEmptyFromCols(cols, colIndices.filledQty) ||
      firstNonEmptyFromCols(cols, colIndices.quantity) ||
      '1';
    const qty = Math.max(
      1,
      parseInt(String(rawQtyStr).replace(/[^\d]/g, ''), 10) || 1
    );

    const rawFillTime =
      firstNonEmptyFromCols(cols, colIndices.fillTime) ||
      firstNonEmptyFromCols(cols, colIndices.timestamp);
    const rawTimestamp =
      firstNonEmptyFromCols(cols, colIndices.timestamp) || rawFillTime;

    const utcEpochMs =
      parseNinjaTimestampUTC(rawFillTime) ?? parseNinjaTimestampUTC(rawTimestamp);
    if (utcEpochMs === null) {
      skippedOrdersCount += 1;
      continue;
    }

    // Step 1: Convert UTC -> Chicago Central Time (CT)
    // Step 2: Shift CT -> Eastern Time (ET) (+1h)
    const { ctEpochMs, etEpochMs } = convertUtcToCtAndEt(
      utcEpochMs,
      Number(utcToCtOffsetHours)
    );

    const orderText = firstNonEmptyFromCols(cols, colIndices.text);
    const orderType = firstNonEmptyFromCols(cols, colIndices.orderType);

    filledOrders.push({
      orderId:
        firstNonEmptyFromCols(cols, colIndices.orderId) || `ord-${i}`,
      account: rawAccount,
      contract: rawContract,
      product: rawProduct,
      productDesc: rawProductDesc,
      side,
      qty,
      avgPrice,
      rawFillTime,
      rawTimestamp,
      utcEpochMs,
      ctEpochMs,
      etEpochMs,
      epochMs: etEpochMs,
      orderText,
      orderType,
    });
  }

  // Sort filled orders chronologically by Fill Time
  filledOrders.sort((a, b) => a.epochMs - b.epochMs);

  // Reconstruct Flat-to-Flat positions per Account + Contract
  const activePositions = new Map();
  const reconstructedTrades = [];

  const finalizePositionToTrade = (pos) => {
    const totalEntryQty = pos.entryLots;
    const totalExitQty = pos.exitLots;
    const matchedQty = Math.max(totalEntryQty, totalExitQty);
    const avgEntryPrice =
      totalEntryQty > 0 ? pos.entryNotional / totalEntryQty : 0;
    const avgExitPrice =
      totalExitQty > 0 ? pos.exitNotional / totalExitQty : avgEntryPrice;

    const direction = pos.openSide === 'Buy' ? 'Long' : 'Short';
    const pointDiff =
      direction === 'Long'
        ? avgExitPrice - avgEntryPrice
        : avgEntryPrice - avgExitPrice;
    const multiplier = getContractMultiplier(pos.contract);
    const grossPnl =
      Math.round(pointDiff * multiplier * matchedQty * 100) / 100;
    const commissions = includeCommissions
      ? getEstimatedRoundTripCommission(pos.contract, matchedQty)
      : 0;
    const netPnl = Math.round((grossPnl - commissions) * 100) / 100;

    const initialRisk = Math.max(50, defaultRiskPerContract * matchedQty);
    const rMultiple = Math.round((netPnl / initialRisk) * 100) / 100;

    const entryCTParts = formatShiftedUtcParts(pos.firstEntryCtMs, 'CT');
    const exitCTParts = formatShiftedUtcParts(pos.lastExitCtMs, 'CT');
    const entryETParts = formatShiftedUtcParts(pos.firstEntryEtMs, 'EST');
    const exitETParts = formatShiftedUtcParts(pos.lastExitEtMs, 'EST');

    const sessionWindow = resolveLiquidityWindowFromCTMinutes(
      entryCTParts.totalMinutes
    );

    const autoProfile = detectAccountProfile(pos.account);
    const effectiveProfile =
      String(pos.account).toUpperCase().startsWith('LFE')
        ? ACCOUNT_PROFILES[0]
        : selectedProfile || autoProfile;

    const lotType = getContractLotType(pos.contract, pos.productDesc);

    reconstructedTrades.push({
      id: `nt-${pos.firstOrderId}-${pos.lastOrderId}-${matchedQty}`,
      accountId: pos.account,
      accountType: effectiveProfile.accountType,
      accountProfileName: effectiveProfile.name,
      accountStartingBalance: effectiveProfile.startingBalance,
      dailyLossLimit: effectiveProfile.dailyLossLimit,
      contract: pos.contract,
      product: pos.product,
      productDesc: pos.productDesc || 'E-Micro Gold',
      lotType,
      direction,
      quantity: matchedQty,
      entryPrice: Math.round(avgEntryPrice * 100) / 100,
      stopLoss:
        direction === 'Long'
          ? Math.round(
              (avgEntryPrice - initialRisk / (multiplier * matchedQty)) * 100
            ) / 100
          : Math.round(
              (avgEntryPrice + initialRisk / (multiplier * matchedQty)) * 100
            ) / 100,
      exitPrice: Math.round(avgExitPrice * 100) / 100,
      grossPnl,
      commissions,
      netPnl,
      initialRisk,
      rMultiple,
      date: entryETParts.date,
      time: entryETParts.time24,
      timeEST: entryETParts.formatted12h,
      timeESTWithSec: entryETParts.formatted12hWithSec,
      exitTime24: exitETParts.time24,
      exitTimeEST: exitETParts.formatted12h,
      exitTimeESTWithSec: exitETParts.formatted12hWithSec,
      timeCT: entryCTParts.formatted12h,
      exitTimeCT: exitCTParts.formatted12h,
      entryEpochMs: pos.firstEntryEtMs,
      exitEpochMs: pos.lastExitEtMs,
      sessionWindow,
      exitReason: pos.lastOrderText || 'Market/Stop',
      source: 'NinjaTrader CSV',
    });
  };

  filledOrders.forEach((order) => {
    const key = `${order.account}__${order.contract}`;
    let pos = activePositions.get(key);

    if (!pos) {
      activePositions.set(key, {
        account: order.account,
        contract: order.contract,
        product: order.product,
        productDesc: order.productDesc,
        openSide: order.side,
        netQty: order.qty,
        entryLots: order.qty,
        entryNotional: order.qty * order.avgPrice,
        exitLots: 0,
        exitNotional: 0,
        firstOrderId: order.orderId,
        lastOrderId: order.orderId,
        firstEntryCtMs: order.ctEpochMs,
        lastExitCtMs: order.ctEpochMs,
        firstEntryEtMs: order.etEpochMs,
        lastExitEtMs: order.etEpochMs,
        lastOrderText: order.orderText,
      });
      return;
    }

    if (order.side === pos.openSide) {
      pos.netQty += order.qty;
      pos.entryLots += order.qty;
      pos.entryNotional += order.qty * order.avgPrice;
      pos.lastOrderId = order.orderId;
      return;
    }

    if (order.qty <= pos.netQty) {
      pos.netQty -= order.qty;
      pos.exitLots += order.qty;
      pos.exitNotional += order.qty * order.avgPrice;
      pos.lastOrderId = order.orderId;
      pos.lastExitCtMs = order.ctEpochMs;
      pos.lastExitEtMs = order.etEpochMs;
      pos.lastOrderText = order.orderText;

      if (pos.netQty === 0) {
        finalizePositionToTrade(pos);
        activePositions.delete(key);
      }
    } else {
      const closeQty = pos.netQty;
      const flipOpenQty = order.qty - closeQty;

      pos.netQty = 0;
      pos.exitLots += closeQty;
      pos.exitNotional += closeQty * order.avgPrice;
      pos.lastOrderId = order.orderId;
      pos.lastExitCtMs = order.ctEpochMs;
      pos.lastExitEtMs = order.etEpochMs;
      pos.lastOrderText = order.orderText;
      finalizePositionToTrade(pos);

      activePositions.set(key, {
        account: order.account,
        contract: order.contract,
        product: order.product,
        productDesc: order.productDesc,
        openSide: order.side,
        netQty: flipOpenQty,
        entryLots: flipOpenQty,
        entryNotional: flipOpenQty * order.avgPrice,
        exitLots: 0,
        exitNotional: 0,
        firstOrderId: order.orderId,
        lastOrderId: order.orderId,
        firstEntryCtMs: order.ctEpochMs,
        lastExitCtMs: order.ctEpochMs,
        firstEntryEtMs: order.etEpochMs,
        lastExitEtMs: order.etEpochMs,
        lastOrderText: order.orderText,
      });
    }
  });

  reconstructedTrades.sort((a, b) => a.entryEpochMs - b.entryEpochMs);

  let revengeTradesCount = 0;
  let runningBalance = selectedProfile.startingBalance;
  const dailyLossByDate = {};

  const finalizedTrades = reconstructedTrades.map((trade, idx) => {
    const prevTrade = idx > 0 ? reconstructedTrades[idx - 1] : null;
    let timeGapFromPrevMins = null;
    let isRevengeTrade = false;

    if (prevTrade && prevTrade.date === trade.date) {
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
    if (trade.exitReason === 'AutoLiq') {
      leakTags.push('Moved Stop Loss');
    }

    let rulesChecked = DEFAULT_14_RULES.map((r) => r.id);
    if (trade.sessionWindow === LIQUIDITY_WINDOWS.OUTSIDE) {
      rulesChecked = rulesChecked.filter((id) => id !== 'r1');
    }
    if (isRevengeTrade) {
      rulesChecked = rulesChecked.filter(
        (id) => id !== 'r14' && id !== 'r4' && id !== 'r3'
      );
    }
    if (trade.exitReason === 'AutoLiq') {
      rulesChecked = rulesChecked.filter((id) => id !== 'r6' && id !== 'r11');
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
          ? `🚨 REVENGE TRADE (< 15m gap): Entered ${timeGapFromPrevMins}m after previous exit.`
          : `Cooldown respected (${timeGapFromPrevMins}m gap).`
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
      notes: `Account ${trade.accountId} • ${trade.quantity}x ${trade.contract} • ${trade.sessionWindow} (${trade.timeCT} / ${trade.timeEST} → ${trade.exitTimeEST}). ${gapNote}`,
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
