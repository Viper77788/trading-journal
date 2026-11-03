import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  PlusCircle,
  RotateCcw,
  Terminal,
  Sparkles,
  Menu,
  X,
  Upload,
  Clock,
} from 'lucide-react';
import { useViper } from './context/ViperContext';
import DashboardView from './components/DashboardView';
import AnalyticsView from './components/AnalyticsView';
import TradeLogModal from './components/TradeLogModal';
import NinjaTraderImportModal from './components/NinjaTraderImportModal';
import ViperCopilotBottomDrawer, {
  ViperCopilotAuditContent,
} from './components/ViperCopilotSidebar';

export default function App() {
  const {
    accountFilter,
    setAccountFilter,
    resetDemoData,
    analytics,
    dailyLossCap,
    displayTimezone,
    setDisplayTimezone,
  } = useViper();

  const [activeView, setActiveView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenNewTrade = () => {
    setEditingTrade(null);
    setIsModalOpen(true);
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setIsModalOpen(true);
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: `${analytics.totalTrades}`,
    },
    {
      id: 'analytics',
      label: 'Performance Analytics',
      icon: BarChart3,
      badge: `${analytics.avgRMultiple}R`,
    },
    {
      id: 'review',
      label: 'AI Session Review',
      icon: Sparkles,
      badge: `${analytics.avgComplianceScore}%`,
    },
  ];

  const pageHeaderMeta = {
    dashboard: {
      title: 'Trading Accounts & Executions',
      subtitle:
        'Gold (GC) & Micro Gold (MGCZ6) execution log • $25k Lucid Flex ($600 Daily Cap) • 15m Revenge Guard.',
    },
    analytics: {
      title: 'Performance & R-Multiple Analytics',
      subtitle:
        'Cumulative equity curve, R-multiple distribution, and liquidity window breakdown (CT & ET).',
    },
    review: {
      title: 'Viper AI Copilot & 14-Rule Audit',
      subtitle:
        'Objective evaluation of rule compliance, $600 daily loss limit utilization, and < 15m revenge trading leaks.',
    },
  }[activeView];

  return (
    <div className="min-h-screen w-full bg-[#090C10] text-[#FFFFFF] flex overflow-x-hidden">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* LUCID-STYLE VERTICAL LEFT SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111620] border-r border-slate-800/60 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branded Header & Navigation */}
        <div className="p-5 space-y-5">
          {/* Branded Logo Header (VIPER) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#FFFFFF] shadow-sm border border-emerald-500/20"
                style={{ backgroundColor: '#386641' }}
              >
                <Terminal size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-[#FFFFFF]">
                    VIPER
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold text-emerald-300 border border-emerald-500/30"
                    style={{ backgroundColor: 'rgba(56, 102, 65, 0.35)' }}
                  >
                    PRO
                  </span>
                </div>
                <p className="text-xs font-medium text-[#8A99AD]">
                  Gold Futures Terminal
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80"
            >
              <X size={18} />
            </button>
          </div>

          {/* Primary Action Buttons in Sidebar */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleOpenNewTrade();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all hover:opacity-95 cursor-pointer border border-emerald-500/20"
              style={{ backgroundColor: '#386641' }}
            >
              <PlusCircle size={16} />
              <span>Fast Log Trade</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsImportModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#FFFFFF] bg-[#090C10] hover:bg-slate-800/80 border border-slate-800/60 transition-colors cursor-pointer"
            >
              <Upload size={14} className="text-emerald-400" />
              <span>Import NinjaTrader CSV</span>
            </button>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1.5">
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-[#8A99AD] mb-2">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800/90 text-[#FFFFFF] border border-slate-700/70 shadow-xs'
                      : 'text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={17}
                      className={isActive ? 'text-emerald-400' : 'text-[#8A99AD]'}
                    />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold ${
                      isActive
                        ? 'bg-[#090C10] text-emerald-400 border border-slate-800/80'
                        : 'text-[#8A99AD]'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Prop Account Filter Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-[#8A99AD]">
              Prop Firm Account
            </div>
            <div className="space-y-1">
              {[
                { id: 'All', label: 'All Accounts', meta: '$25k Base' },
                { id: 'Lucid Flex', label: 'Lucid Flex', meta: '$25k • $600 Cap' },
                { id: 'Apex', label: 'Apex Funding', meta: '$25k PA' },
              ].map((acc) => {
                const active = accountFilter === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountFilter(acc.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-[#090C10] text-[#FFFFFF] border border-slate-800/80'
                        : 'text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: active ? '#386641' : '#475569',
                        }}
                      />
                      <span>{acc.label}</span>
                    </div>
                    <span className="text-xs font-mono text-[#8A99AD]">{acc.meta}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Bottom Account Balance & Daily Loss Guardrail */}
        <div className="p-5 border-t border-slate-800/60 space-y-4 bg-[#090C10]/40">
          {/* $25k Account Balance & Daily Loss Guardrail Card */}
          <div className="p-3.5 rounded-xl bg-[#090C10] border border-slate-800/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-[#8A99AD]">
              <span>$25K LUCID FLEX</span>
              <span
                className="px-2 py-0.5 rounded text-xs font-mono font-semibold text-[#FFFFFF]"
                style={{
                  backgroundColor: analytics.dailyLossTracker.riskStatusPass
                    ? '#386641'
                    : '#BC4749',
                }}
              >
                {analytics.dailyLossTracker.riskStatusPass ? 'ACTIVE' : 'BREACH'}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-[#FFFFFF]">
                ${analytics.currentAccountBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs font-mono text-[#8A99AD]">
                -${analytics.dailyLossTracker.latestDayLossUsed.toFixed(0)} / -${dailyLossCap}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#111620] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(
                    4,
                    analytics.dailyLossTracker.dailyLossUtilizationPct
                  )}%`,
                  backgroundColor:
                    analytics.dailyLossTracker.dailyLossUtilizationPct >= 80
                      ? '#BC4749'
                      : '#386641',
                }}
              />
            </div>
          </div>

          {/* Zone Legend & Reset */}
          <div className="flex items-center justify-between text-xs text-[#8A99AD]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs"
                  style={{ backgroundColor: '#386641' }}
                />
                <span>#386641</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs"
                  style={{ backgroundColor: '#BC4749' }}
                />
                <span>#BC4749</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    'Reset journal to sample Gold (GC/MGCZ6) futures dataset?'
                  )
                ) {
                  resetDemoData();
                }
              }}
              className="p-1.5 rounded-lg text-[#8A99AD] hover:text-[#FFFFFF] hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Reset sample data"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN OBSIDIAN CANVAS CONTENT AREA (#090C10) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#090C10]">
        {/* Clean Lucid Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#090C10]/90 backdrop-blur-md border-b border-slate-800/60 px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-[#111620] border border-slate-800/60 text-[#8A99AD] hover:text-[#FFFFFF]"
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-[#FFFFFF]">
                    {pageHeaderMeta.title}
                  </h1>
                  <span
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold text-emerald-300 border border-emerald-500/30"
                    style={{ backgroundColor: 'rgba(56, 102, 65, 0.3)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#8A99AD] mt-0.5">
                  {pageHeaderMeta.subtitle}
                </p>
              </div>
            </div>

            {/* Header Right Actions: Timezone Switcher + Import NinjaTrader CSV + Fast Log Trade */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Timezone Switcher (CT / ET / Both) */}
              <div
                className="hidden xl:flex items-center bg-[#111620] p-1 rounded-xl border border-slate-800/60"
                title="NinjaTrader Exchange Time (Chicago CT) vs New York Time (ET = CT + 1h)"
              >
                <Clock size={14} className="text-emerald-400 ml-2 mr-1.5" />
                {[
                  { id: 'BOTH', label: 'CT + ET' },
                  { id: 'CT', label: 'Chicago (CT)' },
                  { id: 'ET', label: 'New York (ET)' },
                ].map((tz) => (
                  <button
                    key={tz.id}
                    type="button"
                    onClick={() => setDisplayTimezone(tz.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      displayTimezone === tz.id
                        ? 'bg-slate-800 text-[#FFFFFF] shadow-xs'
                        : 'text-[#8A99AD] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {tz.label}
                  </button>
                ))}
              </div>

              {/* Import NinjaTrader CSV Button */}
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-[#111620] hover:bg-slate-800/80 text-[#FFFFFF] border border-slate-800/60 transition-colors cursor-pointer"
              >
                <Upload size={15} className="text-emerald-400" />
                <span>Import NinjaTrader CSV</span>
              </button>

              {/* Fast Log Trade Button */}
              <button
                type="button"
                onClick={handleOpenNewTrade}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all hover:opacity-95 cursor-pointer border border-emerald-500/20"
                style={{ backgroundColor: '#386641' }}
              >
                <PlusCircle size={16} />
                <span>Fast Log Trade</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace Container */}
        <main className="flex-1 w-full px-6 lg:px-8 py-6 flex flex-col">
          {activeView === 'dashboard' && (
            <DashboardView
              onOpenLogModal={handleOpenNewTrade}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onEditTrade={handleEditTrade}
              onOpenSessionReview={() => setIsBottomDrawerOpen(true)}
              onNavigateAnalytics={() => setActiveView('analytics')}
            />
          )}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'review' && <ViperCopilotAuditContent />}
        </main>
      </div>

      {/* On-Demand Collapsible Bottom AI Copilot Drawer */}
      {activeView !== 'review' && (
        <ViperCopilotBottomDrawer
          isOpen={isBottomDrawerOpen}
          onToggle={() => setIsBottomDrawerOpen((prev) => !prev)}
        />
      )}

      {/* Streamlined Single-Scroll Fast Trade Log Modal */}
      <TradeLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTrade={editingTrade}
      />

      {/* NinjaTrader CSV Importer & 15-Minute Behavioral Leak Guard Modal */}
      <NinjaTraderImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => setIsBottomDrawerOpen(true)}
      />
    </div>
  );
}
