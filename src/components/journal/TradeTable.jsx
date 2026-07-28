import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import TradeRow from './TradeRow';

const TradeTable = ({ trades, sortKey, sortDir, onSort, onView, onEdit, onDelete, onChart, onShare }) => {
  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <span className="text-slate-600 ml-1">⇅</span>;
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="inline ml-0.5 text-blue-400" />
      : <ChevronDown size={14} className="inline ml-0.5 text-blue-400" />;
  };

  return (
    <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl">
      <table className="w-full text-left journal-table">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="sortable" onClick={() => onSort('tradeDate')}>
              Date <SortIcon colKey="tradeDate" />
            </th>
            <th className="sortable" onClick={() => onSort('openTime')}>
              Open <SortIcon colKey="openTime" />
            </th>
            <th className="sortable" onClick={() => onSort('closeTime')}>
              Close <SortIcon colKey="closeTime" />
            </th>
            <th>Pair</th>
            <th>Dir</th>
            <th>RR</th>
            <th className="sortable" onClick={() => onSort('profitLoss')}>
              P/L <SortIcon colKey="profitLoss" />
            </th>
            <th>Result</th>
            <th>Setup</th>
            <th>Plan</th>
            <th className="sortable" onClick={() => onSort('previousDailyDirection')}>
              Daily <SortIcon colKey="previousDailyDirection" />
            </th>
            <th className="sortable" onClick={() => onSort('previousWeeklyDirection')}>
              Weekly <SortIcon colKey="previousWeeklyDirection" />
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onChart={onChart}
              onShare={onShare}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradeTable;
