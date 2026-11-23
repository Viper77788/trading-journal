export interface CompressedChartImageResult {
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  contentHash: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const MAX_RAW_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_LONG_SIDE_PX = 1600;
const TARGET_MAX_BYTES = 300 * 1024; // 300 KB

async function computeFileHash(file: Blob): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      const bytes = new Uint8Array(digest);
      let hex = '';
      for (let i = 0; i < Math.min(16, bytes.length); i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
      }
      return `${hex}-${file.size}`;
    }
  } catch {
    // Fallback below
  }
  return `size-${file.size}-${file.type}`;
}

async function renderToWebpBlob(
  source: ImageBitmap | HTMLImageElement,
  targetW: number,
  targetH: number,
  quality: number
): Promise<Blob> {
  if (
    typeof OffscreenCanvas !== 'undefined' &&
    typeof OffscreenCanvas.prototype.convertToBlob === 'function'
  ) {
    const offscreen = new OffscreenCanvas(targetW, targetH);
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      ctx.drawImage(source, 0, 0, targetW, targetH);
      return await offscreen.convertToBlob({
        type: 'image/webp',
        quality,
      });
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize image canvas.');
  }
  ctx.drawImage(source, 0, 0, targetW, targetH);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Could not encode image to WEBP.'));
      },
      'image/webp',
      quality
    );
  });
}

async function decodeImageSource(
  file: Blob
): Promise<{
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode image file.'));
      el.src = objectUrl;
    });
    return {
      source: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

export async function validateAndCompressChartImage(
  file: File | Blob,
  onProgress?: (pct: number) => void
): Promise<CompressedChartImageResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error("You're offline. Reconnect to upload.");
  }

  const mime = (file.type || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new Error('Please use a PNG, JPG, or WEBP image.');
  }

  if (file.size > MAX_RAW_BYTES) {
    throw new Error('Image is over 10MB. Please choose an image under 10MB.');
  }

  onProgress?.(15);
  const contentHash = await computeFileHash(file);
  onProgress?.(30);

  const decoded = await decodeImageSource(file);
  try {
    const srcW = Math.max(1, decoded.width);
    const srcH = Math.max(1, decoded.height);
    const longSide = Math.max(srcW, srcH);
    const scale =
      longSide > MAX_LONG_SIDE_PX ? MAX_LONG_SIDE_PX / longSide : 1;

    let targetW = Math.max(1, Math.round(srcW * scale));
    let targetH = Math.max(1, Math.round(srcH * scale));

    onProgress?.(55);
    let blob = await renderToWebpBlob(decoded.source, targetW, targetH, 0.8);

    // If over 300KB target, step down quality / dimensions slightly to stay under 300KB
    if (blob.size > TARGET_MAX_BYTES) {
      onProgress?.(70);
      blob = await renderToWebpBlob(decoded.source, targetW, targetH, 0.66);
    }
    if (blob.size > TARGET_MAX_BYTES && Math.max(targetW, targetH) > 1280) {
      const secondScale = 1280 / Math.max(targetW, targetH);
      targetW = Math.max(1, Math.round(targetW * secondScale));
      targetH = Math.max(1, Math.round(targetH * secondScale));
      blob = await renderToWebpBlob(decoded.source, targetW, targetH, 0.62);
    }

    onProgress?.(85);
    return {
      blob,
      width: targetW,
      height: targetH,
      sizeBytes: blob.size,
      contentHash,
    };
  } finally {
    decoded.cleanup();
  }
}
