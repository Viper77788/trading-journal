import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const MultiSelect = ({ options, selected = [], onChange, placeholder = 'Select option(s)' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleOption = (option) => {
    if (option === 'No Setup') {
      if (selected.includes('No Setup')) {
        onChange([]);
      } else {
        onChange(['No Setup']);
      }
      return;
    }

    let newSelected = [...selected];
    if (newSelected.includes('No Setup')) {
      newSelected = newSelected.filter(s => s !== 'No Setup');
    }

    if (newSelected.includes(option)) {
      newSelected = newSelected.filter(s => s !== option);
    } else {
      newSelected.push(option);
    }
    onChange(newSelected);
  };

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'}`} ref={containerRef}>
      <div
        className="flex items-center justify-between min-h-[42px] px-3 py-2 bg-black/20 border border-white/10 rounded-xl cursor-pointer hover:border-white/20 focus:border-blue-500/50 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5 items-center">
          {selected.length === 0 ? (
            <span className="text-slate-500 text-sm">{placeholder}</span>
          ) : (
            selected.map(sel => (
              <span key={sel} className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-lg text-xs font-medium">
                {sel}
              </span>
            ))
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ml-2 flex-shrink-0 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 bg-slate-900/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-2xl max-h-60 overflow-y-auto p-1.5 space-y-0.5 animate-scaleIn">
          {options.map(option => {
            const isSelected = selected.includes(option);
            return (
              <label
                key={option}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                  isSelected ? 'bg-blue-600/20 text-blue-300' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20 accent-blue-600"
                    checked={isSelected}
                    onChange={() => toggleOption(option)}
                  />
                  <span>{option}</span>
                </div>
                {isSelected && <Check size={14} className="text-blue-400" />}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
