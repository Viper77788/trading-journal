import React from 'react';
import {
  LayoutDashboard, BookOpen, CalendarDays, PlusCircle,
  BarChart3, LineChart, Sun, Moon, Shield, Trash2, Target,
  Settings, FileText, TrendingUp, NotebookPen
} from 'lucide-react';

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'journal',      label: 'Journal',           icon: BookOpen },
  { id: 'calendar',     label: 'Calendar',          icon: CalendarDays },
  { id: 'trade-new',    label: 'Add Trade',         icon: PlusCircle },
  { id: 'analytics',   label: 'Analytics',          icon: BarChart3 },
  { id: 'dailyjournal', label: 'Daily Journal',     icon: NotebookPen,  badge: 'NEW' },
  { id: 'reports',      label: 'Reports',           icon: FileText,     badge: 'NEW' },
  { id: 'progress',     label: 'Progress Tracker',  icon: TrendingUp,   badge: 'NEW' },
  { id: 'playbook',     label: 'Playbook',          icon: Target },
  { id: 'propfirm',    label: 'Prop Firm',          icon: Shield },
  { id: 'settings',    label: 'Settings',           icon: Settings },
  { id: 'trash',        label: 'Trash Bin',         icon: Trash2 },
];

export default function Sidebar({ currentView, onNavigate, onToggleTheme, isDark }) {
  return (
    <aside className="flex flex-col w-64 h-full bg-slate-950 dark:bg-slate-950 light:bg-white text-slate-300 dark:text-slate-300 light:text-slate-700 transition-colors duration-200 border-r border-transparent light:border-slate-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20">
          <LineChart className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-white dark:text-white light:text-slate-900 tracking-tight">Trading Journal</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'trade-new' && currentView === 'trade');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center w-full gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 light:bg-blue-50 light:text-blue-600 font-semibold shadow-sm'
                  : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-white/5 light:hover:bg-slate-100'
              }`}
            >
              <Icon size={20} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4">
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium text-slate-400 dark:text-slate-400 light:text-slate-600 rounded-xl hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-white/5 light:hover:bg-slate-100 transition-colors"
        >
          {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-500" />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
}
