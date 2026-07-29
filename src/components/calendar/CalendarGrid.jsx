import React, { useMemo } from 'react';
import { fmtMoney, resultOf } from '../../utils/formatters';

const CalendarGrid = ({ year, month, tradesByDay, onDayClick, onWeekClick }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const totalSlots = firstWeekday + daysInMonth;
  const numWeeks = Math.ceil(totalSlots / 7);

  // Calculate monthly overview stats
  const monthlyStats = useMemo(() => {
    let monthNetPl = 0;
    let monthTradesCount = 0;
    let winCount = 0;
    let lossCount = 0;
    let bestDayPl = -Infinity;
    let bestDayDate = '';

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTrades = tradesByDay.get(dateKey) || [];

      if (dayTrades.length > 0) {
        let dayPl = 0;
        dayTrades.forEach(t => {
          const pl = Number(t.profitLoss || 0);
          dayPl += pl;
          monthNetPl += pl;
          monthTradesCount++;

          const res = resultOf(t);
          if (res === 'Win') winCount++;
          else if (res === 'Loss') lossCount++;
        });

        if (dayPl > bestDayPl) {
          bestDayPl = dayPl;
          bestDayDate = `${new Date(year, month, day).toLocaleString('default', { month: 'short' })} ${day}`;
        }
      }
    }

    const totalDecisive = winCount + lossCount;
    const winRate = totalDecisive > 0 ? (winCount / totalDecisive) * 100 : 0;

    return {
      netPl: monthNetPl,
      totalTrades: monthTradesCount,
      winRate,
      bestDayDate: bestDayPl !== -Infinity ? bestDayDate : '—',
      bestDayPl: bestDayPl !== -Infinity ? bestDayPl : 0
    };
  }, [year, month, daysInMonth, tradesByDay]);

  const weeks = [];
  let dayCounter = 1;

  for (let weekIdx = 0; weekIdx < numWeeks; weekIdx++) {
    const daysInWeek = [];
    let weekNetPl = 0;
    let weekTradesCount = 0;
    const weekTrades = [];
    let startDay = null;
    let endDay = null;

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const slotIndex = weekIdx * 7 + dayOfWeek;

      if (slotIndex < firstWeekday || dayCounter > daysInMonth) {
        daysInWeek.push({
          type: 'blank',
          key: `blank-${slotIndex}`
        });
      } else {
        const day = dayCounter++;
        if (startDay === null) startDay = day;
        endDay = day;

        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTrades = tradesByDay.get(dateKey) || [];

        let netPl = 0;
        dayTrades.forEach(t => {
          netPl += Number(t.profitLoss || 0);
          weekTrades.push(t);
        });

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

    let dateRangeStr = '';
    if (startDay !== null && endDay !== null) {
      const startDate = new Date(year, month, startDay);
      const endDate = new Date(year, month, endDay);
      const startMonth = startDate.toLocaleString('default', { month: 'short' });
      const endMonth = endDate.toLocaleString('default', { month: 'short' });

      if (startMonth === endMonth) {
        dateRangeStr = `${startMonth} ${startDay} – ${endDay}, ${year}`;
      } else {
        dateRangeStr = `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
      }
    }

    weeks.push({
      weekIndex: weekIdx,
      days: daysInWeek,
      weekNetPl,
      weekTradesCount,
      weekTrades,
      dateRangeStr
    });
  }

  // Dynamic cell sizing so the entire calendar screen fits 1 page without scrollbars
  const cellHeightClass = numWeeks >= 6 ? 'min-h-[46px] p-1' : numWeeks >= 5 ? 'min-h-[50px] p-1.5' : 'min-h-[58px] p-2';

  return (
    <div className="w-full space-y-2.5">
      {/* Compact Monthly Performance Header Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-2.5 px-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Monthly Net P/L</span>
          <span className={`text-sm font-bold font-mono ${monthlyStats.netPl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmtMoney(monthlyStats.netPl)}
          </span>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-2.5 px-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Win Rate</span>
          <span className="text-sm font-bold text-blue-400">{monthlyStats.winRate.toFixed(0)}%</span>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-2.5 px-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Total Trades</span>
          <span className="text-sm font-bold text-white">{monthlyStats.totalTrades}</span>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-2.5 px-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Best Day</span>
          <span className="text-xs font-bold text-emerald-400 font-mono truncate max-w-[110px]">
            {monthlyStats.bestDayDate !== '—' ? `${monthlyStats.bestDayDate}` : '—'}
          </span>
        </div>
      </div>

      {/* Full-width Calendar Grid */}
      <div className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-xl">
        {/* 8 Column Headers */}
        <div className="grid grid-cols-8 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-slate-400 p-0.5 uppercase tracking-wider">
              {d}
            </div>
          ))}
          <div className="text-center text-[10px] font-bold text-blue-400 p-0.5 uppercase tracking-wider bg-blue-500/10 rounded border border-blue-500/20">
            Week P&L
          </div>
        </div>

        {/* Week Rows */}
        <div className="space-y-1">
          {weeks.map((week) => {
            const isWeekProfit = week.weekNetPl > 0;
            const isWeekLoss = week.weekNetPl < 0;
            const hasWeekTrades = week.weekTradesCount > 0;

            return (
              <div key={`week-row-${week.weekIndex}`} className="grid grid-cols-8 gap-1">
                {week.days.map((slot) => {
                  if (slot.type === 'blank') {
                    return (
                      <div
                        key={slot.key}
                        className={`border border-white/[0.03] bg-black/10 rounded-lg ${cellHeightClass}`}
                      />
                    );
                  }

                  return (
                    <div
                      key={slot.key}
                      className={`border border-white/[0.06] flex flex-col justify-between transition-all rounded-lg calendar-day ${cellHeightClass} ${
                        slot.hasTrades ? 'cursor-pointer hover:border-white/30 hover:scale-[1.02] shadow-sm' : 'bg-white/[0.02]'
                      } ${slot.isProfit ? 'bg-emerald-500/10 border-emerald-500/20' : slot.isLoss ? 'bg-red-500/10 border-red-500/20' : ''}`}
                      onClick={() => slot.hasTrades && onDayClick?.(slot.dateKey)}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold ${slot.hasTrades ? 'text-white' : 'text-slate-500'}`}>{slot.day}</span>
                      </div>

                      {slot.hasTrades ? (
                        <div className="flex flex-col items-center justify-center leading-none">
                          <span className="text-[8px] font-medium bg-white/10 px-1 rounded text-slate-300">
                            {slot.dayTrades.length}t
                          </span>
                          <div className={`text-[10px] font-mono font-bold mt-0.5 ${slot.isProfit ? 'text-emerald-400' : slot.isLoss ? 'text-red-400' : 'text-slate-400'}`}>
                            {fmtMoney(slot.netPl)}
                          </div>
                        </div>
                      ) : (
                        <div className="h-2" />
                      )}
                    </div>
                  );
                })}

                {/* 8th Column: Weekly Summary Cell */}
                <div
                  className={`border flex flex-col justify-between rounded-lg transition-all font-semibold ${cellHeightClass} ${
                    hasWeekTrades ? 'cursor-pointer hover:border-white/30 hover:scale-[1.02] shadow-sm' : ''
                  } ${
                    isWeekProfit
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5'
                      : isWeekLoss
                      ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-md shadow-red-500/5'
                      : 'bg-white/[0.02] border-white/[0.04] text-slate-500'
                  }`}
                  onClick={() =>
                    hasWeekTrades &&
                    onWeekClick?.({
                      weekNumber: week.weekIndex + 1,
                      dateRangeStr: week.dateRangeStr,
                      trades: week.weekTrades
                    })
                  }
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-bold tracking-wider uppercase text-slate-400">
                      W{week.weekIndex + 1}
                    </span>
                  </div>

                  {hasWeekTrades ? (
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span className="text-[8px] font-medium bg-white/10 px-1 rounded text-slate-300">
                        {week.weekTradesCount}t
                      </span>
                      <div className={`text-[10px] font-mono font-bold mt-0.5 ${isWeekProfit ? 'text-emerald-400' : isWeekLoss ? 'text-red-400' : 'text-slate-400'}`}>
                        {fmtMoney(week.weekNetPl)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-center text-slate-600 my-auto">—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
