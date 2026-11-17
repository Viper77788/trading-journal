import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck2,
  BarChart3,
  Calculator,
  Settings as SettingsIcon,
  Flame,
  ShieldCheck,
  Sun,
  Moon,
  Download,
} from 'lucide-react';
import { SPRING_SNAPPY } from '../utils/animations';

export type NavPageId = 'tracker' | 'dashboard' | 'calculator' | 'settings';

interface SidebarProps {
  activePage: NavPageId;
  onSelectPage: (page: NavPageId) => void;
  streakCount: number;
  todayScore: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onQuickExport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  streakCount,
  todayScore,
  theme,
  onToggleTheme,
  onQuickExport,
}) => {
  const navItems: Array<{
    id: NavPageId;
    label: string;
    subtitle: string;
    icon: React.ElementType;
  }> = [
    {
      id: 'tracker',
      label: 'Daily Tracker',
      subtitle: 'Checklist, Trades & Audit',
      icon: CalendarCheck2,
    },
    {
      id: 'dashboard',
      label: 'Dashboard / History',
      subtitle: 'Heatmap, Equity & Leaks',
      icon: BarChart3,
    },
    {
      id: 'calculator',
      label: 'Future Calculator',
      subtitle: 'Compounding & Monte Carlo',
      icon: Calculator,
    },
    {
      id: 'settings',
      label: 'Settings & Backup',
      subtitle: 'Risk Rules & JSON Export',
      icon: SettingsIcon,
    },
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-[#111827]/90 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between lg:min-h-screen lg:sticky lg:top-0 z-30">
      <div className="p-5 sm:p-6 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[#0B0F19] shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-slate-100">
                  ApexFlow
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Risk, Psychology &amp; Growth
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            title="Toggle Light / Dark contrast"
            className="p-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-400" />
            )}
          </button>
        </div>

        {/* Live Streak & Today Score Pill */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#0B0F19]/90 border border-slate-800/80 flex items-center gap-2.5">
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0"
            >
              <Flame className="w-4 h-4 fill-amber-400/30" />
            </motion.div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Streak
              </div>
              <div className="text-sm font-bold font-mono text-slate-100">
                {streakCount} {streakCount === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0B0F19]/90 border border-slate-800/80 flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                todayScore >= 80
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : todayScore >= 50
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
            >
              {todayScore}
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Discipline
              </div>
              <div className="text-sm font-bold text-slate-100">
                {todayScore >= 80
                  ? 'Elite'
                  : todayScore >= 50
                  ? 'Moderate'
                  : 'At Risk'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links with Shared layoutId Sliding Pill */}
        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onSelectPage(item.id)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-colors cursor-pointer shrink-0 lg:w-full ${
                  isActive
                    ? 'text-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/40 shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)]"
                  />
                )}

                <motion.div
                  whileHover={{ scale: 1.12 }}
                  className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-emerald-500 text-[#0B0F19]'
                      : 'bg-[#0B0F19] text-slate-400 border border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </motion.div>

                <div className="relative z-10 min-w-0">
                  <div className="text-sm font-semibold leading-tight">
                    {item.label}
                  </div>
                  <div className="hidden lg:block text-xs text-slate-400 mt-0.5 truncate">
                    {item.subtitle}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Quick Backup Card (Desktop) */}
      <div className="hidden lg:block p-5 border-t border-slate-800/80">
        <div className="p-4 rounded-2xl bg-[#0B0F19]/90 border border-slate-800/80 space-y-3">
          <div className="text-xs font-semibold text-slate-200">
            Local Storage Active
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All journal entries and risk parameters auto-save in your browser.
          </p>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onQuickExport}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-xs font-semibold text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Backup</span>
          </motion.button>
        </div>
      </div>
    </aside>
  );
};
