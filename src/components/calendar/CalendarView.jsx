import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import CalendarGrid from './CalendarGrid';
import DayDetailModal from './DayDetailModal';
import WeekDetailModal from './WeekDetailModal';

export default function CalendarView({ trades, loading, onView, onEdit, onDelete, onChart }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);

  const tradesByDay = useMemo(() => {
    const map = new Map();
    trades.forEach(t => {
      if (!t.tradeDate) return;
      const dateKey = t.tradeDate.split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(t);
    });
    return map;
  }, [trades]);

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleToday = () => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  return (
    <div className="w-full space-y-3 animate-fadeIn">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div>
          <h1 className="text-xl font-bold text-white">Calendar</h1>
          <p className="text-slate-400 text-xs mt-0.5">Monthly & Weekly performance breakdown</p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-xl">
          <button
            onClick={handlePrev}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
          >
            Today
          </button>
          <span className="text-xs font-bold text-white px-1.5 font-mono">
            {monthName} {year}
          </span>
          <button
            onClick={handleNext}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : trades.length === 0 ? (
        <div className="text-center py-12 w-full glass-card">
          <CalendarIcon size={32} className="mx-auto text-slate-500 mb-2" />
          <p className="text-slate-400 text-sm">No trades logged yet</p>
        </div>
      ) : (
        <CalendarGrid 
          year={year} 
          month={month} 
          tradesByDay={tradesByDay} 
          onDayClick={setSelectedDay}
          onWeekClick={setSelectedWeek}
        />
      )}

      {/* Day Detail Modal */}
      {selectedDay && tradesByDay.has(selectedDay) && (
        <DayDetailModal 
          dateKey={selectedDay}
          trades={tradesByDay.get(selectedDay)}
          onClose={() => setSelectedDay(null)}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onChart={onChart}
        />
      )}

      {/* Week Detail Modal */}
      {selectedWeek && (
        <WeekDetailModal
          weekNumber={selectedWeek.weekNumber}
          dateRangeStr={selectedWeek.dateRangeStr}
          trades={selectedWeek.trades}
          onClose={() => setSelectedWeek(null)}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onChart={onChart}
        />
      )}
    </div>
  );
}
