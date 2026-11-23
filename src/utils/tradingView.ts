export const TV_INVALID_LINK_ERROR =
  'Not a TradingView snapshot link. In TradingView use Take a snapshot > Copy link to the image.';

export interface ParsedTradingViewSnapshot {
  id: string;
  canonicalLink: string;
  primaryS3Url: string;
  midS3Url: string;
  bigS3Url: string;
  thumbCandidates: string[];
  viewerCandidates: string[];
}

/**
 * Strictly validates a TradingView snapshot link:
 * - Must be https:// (or bare tradingview.com/x/<ID> upgraded to https://)
 * - Host must be strictly 'www.tradingview.com' or 'tradingview.com'
 * - Path must be '/x/<ID>' or '/x/<ID>/' where <ID> is alphanumeric
 */
export function parseTradingViewSnapshotLink(
  rawInput: string
): ParsedTradingViewSnapshot | null {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return null;

  // Reject explicit non-https protocols (e.g. http://, javascript:, data:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !trimmed.startsWith('https://')) {
    return null;
  }

  const withProtocol = trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') {
    return null;
  }

  if (
    parsed.hostname !== 'www.tradingview.com' &&
    parsed.hostname !== 'tradingview.com'
  ) {
    return null;
  }

  const pathMatch = parsed.pathname.match(/^\/x\/([A-Za-z0-9]{4,24})\/?$/);
  if (!pathMatch || !pathMatch[1]) {
    return null;
  }

  const id = pathMatch[1];
  const firstLetter = id.charAt(0).toLowerCase();

  // Real TradingView S3 snapshots reside at /snapshots/<first>/<ID>.png;
  // also include /<first>/<ID>_mid.png and /<first>/<ID>_big.png as fallback candidates.
  const primaryS3Url = `https://s3.tradingview.com/snapshots/${firstLetter}/${id}.png`;
  const midS3Url = `https://s3.tradingview.com/${firstLetter}/${id}_mid.png`;
  const bigS3Url = `https://s3.tradingview.com/${firstLetter}/${id}_big.png`;
  const canonicalLink = `https://www.tradingview.com/x/${id}/`;

  return {
    id,
    canonicalLink,
    primaryS3Url,
    midS3Url,
    bigS3Url,
    thumbCandidates: [primaryS3Url, midS3Url],
    viewerCandidates: [primaryS3Url, bigS3Url, midS3Url],
  };
}
