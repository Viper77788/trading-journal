import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function MonthlyChart({ trades }) {
  if (!trades || trades.length === 0) return null;

  const monthMap = new Map();
  trades.forEach((t) => {
    if (!t.tradeDate) return;
    const d = new Date(t.tradeDate);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) || 0) + (Number(t.profitLoss) || 0));
  });

  const sortedKeys = Array.from(monthMap.keys()).sort();
  const labels = sortedKeys.map(k => {
    const [y, m] = k.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  });
  const dataPoints = sortedKeys.map(k => Number(monthMap.get(k).toFixed(2)));

  return (
    <Bar
      data={{
        labels,
        datasets: [{
          data: dataPoints,
          backgroundColor: dataPoints.map(v => v >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'),
          borderRadius: 6,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8' } },
        },
      }}
    />
  );
}
