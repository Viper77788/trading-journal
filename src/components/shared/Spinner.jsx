import React from 'react';

const Spinner = () => {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );
};

export default Spinner;
