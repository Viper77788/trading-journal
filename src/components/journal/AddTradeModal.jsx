import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import MultiSelect from './MultiSelect';
import { SETUP_OPTIONS, EMOTIONS_BEFORE, EMOTIONS_AFTER } from '../../constants';

const extractTime = (val) => {
  if (!val) return '';
  const s = String(val).trim();
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) {
    return `${String(m[1]).padStart(2, '0')}:${String(m[2]).padStart(2, '0')}`;
  }
  return '';
};

const AddTradeModal = ({ trade, isViewOnly, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    tradeDate: '', openTime: '', closeTime: '', pair: '', direction: 'Long', entryPrice: '', stopLoss: '', takeProfit: '',
    profitLoss: '', rr: '', tradeResult: 'Auto', tradingViewLink: '',
    setup: [], planFollowed: 'No', previous4HourDirection: 'No', previousWeeklyDirection: 'No',
    previousDailyDirection: 'No', previous1HourDirection: 'No', leftSideRangeClean: 'No',
    confidenceScore: 5, emotionBeforeTrade: 'Neutral', emotionAfterTrade: 'Neutral',
    mistakes: '', lessons: '', comments: '', screenshotUrl: ''
  });

  useEffect(() => {
    if (trade) {
      setFormData({
        ...trade,
        setup: Array.isArray(trade.setup) ? trade.setup : (trade.setup ? trade.setup.split(',') : []),
        tradeDate: trade.tradeDate ? new Date(trade.tradeDate).toISOString().split('T')[0] : '',
        openTime: extractTime(trade.openTime),
        closeTime: extractTime(trade.closeTime)
      });
    }
  }, [trade]);

  const handleChange = (field, value) => {
    if (isViewOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => {
    if (isViewOnly) return;
    setFormData(prev => ({ ...prev, [field]: prev[field] === 'Yes' ? 'No' : 'Yes' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly) return;
    const payload = {
      ...formData,
      openTime: formData.openTime || null,
      closeTime: formData.closeTime || null
    };
    onSave(payload);
  };

  const renderToggle = (label, field) => (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <button 
        type="button" 
        onClick={() => handleToggle(field)}
        className={`w-11 h-6 rounded-full relative transition-colors ${formData[field] === 'Yes' ? 'bg-emerald-600' : 'bg-slate-700'}`}
        disabled={isViewOnly}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData[field] === 'Yes' ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{isViewOnly ? 'View Trade' : trade ? 'Edit Trade' : 'New Trade'}</h2>
          <p className="text-slate-400 text-sm mt-1">{isViewOnly ? 'Trade breakdown' : 'Fill in trade execution details and psychology'}</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 text-sm font-medium transition-all">
            Cancel
          </button>
          {!isViewOnly && (
            <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 text-sm font-medium shadow-lg shadow-blue-600/20 transition-all">
              {loading ? 'Saving...' : 'Save Trade'}
            </button>
          )}
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Basic Info Container with relative z-20 so MultiSelect dropdown stays above card #2 */}
        <div className="relative z-20 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-blue-400" /> Date
              </label>
              <input type="date" value={formData.tradeDate} onChange={e => handleChange('tradeDate', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm cursor-pointer" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-blue-400" /> Open Time
              </label>
              <input type="time" value={formData.openTime} onChange={e => handleChange('openTime', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-blue-400" /> Close Time
              </label>
              <input type="time" value={formData.closeTime} onChange={e => handleChange('closeTime', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Pair</label>
              <input type="text" value={formData.pair} onChange={e => handleChange('pair', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" placeholder="EURUSD" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Direction</label>
              <div className="flex bg-black/20 rounded-xl p-1 border border-white/10">
                <button type="button" onClick={() => handleChange('direction', 'Long')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.direction === 'Long' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`} disabled={isViewOnly}>Long</button>
                <button type="button" onClick={() => handleChange('direction', 'Short')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.direction === 'Short' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400'}`} disabled={isViewOnly}>Short</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entry Price</label>
              <input type="number" step="0.00001" value={formData.entryPrice} onChange={e => handleChange('entryPrice', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Stop Loss</label>
              <input type="number" step="0.00001" value={formData.stopLoss} onChange={e => handleChange('stopLoss', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Take Profit</label>
              <input type="number" step="0.00001" value={formData.takeProfit} onChange={e => handleChange('takeProfit', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Profit / Loss ($)</label>
              <input type="number" step="0.01" value={formData.profitLoss} onChange={e => handleChange('profitLoss', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm font-mono" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Risk/Reward (RR)</label>
              <input type="number" step="0.1" value={formData.rr} onChange={e => handleChange('rr', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Result</label>
              <select value={formData.tradeResult} onChange={e => handleChange('tradeResult', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm">
                <option value="Auto">Auto (from P/L)</option>
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
                <option value="Breakeven">Breakeven</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">TradingView Link</label>
              <input type="url" value={formData.tradingViewLink} onChange={e => handleChange('tradingViewLink', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-400 mb-1">Setup</label>
              <div className="w-full">
                {isViewOnly ? (
                  <div className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm">
                    {formData.setup.length ? formData.setup.join(', ') : 'No Setup'}
                  </div>
                ) : (
                  <MultiSelect options={SETUP_OPTIONS} selected={formData.setup} onChange={val => handleChange('setup', val)} placeholder="Select setup(s)" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subsequent Cards */}
        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">Setup Validation Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderToggle('Plan Followed?', 'planFollowed')}
            {renderToggle('Prev 4H Direction?', 'previous4HourDirection')}
            {renderToggle('Prev Weekly Direction?', 'previousWeeklyDirection')}
            {renderToggle('Prev Daily Direction?', 'previousDailyDirection')}
            {renderToggle('Prev 1H Direction?', 'previous1HourDirection')}
            {renderToggle('Left Side Range Clean?', 'leftSideRangeClean')}
          </div>
        </div>

        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">Trade Quality Score</h3>
          <div className="flex items-center gap-4">
            <input type="range" min="1" max="10" value={formData.confidenceScore} onChange={e => handleChange('confidenceScore', parseInt(e.target.value))} disabled={isViewOnly} className="flex-1 accent-blue-500" />
            <span className="text-2xl font-mono text-white font-bold">{formData.confidenceScore}/10</span>
          </div>
        </div>

        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">Psychology & Review</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Emotion Before Trade</label>
              <select value={formData.emotionBeforeTrade} onChange={e => handleChange('emotionBeforeTrade', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm">
                {EMOTIONS_BEFORE.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Emotion After Trade</label>
              <select value={formData.emotionAfterTrade} onChange={e => handleChange('emotionAfterTrade', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm">
                {EMOTIONS_AFTER.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Mistakes Made</label>
              <textarea value={formData.mistakes} onChange={e => handleChange('mistakes', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm min-h-[80px]"></textarea>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lessons Learned</label>
              <textarea value={formData.lessons} onChange={e => handleChange('lessons', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm min-h-[80px]"></textarea>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Comments</label>
              <textarea value={formData.comments} onChange={e => handleChange('comments', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm min-h-[80px]"></textarea>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Screenshot URL</label>
              <input type="url" value={formData.screenshotUrl} onChange={e => handleChange('screenshotUrl', e.target.value)} disabled={isViewOnly} className="w-full bg-black/20 border border-white/10 rounded-xl p-2.5 text-white text-sm" />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddTradeModal;
