import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Plus, Trash2 } from 'lucide-react';

export default function AddPlaybookModal({ playbook, onSave, onClose, loading = false }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState('15M');
  const [riskPctPerTrade, setRiskPctPerTrade] = useState(1.0);

  const [entryRules, setEntryRules] = useState(['']);
  const [exitRules, setExitRules] = useState(['']);

  useEffect(() => {
    if (playbook) {
      setName(playbook.name || '');
      setDescription(playbook.description || '');
      setTimeframe(playbook.timeframe || '15M');
      setRiskPctPerTrade(playbook.riskPctPerTrade || 1.0);
      setEntryRules(playbook.entryRules?.length ? playbook.entryRules : ['']);
      setExitRules(playbook.exitRules?.length ? playbook.exitRules : ['']);
    }
  }, [playbook]);

  const handleAddRule = (type) => {
    if (type === 'entry') setEntryRules([...entryRules, '']);
    else setExitRules([...exitRules, '']);
  };

  const handleRuleChange = (type, index, val) => {
    if (type === 'entry') {
      const updated = [...entryRules];
      updated[index] = val;
      setEntryRules(updated);
    } else {
      const updated = [...exitRules];
      updated[index] = val;
      setExitRules(updated);
    }
  };

  const handleRemoveRule = (type, index) => {
    if (type === 'entry') {
      setEntryRules(entryRules.filter((_, i) => i !== index));
    } else {
      setExitRules(exitRules.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please provide a Strategy Name.');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      timeframe: timeframe.trim(),
      riskPctPerTrade: Number(riskPctPerTrade) || 1.0,
      entryRules: entryRules.filter(r => r.trim() !== ''),
      exitRules: exitRules.filter(r => r.trim() !== '')
    };

    onSave(payload);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-2xl p-6 text-white shadow-2xl relative my-auto animate-scaleIn space-y-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Target size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold">{playbook ? 'Edit Playbook Strategy' : 'Create New Playbook Strategy'}</h2>
            <p className="text-xs text-slate-400">Define execution rules and risk parameters</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Strategy Name</label>
            <input
              type="text"
              required
              placeholder="e.g. ICT Silver Bullet, Asia Breakout"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Thesis</label>
            <textarea
              rows={2}
              placeholder="Brief description of the strategy setup & conditions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Timeframe</label>
              <input
                type="text"
                placeholder="15M / 1H"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Risk % Per Trade</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={riskPctPerTrade}
                onChange={(e) => setRiskPctPerTrade(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Entry Rules List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-400">Entry Confirmation Rules</label>
              <button
                type="button"
                onClick={() => handleAddRule('entry')}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <Plus size={12} /> Add Rule
              </button>
            </div>
            {entryRules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Entry Rule #${idx + 1}`}
                  value={rule}
                  onChange={(e) => handleRuleChange('entry', idx, e.target.value)}
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                {entryRules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRule('entry', idx)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Exit Rules List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-red-400">Exit & Take Profit Rules</label>
              <button
                type="button"
                onClick={() => handleAddRule('exit')}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <Plus size={12} /> Add Rule
              </button>
            </div>
            {exitRules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Exit Rule #${idx + 1}`}
                  value={rule}
                  onChange={(e) => handleRuleChange('exit', idx, e.target.value)}
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                {exitRules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRule('exit', idx)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition-all"
            >
              {loading ? 'Saving...' : playbook ? 'Update Strategy' : 'Create Strategy'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
