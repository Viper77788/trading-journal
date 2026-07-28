import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';

export default function DeleteAccountConfirmModal({ account, trades = [], onClose }) {
  const { softDeleteAccount } = useAccount();
  const [loading, setLoading] = useState(false);

  if (!account) return null;

  // Count trades linked to this account
  const linkedTradesCount = trades.filter(t => t.accountId === account.id).length;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await softDeleteAccount(account.id);
      onClose();
    } catch (err) {
      alert('Failed to move account to trash: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 text-white shadow-2xl relative my-auto animate-scaleIn space-y-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Move Account to Trash?</h2>
            <p className="text-xs text-amber-400/90 font-medium">Soft delete • 30-day recovery period</p>
          </div>
        </div>

        <div className="p-4 bg-black/30 border border-white/5 rounded-xl text-xs space-y-2 text-slate-300">
          <p>
            Move <strong className="text-white">{account.name}</strong> to Trash?
          </p>
          <p className="text-slate-400">
            This will move the account and its <strong className="text-amber-400 font-mono">{linkedTradesCount}</strong> linked trade(s) to the Trash Bin.
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            💡 Items in Trash can be restored anytime within 30 days before permanent auto-purge.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-lg shadow-amber-600/20 transition-all flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span>{loading ? 'Moving...' : 'Move to Trash'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
