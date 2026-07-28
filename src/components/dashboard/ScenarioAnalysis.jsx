import React, { useState } from 'react';
import { SCENARIO_CONDITIONS } from '../../constants';
import { isYes, resultOf } from '../../utils/formatters';

export default function ScenarioAnalysis({ trades }) {
  const [activeKeys, setActiveKeys] = useState(new Set());
  
  // Provide fallback in case constants are not perfectly mapped yet
  const conditions = SCENARIO_CONDITIONS || [
    { key: 'planFollowed', label: 'Plan Followed' },
    { key: 'h4Alignment', label: 'H4 Alignment' },
    { key: 'dailyAlignment', label: 'Daily Alignment' }
  ];

  const toggleKey = (key) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Filter trades where ALL active condition keys are truthy/yes
  const filteredTrades = trades.filter((trade) => {
    for (let key of activeKeys) {
      if (!isYes(trade[key])) {
        return false;
      }
    }
    return true;
  });

  const matchCount = filteredTrades.length;
  const winCount = filteredTrades.filter(t => resultOf(t) === 'Win').length;
  const winRate = matchCount > 0 ? ((winCount / matchCount) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Scenario Analysis</h3>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {conditions.map((cond) => {
          const isActive = activeKeys.has(cond.key);
          return (
            <button
              key={cond.key}
              onClick={() => toggleKey(cond.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cond.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
        <div>
          <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Matching Trades</div>
          <div className="font-mono text-2xl text-white font-bold">{matchCount}</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Winning Trades</div>
          <div className="font-mono text-2xl text-emerald-400 font-bold">{winCount}</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Win Rate</div>
          <div className="font-mono text-2xl text-blue-400 font-bold">{winRate}%</div>
        </div>
      </div>
      
      {activeKeys.size > 0 && matchCount === 0 && (
        <div className="mt-4 text-amber-400/80 text-sm bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
          No trades found matching all selected criteria.
        </div>
      )}
    </div>
  );
}
