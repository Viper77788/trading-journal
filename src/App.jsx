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
    <div className="min-h-screen w-full bg-[#F4F4F6] text-slate-900 flex flex-col">
      {/* Clean Modern High-Contrast Full-Width Header */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-white shadow-xs"
              style={{ backgroundColor: '#386641' }}
            >
              <Terminal size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900">
                  VIPER
                </span>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase"
                  style={{
                    backgroundColor: 'rgba(56, 102, 65, 0.1)',
                    color: '#386641',
                  }}
                >
                  GC / MGC Futures
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Fast Futures Logger • 14-Rule Strategy Audit • $600 Daily Loss Guardrail
              </p>
            </div>
          </div>

          {/* Primary Navigation Tabs: Executions, Analytics, Review Session */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={14} />
              <span>Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('review')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'review'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles size={14} style={{ color: '#386641' }} />
              <span>Review Session</span>
            </button>
          </div>

          {/* Right Controls: Account Filter + Fast Log Button */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5">
              <Shield size={13} style={{ color: '#386641' }} />
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Accounts</option>
                <option value="Lucid Flex">Lucid Flex ($600 Cap)</option>
                <option value="Apex">Apex Trader Funding</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenNewTrade}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-95"
              style={{ backgroundColor: '#386641' }}
            >
              <PlusCircle size={15} />
              <span>Fast Log Trade</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset journal to sample Gold (GC/MGCZ6) futures dataset?')) {
                  resetDemoData();
                }
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors"
              title="Reset sample data"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Edge-to-Edge Full-Screen Workspace */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5 flex flex-col">
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

      {/* Full-Width Minimal Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="w-full flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="font-mono font-bold text-slate-800">VIPER JOURNAL</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#386641' }} />
              <span>Support #386641</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#BC4749' }} />
              <span>Resistance #BC4749</span>
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            14-Rule Compliance Avg: <strong className="text-slate-900">{analytics.avgComplianceScore}%</strong>
          </div>
        </div>
      </footer>

      {/* On-Demand Collapsible Bottom AI Copilot Drawer (Hidden when already on Review tab) */}
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
