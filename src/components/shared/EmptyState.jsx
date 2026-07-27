import React from 'react';

const EmptyState = ({ icon: Icon, title, subtitle, action }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full p-12 text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-white/5">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-md text-slate-400">{subtitle}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
