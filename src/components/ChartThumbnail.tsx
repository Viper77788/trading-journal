import React, { useState, useEffect } from 'react';
import { Link2, Image as ImageIcon, Copy, Check, AlertCircle } from 'lucide-react';
import { TradeChartAttachment } from '../types/trade';
import { parseTradingViewSnapshotLink } from '../utils/tradingView';
import {
  getCachedSignedUrl,
  getOrRefreshSignedChartUrl,
} from '../utils/chartStorage';

interface ChartImageSurfaceProps {
  chart: TradeChartAttachment;
  variant: 'thumb' | 'viewer';
  alt?: string;
  imgClassName?: string;
  draggable?: boolean;
}

export const ChartImageSurface: React.FC<ChartImageSurfaceProps> = React.memo(
  ({
    chart,
    variant,
    alt = 'Trade chart',
    imgClassName = 'w-full h-full object-cover',
    draggable = false,
  }) => {
    const [candidateIdx, setCandidateIdx] = useState(0);
    const [hasFailed, setHasFailed] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [uploadUrl, setUploadUrl] = useState<string | null>(() =>
      chart.type === 'upload' ? getCachedSignedUrl(chart.imagePath) : null
    );
    const [retriedSignedUrl, setRetriedSignedUrl] = useState(false);

    useEffect(() => {
      setCandidateIdx(0);
      setHasFailed(false);
      setRetriedSignedUrl(false);

      if (chart.type === 'upload' && chart.imagePath) {
        const cached = getCachedSignedUrl(chart.imagePath);
        if (cached) {
          setUploadUrl(cached);
          return;
        }
        let cancelled = false;
        void getOrRefreshSignedChartUrl(chart.imagePath, false).then((url) => {
          if (!cancelled) {
            if (url) setUploadUrl(url);
            else setHasFailed(true);
          }
        });
        return () => {
          cancelled = true;
        };
      } else {
        setUploadUrl(null);
      }
    }, [chart.type, chart.imagePath, chart.tvLink, variant]);

    const handleCopyOriginal = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!chart.tvLink) return;
      try {
        void navigator.clipboard.writeText(chart.tvLink);
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 1800);
      } catch {
        // Ignore clipboard errors
      }
    };

    if (chart.type === 'tv') {
      const parsed = parseTradingViewSnapshotLink(chart.tvLink || '');
      const candidates = parsed
        ? variant === 'viewer'
          ? parsed.viewerCandidates
          : parsed.thumbCandidates
        : [];

      if (!parsed || candidates.length === 0 || hasFailed) {
        return (
          <div className="w-full h-full p-2.5 bg-[#FFFBF2] flex flex-col items-center justify-center text-center gap-1.5">
            <AlertCircle className="w-5 h-5 text-[#9B2C20] shrink-0" />
            <p className="text-[12px] sm:text-[13px] font-bold text-[#5C3D2E] m-0 leading-snug">
              Chart image unavailable. The snapshot link may have been deleted.
            </p>
            {chart.tvLink && (
              <button
                type="button"
                onClick={handleCopyOriginal}
                className="px-2.5 py-1 rounded-lg bg-[#F2D29B] border border-[#8B5E3C] text-[12px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#2F6B3A]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy original link</span>
                  </>
                )}
              </button>
            )}
          </div>
        );
      }

      const activeUrl =
        candidates[Math.min(candidateIdx, candidates.length - 1)];

      return (
        <img
          src={activeUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          loading={variant === 'thumb' ? 'lazy' : 'eager'}
          decoding="async"
          draggable={draggable}
          onError={() => {
            if (candidateIdx + 1 < candidates.length) {
              setCandidateIdx((prev) => prev + 1);
            } else {
              setHasFailed(true);
            }
          }}
          className={imgClassName}
        />
      );
    }

    // Uploaded image via Supabase Storage signed URL
    if (hasFailed) {
      return (
        <div className="w-full h-full p-2.5 bg-[#FFFBF2] flex flex-col items-center justify-center text-center gap-1">
          <AlertCircle className="w-5 h-5 text-[#9B2C20] shrink-0" />
          <p className="text-[12px] sm:text-[13px] font-bold text-[#5C3D2E] m-0 leading-snug">
            Screenshot unavailable.
          </p>
        </div>
      );
    }

    if (!uploadUrl) {
      return (
        <div className="w-full h-full bg-[#F0DED4]/50 animate-pulse flex items-center justify-center text-[12px] font-bold text-[#8B5E3C]">
          Loading chart...
        </div>
      );
    }

    return (
      <img
        src={uploadUrl}
        alt={alt}
        loading={variant === 'thumb' ? 'lazy' : 'eager'}
        decoding="async"
        draggable={draggable}
        onError={() => {
          if (!retriedSignedUrl && chart.imagePath) {
            setRetriedSignedUrl(true);
            void getOrRefreshSignedChartUrl(chart.imagePath, true).then(
              (fresh) => {
                if (fresh) setUploadUrl(fresh);
                else setHasFailed(true);
              }
            );
          } else {
            setHasFailed(true);
          }
        }}
        className={imgClassName}
      />
    );
  }
);

ChartImageSurface.displayName = 'ChartImageSurface';

interface ChartThumbnailCardProps {
  chart: TradeChartAttachment;
  onClick: () => void;
  compact?: boolean;
  testId?: string;
}

export const ChartThumbnailCard: React.FC<ChartThumbnailCardProps> = React.memo(
  ({ chart, onClick, compact = false, testId }) => {
    const slotTitle = chart.slot === 'entry' ? 'Entry' : 'Result';
    const trimmedLabel = chart.label?.trim() || '';
    const displayLabel = trimmedLabel
      ? `${slotTitle} • ${trimmedLabel}`
      : `${slotTitle} chart`;

    return (
      <div
        role="button"
        tabIndex={0}
        data-testid={testId || `chart-thumb-${chart.slot}`}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        title={`View ${displayLabel}`}
        className={`group relative rounded-xl border-2 border-[#8B5E3C] bg-[#FFFBF2] overflow-hidden flex flex-col text-left cursor-pointer p-0 transition-transform ${
          compact ? 'w-[128px] sm:w-[144px]' : 'w-full'
        }`}
      >
        {/* Fixed 16:9 aspect-ratio thumbnail box on a cream background with object-fit: contain so charts are never cropped (§2) */}
        <div className="relative w-full aspect-video bg-[#FFFBF2] overflow-hidden flex items-center justify-center">
          <ChartImageSurface
            chart={chart}
            variant="thumb"
            alt={displayLabel}
            imgClassName="w-full h-full object-contain bg-[#FFFBF2]"
          />

          {/* Tiny Corner Type Icon (Link icon for TradingView, Image icon for upload — §4) */}
          <span
            title={
              chart.type === 'tv'
                ? 'TradingView snapshot'
                : 'Uploaded screenshot'
            }
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-[#FFFDF7]/95 border border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] shadow-xs"
          >
            {chart.type === 'tv' ? (
              <Link2 className="w-3.5 h-3.5 text-[#8B5E3C]" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-[#2F6B3A]" />
            )}
          </span>
        </div>

        {/* Bottom Label Strip: Entry / Result tag + label under the image on one line with ellipsis and full label as tooltip (§3) */}
        <div
          title={displayLabel}
          className="w-full px-2 py-1 bg-[#FFFDF7] border-t border-[#8B5E3C]/50 flex items-center justify-between gap-1.5"
        >
          <span
            className={`px-1.5 py-0.5 rounded-md border border-[#8B5E3C] text-[11px] font-extrabold shrink-0 ${
              chart.slot === 'entry'
                ? 'bg-[#DCEEF2] text-[#5C3D2E]'
                : 'bg-[#F2D29B] text-[#5C3D2E]'
            }`}
          >
            {slotTitle}
          </span>
          <span
            title={trimmedLabel || `${slotTitle} chart`}
            className="text-[12px] sm:text-[13px] font-extrabold text-[#5C3D2E] truncate flex-1 text-right"
          >
            {trimmedLabel || `${slotTitle} chart`}
          </span>
        </div>
      </div>
    );
  }
);

ChartThumbnailCard.displayName = 'ChartThumbnailCard';
