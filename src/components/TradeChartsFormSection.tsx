import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Link2,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import {
  TradeChartAttachment,
  TradeChartSlot,
} from '../types/trade';
import {
  parseTradingViewSnapshotLink,
  TV_INVALID_LINK_ERROR,
} from '../utils/tradingView';
import {
  uploadChartBlobToStorage,
  removeChartFilesFromStorage,
} from '../utils/chartStorage';
import { ChartImageSurface } from './ChartThumbnail';

interface TradeChartsFormSectionProps {
  userId: string;
  dateIso: string;
  draftTradeId: string;
  charts: TradeChartAttachment[];
  onChangeCharts: React.Dispatch<React.SetStateAction<TradeChartAttachment[]>>;
  onUploadingChange: (uploading: boolean) => void;
}

const SLOTS_META: Array<{
  slot: TradeChartSlot;
  title: string;
  labelPlaceholder: string;
}> = [
  {
    slot: 'entry',
    title: 'Entry chart',
    labelPlaceholder: 'Optional label (e.g. 5m entry)',
  },
  {
    slot: 'result',
    title: 'Result chart',
    labelPlaceholder: 'Optional label (e.g. 1H context)',
  },
];

export const TradeChartsFormSection: React.FC<TradeChartsFormSectionProps> = ({
  userId,
  dateIso,
  draftTradeId,
  charts,
  onChangeCharts,
  onUploadingChange,
}) => {
  const [tvInputs, setTvInputs] = useState<Record<TradeChartSlot, string>>({
    entry: '',
    result: '',
  });
  const [tvErrors, setTvErrors] = useState<
    Record<TradeChartSlot, string | null>
  >({
    entry: null,
    result: null,
  });
  const [slotErrors, setSlotErrors] = useState<
    Record<TradeChartSlot, string | null>
  >({
    entry: null,
    result: null,
  });
  const [uploadingProgress, setUploadingProgress] = useState<
    Record<TradeChartSlot, number | null>
  >({
    entry: null,
    result: null,
  });
  const [replacingSlot, setReplacingSlot] = useState<
    Record<TradeChartSlot, boolean>
  >({
    entry: false,
    result: false,
  });
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<
    Record<TradeChartSlot, boolean>
  >({
    entry: false,
    result: false,
  });

  const fileInputRefs = useRef<
    Record<TradeChartSlot, HTMLInputElement | null>
  >({
    entry: null,
    result: null,
  });
  const lastPastedHashRef = useRef<string | null>(null);
  const chartsRef = useRef<TradeChartAttachment[]>(charts);
  chartsRef.current = charts;

  // Prefetch compression and viewer modules on idle when form opens (§5)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import('../utils/chartCompression');
      void import('./ChartViewerModal');
    }, 250);
    return () => window.clearTimeout(timer);
  }, []);

  // Notify parent whenever any slot is actively uploading
  useEffect(() => {
    const isBusy =
      uploadingProgress.entry !== null || uploadingProgress.result !== null;
    onUploadingChange(isBusy);
  }, [uploadingProgress.entry, uploadingProgress.result, onUploadingChange]);

  const getSlotChart = useCallback(
    (slot: TradeChartSlot): TradeChartAttachment | undefined =>
      chartsRef.current.find((c) => c.slot === slot),
    []
  );

  const upsertSlotChart = useCallback(
    (nextAttachment: TradeChartAttachment) => {
      onChangeCharts((prev) => {
        const existing = prev.find((c) => c.slot === nextAttachment.slot);
        if (
          existing?.type === 'upload' &&
          existing.imagePath &&
          existing.imagePath !== nextAttachment.imagePath
        ) {
          void removeChartFilesFromStorage([existing.imagePath]);
        }
        const filtered = prev.filter((c) => c.slot !== nextAttachment.slot);
        return [...filtered, nextAttachment];
      });
    },
    [onChangeCharts]
  );

  const handleTvLinkInputChange = (slot: TradeChartSlot, rawVal: string) => {
    setTvInputs((prev) => ({ ...prev, [slot]: rawVal }));
    setSlotErrors((prev) => ({ ...prev, [slot]: null }));

    const trimmed = rawVal.trim();
    if (!trimmed) {
      setTvErrors((prev) => ({ ...prev, [slot]: null }));
      return;
    }

    const parsed = parseTradingViewSnapshotLink(trimmed);
    if (!parsed) {
      setTvErrors((prev) => ({ ...prev, [slot]: TV_INVALID_LINK_ERROR }));
      return;
    }

    setTvErrors((prev) => ({ ...prev, [slot]: null }));
    const existingLabel = getSlotChart(slot)?.label || '';

    upsertSlotChart({
      slot,
      type: 'tv',
      tvLink: parsed.canonicalLink,
      label: existingLabel,
      addedAt: new Date().toISOString(),
    });
    setReplacingSlot((prev) => ({ ...prev, [slot]: false }));
    setTvInputs((prev) => ({ ...prev, [slot]: '' }));
  };

  const handleProcessImageFile = useCallback(
    async (slot: TradeChartSlot, file: File | Blob) => {
      setSlotErrors((prev) => ({ ...prev, [slot]: null }));
      setTvErrors((prev) => ({ ...prev, [slot]: null }));

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setSlotErrors((prev) => ({
          ...prev,
          [slot]: "You're offline. Reconnect to upload.",
        }));
        return;
      }

      setUploadingProgress((prev) => ({ ...prev, [slot]: 10 }));

      try {
        const { validateAndCompressChartImage } = await import(
          '../utils/chartCompression'
        );
        const compressed = await validateAndCompressChartImage(file, (pct) => {
          setUploadingProgress((prev) => ({ ...prev, [slot]: pct }));
        });

        // Duplicate paste protection (§6: do not add the same image twice in a row)
        const otherSlot: TradeChartSlot = slot === 'entry' ? 'result' : 'entry';
        const otherChart = getSlotChart(otherSlot);
        const currentChart = getSlotChart(slot);
        if (
          compressed.contentHash === lastPastedHashRef.current ||
          (otherChart?.contentHash &&
            otherChart.contentHash === compressed.contentHash) ||
          (currentChart?.contentHash &&
            currentChart.contentHash === compressed.contentHash &&
            !replacingSlot[slot])
        ) {
          setUploadingProgress((prev) => ({ ...prev, [slot]: null }));
          setSlotErrors((prev) => ({
            ...prev,
            [slot]: 'Duplicate image skipped: this screenshot was already added.',
          }));
          return;
        }

        setUploadingProgress((prev) => ({ ...prev, [slot]: 90 }));

        const uploaded = await uploadChartBlobToStorage({
          userId,
          dateIso,
          tradeId: draftTradeId,
          slot,
          blob: compressed.blob,
        });

        lastPastedHashRef.current = compressed.contentHash;
        const existingLabel = getSlotChart(slot)?.label || '';

        upsertSlotChart({
          slot,
          type: 'upload',
          imagePath: uploaded.imagePath,
          label: existingLabel,
          width: compressed.width,
          height: compressed.height,
          sizeBytes: compressed.sizeBytes,
          contentHash: compressed.contentHash,
          addedAt: new Date().toISOString(),
        });

        setReplacingSlot((prev) => ({ ...prev, [slot]: false }));
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Upload failed. Please check your connection and try again.';
        setSlotErrors((prev) => ({ ...prev, [slot]: msg }));
      } finally {
        setUploadingProgress((prev) => ({ ...prev, [slot]: null }));
      }
    },
    [userId, dateIso, draftTradeId, getSlotChart, upsertSlotChart, replacingSlot]
  );

  // Listen for Ctrl+V paste events while the Add/Edit Trade form is open (§1b)
  useEffect(() => {
    const handleWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      let imageFile: File | null = null;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          imageFile = item.getAsFile();
          break;
        }
      }

      if (!imageFile) return;

      e.preventDefault();
      const entryAttached = getSlotChart('entry');
      const resultAttached = getSlotChart('result');

      // Put the pasted image in the first empty (or currently replacing) slot
      let targetSlot: TradeChartSlot | null = null;
      if (!entryAttached || replacingSlot.entry) {
        targetSlot = 'entry';
      } else if (!resultAttached || replacingSlot.result) {
        targetSlot = 'result';
      }

      if (!targetSlot) {
        setSlotErrors((prev) => ({
          ...prev,
          result:
            'Both Entry and Result chart slots are full. Tap Replace on a slot first.',
        }));
        return;
      }

      void handleProcessImageFile(targetSlot, imageFile);
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [getSlotChart, replacingSlot, handleProcessImageFile]);

  const handleLabelChange = (slot: TradeChartSlot, nextLabel: string) => {
    onChangeCharts((prev) =>
      prev.map((c) => (c.slot === slot ? { ...c, label: nextLabel } : c))
    );
  };

  const handleConfirmDeleteSlot = (slot: TradeChartSlot) => {
    const existing = getSlotChart(slot);
    if (existing?.type === 'upload' && existing.imagePath) {
      void removeChartFilesFromStorage([existing.imagePath]);
    }
    if (existing?.contentHash === lastPastedHashRef.current) {
      lastPastedHashRef.current = null;
    }
    onChangeCharts((prev) => prev.filter((c) => c.slot !== slot));
    setConfirmDeleteSlot((prev) => ({ ...prev, [slot]: false }));
    setReplacingSlot((prev) => ({ ...prev, [slot]: false }));
    setSlotErrors((prev) => ({ ...prev, [slot]: null }));
    setTvErrors((prev) => ({ ...prev, [slot]: null }));
  };

  return (
    <div
      data-testid="trade-charts-form-section"
      className="p-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-heading text-[16px] font-bold uppercase text-[#8B5E3C]">
          Charts (optional • up to 2: Entry &amp; Result)
        </span>
        <span className="text-[13px] font-bold text-[#5C3D2E]">
          Paste screenshot (Ctrl+V) or TradingView snapshot link
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SLOTS_META.map(({ slot, title, labelPlaceholder }) => {
          const attached = charts.find((c) => c.slot === slot);
          const isReplacing = replacingSlot[slot];
          const isUploading = uploadingProgress[slot] !== null;
          const tvError = tvErrors[slot];
          const slotError = slotErrors[slot];
          const isConfirmingDel = confirmDeleteSlot[slot];

          return (
            <div
              key={slot}
              data-testid={`chart-slot-card-${slot}`}
              className="p-3 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] flex flex-col justify-between gap-2.5"
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading text-[15px] font-bold uppercase text-[#8B5E3C]">
                  {title}
                </span>
                {attached && (
                  <span className="px-2 py-0.5 rounded-full bg-[#BFE3C0] border border-[#8B5E3C] text-[12px] font-extrabold text-[#2F6B3A] inline-flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[2.8]" />
                    <span>
                      {attached.type === 'tv'
                        ? 'TradingView'
                        : attached.sizeBytes
                          ? `${Math.max(1, Math.round(attached.sizeBytes / 1024))} KB WEBP`
                          : 'Uploaded'}
                    </span>
                  </span>
                )}
              </div>

              {/* Upload Progress State */}
              {isUploading && (
                <div
                  data-testid={`chart-upload-progress-${slot}`}
                  className="p-3 rounded-xl bg-[#DCEEF2] border border-[#8B5E3C] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[13px] font-extrabold text-[#5C3D2E]">
                    <span className="inline-flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Compressing &amp; uploading...</span>
                    </span>
                    <span>{uploadingProgress[slot]}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FFFDF7] border border-[#8B5E3C] overflow-hidden">
                    <div
                      style={{ width: `${uploadingProgress[slot] || 15}%` }}
                      className="h-full bg-[#2F6B3A] transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Attached Chart Live Thumbnail Preview + Label + Replace/Delete */}
              {attached && !isReplacing && !isUploading && (
                <div className="space-y-2">
                  <div
                    data-testid={`chart-preview-${slot}`}
                    className="relative w-full aspect-[16/10] rounded-xl border-2 border-[#8B5E3C] bg-[#F0DED4]/40 overflow-hidden"
                  >
                    <ChartImageSurface
                      chart={attached}
                      variant="thumb"
                      alt={`${title} preview`}
                      imgClassName="w-full h-full object-cover"
                    />
                  </div>

                  {/* Optional Label Input */}
                  <input
                    type="text"
                    data-testid={`chart-label-input-${slot}`}
                    value={attached.label || ''}
                    onChange={(e) => handleLabelChange(slot, e.target.value)}
                    placeholder={labelPlaceholder}
                    className="w-full h-[40px] px-3 rounded-lg bg-[#FFFBF2] border border-[#8B5E3C] text-[14px] font-bold text-[#5C3D2E] outline-none"
                  />

                  {/* Replace & Delete Controls */}
                  {!isConfirmingDel ? (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        data-testid={`chart-replace-btn-${slot}`}
                        onClick={() =>
                          setReplacingSlot((prev) => ({
                            ...prev,
                            [slot]: true,
                          }))
                        }
                        className="flex-1 h-[38px] px-3 rounded-lg bg-[#F2D29B] border border-[#8B5E3C] text-[14px] font-extrabold text-[#5C3D2E] cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        data-testid={`chart-delete-btn-${slot}`}
                        onClick={() =>
                          setConfirmDeleteSlot((prev) => ({
                            ...prev,
                            [slot]: true,
                          }))
                        }
                        aria-label={`Delete ${title}`}
                        className="h-[38px] px-3 rounded-lg bg-[#F8D0CC] border border-[#8B5E3C] text-[#9B2C20] flex items-center justify-center gap-1 text-[14px] font-extrabold cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-[#F5B8B0]/65 border border-[#8B5E3C] flex items-center justify-between gap-2">
                      <span className="text-[13px] font-extrabold text-[#9B2C20]">
                        Remove chart?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          data-testid={`chart-confirm-delete-${slot}`}
                          onClick={() => handleConfirmDeleteSlot(slot)}
                          className="px-2.5 py-1 rounded-md bg-[#F5B8B0] border border-[#8B5E3C] text-[13px] font-extrabold text-[#9B2C20] cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDeleteSlot((prev) => ({
                              ...prev,
                              [slot]: false,
                            }))
                          }
                          className="px-2.5 py-1 rounded-md bg-[#FFFDF7] border border-[#8B5E3C] text-[13px] font-bold text-[#5C3D2E] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Input Controls when slot is empty or user tapped Replace */}
              {(!attached || isReplacing) && !isUploading && (
                <div className="space-y-2">
                  {/* Option A: TradingView Snapshot Link Input */}
                  <div className="space-y-1">
                    <div className="relative flex items-center">
                      <Link2 className="w-4 h-4 text-[#8B5E3C] absolute left-3 pointer-events-none" />
                      <input
                        type="url"
                        data-testid={`tv-link-input-${slot}`}
                        value={tvInputs[slot]}
                        onChange={(e) =>
                          handleTvLinkInputChange(slot, e.target.value)
                        }
                        placeholder="Paste TradingView snapshot link"
                        className="w-full h-[42px] pl-9 pr-3 rounded-lg bg-[#FFFBF2] border border-[#8B5E3C] text-[14px] font-bold text-[#5C3D2E] placeholder-[#8B5E3C]/65 outline-none"
                      />
                    </div>
                    {tvError && (
                      <div
                        data-testid={`tv-link-error-${slot}`}
                        className="p-2 rounded-lg bg-[#F5B8B0] border border-[#8B5E3C] text-[12px] font-extrabold text-[#9B2C20] flex items-start gap-1.5"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{tvError}</span>
                      </div>
                    )}
                  </div>

                  {/* Option B: Paste (Ctrl+V), Drop or Choose an Image */}
                  <div
                    data-testid={`chart-dropzone-${slot}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer?.files?.[0];
                      if (file) {
                        void handleProcessImageFile(slot, file);
                      }
                    }}
                    onClick={() => fileInputRefs.current[slot]?.click()}
                    className="p-3 rounded-xl bg-[#DCEEF2]/45 border-2 border-dashed border-[#8B5E3C] text-center cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[78px]"
                  >
                    <input
                      ref={(el) => {
                        fileInputRefs.current[slot] = el;
                      }}
                      type="file"
                      data-testid={`chart-file-input-${slot}`}
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          void handleProcessImageFile(slot, file);
                        }
                        e.target.value = '';
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#5C3D2E]">
                      <Upload className="w-4 h-4 text-[#8B5E3C] shrink-0" />
                      <span>Paste (Ctrl+V), drop or choose an image</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#8B5E3C]">
                      PNG, JPG or WEBP • Auto-compressed &lt;300KB
                    </span>
                  </div>

                  {isReplacing && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplacingSlot((prev) => ({
                          ...prev,
                          [slot]: false,
                        }));
                        setTvErrors((prev) => ({ ...prev, [slot]: null }));
                        setSlotErrors((prev) => ({ ...prev, [slot]: null }));
                      }}
                      className="w-full h-[34px] rounded-lg bg-[#F0DED4] border border-[#8B5E3C] text-[13px] font-bold text-[#5C3D2E] cursor-pointer"
                    >
                      Keep current chart
                    </button>
                  )}
                </div>
              )}

              {/* Slot Upload/Validation Error Message */}
              {slotError && (
                <div
                  data-testid={`chart-slot-error-${slot}`}
                  className="p-2 rounded-lg bg-[#F5B8B0] border border-[#8B5E3C] text-[12px] font-extrabold text-[#9B2C20] flex items-start gap-1.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{slotError}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
