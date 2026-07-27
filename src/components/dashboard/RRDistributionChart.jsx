import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function RRDistributionChart({ trades }) {
  const buckets = { '<1': 0, '1-2': 0, '2-3': 0, '3-4': 0, '4+': 0 };

  trades.forEach(t => {
    const rr = parseFloat(t.rr) || 0;
    if (rr < 1) buckets['<1']++;
    else if (rr < 2) buckets['1-2']++;
    else if (rr < 3) buckets['2-3']++;
    else if (rr < 4) buckets['3-4']++;
    else buckets['4+']++;
  });

  return (
    <Bar
      data={{
        labels: Object.keys(buckets),
        datasets: [{
          data: Object.values(buckets),
          backgroundColor: '#a855f7',
          borderRadius: 6,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
        },
      }}
    />
  );
}
