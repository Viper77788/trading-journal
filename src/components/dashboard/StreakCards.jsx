import React from 'react';
import { Flame, Trophy, AlertTriangle } from 'lucide-react';

export default function StreakCards({ streaks }) {
  const { current = 0, longestWin = 0, longestLoss = 0 } = streaks || {};

  const currentText = current >= 0 ? `${current} W` : `${Math.abs(current)} L`;
  const currentColor = current >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Current Streak */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <div className="text-slate-400 text-sm font-medium">Current Streak</div>
          <div className={`font-mono text-2xl font-bold mt-1 ${currentColor}`}>{currentText}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
          <Flame size={20} />
        </div>
      </div>

      {/* Longest Win Streak */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <div className="text-slate-400 text-sm font-medium">Longest Win Streak</div>
          <div className="font-mono text-2xl font-bold mt-1 text-emerald-400">{longestWin} W</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <Trophy size={20} />
        </div>
      </div>

      {/* Longest Loss Streak */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <div className="text-slate-400 text-sm font-medium">Longest Loss Streak</div>
          <div className="font-mono text-2xl font-bold mt-1 text-red-400">{longestLoss} L</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
          <AlertTriangle size={20} />
        </div>
      </div>
    </div>
  );
}
