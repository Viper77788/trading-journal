import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertTriangle, Shield, Check, X } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';

export default function TrashBinView({ trades = [], loading = false }) {
  const { fetchTrash, restoreAccount, permanentlyDeleteAccount } = useAccount();
  const [trashedAccounts, setTrashedAccounts] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Hard Delete Modal State
  const [hardDeleteTarget, setHardDeleteTarget] = useState(null);
  const [confirmName, setConfirmName] = useState('');

  const loadTrash = async () => {
    setFetching(true);
    try {
      const data = await fetchTrash();
      setTrashedAccounts(data);
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadTrash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestore = async (account) => {
    setActionLoadingId(account.id);
    try {
      await restoreAccount(account.id);
      await loadTrash();
    } catch (err) {
      alert('Restore failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!hardDeleteTarget) return;
    if (confirmName.trim() !== hardDeleteTarget.name.trim()) {
      alert('Account name does not match.');
      return;
    }
    setActionLoadingId(hardDeleteTarget.id);
    try {
      await permanentlyDeleteAccount(hardDeleteTarget.id);
      setHardDeleteTarget(null);
      setConfirmName('');
      await loadTrash();
    } catch (err) {
      alert('Permanent delete failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading || fetching) return <Spinner />;

  if (!trashedAccounts.length) {
    return (
      <EmptyState
        icon={Trash2}
        title="Trash Bin is Empty"
        subtitle="No soft-deleted accounts found. Soft-deleted accounts and trades remain here for 30 days before permanent auto-purge."
      />
    );
  }

  return (
    <div className="animate-fadeIn space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Trash2 size={24} className="text-amber-400" />
            <span>Trash Bin</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Soft-deleted accounts & trades. Items are automatically purged after 30 days.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {trashedAccounts.map((account) => {
          const linkedTradesCount = trades.filter(t => t.accountId === account.id).length;
          const deletedDateStr = account.deletedAt
            ? new Date(account.deletedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Recently';

          return (
            <div
              key={account.id}
              className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-500/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{account.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>${account.startingBalance?.toLocaleString()} {account.currency}</span>
                    <span>•</span>
                    <span>Moved to Trash: {deletedDateStr}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-medium">{linkedTradesCount} trade(s)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(account)}
                  disabled={actionLoadingId === account.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium border border-blue-500/30 transition-all"
                >
                  <RefreshCw size={14} className={actionLoadingId === account.id ? 'animate-spin' : ''} />
                  <span>Restore</span>
                </button>
                <button
                  onClick={() => { setHardDeleteTarget(account); setConfirmName(''); }}
                  disabled={actionLoadingId === account.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium border border-red-500/30 transition-all"
                >
                  <Trash2 size={14} />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permanent Hard Delete Confirmation Modal */}
      {hardDeleteTarget && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 text-white shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-bold text-lg text-white">Permanent Hard Delete</h3>
            </div>

            <p className="text-xs text-slate-300">
              This action is <strong className="text-red-400">IRREVERSIBLE</strong>. Type <strong className="text-white font-mono">{hardDeleteTarget.name}</strong> below to permanently delete the account and all its trades.
            </p>

            <input
              type="text"
              placeholder={`Type "${hardDeleteTarget.name}"`}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full bg-black/40 border border-red-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setHardDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                disabled={confirmName.trim() !== hardDeleteTarget.name.trim() || actionLoadingId === hardDeleteTarget.id}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-medium text-xs shadow-lg shadow-red-600/20 transition-all"
              >
                {actionLoadingId === hardDeleteTarget.id ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
