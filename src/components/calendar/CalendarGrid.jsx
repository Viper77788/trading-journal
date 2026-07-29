import React from 'react';
import { fmtMoney } from '../../utils/formatters';

const CalendarGrid = ({ year, month, tradesByDay, onDayClick }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const totalSlots = firstWeekday + daysInMonth;
  const numWeeks = Math.ceil(totalSlots / 7);

  const weeks = [];
  let dayCounter = 1;

  for (let weekIdx = 0; weekIdx < numWeeks; weekIdx++) {
    const daysInWeek = [];
    let weekNetPl = 0;
    let weekTradesCount = 0;

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const slotIndex = weekIdx * 7 + dayOfWeek;

      if (slotIndex < firstWeekday || dayCounter > daysInMonth) {
        daysInWeek.push({
          type: 'blank',
          key: `blank-${slotIndex}`
        });
      } else {
        const day = dayCounter++;
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTrades = tradesByDay.get(dateKey) || [];

        let netPl = 0;
        dayTrades.forEach(t => { netPl += Number(t.profitLoss || 0); });

        weekNetPl += netPl;
        weekTradesCount += dayTrades.length;

        daysInWeek.push({
          type: 'day',
          key: `day-${day}`,
          day,
          dateKey,
          dayTrades,
          netPl,
          isProfit: netPl > 0,
          isLoss: netPl < 0,
          hasTrades: dayTrades.length > 0
        });
      }
    }

    weeks.push({
      weekIndex: weekIdx,
      days: daysInWeek,
      weekNetPl,
      weekTradesCount
    });
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl">
      {/* 8 Column Headers */}
      <div className="grid grid-cols-8 gap-1.5 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 p-1 uppercase tracking-wider">
            {d}
          </div>
        ))}
        <div className="text-center text-xs font-bold text-blue-400 p-1 uppercase tracking-wider bg-blue-500/10 rounded-lg border border-blue-500/20">
          Week P&L
        </div>
      </div>

      {/* Week Rows */}
      <div className="space-y-1.5">
        {weeks.map((week) => {
          const isWeekProfit = week.weekNetPl > 0;
          const isWeekLoss = week.weekNetPl < 0;

          return (
            <div key={`week-row-${week.weekIndex}`} className="grid grid-cols-8 gap-1.5">
              {week.days.map((slot) => {
                if (slot.type === 'blank') {
                  return (
                    <div
                      key={slot.key}
                      className="p-2.5 border border-white/[0.03] bg-black/10 min-h-[82px] rounded-xl"
                    />
                  );
                }

                return (
                  <div
                    key={slot.key}
                    className={`p-2.5 border border-white/[0.06] min-h-[82px] flex flex-col justify-between transition-all rounded-xl calendar-day ${
                      slot.hasTrades ? 'cursor-pointer hover:border-white/30 hover:scale-[1.02] shadow-sm' : 'bg-white/[0.02]'
                    } ${slot.isProfit ? 'bg-emerald-500/10 border-emerald-500/20' : slot.isLoss ? 'bg-red-500/10 border-red-500/20' : ''}`}
                    onClick={() => slot.hasTrades && onDayClick(slot.dateKey)}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-bold ${slot.hasTrades ? 'text-white' : 'text-slate-500'}`}>{slot.day}</span>
                    </div>

                    {slot.hasTrades ? (
                      <div className="mt-1 flex flex-col items-center justify-center space-y-1">
                        <span className="text-[10px] font-medium bg-white/10 px-2 py-0.5 rounded-md text-slate-300 tracking-tight">
                          {slot.dayTrades.length} {slot.dayTrades.length === 1 ? 'trade' : 'trades'}
                        </span>
                        <div className={`text-xs font-mono font-bold ${slot.isProfit ? 'text-emerald-400' : slot.isLoss ? 'text-red-400' : 'text-slate-400'}`}>
                          {fmtMoney(slot.netPl)}
                        </div>
                      </div>
                    ) : (
                      <div className="h-6" />
                    )}
                  </div>
                );
              })}

              {/* 8th Column: Weekly Summary Cell */}
              <div
                className={`p-2.5 border min-h-[82px] flex flex-col justify-between rounded-xl transition-all font-semibold ${
                  isWeekProfit
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5'
                    : isWeekLoss
                    ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-md shadow-red-500/5'
                    : 'bg-white/[0.02] border-white/[0.04] text-slate-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                    Week {week.weekIndex + 1}
                  </span>
                </div>

                {week.weekTradesCount > 0 ? (
                  <div className="mt-1 flex flex-col items-center justify-center space-y-1">
                    <span className="text-[10px] font-medium bg-white/10 px-2 py-0.5 rounded-md text-slate-300 tracking-tight">
                      {week.weekTradesCount} {week.weekTradesCount === 1 ? 'trade' : 'trades'}
                    </span>
                    <div className={`text-xs font-mono font-bold ${isWeekProfit ? 'text-emerald-400' : isWeekLoss ? 'text-red-400' : 'text-slate-400'}`}>
                      {fmtMoney(week.weekNetPl)}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-center text-slate-600 my-auto">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
