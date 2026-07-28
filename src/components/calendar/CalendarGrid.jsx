import React from 'react';
import { fmtMoney } from '../../utils/formatters';

const CalendarGrid = ({ year, month, tradesByDay, onDayClick }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const blanks = Array.from({ length: firstWeekday }).map((_, i) => (
    <div key={`blank-${i}`} className="p-2.5 border border-white/[0.04] bg-black/10 min-h-[82px] rounded-xl" />
  ));

  const days = Array.from({ length: daysInMonth }).map((_, i) => {
    const day = i + 1;
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTrades = tradesByDay.get(dateKey) || [];

    let netPl = 0;
    dayTrades.forEach(t => netPl += Number(t.profitLoss || 0));

    const isProfit = netPl > 0;
    const isLoss = netPl < 0;
    const hasTrades = dayTrades.length > 0;

    return (
      <div
        key={`day-${day}`}
        className={`p-2.5 border border-white/[0.06] min-h-[82px] flex flex-col justify-between transition-all rounded-xl calendar-day ${
          hasTrades ? 'cursor-pointer hover:border-white/30 hover:scale-[1.02] shadow-sm' : 'bg-white/[0.02]'
        } ${isProfit ? 'bg-emerald-500/10 border-emerald-500/20' : isLoss ? 'bg-red-500/10 border-red-500/20' : ''}`}
        onClick={() => hasTrades && onDayClick(dateKey)}
      >
        {/* Top Row: Day Number */}
        <div className="flex justify-between items-start">
          <span className={`text-xs font-bold ${hasTrades ? 'text-white' : 'text-slate-500'}`}>{day}</span>
        </div>

        {/* Content Section: Trade Count Badge on separate line + Net PnL */}
        {hasTrades ? (
          <div className="mt-1 flex flex-col items-center justify-center space-y-1">
            <span className="text-[10px] font-medium bg-white/10 px-2 py-0.5 rounded-md text-slate-300 tracking-tight">
              {dayTrades.length} {dayTrades.length === 1 ? 'trade' : 'trades'}
            </span>
            <div className={`text-xs font-mono font-bold ${isProfit ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-slate-400'}`}>
              {fmtMoney(netPl)}
            </div>
          </div>
        ) : (
          <div className="h-6" />
        )}
      </div>
    );
  });

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl">
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {weekdays.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 p-1 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {blanks}
        {days}
      </div>
    </div>
  );
};

export default CalendarGrid;
