import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  PlusCircle,
  Shield,
  RotateCcw,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { useViper } from './context/ViperContext';
import DashboardView from './components/DashboardView';
import AnalyticsView from './components/AnalyticsView';
import TradeLogModal from './components/TradeLogModal';
import ViperCopilotBottomDrawer, {
  ViperCopilotAuditContent,
} from './components/ViperCopilotSidebar';

export default function App() {
  const { accountFilter, setAccountFilter, resetDemoData, analytics } = useViper();

  const [activeView, setActiveView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);

  const handleOpenNewTrade = () => {
    setEditingTrade(null);
    setIsModalOpen(true);
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-[#F8FAFC] flex flex-col">
      {/* Professional Dark Full-Width Header */}
      <header className="sticky top-0 z-30 w-full bg-[#131B2E]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
        <div className="w-full px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-[#F8FAFC] shadow-sm"
              style={{ backgroundColor: '#386641' }}
            >
              <Terminal size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-bold tracking-tight text-[#F8FAFC]">
                  VIPER
                </span>
                <span
                  className="px-2.5 py-1 rounded-md text-sm font-mono font-semibold"
                  style={{
                    backgroundColor: 'rgba(56, 102, 65, 0.25)',
                    color: '#4ade80',
                  }}
                >
                  GC / MGC Futures
                </span>
              </div>
              <p className="text-sm text-[#94A3B8] hidden sm:block">
                Fast Futures Logger • 14-Rule Strategy Audit • $600 Daily Loss Guardrail
              </p>
            </div>
          </div>

          {/* Primary Navigation Tabs: Dashboard, Analytics, Review Session */}
          <div className="flex items-center gap-1.5 bg-[#0B0F17] p-1.5 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeView === 'dashboard'
                  ? 'bg-[#131B2E] text-[#F8FAFC] shadow-sm border border-slate-700/70'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeView === 'analytics'
                  ? 'bg-[#131B2E] text-[#F8FAFC] shadow-sm border border-slate-700/70'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <BarChart3 size={16} />
              <span>Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('review')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeView === 'review'
                  ? 'bg-[#131B2E] text-[#F8FAFC] shadow-sm border border-slate-700/70'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Sparkles size={16} className="text-emerald-400" />
              <span>Review Session</span>
            </button>
          </div>

          {/* Right Controls: Account Filter + Fast Log Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0B0F17] border border-slate-800/80 rounded-xl px-3.5 py-2">
              <Shield size={16} className="text-emerald-400" />
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="bg-transparent text-sm font-semibold text-[#F8FAFC] focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#131B2E] text-[#F8FAFC]">
                  All Accounts
                </option>
                <option value="Lucid Flex" className="bg-[#131B2E] text-[#F8FAFC]">
                  Lucid Flex ($600 Cap)
                </option>
                <option value="Apex" className="bg-[#131B2E] text-[#F8FAFC]">
                  Apex Trader Funding
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenNewTrade}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#F8FAFC] shadow-sm transition-all hover:opacity-95"
              style={{ backgroundColor: '#386641' }}
            >
              <PlusCircle size={17} />
              <span>Fast Log Trade</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset journal to sample Gold (GC/MGCZ6) futures dataset?')) {
                  resetDemoData();
                }
              }}
              className="p-2.5 rounded-xl bg-[#0B0F17] hover:bg-slate-800/70 text-[#94A3B8] hover:text-[#F8FAFC] border border-slate-800/80 transition-colors"
              title="Reset sample data"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Edge-to-Edge Full-Screen Dark Workspace */}
      <main className="flex-1 w-full px-5 sm:px-8 py-6 flex flex-col">
        {activeView === 'dashboard' && (
          <DashboardView
            onOpenLogModal={handleOpenNewTrade}
            onEditTrade={handleEditTrade}
            onOpenSessionReview={() => setIsBottomDrawerOpen(true)}
          />
        )}
        {activeView === 'analytics' && <AnalyticsView />}
        {activeView === 'review' && <ViperCopilotAuditContent />}
      </main>

      {/* Full-Width Dark Footer */}
      <footer className="w-full bg-[#131B2E] border-t border-slate-800/80 py-3.5 px-5 sm:px-8 text-sm text-[#94A3B8]">
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-5">
            <span className="font-mono font-bold text-[#F8FAFC]">VIPER JOURNAL</span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#386641' }} />
              <span>Support #386641</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#BC4749' }} />
              <span>Resistance #BC4749</span>
            </span>
          </div>
          <div className="font-mono text-sm text-[#94A3B8]">
            14-Rule Compliance Avg: <strong className="text-[#F8FAFC]">{analytics.avgComplianceScore}%</strong>
          </div>
        </div>
      </footer>

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
    </div>
  );
}
