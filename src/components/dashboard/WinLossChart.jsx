import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { resultOf } from '../../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function WinLossChart({ trades }) {
  let wins = 0, losses = 0, breakevens = 0;

  trades.forEach(trade => {
    const res = resultOf(trade);
    if (res === 'Win') wins++;
    else if (res === 'Loss') losses++;
    else breakevens++;
  });

  return (
    <Pie
      data={{
        labels: ['Wins', 'Losses', 'Breakeven'],
        datasets: [{
          data: [wins, losses, breakevens],
          backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
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
