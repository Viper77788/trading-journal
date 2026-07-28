import React from 'react';
import { Search } from 'lucide-react';
import MultiSelect from './MultiSelect';
import { SETUP_OPTIONS } from '../../constants';
import { SESSIONS } from '../../utils/sessionAnalytics';

const TradeFilters = ({
  searchTerm, onSearchChange,
  quickFilter, onQuickFilterChange,
  dateFrom, dateTo, onDateFromChange, onDateToChange,
  setupFilter, onSetupFilterChange,
  sessionFilter = [], onSessionFilterChange
}) => {
  const quickFilters = [
    { label: 'All', value: 'all' },
    { label: 'Winning', value: 'win' },
    { label: 'Losing', value: 'loss' },
    { label: 'Long', value: 'long' },
    { label: 'Short', value: 'short' }
  ];

  const sessionOptions = Object.values(SESSIONS).map(s => s.label);

  return (
    <div className="relative z-30 flex flex-wrap gap-4 mb-6 items-center bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search pair, notes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-black/20 border border-white/10 rounded-xl !pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="flex gap-2">
        {quickFilters.map(filter => (
          <button
            key={filter.value}
            onClick={() => onQuickFilterChange(filter.value)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              quickFilter === filter.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
        />
        <span className="text-slate-500 text-xs font-medium">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="w-[220px]">
        <MultiSelect
          options={sessionOptions}
          selected={sessionFilter}
          onChange={onSessionFilterChange}
          placeholder="Filter by Session"
        />
      </div>

      <div className="w-[220px]">
        <MultiSelect
          options={SETUP_OPTIONS}
          selected={setupFilter}
          onChange={onSetupFilterChange}
          placeholder="Filter by setup"
        />
      </div>
    </div>
  );
};

export default TradeFilters;
