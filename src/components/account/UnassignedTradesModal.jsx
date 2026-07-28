import React, { useState, useEffect } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { bulkAssignAccountToTrades } from '../../services/tradeService';
import { useAuth } from '../../context/AuthContext';

export default function UnassignedTradesModal({ trades = [], onComplete }) {
  const { user } = useAuth();
  const { accounts, refreshAccounts } = useAccount();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync selectedAccountId when accounts load
  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Find trades missing accountId or assigned to 'all' / ''
  const orphanedTrades = trades.filter(
    t => (!t.accountId || t.accountId === 'all' || t.accountId === '') && t.isDeleted !== true
  );

  if (!orphanedTrades.length || !accounts.length) return null;

  const activeTargetAccountId = selectedAccountId || accounts[0]?.id;

  const handleAssign = async () => {
    if (!activeTargetAccountId || !user || !orphanedTrades.length) {
      alert('Please select a valid account to assign trades.');
      return;
    }

    setLoading(true);
    try {
      const ids = orphanedTrades.map(t => t.id);
      await bulkAssignAccountToTrades(user.uid, ids, activeTargetAccountId);
      if (onComplete) await onComplete();
      await refreshAccounts();
      alert(`Successfully assigned ${ids.length} trade(s) to account!`);
    } catch (err) {
      alert('Failed to assign trades: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 border border-blue-500/30 bg-blue-600/10 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-white text-sm">Unassigned Trades Detected</h4>
          <p className="text-xs text-slate-300">
            We found <strong className="text-blue-400 font-mono">{orphanedTrades.length}</strong> historical trade(s) not linked to any account.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={activeTargetAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="bg-slate-900 border border-blue-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
        >
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              Assign to: {acc.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
        >
          <Check size={14} />
          <span>{loading ? 'Assigning...' : 'Assign All'}</span>
        </button>
      </div>
    </div>
  );
}
