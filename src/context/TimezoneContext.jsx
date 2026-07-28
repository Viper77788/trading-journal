import React, { createContext, useContext, useState, useEffect } from 'react';

export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'New York (EDT/EST, UTC-4/5)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST, UTC+5:30)' },
  { value: 'Europe/London', label: 'London (BST/GMT, UTC+0/1)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST, UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST, UTC+10)' },
  { value: 'local', label: 'Browser Local Timezone' }
];

const TimezoneContext = createContext();

export const TimezoneProvider = ({ children }) => {
  const [timezone, setTimezoneState] = useState(() => {
    try {
      return localStorage.getItem('tj-timezone') || 'America/New_York';
    } catch {
      return 'America/New_York';
    }
  });

  const setTimezone = (tz) => {
    setTimezoneState(tz);
    try {
      localStorage.setItem('tj-timezone', tz);
    } catch (err) {
      console.error('Failed to save timezone to localStorage:', err);
    }
  };

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone, TIMEZONE_OPTIONS }}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};
