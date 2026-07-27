import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { computeHourlyStats, hourLabel } from '../../utils/calculations';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function HourlyChart({ trades }) {
  const hourly = useMemo(() => computeHourlyStats(trades), [trades]);
  const withData = hourly.filter(h => h.total > 0);

  if (!withData.length) {
    return (
      <p className="text-slate-500 text-sm text-center py-8">
        No open-time data yet. Import from MT5 or add Open Time when logging trades.
      </p>
    );
  }

  // Best/worst hour — prefer hours with >= 2 trades
  const reliable = withData.filter(h => h.total >= 2);
  const pool = reliable.length ? reliable : withData;
  const best = [...pool].sort((a, b) => b.winRate - a.winRate || b.total - a.total)[0];
  const worst = [...pool].sort((a, b) => a.winRate - b.winRate || b.total - a.total)[0];

  return (
    <div>
      <div className="h-[280px] mb-6">
        <Bar
          data={{
            labels: hourly.map(h => hourLabel(h.hour)),
            datasets: [{
              label: 'Win Rate',
              data: hourly.map(h => Number(h.winRate.toFixed(1))),
              backgroundColor: hourly.map(h =>
                h.total === 0 ? 'rgba(148,163,184,0.2)' :
                h.winRate >= 50 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'
              ),
              borderRadius: 6,
            }],
          }}
          options={{
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const h = hourly[ctx.dataIndex];
                    return h.total
                      ? [`Win rate: ${h.winRate.toFixed(1)}%`, `Trades: ${h.total} (${h.wins}W / ${h.losses}L)`]
                      : ['No trades opened this hour'];
                  },
                },
              },
            },
            scales: {
              x: { grid: { display: false } },
              y: { grid: { color: 'rgba(255,255,255,0.06)' }, min: 0, max: 100, ticks: { callback: v => v + '%' } },
            },
          }}
        />
      </div>

      {/* Best/Worst Hour Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card text-center">
          <div className="text-slate-400 text-xs mb-1">Best Hour</div>
          <div className="text-lg font-bold font-mono text-emerald-400">
            {hourLabel(best.hour)} · {best.winRate.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">
            {best.total} trade{best.total === 1 ? '' : 's'} ({best.wins}W / {best.losses}L)
          </div>
        </div>
        <div className="glass-card text-center">
          <div className="text-slate-400 text-xs mb-1">Worst Hour</div>
          <div className="text-lg font-bold font-mono text-red-400">
            {hourLabel(worst.hour)} · {worst.winRate.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">
            {worst.total} trade{worst.total === 1 ? '' : 's'} ({worst.wins}W / {worst.losses}L)
          </div>
        </div>
      </div>
    </div>
  );
}
