import React from 'react';
import { Lightbulb } from 'lucide-react';
import { generateInsights } from '../../utils/calculations';

export default function InsightsList({ trades }) {
  const insights = generateInsights ? generateInsights(trades) : [];

  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb className="text-amber-400" size={20} />
        <h3 className="text-lg font-bold text-white">Performance Insights</h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-start space-x-3 bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <p className="text-slate-300 text-sm leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
