import React, { useState, useMemo } from 'react';
import {
  BarChart2,
  List,
  Calendar,
  Compass,
  TrendingUp,
  Shield,
  Award,
  Plus,
  User,
  BookOpen,
  Clock,
} from 'lucide-react';
import { useViper } from './context/ViperContext';
import { LIQUIDITY_WINDOWS } from './constants/viperConstants';
import DashboardView from './components/DashboardView';
import WorkspaceTabView from './components/AnalyticsView';
import TradeLogModal from './components/TradeLogModal';
import NinjaTraderImportModal from './components/NinjaTraderImportModal';

export default function App() {
  const { trades, strategies } = useViper();

  const [activeTab, setActiveTab] = useState('tradelog');
  const [timeRange, setTimeRange] = useState('30d');
  const [windowFilter, setWindowFilter] = useState('All');

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);

  const handleOpenNewTrade = () => {
    setEditingTrade(null);
    setIsLogModalOpen(true);
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setIsLogModalOpen(true);
  };

  // Filter trades by Time Range + Liquidity Window
  const filteredTrades = useMemo(() => {
    const refMs = Date.UTC(2026, 10, 4, 23, 59, 59);

    return trades.filter((t) => {
      if (windowFilter !== 'All' && t.sessionWindow !== windowFilter) {
        return false;
      }

      if (timeRange !== 'all' && t.date) {
        const parts = String(t.date).split('-').map(Number);
        if (parts.length === 3 && !Number.isNaN(parts[0])) {
          const tradeMs = Date.UTC(parts[0], parts[1] - 1, parts[2]);
          const diffDays = (refMs - tradeMs) / (1000 * 3600 * 24);
          if (timeRange === '7d' && diffDays > 7) return false;
          if (timeRange === '30d' && diffDays > 30) return false;
          if (timeRange === '90d' && diffDays > 90) return false;
        }
      }

      return true;
    });
  }, [trades, timeRange, windowFilter]);

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    {
      id: 'tradelog',
      label: 'Trade log',
      icon: List,
      badge: filteredTrades.length,
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    {
      id: 'strategies',
      label: 'Strategies',
      icon: Compass,
      badge: strategies.length,
    },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'rules', label: 'Rules', icon: Shield },
    { id: 'report', label: 'Report', icon: Award },
  ];

  const timeRangeOptions = [
    { id: '7d', label: '7 days' },
    { id: '30d', label: '30 days' },
    { id: '90d', label: '90 days' },
    { id: 'all', label: 'All time' },
  ];

  const windowFilterOptions = [
    { id: 'All', label: 'All Windows' },
    {
      id: LIQUIDITY_WINDOWS.ASIAN_LONDON,
      label: '2–5 AM EST (London)',
    },
    {
      id: LIQUIDITY_WINDOWS.NY_OPEN,
      label: '9–12 PM EST (NY)',
    },
    {
      id: LIQUIDITY_WINDOWS.OUTSIDE,
      label: 'Outside Window',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* §4. HEADER (sticky, 64px, backdrop blur, full width with page padding) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          height: '64px',
          width: '100%',
          backgroundColor: 'rgba(10, 13, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          className="viper-shell-padding"
          style={{ height: '100%' }}
        >
          <div
            className="viper-container"
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            {/* Left: Logo icon + Viper Trading Journal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--green)',
                  flexShrink: 0,
                }}
              >
                <BookOpen size={18} />
              </div>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                }}
              >
                Viper Trading Journal
              </span>
            </div>

            {/* Right: User badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                height: '36px',
                padding: '0 14px',
                borderRadius: '999px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  color: 'var(--green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={13} />
              </div>
              <span>Trader</span>
            </div>
          </div>
        </div>
      </header>

      {/* §3. MAIN WORKSPACE SHELL (full width with clamp(16px, 2.5vw, 40px) side padding, vertical stack gap 24px) */}
      <main
        className="viper-shell-padding"
        style={{
          flex: 1,
          paddingTop: '24px',
          paddingBottom: '48px',
        }}
      >
        <div
          className="viper-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* §4. HERO CARD */}
          <section className="viper-hero-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div style={{ minWidth: 0, maxWidth: '680px' }}>
                <div className="eyebrow-green">✨ TRADING WORKSPACE</div>
                <h1
                  className="hero-title"
                  style={{ marginTop: '12px', marginBottom: 0 }}
                >
                  <span>Trade with clarity. </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Review with intention.
                  </span>
                </h1>
                <p
                  style={{
                    marginTop: '12px',
                    marginBottom: 0,
                    maxWidth: '560px',
                    fontSize: '15px',
                    lineHeight: 1.5,
                    color: 'var(--text-muted)',
                  }}
                >
                  A calmer place to record your decisions, understand your
                  patterns and build consistency one trade at a time.
                </p>
              </div>

              <div className="w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleOpenNewTrade}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90"
                  style={{
                    height: '44px',
                    padding: '0 20px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: 'var(--green)',
                    color: '#0A0D12',
                    fontSize: '15px',
                    fontWeight: 600,
                    border: 'none',
                  }}
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span>Log a trade</span>
                </button>
              </div>
            </div>
          </section>

          {/* §4. NAV CARD — TWO CLEAN ROWS, NO OVERFLOW */}
          <section
            className="viper-card"
            style={{ padding: '20px 28px' }}
          >
            {/* Row 1: Left = 7 Navigation Tabs | Right = Range Filter Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                minWidth: 0,
              }}
            >
              {/* Left: Tabs (never shrink or clip) */}
              <div
                className="no-scrollbar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  overflowX: 'auto',
                  maxWidth: '100%',
                  minWidth: 0,
                }}
              >
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        height: '40px',
                        padding: '0 16px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '14px',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        backgroundColor: isActive ? '#1E293B' : 'transparent',
                        color: isActive ? 'var(--text)' : 'var(--text-muted)',
                        border: isActive
                          ? '1px solid rgba(148, 163, 184, 0.22)'
                          : '1px solid transparent',
                      }}
                    >
                      <Icon
                        size={15}
                        style={{
                          color: isActive
                            ? 'var(--green)'
                            : 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      />
                      <span>{tab.label}</span>
                      {tab.badge !== undefined && (
                        <span
                          className="tabular-nums"
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: isActive
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(148, 163, 184, 0.12)',
                            color: isActive
                              ? 'var(--green)'
                              : 'var(--text-muted)',
                          }}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right: "Range" label + Time Range Pills */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  flexShrink: 0,
                }}
              >
                <span
                  className="eyebrow-label"
                  style={{ marginRight: '4px' }}
                >
                  Range
                </span>
                {timeRangeOptions.map((tr) => {
                  const isActive = timeRange === tr.id;
                  return (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => setTimeRange(tr.id)}
                      style={{
                        height: '36px',
                        padding: '0 14px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '13px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        backgroundColor: isActive
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'var(--surface-2)',
                        color: isActive ? 'var(--green)' : 'var(--text-muted)',
                        border: isActive
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid var(--border)',
                      }}
                    >
                      {tr.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Separated by 1px border-top, padding-top 16px */}
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '16px',
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                }}
              >
                <Clock size={14} style={{ color: 'var(--green)' }} />
                <span>Session liquidity window (EST)</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                {windowFilterOptions.map((w) => {
                  const isActive = windowFilter === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWindowFilter(w.id)}
                      style={{
                        height: '36px',
                        padding: '0 14px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '13px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        backgroundColor: isActive
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'var(--surface-2)',
                        color: isActive ? 'var(--green)' : 'var(--text-muted)',
                        border: isActive
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid var(--border)',
                      }}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* §5 & §6. ACTIVE WORKSPACE CONTENT */}
          {activeTab === 'tradelog' ? (
            <DashboardView
              trades={filteredTrades}
              onOpenLogModal={handleOpenNewTrade}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onEditTrade={handleEditTrade}
            />
          ) : (
            <WorkspaceTabView
              activeTab={activeTab}
              trades={filteredTrades}
              onOpenLogModal={handleOpenNewTrade}
              onSwitchToTradeLog={() => setActiveTab('tradelog')}
            />
          )}
        </div>
      </main>

      {/* §7. "LOG A TRADE" MODAL (880px wide, sticky header/footer, scrollable body) */}
      <TradeLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        editTrade={editingTrade}
      />

      {/* CSV IMPORT MODAL */}
      <NinjaTraderImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
