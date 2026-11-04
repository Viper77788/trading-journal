import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Upload,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  Star,
  Clock,
  Download,
  Sparkles,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import { formatUSD } from '../utils/viperAnalytics';
import {
  LIQUIDITY_WINDOWS,
  FEELING_OPTIONS,
  MARKET_CONDITION_OPTIONS,
} from '../constants/viperConstants';
import {
  formatLiquidityWindowESTLabel,
  exportTradingJournalCsv,
} from '../utils/ninjaTraderCsvParser';

/**
 * §6. Liquidity Window Badge:
 * - green = London (2:00–5:00 AM EST)
 * - blue = NY (9:00 AM–12:00 PM EST)
 * - grey = Outside Window
 */
export function LiquidityWindowBadge({ sessionWindow, time }) {
  const label = formatLiquidityWindowESTLabel(sessionWindow, time);

  if (sessionWindow === LIQUIDITY_WINDOWS.ASIAN_LONDON) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-pill)',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--green)',
          border: '1px solid rgba(16, 185, 129, 0.38)',
          whiteSpace: 'nowrap',
        }}
      >
        <Clock size={12} style={{ flexShrink: 0 }} />
        <span>{label}</span>
      </span>
    );
  }

  if (sessionWindow === LIQUIDITY_WINDOWS.NY_OPEN) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-pill)',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          color: '#60A5FA',
          border: '1px solid rgba(59, 130, 246, 0.38)',
          whiteSpace: 'nowrap',
        }}
      >
        <Clock size={12} style={{ flexShrink: 0 }} />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border)',
        whiteSpace: 'nowrap',
      }}
    >
      <Clock size={12} style={{ flexShrink: 0 }} />
      <span>Outside Window</span>
    </span>
  );
}

export default function DashboardView({
  trades,
  onOpenLogModal,
  onOpenImportModal,
  onEditTrade,
}) {
  const { deleteTrade, clearAllTrades, loadSampleNinjaTraderCsv } = useViper();
  const [searchQuery, setSearchQuery] = useState('');

  const searchedTrades = trades.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const winLabel = formatLiquidityWindowESTLabel(
      t.sessionWindow,
      t.time
    ).toLowerCase();
    return (
      t.contract?.toLowerCase().includes(q) ||
      t.direction?.toLowerCase().includes(q) ||
      winLabel.includes(q) ||
      t.notes?.toLowerCase().includes(q) ||
      (t.customTags || []).join(' ').toLowerCase().includes(q) ||
      (t.feelings || []).join(' ').toLowerCase().includes(q) ||
      (t.marketConditions || []).join(' ').toLowerCase().includes(q) ||
      (t.leakTags || []).join(' ').toLowerCase().includes(q)
    );
  });

  // §5. Decision Archive Metrics
  const totalTrades = searchedTrades.length;
  const netResult = searchedTrades.reduce(
    (sum, t) => sum + (Number(t.netPnl) || 0),
    0
  );
  const winsCount = searchedTrades.filter(
    (t) => (Number(t.netPnl) || 0) > 0
  ).length;
  const lossesCount = searchedTrades.filter(
    (t) => (Number(t.netPnl) || 0) < 0
  ).length;
  const winRate =
    totalTrades > 0 ? ((winsCount / totalTrades) * 100).toFixed(1) : '0.0';

  const bestTradePnl =
    totalTrades > 0
      ? Math.max(...searchedTrades.map((t) => Number(t.netPnl) || 0))
      : null;

  const revengeFlaggedCount = searchedTrades.filter(
    (t) => t.isRevengeTrade
  ).length;
  const cleanTradesCount = Math.max(0, totalTrades - revengeFlaggedCount);

  const handleExportCsv = () => {
    const csvContent = exportTradingJournalCsv(searchedTrades);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'trading-journal-2026-11-04.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* §5. DECISION ARCHIVE CARD */}
      <section className="viper-card">
        {/* Top Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow-green">DECISION ARCHIVE</div>
            <h2
              className="card-title"
              style={{ marginTop: '6px', marginBottom: 0 }}
            >
              Every trade, in context
            </h2>
            <p
              style={{
                marginTop: '4px',
                marginBottom: 0,
                fontSize: '15px',
                color: 'var(--text-muted)',
              }}
            >
              Search the details behind the result, not just the result itself.
            </p>
          </div>

          {/* Right: Button Group (all 40px high, 14px/600, 8px gap, wrap on mobile) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={onOpenImportModal}
              className="cursor-pointer transition-colors hover:bg-slate-800/50"
              style={{
                height: '40px',
                padding: '0 16px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Upload size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Import CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="cursor-pointer transition-opacity hover:opacity-90"
              style={{
                height: '40px',
                padding: '0 16px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.38)',
                color: 'var(--green)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            {trades.length > 0 && (
              <button
                type="button"
                onClick={clearAllTrades}
                className="cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.38)',
                  color: 'var(--red)',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Trash2 size={15} />
                <span>Clear CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenLogModal}
              className="cursor-pointer transition-opacity hover:opacity-90"
              style={{
                height: '40px',
                padding: '0 18px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--green)',
                border: 'none',
                color: '#0A0D12',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Log trade</span>
            </button>
          </div>
        </div>

        {/* §3 & §5. 4-Column Metric Grid with 1px Vertical Dividers */}
        <div className="viper-metric-grid">
          {/* 1. NET RESULT */}
          <div className="viper-metric-cell">
            <div className="eyebrow-label">NET RESULT</div>
            <div
              className="metric-value"
              style={{
                marginTop: '8px',
                color:
                  netResult > 0
                    ? 'var(--green)'
                    : netResult < 0
                    ? 'var(--red)'
                    : 'var(--green)',
              }}
            >
              {formatUSD(netResult)}
            </div>
            <div
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              Across {totalTrades} {totalTrades === 1 ? 'execution' : 'executions'}
            </div>
          </div>

          {/* 2. WIN RATE */}
          <div className="viper-metric-cell">
            <div className="eyebrow-label">WIN RATE</div>
            <div
              className="metric-value"
              style={{ marginTop: '8px', color: 'var(--text)' }}
            >
              {winRate}%
            </div>
            <div
              className="tabular-nums"
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              {winsCount}W / {lossesCount}L record
            </div>
          </div>

          {/* 3. BEST RESULT */}
          <div className="viper-metric-cell">
            <div className="eyebrow-label">BEST RESULT</div>
            <div
              className="metric-value"
              style={{
                marginTop: '8px',
                color:
                  bestTradePnl !== null && bestTradePnl > 0
                    ? 'var(--green)'
                    : 'var(--text-muted)',
              }}
            >
              {bestTradePnl !== null ? formatUSD(bestTradePnl) : '—'}
            </div>
            <div
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              Single trade peak
            </div>
          </div>

          {/* 4. TRADES + Clean / Revenge Pills */}
          <div className="viper-metric-cell">
            <div className="eyebrow-label">TRADES</div>
            <div
              className="metric-value"
              style={{ marginTop: '8px', color: 'var(--text)' }}
            >
              {totalTrades}
            </div>
            <div
              style={{
                marginTop: '8px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                className="tabular-nums"
                style={{
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--green)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  whiteSpace: 'nowrap',
                }}
              >
                {cleanTradesCount} Clean
              </span>
              <span
                className="tabular-nums"
                style={{
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor:
                    revengeFlaggedCount > 0
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(148, 163, 184, 0.1)',
                  color:
                    revengeFlaggedCount > 0
                      ? 'var(--red)'
                      : 'var(--text-muted)',
                  border:
                    revengeFlaggedCount > 0
                      ? '1px solid rgba(239, 68, 68, 0.38)'
                      : '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}
              >
                {revengeFlaggedCount} &lt;15m Revenge
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* §6. TRADE LOG TABLE / EMPTY STATE CARD */}
      <section className="viper-card">
        {trades.length === 0 ? (
          /* Empty State (§6) */
          <div
            style={{
              padding: '48px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '460px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.32)',
                color: 'var(--green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <CalendarIcon size={26} />
            </div>
            <h3 className="card-title" style={{ margin: 0 }}>
              Your trade log is ready
            </h3>
            <p
              style={{
                marginTop: '8px',
                marginBottom: 0,
                fontSize: '15px',
                color: 'var(--text-muted)',
              }}
            >
              Once you log a trade, this is where you&apos;ll review the
              decision, context and result.
            </p>
            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={onOpenLogModal}
                className="cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  height: '40px',
                  padding: '0 18px',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: 'var(--green)',
                  border: 'none',
                  color: '#0A0D12',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Log a trade</span>
              </button>
              <button
                type="button"
                onClick={() => loadSampleNinjaTraderCsv()}
                className="cursor-pointer transition-colors hover:bg-slate-800/50"
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Sparkles size={15} style={{ color: 'var(--green)' }} />
                <span>Load Sample Orders.csv</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Search Bar (44px high) + Result Count on the Right */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  flex: '1 1 320px',
                  maxWidth: '560px',
                  minWidth: 0,
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by contract, liquidity window, emotion, tag or notes..."
                  className="viper-input"
                  style={{
                    height: '44px',
                    paddingLeft: '40px',
                    paddingRight: '16px',
                  }}
                />
              </div>

              <div
                className="tabular-nums"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                Showing{' '}
                <strong style={{ color: 'var(--text)', fontWeight: 600 }}>
                  {searchedTrades.length}
                </strong>{' '}
                {searchedTrades.length === 1 ? 'execution' : 'executions'} •
                12-hour EST
              </div>
            </div>

            {/* DESKTOP & TABLET TABLE (≥768px): fixed layout with exact column percentages */}
            <div
              className="hidden md:block"
              style={{
                width: '100%',
                overflowX: 'auto',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-2)',
              }}
            >
              <table
                className="w-full min-w-[1100px] xl:min-w-0"
                style={{
                  width: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                }}
              >
                <colgroup>
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '19%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                    }}
                  >
                    <th
                      className="eyebrow-label"
                      style={{
                        padding: '14px 16px',
                        position: 'sticky',
                        top: 0,
                      }}
                    >
                      Date &amp; Time
                    </th>
                    <th
                      className="eyebrow-label"
                      style={{ padding: '14px 16px' }}
                    >
                      Liquidity Window
                    </th>
                    <th
                      className="eyebrow-label"
                      style={{ padding: '14px 16px' }}
                    >
                      Contract
                    </th>
                    <th
                      className="eyebrow-label"
                      style={{ padding: '14px 16px' }}
                    >
                      Direction &amp; Lots
                    </th>
                    <th
                      className="eyebrow-label"
                      style={{ padding: '14px 16px' }}
                    >
                      Entry → Exit
                    </th>
                    <th
                      className="eyebrow-label"
                      style={{ padding: '14px 16px', textAlign: 'right' }}
                    >
                      Net P&amp;L
                    </th>
                    <th
                      className="eyebrow-label"
                      style={{ padding: '14px 16px' }}
                    >
                      Execution Grade &amp; Tags
                    </th>
                    <th
                      className="eyebrow-label"
                      style={{ padding: '14px 16px', textAlign: 'right' }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searchedTrades.map((trade) => {
                    const isPositive = Number(trade.netPnl) > 0;
                    const isNegative = Number(trade.netPnl) < 0;
                    const stars = Number(trade.executionGrade) || 0;

                    return (
                      <tr
                        key={trade.id}
                        className="transition-colors hover:bg-slate-800/35"
                        style={{
                          borderBottom: '1px solid var(--border)',
                          minHeight: '64px',
                        }}
                      >
                        {/* 1. Date & Time (16%) */}
                        <td
                          className="tabular-nums"
                          style={{
                            padding: '16px',
                            verticalAlign: 'middle',
                            fontSize: '14px',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--text)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {trade.formattedDateEST} EST
                          </div>
                          <div
                            style={{
                              marginTop: '4px',
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Exit: {trade.exitTimeEST} • {trade.timeCT}
                          </div>
                        </td>

                        {/* 2. Liquidity Window (14%) */}
                        <td
                          style={{
                            padding: '16px',
                            verticalAlign: 'middle',
                          }}
                        >
                          <LiquidityWindowBadge
                            sessionWindow={trade.sessionWindow}
                            time={trade.time}
                          />
                        </td>

                        {/* 3. Contract (8%) */}
                        <td
                          style={{
                            padding: '16px',
                            verticalAlign: 'middle',
                          }}
                        >
                          <span
                            className="tabular-nums"
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              backgroundColor: 'var(--surface)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            {trade.contract || 'MGCZ6'}
                          </span>
                        </td>

                        {/* 4. Direction & Lots (11%) */}
                        <td
                          style={{
                            padding: '16px',
                            verticalAlign: 'middle',
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '6px',
                            }}
                          >
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                backgroundColor:
                                  trade.direction === 'Long'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(239, 68, 68, 0.15)',
                                color:
                                  trade.direction === 'Long'
                                    ? 'var(--green)'
                                    : 'var(--red)',
                                border:
                                  trade.direction === 'Long'
                                    ? '1px solid rgba(16, 185, 129, 0.38)'
                                    : '1px solid rgba(239, 68, 68, 0.38)',
                              }}
                            >
                              {trade.direction}
                            </span>
                            <span
                              className="tabular-nums"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                backgroundColor: 'var(--surface)',
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {trade.quantity || 1}x
                            </span>
                          </div>
                        </td>

                        {/* 5. Entry -> Exit (14%) */}
                        <td
                          className="tabular-nums"
                          style={{
                            padding: '16px',
                            verticalAlign: 'middle',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span>{Number(trade.entryPrice || 0).toFixed(2)}</span>
                          <span
                            style={{
                              color: 'var(--text-dim)',
                              margin: '0 6px',
                            }}
                          >
                            →
                          </span>
                          <span>{Number(trade.exitPrice || 0).toFixed(2)}</span>
                        </td>

                        {/* 6. Net P&L (10%) */}
                        <td
                          className="tabular-nums"
                          style={{
                            padding: '16px',
                            verticalAlign: 'middle',
                            textAlign: 'right',
                            fontSize: '14px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            color: isPositive
                              ? 'var(--green)'
                              : isNegative
                              ? 'var(--red)'
                              : 'var(--text-muted)',
                          }}
                        >
                          {formatUSD(trade.netPnl)}
                        </td>

                        {/* 7. Execution Grade & Tags (19% - wraps naturally, never cut off) */}
                        <td
                          style={{
                            padding: '16px',
                            verticalAlign: 'middle',
                            minWidth: 0,
                          }}
                        >
                          {/* Line 1: Stars */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              marginBottom: '6px',
                            }}
                          >
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={13}
                                style={{
                                  color:
                                    s <= stars
                                      ? 'var(--green)'
                                      : 'rgba(148, 163, 184, 0.25)',
                                  fill:
                                    s <= stars ? 'var(--green)' : 'transparent',
                                }}
                              />
                            ))}
                          </div>

                          {/* Line 2: Emotion pills + Revenge badge wrapping cleanly */}
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {trade.isRevengeTrade && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-pill)',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                  color: 'var(--red)',
                                  border: '1px solid rgba(239, 68, 68, 0.38)',
                                }}
                              >
                                🚨 Revenge (&lt;15m gap)
                              </span>
                            )}

                            {(trade.feelings || []).map((fId) => {
                              const fMeta = FEELING_OPTIONS.find(
                                (item) => item.id === fId
                              );
                              const label = fMeta ? fMeta.label : fId;
                              const isRevengeFeeling = fId === 'Revenge';
                              return (
                                <span
                                  key={fId}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-pill)',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    backgroundColor: isRevengeFeeling
                                      ? 'rgba(239, 68, 68, 0.15)'
                                      : 'var(--surface)',
                                    color: isRevengeFeeling
                                      ? 'var(--red)'
                                      : 'var(--text)',
                                    border: isRevengeFeeling
                                      ? '1px solid rgba(239, 68, 68, 0.38)'
                                      : '1px solid var(--border)',
                                  }}
                                >
                                  {label}
                                </span>
                              );
                            })}

                            {(trade.marketConditions || []).map((mcId) => {
                              const mcMeta = MARKET_CONDITION_OPTIONS.find(
                                (item) => item.id === mcId
                              );
                              return (
                                <span
                                  key={mcId}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-pill)',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    backgroundColor: 'var(--surface)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  {mcMeta ? mcMeta.label : mcId}
                                </span>
                              );
                            })}

                            {(trade.customTags || []).map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-pill)',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                  color: 'var(--green)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 8. Actions (8% - 32px icon buttons aligned right) */}
                        <td
                          style={{
                            padding: '16px',
                            verticalAlign: 'middle',
                            textAlign: 'right',
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '4px',
                            }}
                          >
                            {trade.chartUrl && (
                              <a
                                href={trade.chartUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="View Chart"
                                className="hover:bg-slate-800/70 transition-colors"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                <ExternalLink size={15} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditTrade(trade)}
                              title="Edit trade"
                              className="cursor-pointer hover:bg-slate-800/70 transition-colors"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-muted)',
                                backgroundColor: 'transparent',
                                border: 'none',
                              }}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTrade(trade.id)}
                              title="Delete trade"
                              className="cursor-pointer hover:bg-red-500/15 transition-colors"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-muted)',
                                backgroundColor: 'transparent',
                                border: 'none',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE STACKED TRADE CARDS (<768px, §8) */}
            <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchedTrades.map((trade) => {
                const isPositive = Number(trade.netPnl) > 0;
                const isNegative = Number(trade.netPnl) < 0;
                const stars = Number(trade.executionGrade) || 0;

                return (
                  <div
                    key={trade.id}
                    style={{
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Top: Date + Net P&L */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <div className="tabular-nums">
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text)',
                          }}
                        >
                          {trade.formattedDateEST} EST
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          Exit: {trade.exitTimeEST} • {trade.timeCT}
                        </div>
                      </div>

                      <div
                        className="tabular-nums"
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: isPositive
                            ? 'var(--green)'
                            : isNegative
                            ? 'var(--red)'
                            : 'var(--text-muted)',
                        }}
                      >
                        {formatUSD(trade.netPnl)}
                      </div>
                    </div>

                    {/* Middle: Contract, Direction, Lots, Window, Prices */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        className="tabular-nums"
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {trade.contract || 'MGCZ6'}
                      </span>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor:
                            trade.direction === 'Long'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            trade.direction === 'Long'
                              ? 'var(--green)'
                              : 'var(--red)',
                          border:
                            trade.direction === 'Long'
                              ? '1px solid rgba(16, 185, 129, 0.38)'
                              : '1px solid rgba(239, 68, 68, 0.38)',
                        }}
                      >
                        {trade.direction} {trade.quantity || 1}x
                      </span>
                      <LiquidityWindowBadge
                        sessionWindow={trade.sessionWindow}
                        time={trade.time}
                      />
                      <span
                        className="tabular-nums"
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {Number(trade.entryPrice || 0).toFixed(2)} →{' '}
                        {Number(trade.exitPrice || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Bottom: Stars + Tags + Actions */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'inline-flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              style={{
                                color:
                                  s <= stars
                                    ? 'var(--green)'
                                    : 'rgba(148, 163, 184, 0.25)',
                                fill:
                                  s <= stars ? 'var(--green)' : 'transparent',
                              }}
                            />
                          ))}
                        </div>
                        {trade.isRevengeTrade && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '12px',
                              fontWeight: 600,
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: 'var(--red)',
                              border: '1px solid rgba(239, 68, 68, 0.38)',
                            }}
                          >
                            🚨 Revenge (&lt;15m gap)
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => onEditTrade(trade)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTrade(trade.id)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--red)',
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
