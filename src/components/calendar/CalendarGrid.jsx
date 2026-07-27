import React from 'react';
import { fmtMoney } from '../../utils/formatters';

const CalendarGrid = ({ year, month, tradesByDay, onDayClick }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const blanks = Array.from({ length: firstWeekday }).map((_, i) => (
    <div key={`blank-${i}`} className="p-2 border border-white/[0.04] bg-black/10 min-h-[68px]" />
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
        className={`p-2 border border-white/[0.06] min-h-[68px] flex flex-col justify-between transition-all rounded-lg calendar-day ${
          hasTrades ? 'cursor-pointer hover:border-white/30 hover:scale-[1.02] shadow-sm' : 'bg-white/[0.02]'
        } ${isProfit ? 'bg-emerald-500/10 border-emerald-500/20' : isLoss ? 'bg-red-500/10 border-red-500/20' : ''}`}
        onClick={() => hasTrades && onDayClick(dateKey)}
      >
        <div className="flex justify-between items-center">
          <span className={`text-xs font-semibold ${hasTrades ? 'text-white' : 'text-slate-500'}`}>{day}</span>
          {hasTrades && (
            <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-full font-mono text-slate-300">
              {dayTrades.length}t
            </span>
          )}
        </div>
        {hasTrades && (
          <div className={`mt-1 text-xs font-mono font-semibold ${isProfit ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-slate-400'}`}>
            {fmtMoney(netPl)}
          </div>
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
