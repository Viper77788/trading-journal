export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: '🇺🇸 America/New_York (Eastern Time - US & Canada)' },
  { value: 'Europe/London', label: '🇬🇧 Europe/London (UK & GMT/BST)' },
  { value: 'Asia/Kolkata', label: '🇮🇳 Asia/Kolkata (India Standard Time)' },
  { value: 'Australia/Sydney', label: '🇦🇺 Australia/Sydney (Eastern Australia)' },
  { value: 'Asia/Tokyo', label: '🇯🇵 Asia/Tokyo (Japan Standard Time)' },
  { value: 'UTC', label: '🌐 UTC (Coordinated Universal Time)' },
  { value: 'America/Chicago', label: '🇺🇸 America/Chicago (Central Time)' },
  { value: 'America/Denver', label: '🇺🇸 America/Denver (Mountain Time)' },
  { value: 'America/Los_Angeles', label: '🇺🇸 America/Los_Angeles (Pacific Time)' },
  { value: 'Europe/Paris', label: '🇫🇷 Europe/Paris (Central European Time)' },
  { value: 'Europe/Berlin', label: '🇩🇪 Europe/Berlin (Central European Time)' },
  { value: 'Asia/Dubai', label: '🇦🇪 Asia/Dubai (Gulf Standard Time)' },
  { value: 'Asia/Singapore', label: '🇸🇬 Asia/Singapore (Singapore Time)' },
  { value: 'Asia/Hong_Kong', label: '🇭🇰 Asia/Hong_Kong (Hong Kong Time)' }
];

export const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const getAllSupportedTimezones = () => {
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      const all = Intl.supportedValuesOf('timeZone');
      const commonValues = new Set(COMMON_TIMEZONES.map(t => t.value));
      const rest = all.filter(tz => !commonValues.has(tz)).map(tz => ({
        value: tz,
        label: `📍 ${tz}`
      }));
      return [...COMMON_TIMEZONES, ...rest];
    }
  } catch {
    // Fallback if supportedValuesOf is unavailable
  }
  return COMMON_TIMEZONES;
};

/**
 * Format any ISO date/time timestamp string into the user's chosen IANA timezone
 */
export const formatInUserTimezone = (timestamp, userTimezone = 'UTC', options = {}) => {
  if (!timestamp) return '—';

  let dateObj = null;
  if (timestamp instanceof Date) {
    dateObj = timestamp;
  } else if (typeof timestamp === 'string' && timestamp.includes('T')) {
    dateObj = new Date(timestamp);
  } else {
    dateObj = new Date(timestamp);
  }

  if (isNaN(dateObj.getTime())) return String(timestamp);

  const defaultOptions = {
    timeZone: userTimezone,
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
    return dateObj.toLocaleString();
  }
};

/**
 * Format time only (HH:MM) in user timezone
 */
export const formatTimeInUserTimezone = (timestamp, userTimezone = 'UTC') => {
  return formatInUserTimezone(timestamp, userTimezone, {
    year: undefined,
    month: undefined,
    day: undefined,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Format date only (MMM D, YYYY) in user timezone
 */
export const formatDateInUserTimezone = (timestamp, userTimezone = 'UTC') => {
  return formatInUserTimezone(timestamp, userTimezone, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: undefined,
    minute: undefined
  });
};
