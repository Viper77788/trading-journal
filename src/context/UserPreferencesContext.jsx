import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getBrowserTimezone } from '../utils/timezoneUtils';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const UserPreferencesContext = createContext();

export function UserPreferencesProvider({ children }) {
  const { user } = useAuth();
  const [userTimezone, setUserTimezone] = useState(getBrowserTimezone());
  const [timezoneSetAt, setTimezoneSetAt] = useState(null);
  const [isTimezoneUnconfigured, setIsTimezoneUnconfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    if (!user) {
      setUserTimezone(getBrowserTimezone());
      setIsTimezoneUnconfigured(true);
      setGeminiApiKey('');
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      setLoading(true);
      const localKey = `tj-timezone-${user.uid}`;
      const localSetKey = `tj-tzsetat-${user.uid}`;
      const localApiKey = `tj-geminikey-${user.uid}`;
      const localTz = localStorage.getItem(localKey);
      const localSet = localStorage.getItem(localSetKey);
      const localKeyVal = localStorage.getItem(localApiKey);

      if (localTz) {
        setUserTimezone(localTz);
        setTimezoneSetAt(localSet || null);
        setIsTimezoneUnconfigured(false);
      }
      if (localKeyVal) {
        setGeminiApiKey(localKeyVal);
      }

      try {
        const docRef = doc(db, `users/${user.uid}/settings`, 'preferences');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.timezone) {
            setUserTimezone(data.timezone);
            setTimezoneSetAt(data.timezoneSetAt || null);
            setIsTimezoneUnconfigured(false);
            localStorage.setItem(localKey, data.timezone);
            if (data.timezoneSetAt) localStorage.setItem(localSetKey, data.timezoneSetAt);
          }
          if (data.geminiApiKey !== undefined) {
            setGeminiApiKey(data.geminiApiKey);
            localStorage.setItem(localApiKey, data.geminiApiKey);
          }
        }
      } catch (err) {
        console.warn('Firestore preferences load fallback:', err?.message);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const updateTimezone = async (newTz) => {
    const isoNow = new Date().toISOString();
    setUserTimezone(newTz);
    setTimezoneSetAt(isoNow);
    setIsTimezoneUnconfigured(false);

    if (user) {
      localStorage.setItem(`tj-timezone-${user.uid}`, newTz);
      localStorage.setItem(`tj-tzsetat-${user.uid}`, isoNow);
      try {
        const docRef = doc(db, `users/${user.uid}/settings`, 'preferences');
        await setDoc(docRef, { timezone: newTz, timezoneSetAt: isoNow }, { merge: true });
      } catch (err) {
        console.warn('Firestore timezone save fallback:', err?.message);
      }
    }
  };

  const updateGeminiApiKey = async (newKey) => {
    const trimmed = (newKey || '').trim();
    setGeminiApiKey(trimmed);
    if (user) {
      localStorage.setItem(`tj-geminikey-${user.uid}`, trimmed);
      try {
        const docRef = doc(db, `users/${user.uid}/settings`, 'preferences');
        await setDoc(docRef, { geminiApiKey: trimmed }, { merge: true });
      } catch (err) {
        console.warn('Firestore gemini key save fallback:', err?.message);
      }
    }
  };

  const confirmBrowserTimezone = () => {
    updateTimezone(userTimezone || getBrowserTimezone());
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        userTimezone,
        timezoneSetAt,
        isTimezoneUnconfigured,
        updateTimezone,
        confirmBrowserTimezone,
        geminiApiKey,
        updateGeminiApiKey,
        loading
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export const useUserPreferences = () => useContext(UserPreferencesContext);
