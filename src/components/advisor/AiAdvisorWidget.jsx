import React, { useState } from 'react';
import { Shield, AlertTriangle, AlertCircle, CheckCircle2, Info, X, Lightbulb } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { calculateAiAdvisorRules, dismissAlertKey } from '../../utils/aiAdvisor';

export default function AiAdvisorWidget({ trades = [] }) {
  const { activeAccount, activeAccountId } = useAccount();
  const [dismissedLocal, setDismissedLocal] = useState([]);

  if (activeAccountId === 'all' || !activeAccount) {
    return (
      <div className="glass-card p-5 border border-blue-500/20 bg-blue-600/10 mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">AI Behavioral Advisor Available</h4>
            <p className="text-xs text-slate-300">
              Select a specific trading account from the top menu to view account-scoped discipline score and risk alerts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const advisorData = calculateAiAdvisorRules(activeAccount, trades);
  const { disciplineScore, disciplineRating, alerts, coachingInsights, sampleSizeSufficient, scoreUnlocked } = advisorData;

  const visibleAlerts = alerts.filter(a => !dismissedLocal.includes(a.key));

  const handleDismiss = (key) => {
    dismissAlertKey(key);
    setDismissedLocal([...dismissedLocal, key]);
  };

  const getScoreColor = (score) => {
    if (score === null) return 'text-slate-400 border-slate-700';
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-red-400 border-red-500/40 bg-red-500/10';
  };

  return (
    <div className="glass-card p-6 space-y-6 border border-white/10 mb-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">AI Behavioral Advisor</h3>
            <p className="text-xs text-slate-400">Account: {activeAccount.name}</p>
          </div>
        </div>

        {/* Score Gauge */}
        <div className="flex items-center gap-3">
          {scoreUnlocked ? (
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${getScoreColor(disciplineScore)}`}>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Discipline Score</div>
                <div className="text-xs font-semibold">{disciplineRating}</div>
              </div>
              <div className="text-2xl font-black font-mono ml-1">{disciplineScore}%</div>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 font-medium">
              🔒 Score unlocks after 5 trades logged this month
            </div>
          )}
        </div>
      </div>

      {/* Active Risk Alerts */}
      {visibleAlerts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Risk Alerts ({visibleAlerts.length})</h4>
          <div className="space-y-2.5">
            {visibleAlerts.map((alert) => (
              <div
                key={alert.key}
                className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : alert.severity === 'WARNING'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-white">{alert.title}</h5>
                    <p className="text-xs opacity-90">{alert.message}</p>
                    <p className="text-[11px] font-semibold pt-1 text-white">💡 Action: {alert.recommendation}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(alert.key)}
                  className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
                  title="Dismiss Alert"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Behavioral Insights Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Lightbulb size={14} className="text-amber-400" />
          <span>Behavioral Coaching Recommendations</span>
        </h4>
        {sampleSizeSufficient ? (
          coachingInsights.length > 0 ? (
            <div className="space-y-1.5">
              {coachingInsights.map((insight, idx) => (
                <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-300 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No risk breaches detected. Excellent setup and risk discipline for this account!</p>
          )
        ) : (
          <p className="text-xs text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
            Log at least 15 trades for this account to unlock AI coaching insights based on your personal trading patterns.
          </p>
        )}
      </div>
    </div>
  );
}
