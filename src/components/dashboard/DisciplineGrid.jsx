import React, { useState, useEffect } from 'react';

export default function DisciplineGrid({ stats }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Delay animation trigger for visual effect
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const items = [
    { label: 'Plan Followed', pct: stats?.planFollowedPct || 0 },
    { label: '4H Candle Alignment', pct: stats?.h4Pct || 0 },
    { label: 'Daily Candle Alignment', pct: stats?.dailyPct || 0 },
    { label: 'Weekly Candle Alignment', pct: stats?.weeklyPct || 0 },
    { label: '1H Candle Alignment', pct: stats?.h1Pct || 0 },
    { label: 'Left-Side Range Clean', pct: stats?.rangeCleanPct || 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <div className="flex justify-between items-end mb-3">
            <span className="text-slate-400 text-sm font-medium">{item.label}</span>
            <span className="font-mono text-lg font-bold text-white">{item.pct.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden discipline-bar-track">
            <div
              className="h-full bg-blue-500 transition-all duration-1000 ease-out discipline-bar-fill"
              style={{ width: mounted ? `${item.pct}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
