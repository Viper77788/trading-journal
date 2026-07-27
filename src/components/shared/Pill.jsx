import React from 'react';

const VARIANT_CLASSES = {
  win: 'bg-emerald-500/20 text-emerald-400',
  loss: 'bg-red-500/20 text-red-400',
  breakeven: 'bg-amber-500/20 text-amber-400',
  long: 'bg-blue-500/20 text-blue-400',
  short: 'bg-purple-500/20 text-purple-400',
  yes: 'bg-emerald-500/20 text-emerald-400',
  no: 'bg-red-500/20 text-red-400',
};

const Pill = ({ variant, label, className, children }) => {
  const classes = className || VARIANT_CLASSES[variant] || 'bg-slate-500/20 text-slate-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${classes}`}>
      {children || label || '—'}
    </span>
  );
};

export default Pill;
