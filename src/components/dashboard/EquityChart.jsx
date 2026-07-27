import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function EquityChart({ trades }) {
  if (!trades || trades.length === 0) return null;

  const sortedTrades = [...trades].sort((a, b) => new Date(a.tradeDate) - new Date(b.tradeDate));
  
  let runningSum = 0;
  const labels = [];
  const dataPoints = [];

  sortedTrades.forEach((trade, i) => {
    runningSum += Number(trade.profitLoss) || 0;
    const d = trade.tradeDate ? new Date(trade.tradeDate) : null;
    const label = d && !isNaN(d.getTime())
      ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : `#${i + 1}`;
    labels.push(label);
    dataPoints.push(Number(runningSum.toFixed(2)));
  });

  return (
    <Line
      data={{
        labels,
        datasets: [{
          label: 'Cumulative P/L',
          data: dataPoints,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8', maxRotation: 0, autoSkip: true } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8' } },
        },
      }}
    />
  );
}
