import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, Shield, Layers, Check, Building2, X } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { PROP_FIRM_TEMPLATES } from '../../services/accountService';

export default function AccountSwitcher() {
  const { accounts, activeAccountId, activeAccount, switchAccount, addAccount } = useAccount();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Form state for new account modal
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('FTMO_100K');
  const [formData, setFormData] = useState(PROP_FIRM_TEMPLATES.FTMO_100K);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTemplateSelect = (key) => {
    setSelectedTemplateKey(key);
    if (PROP_FIRM_TEMPLATES[key]) {
      setFormData({ ...PROP_FIRM_TEMPLATES[key] });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addAccount(formData);
      setModalOpen(false);
    } catch (err) {
      alert('Failed to create account: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Switcher Button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-medium transition-all"
      >
        <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
          {activeAccountId === 'all' ? <Layers size={14} /> : <Shield size={14} />}
        </div>
        <div className="text-left hidden sm:block">
          <div className="font-semibold truncate max-w-[130px]">
            {activeAccountId === 'all' ? 'All Accounts' : activeAccount?.name}
          </div>
          <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
            {activeAccountId === 'all' ? 'Combined View' : `${activeAccount?.currency} • ${activeAccount?.drawdownType?.toUpperCase() || 'STATIC'}`}
          </div>
        </div>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 animate-fadeIn">
          <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
            Trading Accounts
          </div>

          <button
            onClick={() => { switchAccount('all'); setDropdownOpen(false); }}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
              activeAccountId === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers size={16} />
              <span className="font-medium">All Accounts Combined</span>
            </div>
            {activeAccountId === 'all' && <Check size={14} />}
          </button>

          <div className="my-1 border-t border-white/5" />

          <div className="max-h-48 overflow-y-auto space-y-1">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => { switchAccount(acc.id); setDropdownOpen(false); }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                  activeAccountId === acc.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-medium text-white truncate max-w-[160px]">{acc.name}</span>
                  <span className="text-[10px] text-slate-400">
                    ${acc.startingBalance?.toLocaleString()} • {acc.propFirmName || acc.broker}
                  </span>
                </div>
                {activeAccountId === acc.id && <Check size={14} className="shrink-0" />}
              </button>
            ))}
          </div>

          <div className="my-1 border-t border-white/5" />

          <button
            onClick={() => { setModalOpen(true); setDropdownOpen(false); }}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-md shadow-blue-600/20"
          >
            <Plus size={14} />
            <span>Add New Account</span>
          </button>
        </div>
      )}

      {/* Add Account Modal rendered outside via React Portal for perfect z-index */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-2xl p-6 text-white shadow-2xl relative my-auto animate-scaleIn">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Add Trading Account</h2>
                <p className="text-xs text-slate-400">Select a Prop Firm template or build custom rules</p>
              </div>
            </div>

            {/* Template Selector */}
            <div className="mb-6">
              <label className="text-xs font-medium text-slate-400 mb-2 block">Quick Templates</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PROP_FIRM_TEMPLATES).map(([key, tpl]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTemplateSelect(key)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      selectedTemplateKey === key
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-black/20 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="font-semibold text-white truncate">{tpl.name}</div>
                    <div className="text-[10px] mt-1 text-slate-400">
                      ${tpl.startingBalance?.toLocaleString()} • {tpl.drawdownType.toUpperCase()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Starting Balance ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.startingBalance}
                    onChange={(e) => setFormData({ ...formData, startingBalance: Number(e.target.value) })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Profit Target ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.targetProfit}
                    onChange={(e) => setFormData({ ...formData, targetProfit: Number(e.target.value) })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Max Daily Loss ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.maxDailyLoss}
                    onChange={(e) => setFormData({ ...formData, maxDailyLoss: Number(e.target.value) })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Max Total Drawdown ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.maxTotalDrawdown}
                    onChange={(e) => setFormData({ ...formData, maxTotalDrawdown: Number(e.target.value) })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Drawdown Type</label>
                  <select
                    value={formData.drawdownType}
                    onChange={(e) => setFormData({ ...formData, drawdownType: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="static">Static (Fixed Floor)</option>
                    <option value="trailing">Trailing (Trails Equity)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Trailing Freeze</label>
                  <select
                    value={formData.trailingFreezeEnabled ? 'yes' : 'no'}
                    onChange={(e) => setFormData({ ...formData, trailingFreezeEnabled: e.target.value === 'yes' })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="no">Disabled (Never Freeze)</option>
                    <option value="yes">Enabled (Freeze at Initial Balance)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition-all"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
