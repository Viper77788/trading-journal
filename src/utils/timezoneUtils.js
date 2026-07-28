export const TRADINGVIEW_TIMEZONES = [
  { value: 'America/New_York', label: '(UTC-4) New York' },
  { value: 'Exchange', label: 'Exchange (New York)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Pacific/Honolulu', label: '(UTC-10) Honolulu' },
  { value: 'America/Anchorage', label: '(UTC-8) Anchorage' },
  { value: 'America/Juneau', label: '(UTC-8) Juneau' },
  { value: 'America/Los_Angeles', label: '(UTC-7) Los Angeles' },
  { value: 'America/Phoenix', label: '(UTC-7) Phoenix' },
  { value: 'America/Vancouver', label: '(UTC-7) Vancouver' },
  { value: 'America/Denver', label: '(UTC-6) Denver' },
  { value: 'America/Mexico_City', label: '(UTC-6) Mexico City' },
  { value: 'America/El_Salvador', label: '(UTC-6) San Salvador' },
  { value: 'America/Bogota', label: '(UTC-5) Bogota' },
  { value: 'America/Chicago', label: '(UTC-5) Chicago' },
  { value: 'America/Lima', label: '(UTC-5) Lima' },
  { value: 'America/Caracas', label: '(UTC-4) Caracas' },
  { value: 'America/Santiago', label: '(UTC-4) Santiago' },
  { value: 'America/Toronto', label: '(UTC-4) Toronto' },
  { value: 'America/Argentina/Buenos_Aires', label: '(UTC-3) Buenos Aires' },
  { value: 'America/Halifax', label: '(UTC-3) Halifax' },
  { value: 'America/Sao_Paulo', label: '(UTC-3) Sao Paulo' },
  { value: 'Atlantic/Azores', label: '(UTC-1) Azores' },
  { value: 'Atlantic/Reykjavik', label: '(UTC) Reykjavik' },
  { value: 'Europe/London', label: '(UTC+1) London' },
  { value: 'Europe/Paris', label: '(UTC+2) Paris' },
  { value: 'Europe/Berlin', label: '(UTC+2) Berlin' },
  { value: 'Asia/Dubai', label: '(UTC+4) Dubai' },
  { value: 'Asia/Kolkata', label: '(UTC+5:30) Kolkata / India' },
  { value: 'Asia/Bangkok', label: '(UTC+7) Bangkok' },
  { value: 'Asia/Singapore', label: '(UTC+8) Singapore' },
  { value: 'Asia/Hong_Kong', label: '(UTC+8) Hong Kong' },
  { value: 'Asia/Tokyo', label: '(UTC+9) Tokyo' },
  { value: 'Australia/Sydney', label: '(UTC+10) Sydney' }
];

export const getBrowserTimezone = () => {
  return 'America/New_York';
};

export const getAllSupportedTimezones = () => {
  return TRADINGVIEW_TIMEZONES;
};

/**
 * Parses trade entry/exit time treating manual inputs as America/New_York (UTC-4)
 */
const parseBaseNyTimestamp = (timestamp, tradeDate) => {
  if (!timestamp) return null;

  // If already full ISO string (e.g. from MT5 import)
  if (typeof timestamp === 'string' && timestamp.includes('T')) {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) return d;
  }

  // If HH:MM time string, combine with tradeDate in NY local time
  if (typeof timestamp === 'string') {
    const match = timestamp.trim().match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const dateStr = tradeDate || new Date().toISOString().split('T')[0];
      const hh = String(match[1]).padStart(2, '0');
      const mm = String(match[2]).padStart(2, '0');
      
      // Parse as America/New_York time
      // Construct ISO string with -04:00 offset (EDT) or -05:00 offset (EST)
      const nyIso = `${dateStr}T${hh}:${mm}:00-04:00`;
      const d = new Date(nyIso);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const fallback = new Date(timestamp);
  return isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Format timestamp in target user timezone
 * If target timezone is America/New_York, Exchange, or UTC-4, preserves original NY logged time.
 */
export const formatInUserTimezone = (timestamp, userTimezone = 'America/New_York', options = {}, tradeDate = null) => {
  if (!timestamp) return '—';

  // Return raw time if it's already HH:MM and user is on NY / Exchange time
  const targetTz = (userTimezone === 'Exchange' || !userTimezone) ? 'America/New_York' : userTimezone;

  if (targetTz === 'America/New_York' && typeof timestamp === 'string' && !timestamp.includes('T')) {
    const match = timestamp.trim().match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      return `${String(match[1]).padStart(2, '0')}:${String(match[2]).padStart(2, '0')}`;
    }
  }

  const dateObj = parseBaseNyTimestamp(timestamp, tradeDate);
  if (!dateObj) return String(timestamp);

  const defaultOptions = {
    timeZone: targetTz,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  };

  try {
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  } catch {
    return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
};

/**
 * Format time only (HH:MM) in user timezone
 */
export const formatTimeInUserTimezone = (timestamp, userTimezone = 'America/New_York', tradeDate = null) => {
  const targetTz = (userTimezone === 'Exchange' || !userTimezone) ? 'America/New_York' : userTimezone;

  // If user is on NY / Exchange timezone and trade time is HH:MM, return exactly as logged
  if (targetTz === 'America/New_York' && typeof timestamp === 'string' && !timestamp.includes('T')) {
    const match = timestamp.trim().match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      return `${String(match[1]).padStart(2, '0')}:${String(match[2]).padStart(2, '0')}`;
    }
  }

  return formatInUserTimezone(timestamp, userTimezone, {
    year: undefined,
    month: undefined,
    day: undefined,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }, tradeDate);
};
