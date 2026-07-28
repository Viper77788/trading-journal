import React from 'react';
import { Eye, LineChart, Pencil, Trash2, Share2 } from 'lucide-react';
import { resultOf, fmtMoney, fmtDate, setupArray, isYes } from '../../utils/formatters';
import { formatTimeInUserTimezone } from '../../utils/timezoneUtils';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import Pill from '../shared/Pill';

const TradeRow = ({ trade, showDate = true, onView, onEdit, onDelete, onChart, onShare, onlyView = false }) => {
  const { userTimezone } = useUserPreferences();
  const pl = Number(trade.profitLoss) || 0;
  const result = resultOf(trade);
  const setups = setupArray(trade);
  const displaySetups = setups.slice(0, 2);
  const moreSetups = setups.length > 2 ? setups.length - 2 : 0;

  const openTimeDisplay = trade.openTime ? formatTimeInUserTimezone(trade.openTime, userTimezone, trade.tradeDate) : '—';
  const closeTimeDisplay = trade.closeTime ? formatTimeInUserTimezone(trade.closeTime, userTimezone, trade.tradeDate) : '—';

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      {showDate && (
        <>
          <td className="p-3 text-sm text-slate-300 whitespace-nowrap">{fmtDate(trade.tradeDate)}</td>
          <td className="p-3 text-sm font-mono text-slate-400 whitespace-nowrap">{openTimeDisplay}</td>
          <td className="p-3 text-sm font-mono text-slate-400 whitespace-nowrap">{closeTimeDisplay}</td>
        </>
      )}
      <td className="p-3 font-semibold text-white whitespace-nowrap">{trade.pair || '—'}</td>
      <td className="p-3">
        <Pill variant={trade.direction?.toLowerCase() === 'short' ? 'short' : 'long'}>
          {trade.direction || '—'}
        </Pill>
      </td>
      <td className="p-3 text-sm font-mono text-slate-300">{trade.rr ?? '—'}</td>
      <td className={`p-3 text-sm font-mono ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtMoney(pl)}</td>
      <td className="p-3">
        <Pill variant={result.toLowerCase()}>{result}</Pill>
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-1">
          {displaySetups.length === 0 && <span className="text-xs text-slate-500">—</span>}
          {displaySetups.map((s, i) => (
            <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded-md text-slate-300">{s}</span>
          ))}
          {moreSetups > 0 && (
            <span className="text-xs text-slate-500">+{moreSetups}</span>
          )}
        </div>
      </td>
      <td className="p-3">
        <Pill variant={isYes(trade.planFollowed) ? 'yes' : 'no'}>
          {isYes(trade.planFollowed) ? 'Yes' : 'No'}
        </Pill>
      </td>
      <td className="p-3">
        <Pill variant={isYes(trade.previousDailyDirection) ? 'yes' : 'no'}>
          {isYes(trade.previousDailyDirection) ? 'Yes' : 'No'}
        </Pill>
      </td>
      <td className="p-3">
        <Pill variant={isYes(trade.previousWeeklyDirection) ? 'yes' : 'no'}>
          {isYes(trade.previousWeeklyDirection) ? 'Yes' : 'No'}
        </Pill>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1.5">
          <button onClick={() => onView?.(trade.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="View Details">
            <Eye size={16} />
          </button>

          <button onClick={() => onShare?.(trade)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Share Trade Card">
            <Share2 size={16} />
          </button>

          {!onlyView && (
            <>
              <button onClick={() => onChart?.(trade)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Chart">
                <LineChart size={16} />
              </button>
              <button onClick={() => onEdit?.(trade.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Edit">
                <Pencil size={16} />
              </button>
              <button onClick={() => onDelete?.(trade.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TradeRow;
