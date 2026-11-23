import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import {
  TradeEntry,
  TradingSession,
  MistakeTag,
  MISTAKE_TAGS,
  TradeChartAttachment,
  TradeChartSlot,
} from '../types/trade';
import { DayRecord } from '../types/day';
import { AccountSettings } from '../types/settings';
import {
  getMaxRiskDollar,
  isTradeRiskViolated,
  isMinorMistake,
  getDayMaxTradesLimit,
  getDayOverTradesCount,
  isTradeOverLimit,
  getEffectiveTradeMistakes,
  getRecentTradedPairs,
} from '../utils/calculations';
import { formatCurrency, formatRMultiple } from '../utils/formatters';
import { removeChartFilesFromStorage } from '../utils/chartStorage';
import { AnimatedNumber } from './animations/AnimatedNumber';
import { TradeChartsFormSection } from './TradeChartsFormSection';

export interface ExternalTradeModalRequest {
  mode: 'new' | 'edit';
  trade?: TradeEntry;
  openChartsSection?: boolean;
  nonce: number;
}

interface TradeTableProps {
  userId?: string | null;
  day: DayRecord;
  daysMap?: Record<string, DayRecord>;
  trades: TradeEntry[];
  settings: AccountSettings;
  onUpdateSettings: (patch: Partial<AccountSettings>) => void;
  onAddTrade: (customPayload?: Partial<TradeEntry>) => {
    ok: boolean;
    reason?: string;
  };
  onUpdateTrade: (tradeId: string, patch: Partial<TradeEntry>) => void;
  onDeleteTrade: (tradeId: string) => void;
  onNotify: (
    title: string,
    type: 'success' | 'warning' | 'error' | 'info',
    actionLabel?: string,
    onAction?: () => void
  ) => void;
  dailyPnl: number;
  dailyR: number;
  onOpenChartViewer?: (tradeId: string, slot?: TradeChartSlot) => void;
  externalModalRequest?: ExternalTradeModalRequest | null;
}

interface TradeRowCardProps {
  trade: TradeEntry;
  tradeIndex: number;
  day: DayRecord;
  settings: AccountSettings;
  isConfirmingDelete: boolean;
  onEdit: (trade: TradeEntry, openCharts?: boolean) => void;
  onToggleConfirmDelete: (tradeId: string) => void;
  onConfirmDelete: (tradeId: string) => void;
  onCancelDelete: () => void;
  onOpenChartViewer?: (tradeId: string, slot?: TradeChartSlot) => void;
}

const TradeRowCard: React.FC<TradeRowCardProps> = React.memo(
  ({
    trade,
    tradeIndex,
    day,
    settings,
    isConfirmingDelete,
    onEdit,
    onToggleConfirmDelete,
    onConfirmDelete,
    onCancelDelete,
    onOpenChartViewer,
  }) => {
    const violated = isTradeRiskViolated(trade, settings);
    const overLimit = isTradeOverLimit(tradeIndex, day, settings);
    const effectiveMistakes = getEffectiveTradeMistakes(
      trade,
      tradeIndex,
      day,
      settings
    );
    const isWin = trade.outcome >= 0;
    const sessionName =
      trade.session === 'London'
        ? 'London'
        : trade.session === 'NY'
          ? 'NY'
          : 'Outside';
    const tradeR =
      trade.riskAmount > 0
        ? Math.round((trade.outcome / trade.riskAmount) * 10) / 10
        : 0;
    const rString = tradeR > 0 ? `+${tradeR}R` : `${tradeR}R`;
    const chartsCount = trade.charts?.length || 0;

    return (
      <div
        data-testid={`trade-card-${tradeIndex + 1}`}
        className={`rounded-xl bg-[#FFFDF7] border-2 px-3.5 py-2.5 space-y-1.5 ${
          overLimit ? 'border-[#9B2C20]' : 'border-[#8B5E3C]'
        }`}
      >
        {/* Line 1: Trade #, pair, session chip, money risked | Result badge + Edit/Delete icon buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span
              className={`px-2.5 py-0.5 rounded-lg border font-heading text-[16px] font-bold ${
                overLimit
                  ? 'bg-[#F5B8B0] border-[#9B2C20] text-[#9B2C20]'
                  : 'bg-[#DCEEF2] border-[#8B5E3C] text-[#8B5E3C]'
              }`}
            >
              #{tradeIndex + 1}
            </span>
            <span className="text-[18px] font-extrabold text-[#5C3D2E]">
              {trade.asset}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#F0DED4] border border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E]">
              {sessionName}
            </span>
            <span className="text-[16px] font-semibold text-[#5C3D2E]">
              Risk: <strong>{formatCurrency(trade.riskAmount)}</strong> (
              {trade.riskPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-3 py-1 rounded-xl border-2 border-[#8B5E3C] leading-none inline-flex items-baseline gap-1.5 ${
                isWin
                  ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                  : 'bg-[#F5B8B0] text-[#9B2C20]'
              }`}
            >
              <strong className="text-[18px] font-extrabold">
                {formatCurrency(trade.outcome, true)}
              </strong>
              <span className="text-[15px] font-bold opacity-90">
                / {rString}
              </span>
            </span>

            <button
              type="button"
              onClick={() => onEdit(trade, false)}
              aria-label="Edit trade"
              title="Edit trade"
              className="no-print trade-icon-btn rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[#5C3D2E] flex items-center justify-center cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggleConfirmDelete(trade.id)}
              aria-label="Delete trade"
              title="Delete trade"
              className="no-print trade-icon-btn rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[#9B2C20] flex items-center justify-center cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inline Delete Confirmation */}
        {isConfirmingDelete && (
          <div className="no-print px-3 py-2 rounded-xl bg-[#F5B8B0]/60 border-2 border-[#8B5E3C] flex items-center justify-between gap-2">
            <span className="text-[16px] font-bold text-[#9B2C20]">
              Delete this trade?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onConfirmDelete(trade.id)}
                className="touch-btn px-3.5 py-1.5 rounded-xl bg-[#F5B8B0] border-2 border-[#8B5E3C] text-[16px] font-extrabold text-[#9B2C20] cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="touch-btn px-3.5 py-1.5 rounded-xl bg-[#FFFDF7] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Line 2: Risk limit warning, note, Charts chip / + Add chart chip, and mistake tags (§4) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dotted border-[#8B5E3C]/40">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {violated && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#F5B8B0] border border-[#8B5E3C] text-[15px] font-extrabold text-[#9B2C20]">
                Over your risk limit!
              </span>
            )}
            {trade.notes && (
              <span className="text-[15px] text-[#5C3D2E] truncate max-w-md">
                {trade.notes}
              </span>
            )}

            {/* Charts count chip or soft "+ Add chart" chip (§4) */}
            {chartsCount > 0 ? (
              <button
                type="button"
                data-testid={`trade-charts-chip-${tradeIndex + 1}`}
                onClick={() => onOpenChartViewer?.(trade.id)}
                className="no-print px-2.5 py-0.5 rounded-full bg-[#DCEEF2] border border-[#8B5E3C] text-[13px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#8B5E3C]" />
                <span>
                  {chartsCount} {chartsCount === 1 ? 'chart' : 'charts'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                data-testid={`trade-add-chart-chip-${tradeIndex + 1}`}
                onClick={() => onEdit(trade, true)}
                className="no-print px-2.5 py-0.5 rounded-full bg-[#FFFBF2] border border-dashed border-[#8B5E3C] text-[13px] font-bold text-[#8B5E3C] inline-flex items-center gap-1 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>+ Add chart</span>
              </button>
            )}
          </div>

          {effectiveMistakes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {effectiveMistakes.map((m) => {
                const minor = isMinorMistake(m);
                const isOverTradeChip = m === 'Over Trading';
                return (
                  <span
                    key={m}
                    data-testid={
                      isOverTradeChip ? 'over-trading-chip' : undefined
                    }
                    className={`px-2.5 py-0.5 rounded-full border border-[#8B5E3C] text-[14px] font-extrabold ${
                      isOverTradeChip
                        ? 'bg-[#F5B8B0] text-[#9B2C20]'
                        : minor
                          ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                          : 'bg-[#F8D0CC] text-[#9B2C20]'
                    }`}
                  >
                    {m}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);

TradeRowCard.displayName = 'TradeRowCard';

export const TradeTable: React.FC<TradeTableProps> = React.memo(
  ({
    userId,
    day,
    daysMap = {},
    trades,
    settings,
    onAddTrade,
    onUpdateTrade,
    onDeleteTrade,
    onNotify,
    dailyPnl,
    dailyR,
    onOpenChartViewer,
    externalModalRequest,
  }) => {
    const shouldReduceMotion = useReducedMotion();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOverLimitConfirmOpen, setIsOverLimitConfirmOpen] = useState(false);
    const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
    const [draftTradeId, setDraftTradeId] = useState<string>('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(
      null
    );
    const [showMoreDetails, setShowMoreDetails] = useState(false);

    // 5 Simple Fields for the Pop-up Form
    const [asset, setAsset] = useState('XAUUSD');
    const [session, setSession] = useState<TradingSession>('NY');
    const [riskDollar, setRiskDollar] = useState<string>('250');
    const [resultType, setResultType] = useState<'WIN' | 'LOSS'>('WIN');
    const [resultDollar, setResultDollar] = useState<string>('500');
    const [notes, setNotes] = useState('');

    // Optional More Details & Charts
    const [setupQuality, setSetupQuality] = useState<number>(4);
    const [disciplineScore, setDisciplineScore] = useState<number>(5);
    const [mistakes, setMistakes] = useState<MistakeTag[]>(['None']);
    const [charts, setCharts] = useState<TradeChartAttachment[]>([]);
    const [isChartUploading, setIsChartUploading] = useState<boolean>(false);

    const chartsSectionAnchorRef = useRef<HTMLDivElement | null>(null);
    const pendingOpenChartsSectionRef = useRef<boolean>(false);

    // Track visualViewport for on-screen virtual keyboard safety (§3.6)
    const [vvMetrics, setVvMetrics] = useState<{
      maxHeightPx: number | null;
      offsetY: number;
    }>({
      maxHeightPx: null,
      offsetY: 0,
    });

    useEffect(() => {
      if (
        (!isModalOpen && !isOverLimitConfirmOpen) ||
        typeof window === 'undefined'
      ) {
        return;
      }
      const vv = window.visualViewport;
      if (!vv) return;

      const updateMetrics = () => {
        const keyboardHeight = Math.max(
          0,
          window.innerHeight - (vv.offsetTop + vv.height)
        );
        setVvMetrics({
          maxHeightPx: Math.max(280, Math.round(vv.height * 0.92)),
          offsetY: keyboardHeight > 20 ? -Math.round(keyboardHeight / 2) : 0,
        });
      };

      updateMetrics();
      vv.addEventListener('resize', updateMetrics);
      vv.addEventListener('scroll', updateMetrics);
      return () => {
        vv.removeEventListener('resize', updateMetrics);
        vv.removeEventListener('scroll', updateMetrics);
      };
    }, [isModalOpen, isOverLimitConfirmOpen]);

    const maxRiskDollar = getMaxRiskDollar(settings);
    const maxTradesLimit = getDayMaxTradesLimit(day, settings);
    const overTradesCount = getDayOverTradesCount(day, settings);
    const isAtOrOverLimit = trades.length >= maxTradesLimit;
    const isStrictlyOverLimit = trades.length > maxTradesLimit;

    const latestTradesCountRef = useRef(trades.length);
    latestTradesCountRef.current = trades.length;
    const latestLimitRef = useRef(maxTradesLimit);
    latestLimitRef.current = maxTradesLimit;

    const recentPairs = useMemo(
      () => getRecentTradedPairs(daysMap, day),
      [daysMap, day]
    );

    const scrollToChartsSection = () => {
      window.setTimeout(() => {
        chartsSectionAnchorRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 90);
    };

    const prepareAndOpenAddModal = (openCharts = false) => {
      const shouldOpenCharts =
        openCharts || pendingOpenChartsSectionRef.current;
      pendingOpenChartsSectionRef.current = false;
      const newId = `${day.date}-t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setEditingTradeId(null);
      setDraftTradeId(newId);
      setAsset(recentPairs[0] || 'XAUUSD');
      setSession('NY');
      setRiskDollar(String(maxRiskDollar));
      setResultType('WIN');
      setResultDollar(String(maxRiskDollar * 2));
      setNotes('');
      setSetupQuality(4);
      setDisciplineScore(5);
      setMistakes(['None']);
      setCharts([]);
      setIsChartUploading(false);
      setShowMoreDetails(shouldOpenCharts);
      setIsOverLimitConfirmOpen(false);
      setIsModalOpen(true);
      if (shouldOpenCharts) {
        scrollToChartsSection();
      }
    };

    const handleTapAddTrade = (
      overrideCurrentCount?: number,
      openCharts = false
    ) => {
      const currentCount =
        typeof overrideCurrentCount === 'number'
          ? overrideCurrentCount
          : latestTradesCountRef.current;
      const limit = latestLimitRef.current;

      if (currentCount >= limit) {
        pendingOpenChartsSectionRef.current = openCharts;
        setIsOverLimitConfirmOpen(true);
        return;
      }
      prepareAndOpenAddModal(openCharts);
    };

    const openEditTradeModal = (t: TradeEntry, openCharts = false) => {
      setEditingTradeId(t.id);
      setDraftTradeId(t.id);
      setAsset(t.asset || 'XAUUSD');
      setSession(t.session === 'London' ? 'London' : 'NY');
      setRiskDollar(String(t.riskAmount || maxRiskDollar));
      setResultType(t.outcome >= 0 ? 'WIN' : 'LOSS');
      setResultDollar(String(Math.abs(t.outcome || 0)));
      setNotes(t.notes || '');
      setSetupQuality(t.setupQuality || 4);
      setDisciplineScore(t.disciplineScore || 5);
      setMistakes(t.mistakes && t.mistakes.length > 0 ? t.mistakes : ['None']);
      setCharts(t.charts || []);
      setIsChartUploading(false);
      setShowMoreDetails(openCharts);
      setIsModalOpen(true);
      if (openCharts) {
        scrollToChartsSection();
      }
    };

    // Respond to external modal requests from ChartsOfTheDayCard or ChartViewerModal
    const lastNonceRef = useRef<number>(0);
    useEffect(() => {
      if (
        !externalModalRequest ||
        externalModalRequest.nonce === lastNonceRef.current
      ) {
        return;
      }
      lastNonceRef.current = externalModalRequest.nonce;
      if (externalModalRequest.mode === 'edit' && externalModalRequest.trade) {
        openEditTradeModal(
          externalModalRequest.trade,
          Boolean(externalModalRequest.openChartsSection)
        );
      } else {
        handleTapAddTrade(
          undefined,
          Boolean(externalModalRequest.openChartsSection)
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalModalRequest]);

    const handleCloseModalWithoutSaving = () => {
      if (isChartUploading) return;
      // If cancelling a brand-new trade draft, clean up any uploaded draft chart files
      if (!editingTradeId && charts.length > 0) {
        const draftUploadPaths = charts
          .filter((c) => c.type === 'upload' && c.imagePath)
          .map((c) => c.imagePath);
        if (draftUploadPaths.length > 0) {
          void removeChartFilesFromStorage(draftUploadPaths);
        }
      }
      setIsModalOpen(false);
    };

    const toggleMistakeInModal = (tag: MistakeTag) => {
      if (tag === 'None') {
        setMistakes(['None']);
        return;
      }
      const withoutNone = mistakes.filter((m) => m !== 'None');
      const exists = withoutNone.includes(tag);
      const next = exists
        ? withoutNone.filter((m) => m !== tag)
        : [...withoutNone, tag];
      setMistakes(next.length === 0 ? ['None'] : next);
    };

    const handleSaveModal = (e: React.FormEvent) => {
      e.preventDefault();
      if (isChartUploading) return;

      const numericRisk = Math.max(0, Number(riskDollar) || 0);
      const numericResultAbs = Math.max(0, Number(resultDollar) || 0);
      const signedOutcome =
        resultType === 'WIN' ? numericResultAbs : -numericResultAbs;
      const normalizedAsset = asset.trim().toUpperCase() || 'XAUUSD';

      if (editingTradeId) {
        onUpdateTrade(editingTradeId, {
          asset: normalizedAsset,
          session,
          riskAmount: numericRisk,
          outcome: signedOutcome,
          notes: notes.trim(),
          setupQuality,
          disciplineScore,
          mistakes,
          charts,
        });
        onNotify('Trade updated!', 'success');
      } else {
        const nextCountAfterAdd = trades.length + 1;
        const res = onAddTrade({
          id: draftTradeId,
          asset: normalizedAsset,
          session,
          riskAmount: numericRisk,
          outcome: signedOutcome,
          notes: notes.trim(),
          setupQuality,
          disciplineScore,
          mistakes,
          charts,
        });
        if (res.ok) {
          onNotify('Trade saved!', 'success', 'Add another', () => {
            handleTapAddTrade(nextCountAfterAdd, false);
          });
        } else if (res.reason) {
          onNotify(res.reason, 'warning');
        }
      }
      setIsModalOpen(false);
    };

    const handleFieldFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const target = e.currentTarget;
      window.setTimeout(() => {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 90);
    };

    const handleQuickOpenChartsInModal = () => {
      setShowMoreDetails(true);
      scrollToChartsSection();
    };

    const calculatedRiskPctInModal =
      settings.accountSize > 0
        ? (((Number(riskDollar) || 0) / settings.accountSize) * 100).toFixed(1)
        : '0.0';

    const modalsPortal =
      typeof document !== 'undefined'
        ? createPortal(
            <>
              {/* PART 1.1: OVER-LIMIT CONFIRMATION DIALOG */}
              <AnimatePresence>
                {isOverLimitConfirmOpen && (
                  <div
                    data-testid="over-limit-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="over-limit-dialog-title"
                    onClick={() => setIsOverLimitConfirmOpen(false)}
                    className="no-print fixed inset-0 z-[9998] bg-[#5C3D2E]/45 flex items-center justify-center p-3"
                  >
                    <motion.div
                      initial={
                        shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }
                      }
                      animate={{ opacity: 1, scale: 1 }}
                      exit={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.96 }
                      }
                      transition={{ duration: 0.14 }}
                      onClick={(e) => e.stopPropagation()}
                      style={
                        vvMetrics.offsetY !== 0
                          ? {
                              transform: `translate3d(0, ${vvMetrics.offsetY}px, 0)`,
                            }
                          : undefined
                      }
                      className="w-full max-w-[500px] rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] shadow-xl p-5 space-y-4"
                    >
                      <div className="px-4 py-2.5 rounded-xl bg-[#F5B8B0] border-2 border-[#8B5E3C] flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-[#9B2C20] shrink-0 stroke-[2.5]" />
                        <h3
                          id="over-limit-dialog-title"
                          className="font-heading text-[22px] font-bold uppercase text-[#9B2C20] m-0 leading-tight"
                        >
                          Over your daily limit
                        </h3>
                      </div>

                      <p className="text-[17px] font-bold text-[#5C3D2E] m-0 leading-relaxed">
                        You already logged {trades.length} of {maxTradesLimit}{' '}
                        trades today. Log this extra trade anyway? It will be
                        tagged Over Trading and lower your discipline score.
                      </p>

                      <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsOverLimitConfirmOpen(false)}
                          className="touch-btn min-h-[48px] px-5 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          data-testid="confirm-log-extra-trade"
                          onClick={() => prepareAndOpenAddModal(false)}
                          className="touch-btn min-h-[48px] px-5 rounded-xl bg-[#F5B8B0] border-2 border-[#8B5E3C] font-heading text-[17px] font-bold uppercase text-[#9B2C20] cursor-pointer"
                        >
                          Log it anyway
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* PART 3.6 & SECTION 1: CENTERED 2-COLUMN ADD / EDIT TRADE MODAL WITH CHARTS & STICKY FOOTER */}
              <AnimatePresence>
                {isModalOpen && (
                  <div
                    data-testid="add-trade-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="add-trade-modal-title"
                    onClick={handleCloseModalWithoutSaving}
                    className="no-print fixed inset-0 z-[9999] bg-[#5C3D2E]/45 flex items-center justify-center p-3"
                  >
                    <motion.div
                      initial={
                        shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }
                      }
                      animate={{ opacity: 1, scale: 1 }}
                      exit={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.96 }
                      }
                      transition={{ duration: 0.14 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        maxHeight: vvMetrics.maxHeightPx
                          ? `${vvMetrics.maxHeightPx}px`
                          : '90dvh',
                        transform:
                          vvMetrics.offsetY !== 0
                            ? `translate3d(0, ${vvMetrics.offsetY}px, 0)`
                            : undefined,
                      }}
                      className="w-full max-w-[640px] rounded-2xl bg-[#FFFDF7] border-2 border-[#8B5E3C] shadow-xl flex flex-col overflow-hidden"
                    >
                      {/* Sticky Top Header */}
                      <div className="px-5 pt-3.5 pb-2.5 border-b-2 border-dotted border-[#8B5E3C]/50 flex items-center justify-between shrink-0 bg-[#FFFDF7]">
                        <h3
                          id="add-trade-modal-title"
                          className="font-heading text-[22px] font-bold uppercase text-[#8B5E3C] m-0"
                        >
                          {editingTradeId ? 'EDIT TRADE' : 'ADD A TRADE'}
                        </h3>
                        <button
                          type="button"
                          onClick={handleCloseModalWithoutSaving}
                          aria-label="Close modal"
                          className="touch-btn w-12 h-12 rounded-full bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-center text-[#5C3D2E] cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Form with Scrollable Body + Sticky Footer */}
                      <form
                        onSubmit={handleSaveModal}
                        className="flex-1 flex flex-col min-h-0 overflow-hidden"
                      >
                        <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3.5 panel-scroll">
                          {/* Row 1 (2 Columns): Pair / Asset (with 4 recent pair chips) + Session */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                                1. Pair / Asset
                              </label>
                              <input
                                type="text"
                                inputMode="text"
                                autoCapitalize="characters"
                                required
                                value={asset}
                                onFocus={handleFieldFocus}
                                onChange={(e) =>
                                  setAsset(e.target.value.toUpperCase())
                                }
                                placeholder="Example: XAUUSD"
                                className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] outline-none"
                              />
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {recentPairs.map((pair) => {
                                  const isSelectedPair =
                                    asset.trim().toUpperCase() === pair;
                                  return (
                                    <button
                                      key={pair}
                                      type="button"
                                      onClick={() => setAsset(pair)}
                                      className={`min-h-[36px] px-2.5 py-1 rounded-lg border border-[#8B5E3C] text-[14px] font-extrabold cursor-pointer ${
                                        isSelectedPair
                                          ? 'bg-[#F2D29B] text-[#5C3D2E] border-2'
                                          : 'bg-[#FFFDF7] text-[#8B5E3C]'
                                      }`}
                                    >
                                      {pair}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                                2. Session
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSession('London')}
                                  className={`touch-btn min-h-[52px] rounded-xl border-2 border-[#8B5E3C] text-[16px] font-bold cursor-pointer ${
                                    session === 'London'
                                      ? 'bg-[#DCEEF2] text-[#5C3D2E]'
                                      : 'bg-[#FFFBF2] text-[#8B5E3C]'
                                  }`}
                                >
                                  London
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSession('NY')}
                                  className={`touch-btn min-h-[52px] rounded-xl border-2 border-[#8B5E3C] text-[16px] font-bold cursor-pointer ${
                                    session === 'NY'
                                      ? 'bg-[#F2D29B] text-[#5C3D2E]'
                                      : 'bg-[#FFFBF2] text-[#8B5E3C]'
                                  }`}
                                >
                                  New York
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Row 2 (2 Columns): Risk ($) + Result (WIN/LOSS + $) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[16px] font-bold text-[#5C3D2E]">
                                  3. Money risked ($)
                                </label>
                                <span className="text-[16px] font-bold text-[#8B5E3C]">
                                  ({calculatedRiskPctInModal}%)
                                </span>
                              </div>
                              <input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="any"
                                required
                                value={riskDollar}
                                onFocus={handleFieldFocus}
                                onChange={(e) => setRiskDollar(e.target.value)}
                                className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] outline-none"
                              />
                              {Number(riskDollar) > maxRiskDollar && (
                                <div className="mt-1 px-2.5 py-1 rounded-lg bg-[#F5B8B0] border border-[#8B5E3C] text-[15px] font-bold text-[#9B2C20]">
                                  Over {formatCurrency(maxRiskDollar)} risk
                                  limit!
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                                4. Result ($ amount)
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setResultType('WIN')}
                                  className={`touch-btn min-h-[52px] px-3.5 rounded-xl border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer shrink-0 ${
                                    resultType === 'WIN'
                                      ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                                      : 'bg-[#FFFBF2] text-[#8B5E3C]'
                                  }`}
                                >
                                  WIN
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setResultType('LOSS')}
                                  className={`touch-btn min-h-[52px] px-3.5 rounded-xl border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer shrink-0 ${
                                    resultType === 'LOSS'
                                      ? 'bg-[#F5B8B0] text-[#9B2C20]'
                                      : 'bg-[#FFFBF2] text-[#8B5E3C]'
                                  }`}
                                >
                                  LOSS
                                </button>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  step="any"
                                  required
                                  value={resultDollar}
                                  onFocus={handleFieldFocus}
                                  onChange={(e) =>
                                    setResultDollar(e.target.value)
                                  }
                                  placeholder="$"
                                  className="flex-1 min-w-0 min-h-[52px] px-3 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Quick Note + Small "Add chart" button near the note field (§1) */}
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <label className="block text-[16px] font-bold text-[#5C3D2E]">
                                5. Quick note (optional)
                              </label>
                              <button
                                type="button"
                                data-testid="quick-add-chart-toggle"
                                onClick={handleQuickOpenChartsInModal}
                                className="px-2.5 py-1 rounded-lg bg-[#DCEEF2] border border-[#8B5E3C] text-[13px] font-extrabold text-[#5C3D2E] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-[#8B5E3C]" />
                                <span>
                                  {charts.length > 0
                                    ? `Charts (${charts.length}/2)`
                                    : '+ Add chart'}
                                </span>
                              </button>
                            </div>
                            <input
                              type="text"
                              inputMode="text"
                              value={notes}
                              onFocus={handleFieldFocus}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Short note about this trade..."
                              className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] text-[16px] text-[#5C3D2E] outline-none"
                            />
                          </div>

                          {/* Collapsible "More details (optional)" including "Charts (optional)" (§1) */}
                          <div>
                            <button
                              type="button"
                              data-testid="toggle-more-details-btn"
                              onClick={() =>
                                setShowMoreDetails((prev) => !prev)
                              }
                              className="touch-btn w-full min-h-[48px] px-3.5 rounded-xl bg-[#E2DCEB] border-2 border-[#8B5E3C] text-[16px] font-bold text-[#5C3D2E] flex items-center justify-between cursor-pointer"
                            >
                              <span>
                                More details &amp; Charts (optional
                                {charts.length > 0
                                  ? ` • ${charts.length} attached`
                                  : ''}
                                )
                              </span>
                              {showMoreDetails ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>

                            {showMoreDetails && (
                              <div className="mt-2.5 p-3.5 rounded-xl bg-[#FFFBF2] border-2 border-[#8B5E3C] space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <span className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                                      Setup Quality (1–5)
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {[1, 2, 3, 4, 5].map((num) => (
                                        <button
                                          key={num}
                                          type="button"
                                          onClick={() => setSetupQuality(num)}
                                          className={`touch-btn w-11 h-11 rounded-full border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer ${
                                            setupQuality >= num
                                              ? 'bg-[#F2D29B] text-[#5C3D2E]'
                                              : 'bg-[#FFFDF7] text-[#8B5E3C]'
                                          }`}
                                        >
                                          {num}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <span className="block text-[16px] font-bold text-[#5C3D2E] mb-1">
                                      Discipline (1–5)
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {[1, 2, 3, 4, 5].map((num) => (
                                        <button
                                          key={num}
                                          type="button"
                                          onClick={() =>
                                            setDisciplineScore(num)
                                          }
                                          className={`touch-btn w-11 h-11 rounded-full border-2 border-[#8B5E3C] text-[16px] font-extrabold cursor-pointer ${
                                            disciplineScore >= num
                                              ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                                              : 'bg-[#FFFDF7] text-[#8B5E3C]'
                                          }`}
                                        >
                                          {num}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <span className="block text-[16px] font-bold text-[#5C3D2E] mb-1.5">
                                    Mistake tags (Yellow = Small mistake • Red =
                                    Rule break)
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {MISTAKE_TAGS.map((tag) => {
                                      const selected = mistakes.includes(tag);
                                      const minor = isMinorMistake(tag);
                                      return (
                                        <button
                                          key={tag}
                                          type="button"
                                          onClick={() =>
                                            toggleMistakeInModal(tag)
                                          }
                                          className={`touch-btn min-h-[44px] px-3 py-1 rounded-xl border-2 border-[#8B5E3C] text-[15px] font-bold cursor-pointer ${
                                            selected
                                              ? tag === 'None'
                                                ? 'bg-[#BFE3C0] text-[#2F6B3A]'
                                                : minor
                                                  ? 'bg-[#F7E2A0] text-[#5C3D2E]'
                                                  : 'bg-[#F5B8B0] text-[#9B2C20]'
                                              : 'bg-[#FFFDF7] text-[#5C3D2E]'
                                          }`}
                                        >
                                          {tag}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Section 1: Charts (optional) */}
                                <div ref={chartsSectionAnchorRef}>
                                  <TradeChartsFormSection
                                    userId={userId || 'anon'}
                                    dateIso={day.date}
                                    draftTradeId={draftTradeId}
                                    charts={charts}
                                    onChangeCharts={setCharts}
                                    onUploadingChange={setIsChartUploading}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sticky Footer (Close and SAVE TRADE always visible — blocked only while upload is running) */}
                        <div className="px-5 py-3 border-t-2 border-dotted border-[#8B5E3C]/50 bg-[#FFFDF7] flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            disabled={isChartUploading}
                            onClick={handleCloseModalWithoutSaving}
                            className="touch-btn min-h-[48px] px-5 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] text-[17px] font-bold text-[#5C3D2E] cursor-pointer disabled:opacity-50"
                          >
                            Close
                          </button>
                          <button
                            type="submit"
                            disabled={isChartUploading}
                            data-testid="save-trade-submit"
                            className="touch-btn flex-1 min-h-[48px] px-6 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] font-heading text-[18px] font-bold uppercase text-[#2F6B3A] cursor-pointer disabled:opacity-50"
                          >
                            {isChartUploading
                              ? 'UPLOADING CHART...'
                              : editingTradeId
                                ? 'SAVE CHANGES'
                                : 'SAVE TRADE'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </>,
            document.body
          )
        : null;

    return (
      <section
        aria-label="My Trades Today"
        className="flex flex-col flex-1 min-h-0 gap-2"
      >
        {/* Slim Pastel Heading Bar + Always-Enabled "ADD TRADE" Button (§1.1 & §1.2) */}
        <div className="px-3.5 py-2 rounded-xl bg-[#F2D29B] border-2 border-[#8B5E3C] flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h2 className="font-heading text-[19px] sm:text-[22px] font-bold uppercase text-[#8B5E3C] m-0 leading-tight">
              MY TRADES TODAY
            </h2>
            <span className="text-[16px] font-semibold text-[#5C3D2E] block leading-tight">
              <strong
                data-testid="trades-header-count"
                className={
                  isStrictlyOverLimit
                    ? 'text-[#9B2C20] font-extrabold'
                    : 'text-[#5C3D2E] font-bold'
                }
              >
                {trades.length} of {maxTradesLimit} trades
              </strong>{' '}
              • Limit {formatCurrency(maxRiskDollar)} ({settings.maxRiskPercent}
              %)
            </span>
          </div>

          <button
            type="button"
            data-testid="add-trade-btn"
            onClick={() => handleTapAddTrade(undefined, false)}
            className={`no-print touch-btn min-h-[44px] px-4 rounded-xl border-2 border-[#8B5E3C] font-heading text-[16px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
              isAtOrOverLimit
                ? 'bg-[#F5B8B0] text-[#9B2C20]'
                : 'bg-[#BFE3C0] text-[#2F6B3A]'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span>ADD TRADE</span>
          </button>
        </div>

        {/* Slim Red Notice when over the daily limit (§1.2) */}
        {overTradesCount > 0 && (
          <div
            data-testid="over-limit-notice"
            className="px-3.5 py-2 rounded-xl bg-[#F5B8B0] border-2 border-[#8B5E3C] text-[16px] font-extrabold text-[#9B2C20] shrink-0"
          >
            Over limit: {overTradesCount} extra{' '}
            {overTradesCount === 1 ? 'trade' : 'trades'}. This day counts as a
            rule break.
          </div>
        )}

        {/* Scrollable Trade Cards List */}
        <div className="flex-1 panel-scroll space-y-2 pr-0.5 min-h-0">
          {trades.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#FFFDF7] border-2 border-dashed border-[#8B5E3C]/60 text-center flex flex-col items-center justify-center h-full min-h-[110px] gap-2.5">
              <div className="text-[16px] sm:text-[17px] font-bold text-[#8B5E3C]">
                No trades yet today. Tap ADD TRADE to start.
              </div>
              <button
                type="button"
                onClick={() => handleTapAddTrade(undefined, false)}
                className="no-print touch-btn min-h-[44px] px-5 rounded-xl bg-[#BFE3C0] border-2 border-[#8B5E3C] font-heading text-[16px] font-bold uppercase text-[#2F6B3A] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.8]" />
                <span>ADD TRADE</span>
              </button>
            </div>
          ) : (
            trades.map((trade, idx) => (
              <TradeRowCard
                key={trade.id}
                trade={trade}
                tradeIndex={idx}
                day={day}
                settings={settings}
                isConfirmingDelete={confirmDeleteId === trade.id}
                onEdit={openEditTradeModal}
                onToggleConfirmDelete={(id) =>
                  setConfirmDeleteId((prev) => (prev === id ? null : id))
                }
                onConfirmDelete={(id) => {
                  onDeleteTrade(id);
                  setConfirmDeleteId(null);
                  onNotify('Trade deleted.', 'info');
                }}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onOpenChartViewer={onOpenChartViewer}
              />
            ))
          )}
        </div>

        {/* Pinned Bottom Bar: Total today & R total */}
        <div className="px-4 py-2 rounded-xl bg-[#F0DED4] border-2 border-[#8B5E3C] flex items-center justify-between gap-2 shrink-0">
          <div className="text-[17px] font-extrabold text-[#5C3D2E]">
            Total today:{' '}
            <span
              className={
                dailyPnl > 0
                  ? 'text-[#2F6B3A]'
                  : dailyPnl < 0
                    ? 'text-[#9B2C20]'
                    : 'text-[#5C3D2E]'
              }
            >
              <AnimatedNumber
                value={dailyPnl}
                formatter={(v) => formatCurrency(v, true)}
              />
            </span>
          </div>
          <div className="text-[17px] font-bold text-[#5C3D2E]">
            R total:{' '}
            <strong>
              <AnimatedNumber
                value={dailyR}
                formatter={(v) => formatRMultiple(v)}
              />
            </strong>
          </div>
        </div>

        {modalsPortal}
      </section>
    );
  }
);

TradeTable.displayName = 'TradeTable';
