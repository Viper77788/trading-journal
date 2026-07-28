import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, Shield, TrendingUp, CheckCircle, ArrowUpRight, ArrowDownRight, Clock, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { getAllPlaybooks, createPlaybook, updatePlaybookById, softDeletePlaybookById, ensureDefaultPlaybooks } from '../../services/playbookService';
import { computeStrategyStats } from '../../utils/playbookAnalytics';
import { fmtMoney } from '../../utils/formatters';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';
import AddPlaybookModal from './AddPlaybookModal';

export default function PlaybookView({ trades = [], loading: tradesLoading = false }) {
  const { user } = useAuth();
  const { filterTradesByAccount } = useAccount();
  const activeTrades = filterTradesByAccount(trades);

  const [playbooks, setPlaybooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPlaybooks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await ensureDefaultPlaybooks(user.uid);
      setPlaybooks(data);
    } catch (err) {
      console.error('Failed to fetch playbooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaybooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSavePlaybook = async (payload) => {
    if (!user) return;
    setActionLoading(true);
    try {
      if (editingPlaybook) {
        await updatePlaybookById(user.uid, editingPlaybook.id, payload);
      } else {
        await createPlaybook(user.uid, payload);
      }
      setModalOpen(false);
      setEditingPlaybook(null);
      await fetchPlaybooks();
    } catch (err) {
      alert('Save strategy failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlaybook = async (playbook) => {
    if (!window.confirm(`Move strategy "${playbook.name}" to Trash? Historical trade references will remain intact.`)) return;
    try {
      await softDeletePlaybookById(user.uid, playbook.id);
      await fetchPlaybooks();
    } catch (err) {
      alert('Delete strategy failed: ' + (err?.message || 'Unknown error'));
    }
  };

  if (loading || tradesLoading) return <Spinner />;

  return (
    <div className="animate-fadeIn space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Target size={24} className="text-blue-400" />
            <span>Strategy Playbook Library</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build named trading setups and track real-time win rates, profit factor, and expectancy.
          </p>
        </div>
        <button
          onClick={() => { setEditingPlaybook(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition-all shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Playbook Strategy</span>
        </button>
      </div>

      {!playbooks.length ? (
        <EmptyState
          icon={Target}
          title="No Playbook Strategies Found"
          subtitle="Create your first trading playbook strategy to track custom setup analytics."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {playbooks.map((pb) => {
            const stats = computeStrategyStats(pb, activeTrades);

            return (
              <div key={pb.id} className="glass-card p-6 border border-white/10 flex flex-col justify-between space-y-6 hover:border-blue-500/30 transition-all">

                {/* Card Top */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">{pb.name}</h2>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono">
                          {pb.timeframe || '15M'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{pb.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingPlaybook(pb); setModalOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Edit Strategy"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeletePlaybook(pb)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Move Strategy to Trash"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Financial Performance Grid */}
                  <div className="grid grid-cols-4 gap-2 p-3 bg-black/40 border border-white/5 rounded-xl text-center">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Win Rate</div>
                      <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                        {stats.totalTrades > 0 ? `${stats.winRate.toFixed(1)}%` : '—'}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{stats.wins}W / {stats.losses}L</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Profit Factor</div>
                      <div className="text-sm font-black text-blue-400 font-mono mt-0.5">
                        {stats.profitFactor}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">PF Ratio</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Avg R-Multiple</div>
                      <div className="text-sm font-black text-purple-400 font-mono mt-0.5">
                        {stats.totalTrades > 0 ? `${stats.avgRR.toFixed(2)}R` : '—'}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Reward</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Expectancy</div>
                      <div className={`text-sm font-black font-mono mt-0.5 ${stats.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stats.totalTrades > 0 ? fmtMoney(stats.expectancy) : '—'}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Per Trade</div>
                    </div>
                  </div>

                  {/* Entry & Exit Rules Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="space-y-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="font-semibold text-emerald-400 text-[11px] flex items-center gap-1">
                        <CheckCircle size={12} /> Entry Confirmation Rules
                      </div>
                      <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                        {pb.entryRules?.map((rule, idx) => (
                          <li key={idx} className="truncate">{rule}</li>
                        )) || <li className="text-slate-500">No entry rules listed</li>}
                      </ul>
                    </div>
                    <div className="space-y-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="font-semibold text-red-400 text-[11px] flex items-center gap-1">
                        <Award size={12} /> Exit & Target Rules
                      </div>
                      <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                        {pb.exitRules?.map((rule, idx) => (
                          <li key={idx} className="truncate">{rule}</li>
                        )) || <li className="text-slate-500">No exit rules listed</li>}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Meta */}
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-3">
                  <div>Risk: <strong className="text-white font-mono">{pb.riskPctPerTrade || 1.0}%</strong> per trade</div>
                  <div>Net PnL: <strong className={`font-mono ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtMoney(stats.netProfit)}</strong></div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Strategy Modal */}
      {modalOpen && (
        <AddPlaybookModal
          playbook={editingPlaybook}
          onSave={handleSavePlaybook}
          onClose={() => { setModalOpen(false); setEditingPlaybook(null); }}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
