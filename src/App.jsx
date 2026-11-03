import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  PlusCircle,
  Shield,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { useViper } from './context/ViperContext';
import DashboardView from './components/DashboardView';
import AnalyticsView from './components/AnalyticsView';
import TradeLogModal from './components/TradeLogModal';
import ViperCopilotSidebar from './components/ViperCopilotSidebar';

export default function App() {
  const { accountFilter, setAccountFilter, resetDemoData, analytics } = useViper();

  const [activeView, setActiveView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);

  const handleOpenNewTrade = () => {
    setEditingTrade(null);
    setIsModalOpen(true);
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-slate-900 flex flex-col">
      {/* Deep Slate / Charcoal Top Command Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#121417] text-white border-b border-slate-800 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-white shadow-md"
              style={{ backgroundColor: '#386641' }}
            >
              <Terminal size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  VIPER
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-emerald-400 border border-slate-700">
                  GC / MGC Futures
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                14-Rule Strategy Auditing • Support (#386641) & Resistance (#BC4749) • Prop Risk Engine
              </p>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-[#181B20] p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'dashboard'
                  ? 'bg-[#386641] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard & Trades</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'analytics'
                  ? 'bg-[#386641] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              <span>Analytics & R-Distribution</span>
            </button>
          </div>

          {/* Right Controls: Prop Account Filter + Log Trade CTA */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-[#181B20] border border-slate-800 rounded-xl px-3 py-1.5">
              <Shield size={13} className="text-emerald-400" />
              <span className="text-[11px] text-slate-400 hidden md:inline">Prop Account:</span>
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#121417]">
                  All Accounts (Apex + Lucid Flex)
                </option>
                <option value="Lucid Flex" className="bg-[#121417]">
                  Lucid Flex ($600 Daily Cap)
                </option>
                <option value="Apex" className="bg-[#121417]">
                  Apex Trader Funding
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenNewTrade}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:opacity-95"
              style={{ backgroundColor: '#386641' }}
            >
              <PlusCircle size={15} />
              <span>Log Futures Trade</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset journal to sample Gold (GC/MGCZ6) futures dataset?')) {
                  resetDemoData();
                }
              }}
              className="p-2 rounded-xl bg-[#181B20] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Reset sample data"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace: Left = Active View, Right = Dedicated AI Copilot Sidebar */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col xl:flex-row items-start gap-6">
          {/* Primary Module Viewport */}
          <div className="flex-1 w-full min-w-0">
            {activeView === 'dashboard' ? (
              <DashboardView
                onOpenLogModal={handleOpenNewTrade}
                onEditTrade={handleEditTrade}
              />
            ) : (
              <AnalyticsView />
            )}
          </div>

          {/* Dedicated Right AI Copilot & 4-Point Automated Audit Sidebar */}
          <ViperCopilotSidebar />
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-[#121417] text-slate-400 border-t border-slate-800 py-3 px-6 text-xs">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="font-mono font-bold text-white">VIPER v2.0</span>
            <span>Support Zone: <strong className="font-mono text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: '#386641' }}>#386641</strong></span>
            <span>Resistance Zone: <strong className="font-mono text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: '#BC4749' }}>#BC4749</strong></span>
          </div>
          <div className="font-mono text-[11px]">
            14-Rule Compliance Avg: <strong className="text-white">{analytics.avgComplianceScore}%</strong> • LocalStorage Synced (Firebase-Ready)
          </div>
        </div>
      </footer>

      {/* Multi-Tab Trade Logging Modal */}
      <TradeLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTrade={editingTrade}
      />
    </div>
  );
}
