/**
 * Currency Conversion & Formatting Utilities
 * Supports Multi-Currency accounts, trade-date fxRateAtEntry freezing, and offline fallback conversion matrix.
 */

// NOTE: Offline fallback exchange rate matrix relative to USD base.
// Reviewed periodically. Used when offline or during FX API network failure.
export const FX_FALLBACK_RATES = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  INR: 0.012,
};

export function convertCurrency(amount, fromCurrency = 'USD', toCurrency = 'USD', fxRateAtEntry = null) {
  const num = Number(amount) || 0;
  if (fromCurrency === toCurrency) return num;

  // If trade has a frozen entry rate, use it
  if (fxRateAtEntry && typeof fxRateAtEntry === 'number') {
    return num * fxRateAtEntry;
  }

  // Fallback to rate matrix
  const fromRate = FX_FALLBACK_RATES[fromCurrency.toUpperCase()] || 1.0;
  const toRate = FX_FALLBACK_RATES[toCurrency.toUpperCase()] || 1.0;

  // Convert to USD base first, then to target currency
  const inUSD = num * fromRate;
  return inUSD / toRate;
}

export function formatCurrency(amount, currency = 'USD') {
  const num = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}
