import React from 'react';

const COLOR_MAP = {
  green: 'bg-emerald-500/15 text-emerald-400',
  red: 'bg-red-500/15 text-red-400',
  blue: 'bg-blue-500/15 text-blue-400',
  purple: 'bg-purple-500/15 text-purple-400',
  amber: 'bg-amber-500/15 text-amber-400',
};

export default function StatCard({ icon: Icon, label, value, sub, color = 'blue', valueColor, animate = false }) {
  const colorClasses = COLOR_MAP[color] || COLOR_MAP.blue;

  let valColor = valueColor;
  if (!valColor) {
    const valStr = String(value || '').trim();
    if (valStr.startsWith('+')) {
      valColor = 'text-emerald-400';
    } else if (valStr.startsWith('-')) {
      valColor = 'text-red-400';
    } else {
      valColor = 'text-white';
    }
  }

  return (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center space-x-4 ${animate ? 'hover:scale-105 transition-transform duration-300' : ''}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <div className="text-slate-400 text-sm font-medium">{label}</div>
        <div className={`font-mono text-2xl font-bold ${valColor}`}>{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}
