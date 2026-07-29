import React from 'react';
import { fmtMoney } from '../../utils/formatters';

const CalendarGrid = ({ year, month, tradesByDay, onDayClick, onWeekClick }) => {
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

  // Dynamic sizing based on number of weeks (4, 5, or 6 weeks)
  let cellMinHeight = 'min-h-[64px]';
  let cellPadding = 'p-2';
  let containerPadding = 'p-4';
  let rowSpacing = 'space-y-1.5';
  let fontSizeDay = 'text-xs';
  let fontSizeBadge = 'text-[9.5px]';
  let fontSizePnl = 'text-xs';

  if (numWeeks >= 6) {
    cellMinHeight = 'min-h-[46px]';
    cellPadding = 'p-1';
    containerPadding = 'p-2.5';
    rowSpacing = 'space-y-0.5';
    fontSizeDay = 'text-[10px]';
    fontSizeBadge = 'text-[8.5px]';
    fontSizePnl = 'text-[10px]';
  } else if (numWeeks === 5) {
    cellMinHeight = 'min-h-[54px]';
    cellPadding = 'p-1.5';
    containerPadding = 'p-3';
    rowSpacing = 'space-y-1';
    fontSizeDay = 'text-[11px]';
    fontSizeBadge = 'text-[9px]';
    fontSizePnl = 'text-[11px]';
  }

  return (
    <div className={`w-full max-w-5xl mx-auto bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl ${containerPadding} shadow-2xl transition-all`}>
      {/* 8 Column Headers */}
      <div className="grid grid-cols-8 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-slate-400 p-0.5 uppercase tracking-wider">
            {d}
          </div>
        ))}
        <div className="text-center text-[11px] font-bold text-blue-400 p-0.5 uppercase tracking-wider bg-blue-500/10 rounded-md border border-blue-500/20">
          Week P&L
        </div>
      </div>

      {/* Week Rows */}
      <div className={rowSpacing}>
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
                      className={`${cellPadding} border border-white/[0.03] bg-black/10 ${cellMinHeight} rounded-lg`}
                    />
                  );
                }

                return (
                  <div
                    key={slot.key}
                    className={`${cellPadding} border border-white/[0.06] ${cellMinHeight} flex flex-col justify-between transition-all rounded-lg calendar-day ${
                      slot.hasTrades ? 'cursor-pointer hover:border-white/30 hover:scale-[1.02] shadow-sm' : 'bg-white/[0.02]'
                    } ${slot.isProfit ? 'bg-emerald-500/10 border-emerald-500/20' : slot.isLoss ? 'bg-red-500/10 border-red-500/20' : ''}`}
                    onClick={() => slot.hasTrades && onDayClick?.(slot.dateKey)}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`${fontSizeDay} font-bold ${slot.hasTrades ? 'text-white' : 'text-slate-500'}`}>{slot.day}</span>
                    </div>

                    {slot.hasTrades ? (
                      <div className="flex flex-col items-center justify-center space-y-0.5">
                        <span className={`${fontSizeBadge} font-medium bg-white/10 px-1 py-0.1 rounded text-slate-300 tracking-tight`}>
                          {slot.dayTrades.length} {slot.dayTrades.length === 1 ? 'trade' : 'trades'}
                        </span>
                        <div className={`${fontSizePnl} font-mono font-bold leading-none ${slot.isProfit ? 'text-emerald-400' : slot.isLoss ? 'text-red-400' : 'text-slate-400'}`}>
                          {fmtMoney(slot.netPl)}
                        </div>
                      </div>
                    ) : (
                      <div className="h-3" />
                    )}
                  </div>
                );
              })}

              {/* 8th Column: Weekly Summary Cell */}
              <div
                className={`${cellPadding} border ${cellMinHeight} flex flex-col justify-between rounded-lg transition-all font-semibold ${
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
                  <span className={`${fontSizeBadge} font-bold tracking-wider uppercase text-slate-400`}>
                    W{week.weekIndex + 1}
                  </span>
                </div>

                {hasWeekTrades ? (
                  <div className="flex flex-col items-center justify-center space-y-0.5">
                    <span className={`${fontSizeBadge} font-medium bg-white/10 px-1 py-0.1 rounded text-slate-300 tracking-tight`}>
                      {week.weekTradesCount} {week.weekTradesCount === 1 ? 'trade' : 'trades'}
                    </span>
                    <div className={`${fontSizePnl} font-mono font-bold leading-none ${isWeekProfit ? 'text-emerald-400' : isWeekLoss ? 'text-red-400' : 'text-slate-400'}`}>
                      {fmtMoney(week.weekNetPl)}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-center text-slate-600 my-auto">—</div>
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
