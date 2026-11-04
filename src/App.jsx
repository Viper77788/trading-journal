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
  Sparkles,
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
    // Reference anchor date from latest trade or Nov 4, 2026
    const refMs = Date.UTC(2026, 10, 4, 23, 59, 59);

    return trades.filter((t) => {
      // Session Window filter
      if (windowFilter !== 'All' && t.sessionWindow !== windowFilter) {
        return false;
      }

      // Time range filter
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
    <div className="min-h-screen w-full bg-[#0A0D12] text-[#F8FAFC] flex flex-col">
      {/* A. TOP MINIMAL HEADER (No Calculator link) */}
      <header className="w-full border-b border-slate-800/70 bg-[#0A0D12]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1150px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Brand icon + Viper Trading Journal title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shadow-xs">
              <BookOpen size={18} />
            </div>
            <span className="text-base font-bold tracking-tight text-[#F8FAFC]">
              Viper Trading Journal
            </span>
          </div>

          {/* Right: User profile badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#121721] border border-slate-800/80 text-sm font-medium text-[#F8FAFC]">
            <div className="w-6 h-6 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
              <User size={13} />
            </div>
            <span>Trader</span>
          </div>
        </div>
      </header>

      {/* MAIN CENTERED WORKSPACE CONTAINER (Max-Width 1150px) */}
      <main className="w-full max-w-[1150px] mx-auto px-4 sm:px-6 py-7 space-y-5 flex-1">
        {/* B. HERO BANNER CARD ("TRADING WORKSPACE") */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#121721] to-[#121721] border border-slate-800/70 p-6 sm:p-8 shadow-lg">
          {/* Subtle radial emerald ambient glow on the right */}
          <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#10B981]/10 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#10B981]">
                <Sparkles size={13} />
                <span>TRADING WORKSPACE</span>
              </div>

              <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                <span className="block text-[#F8FAFC]">
                  Trade with clarity.
                </span>
                <span className="block text-[#94A3B8] mt-0.5">
                  Review with intention.
                </span>
              </h1>

              <p className="mt-3.5 text-sm sm:text-[15px] text-[#94A3B8] leading-relaxed">
                A calmer place to record your decisions, understand your
                patterns and build consistency one trade at a time.
              </p>
            </div>

            {/* Right-aligned Primary CTA Button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={handleOpenNewTrade}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-[#0A0D12] bg-[#10B981] hover:bg-emerald-400 shadow-md transition-all cursor-pointer"
              >
                <Plus size={17} strokeWidth={2.5} />
                <span>Log a trade</span>
              </button>
            </div>
          </div>
        </section>

        {/* C. HORIZONTAL NAVIGATION & FILTER BAR */}
        <section className="bg-[#121721] rounded-2xl border border-slate-800/70 p-3.5 sm:px-5 sm:py-3.5 shadow-md space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Pill-style navigation tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0A0D12] text-[#F8FAFC] border border-slate-700/80 shadow-xs'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <Icon
                      size={15}
                      className={
                        isActive ? 'text-[#10B981]' : 'text-[#94A3B8]'
                      }
                    />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold ${
                          isActive
                            ? 'bg-[#10B981]/20 text-[#10B981]'
                            : 'bg-slate-800 text-[#94A3B8]'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Time Range Pills */}
            <div className="flex items-center gap-1.5 self-end lg:self-auto shrink-0">
              <span className="text-xs font-medium text-[#94A3B8] mr-1">
                View
              </span>
              {timeRangeOptions.map((tr) => {
                const active = timeRange === tr.id;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => setTimeRange(tr.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {tr.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Window Filter Pills (Retained from core strategy) */}
          <div className="pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8]">
              <Clock size={13} className="text-[#10B981]" />
              <span>Session Liquidity Window (EST):</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {windowFilterOptions.map((w) => {
                const active = windowFilter === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWindowFilter(w.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#10B981] text-[#0A0D12] shadow-xs'
                        : 'bg-[#0A0D12] text-[#94A3B8] hover:text-[#F8FAFC] border border-slate-800/80'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* D & E. ACTIVE WORKSPACE VIEW */}
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
      </main>

      {/* LOG A TRADE MODAL (2-Part Expandable Design) */}
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
