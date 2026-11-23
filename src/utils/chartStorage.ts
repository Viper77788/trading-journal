import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { DayRecord } from '../types/day';
import { TradeChartSlot } from '../types/trade';

export const TRADE_CHARTS_BUCKET = 'trade-charts';
const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour
const REFRESH_MARGIN_MS = 5 * 60 * 1000; // Refresh when < 5 min remaining

interface CachedSignedUrl {
  url: string;
  expiresAt: number;
}

const signedUrlCache = new Map<string, CachedSignedUrl>();
const inflightBatchByPath = new Map<string, Promise<string | null>>();

export function getCachedSignedUrl(imagePath?: string): string | null {
  if (!imagePath) return null;
  const entry = signedUrlCache.get(imagePath);
  if (!entry) return null;
  if (Date.now() + REFRESH_MARGIN_MS >= entry.expiresAt) {
    signedUrlCache.delete(imagePath);
    return null;
  }
  return entry.url;
}

export function setCachedSignedUrl(
  imagePath: string,
  url: string,
  ttlSeconds = SIGNED_URL_TTL_SECONDS
): void {
  signedUrlCache.set(imagePath, {
    url,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Fetches signed URLs in ONE batch per day (`createSignedUrls`) and caches them in memory.
 */
export async function prefetchDaySignedUrls(
  day: DayRecord | undefined
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!day || !isSupabaseConfigured) return result;

  const pathsToFetch: string[] = [];
  for (const trade of day.trades || []) {
    for (const chart of trade.charts || []) {
      if (chart.type === 'upload' && chart.imagePath) {
        const cached = getCachedSignedUrl(chart.imagePath);
        if (cached) {
          result[chart.imagePath] = cached;
        } else if (!pathsToFetch.includes(chart.imagePath)) {
          pathsToFetch.push(chart.imagePath);
        }
      }
    }
  }

  if (pathsToFetch.length === 0) {
    return result;
  }

  try {
    const { data, error } = await supabase.storage
      .from(TRADE_CHARTS_BUCKET)
      .createSignedUrls(pathsToFetch, SIGNED_URL_TTL_SECONDS);

    if (!error && data) {
      for (const item of data) {
        if (item.path && item.signedUrl) {
          setCachedSignedUrl(item.path, item.signedUrl);
          result[item.path] = item.signedUrl;
        }
      }
    }
  } catch {
    // Individual getSignedChartUrl calls will retry as needed
  }

  return result;
}

/**
 * Resolves a single signed URL from cache or fetches/refreshes it from Supabase Storage.
 */
export async function getOrRefreshSignedChartUrl(
  imagePath: string,
  forceRefresh = false
): Promise<string | null> {
  if (!imagePath || !isSupabaseConfigured) return null;

  if (!forceRefresh) {
    const cached = getCachedSignedUrl(imagePath);
    if (cached) return cached;
  } else {
    signedUrlCache.delete(imagePath);
  }

  const existingPromise = inflightBatchByPath.get(imagePath);
  if (existingPromise && !forceRefresh) {
    return existingPromise;
  }

  const promise = (async () => {
    try {
      const { data, error } = await supabase.storage
        .from(TRADE_CHARTS_BUCKET)
        .createSignedUrl(imagePath, SIGNED_URL_TTL_SECONDS);

      if (error || !data?.signedUrl) {
        return null;
      }
      setCachedSignedUrl(imagePath, data.signedUrl);
      return data.signedUrl;
    } catch {
      return null;
    } finally {
      inflightBatchByPath.delete(imagePath);
    }
  })();

  inflightBatchByPath.set(imagePath, promise);
  return promise;
}

/**
 * Builds the required storage object path:
 * <user_id>/<yyyy-mm-dd>/<trade_id>-<slot>-<timestamp>.webp
 */
export function buildChartStoragePath(
  userId: string,
  dateIso: string,
  tradeId: string,
  slot: TradeChartSlot
): string {
  const safeTradeId = tradeId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${userId}/${dateIso}/${safeTradeId}-${slot}-${Date.now()}.webp`;
}

export async function uploadChartBlobToStorage(params: {
  userId: string;
  dateIso: string;
  tradeId: string;
  slot: TradeChartSlot;
  blob: Blob;
}): Promise<{ imagePath: string; signedUrl: string }> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error("You're offline. Reconnect to upload.");
  }
  if (!isSupabaseConfigured) {
    throw new Error('Cloud storage is not configured.');
  }

  const imagePath = buildChartStoragePath(
    params.userId,
    params.dateIso,
    params.tradeId,
    params.slot
  );

  const { error } = await supabase.storage
    .from(TRADE_CHARTS_BUCKET)
    .upload(imagePath, params.blob, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (error) {
    throw new Error(
      error.message || 'Could not upload chart screenshot. Please try again.'
    );
  }

  const signed = await getOrRefreshSignedChartUrl(imagePath, true);
  const fallbackLocalUrl = signed || URL.createObjectURL(params.blob);
  if (!signed) {
    setCachedSignedUrl(imagePath, fallbackLocalUrl);
  }

  return {
    imagePath,
    signedUrl: fallbackLocalUrl,
  };
}

/**
 * Deletes one or more uploaded chart files from Supabase Storage and clears their cached URLs.
 */
export async function removeChartFilesFromStorage(
  imagePaths: Array<string | undefined | null>
): Promise<void> {
  const validPaths = Array.from(
    new Set(
      imagePaths
        .map((p) => (p || '').trim())
        .filter((p) => p.length > 0)
    )
  );

  if (validPaths.length === 0) return;

  for (const p of validPaths) {
    signedUrlCache.delete(p);
  }

  if (!isSupabaseConfigured) return;

  try {
    await supabase.storage.from(TRADE_CHARTS_BUCKET).remove(validPaths);
  } catch {
    // Ignore background storage cleanup failure
  }
}

export interface ChartStorageUsageSummary {
  totalBytes: number;
  totalMb: number;
  formattedText: string;
  isOverWarningThreshold: boolean; // > 800 MB
  uploadedCount: number;
}

/**
 * Sums stored chart sizes from metadata across all days.
 */
export function calculateChartStorageUsage(
  daysMap: Record<string, DayRecord>
): ChartStorageUsageSummary {
  let totalBytes = 0;
  let uploadedCount = 0;

  for (const day of Object.values(daysMap || {})) {
    if (!day?.trades) continue;
    for (const trade of day.trades) {
      for (const chart of trade.charts || []) {
        if (chart.type === 'upload' && chart.imagePath) {
          uploadedCount += 1;
          totalBytes +=
            typeof chart.sizeBytes === 'number' && chart.sizeBytes > 0
              ? chart.sizeBytes
              : 120 * 1024;
        }
      }
    }
  }

  const totalMb = totalBytes / (1024 * 1024);
  let formattedMb: string;
  if (totalBytes === 0) {
    formattedMb = '0 MB';
  } else if (totalMb < 0.1) {
    formattedMb = '< 0.1 MB';
  } else if (totalMb < 10) {
    formattedMb = `${totalMb.toFixed(1)} MB`;
  } else {
    formattedMb = `${Math.round(totalMb)} MB`;
  }

  return {
    totalBytes,
    totalMb,
    formattedText: `Chart storage: ${formattedMb} used`,
    isOverWarningThreshold: totalMb > 800,
    uploadedCount,
  };
}

// ============================================================================
// Pure Browser ZIP Builder (PKZIP STORE format with CRC32) for Chart Images
// ============================================================================
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZipBlob(
  files: Array<{ name: string; data: Uint8Array }>
): Blob {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = file.data;
    const fileCrc = crc32(data);

    // Local file header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // compression: 0 (STORE)
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, fileCrc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localChunks.push(localHeader, data);

    // Central directory header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, fileCrc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralChunks.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralChunks.reduce((s, c) => s + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob(
    [
      ...(localChunks as unknown as BlobPart[]),
      ...(centralChunks as unknown as BlobPart[]),
      eocd as unknown as BlobPart,
    ],
    {
      type: 'application/zip',
    }
  );
}

export async function downloadAllChartImagesZip(
  daysMap: Record<string, DayRecord>
): Promise<{ count: number }> {
  const entries: Array<{
    dateIso: string;
    tradeNum: number;
    asset: string;
    slot: string;
    imagePath: string;
  }> = [];

  for (const [dateIso, day] of Object.entries(daysMap || {})) {
    if (!day?.trades) continue;
    day.trades.forEach((trade, idx) => {
      for (const chart of trade.charts || []) {
        if (chart.type === 'upload' && chart.imagePath) {
          entries.push({
            dateIso,
            tradeNum: idx + 1,
            asset: trade.asset || 'TRADE',
            slot: chart.slot,
            imagePath: chart.imagePath,
          });
        }
      }
    });
  }

  if (entries.length === 0) {
    return { count: 0 };
  }

  const zipFiles: Array<{ name: string; data: Uint8Array }> = [];

  for (const entry of entries) {
    try {
      const { data, error } = await supabase.storage
        .from(TRADE_CHARTS_BUCKET)
        .download(entry.imagePath);
      if (!error && data) {
        const buf = await data.arrayBuffer();
        const fileName = `${entry.dateIso}/trade-${entry.tradeNum}-${entry.asset}-${entry.slot}.webp`;
        zipFiles.push({
          name: fileName,
          data: new Uint8Array(buf),
        });
      }
    } catch {
      // Skip unreachable file
    }
  }

  if (zipFiles.length === 0) {
    return { count: 0 };
  }

  const zipBlob = buildZipBlob(zipFiles);
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trading-chart-images-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { count: zipFiles.length };
}
