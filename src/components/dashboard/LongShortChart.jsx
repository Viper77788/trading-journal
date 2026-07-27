import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function LongShortChart({ trades }) {
  let longs = 0, shorts = 0;

  trades.forEach(t => {
    if (t.direction?.toLowerCase() === 'long') longs++;
    else if (t.direction?.toLowerCase() === 'short') shorts++;
  });

  return (
    <Doughnut
      data={{
        labels: ['Long', 'Short'],
        datasets: [{
          data: [longs, shorts],
          backgroundColor: ['#3b82f6', '#a855f7'],
          borderWidth: 0,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } },
        },
      }}
    />
  );
}
