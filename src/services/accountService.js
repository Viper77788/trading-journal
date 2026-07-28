import { db } from '../config/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

export const PROP_FIRM_TEMPLATES = {
  // Funding Pips Options (5k, 10k, 25k, 50k, 100k)
  FUNDING_PIPS_5K: {
    name: 'Funding Pips $5k Evaluation',
    broker: 'cTrader / MT5',
    currency: 'USD',
    type: 'prop_evaluation',
    propFirmName: 'Funding Pips',
    startingBalance: 5000,
    targetProfit: 400,
    maxDailyLoss: 250,
    drawdownType: 'static',
    maxTotalDrawdown: 500,
    trailingFreezeEnabled: false,
    dailyResetTimezone: 'UTC',
    consistencyRuleLimit: 0,
    overtradingThreshold: 5,
    revengeTradeTimeWindow: 30,
    riskWarningThresholdPct: 80,
  },
  FUNDING_PIPS_10K: {
    name: 'Funding Pips $10k Evaluation',
    broker: 'cTrader / MT5',
    currency: 'USD',
    type: 'prop_evaluation',
    propFirmName: 'Funding Pips',
    startingBalance: 10000,
    targetProfit: 800,
    maxDailyLoss: 500,
    drawdownType: 'static',
    maxTotalDrawdown: 1000,
    trailingFreezeEnabled: false,
    dailyResetTimezone: 'UTC',
    consistencyRuleLimit: 0,
    overtradingThreshold: 5,
    revengeTradeTimeWindow: 30,
    riskWarningThresholdPct: 80,
  },
  FUNDING_PIPS_25K: {
    name: 'Funding Pips $25k Evaluation',
    broker: 'cTrader / MT5',
    currency: 'USD',
    type: 'prop_evaluation',
    propFirmName: 'Funding Pips',
    startingBalance: 25000,
    targetProfit: 2000,
    maxDailyLoss: 1250,
    drawdownType: 'static',
    maxTotalDrawdown: 2500,
    trailingFreezeEnabled: false,
    dailyResetTimezone: 'UTC',
    consistencyRuleLimit: 0,
    overtradingThreshold: 5,
    revengeTradeTimeWindow: 30,
    riskWarningThresholdPct: 80,
  },
  FUNDING_PIPS_50K: {
    name: 'Funding Pips $50k Evaluation',
    broker: 'cTrader / MT5',
    currency: 'USD',
    type: 'prop_evaluation',
    propFirmName: 'Funding Pips',
    startingBalance: 50000,
    targetProfit: 4000,
    maxDailyLoss: 2500,
    drawdownType: 'static',
    maxTotalDrawdown: 5000,
    trailingFreezeEnabled: false,
    dailyResetTimezone: 'UTC',
    consistencyRuleLimit: 0,
    overtradingThreshold: 5,
    revengeTradeTimeWindow: 30,
    riskWarningThresholdPct: 80,
  },
  FUNDING_PIPS_100K: {
    name: 'Funding Pips $100k Evaluation',
    broker: 'cTrader / MT5',
    currency: 'USD',
    type: 'prop_evaluation',
    propFirmName: 'Funding Pips',
    startingBalance: 100000,
    targetProfit: 8000,
    maxDailyLoss: 5000,
    drawdownType: 'static',
    maxTotalDrawdown: 10000,
    trailingFreezeEnabled: false,
    dailyResetTimezone: 'UTC',
    consistencyRuleLimit: 0,
    overtradingThreshold: 6,
    revengeTradeTimeWindow: 30,
    riskWarningThresholdPct: 80,
  },

  // FTMO Options
  FTMO_100K: {
    name: 'FTMO $100k Evaluation',
    broker: 'MetaTrader 5',
    currency: 'USD',
    type: 'prop_evaluation',
    propFirmName: 'FTMO',
    startingBalance: 100000,
    targetProfit: 10000,
    maxDailyLoss: 5000,
    drawdownType: 'static',
    maxTotalDrawdown: 10000,
    trailingFreezeEnabled: false,
    dailyResetTimezone: 'Europe/Prague',
    consistencyRuleLimit: 0,
    overtradingThreshold: 6,
    revengeTradeTimeWindow: 30,
    riskWarningThresholdPct: 80,
  },
  FTMO_50K: {
    name: 'FTMO $50k Evaluation',
    broker: 'MetaTrader 5',
    currency: 'USD',
    type: 'prop_evaluation',
    propFirmName: 'FTMO',
    startingBalance: 50000,
    targetProfit: 5000,
    maxDailyLoss: 2500,
    drawdownType: 'static',
    maxTotalDrawdown: 5000,
    trailingFreezeEnabled: false,
    dailyResetTimezone: 'Europe/Prague',
    consistencyRuleLimit: 0,
    overtradingThreshold: 6,
    revengeTradeTimeWindow: 30,
    riskWarningThresholdPct: 80,
  },

  // Apex Options
  APEX_50K: {
    name: 'Apex $50k Evaluation',
    broker: 'NinjaTrader',
    currency: 'USD',
    type: 'prop_evaluation',
    propFirmName: 'Apex Trader Funding',
    startingBalance: 50000,
    targetProfit: 3000,
    maxDailyLoss: 2500,
    drawdownType: 'trailing',
    maxTotalDrawdown: 2500,
    trailingFreezeEnabled: true,
    dailyResetTimezone: 'America/New_York',
    consistencyRuleLimit: 30,
    overtradingThreshold: 8,
    revengeTradeTimeWindow: 20,
    riskWarningThresholdPct: 80,
  },
  APEX_100K: {
    name: 'Apex $100k Evaluation',
    broker: 'NinjaTrader',
    currency: 'USD',
    type: 'prop_evaluation',
    propFirmName: 'Apex Trader Funding',
    startingBalance: 100000,
    targetProfit: 6000,
    maxDailyLoss: 3000,
    drawdownType: 'trailing',
    maxTotalDrawdown: 3000,
    trailingFreezeEnabled: true,
    dailyResetTimezone: 'America/New_York',
    consistencyRuleLimit: 30,
    overtradingThreshold: 8,
    revengeTradeTimeWindow: 20,
    riskWarningThresholdPct: 80,
  },

  // TopStep Options
  TOPSTEP_150K: {
    name: 'TopStep $150k Trading Combine',
    broker: 'Tradovate',
    currency: 'USD',
    type: 'prop_evaluation',
    propFirmName: 'TopStep',
    startingBalance: 150000,
    targetProfit: 9000,
    maxDailyLoss: 3000,
    drawdownType: 'trailing',
    maxTotalDrawdown: 4500,
    trailingFreezeEnabled: false,
    dailyResetTimezone: 'America/Chicago',
    consistencyRuleLimit: 50,
    overtradingThreshold: 5,
    revengeTradeTimeWindow: 30,
    riskWarningThresholdPct: 80,
  },

  // Personal Live
  PERSONAL_LIVE: {
    name: 'Personal Trading Account',
    broker: 'Interactive Brokers',
    currency: 'USD',
    type: 'personal_live',
    propFirmName: 'Personal',
    startingBalance: 10000,
    targetProfit: 2000,
    maxDailyLoss: 500,
    drawdownType: 'static',
    maxTotalDrawdown: 1500,
    trailingFreezeEnabled: false,
    dailyResetTimezone: 'America/New_York',
    consistencyRuleLimit: 0,
    overtradingThreshold: 5,
    revengeTradeTimeWindow: 30,
    riskWarningThresholdPct: 80,
  }
};

// Local storage fallback helpers
const getLocalAccounts = (uid) => {
  try {
    const raw = localStorage.getItem(`tj-accounts-${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalAccounts = (uid, list) => {
  try {
    localStorage.setItem(`tj-accounts-${uid}`, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save local accounts:', err);
  }
};

export const createAccount = async (uid, accountData) => {
  try {
    const accountsRef = collection(db, `users/${uid}/accounts`);
    const docRef = await addDoc(accountsRef, {
      ...accountData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.warn('Firestore write permission restricted — using local storage fallback:', err?.message);
    const local = getLocalAccounts(uid);
    const newAccount = {
      id: `local_acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...accountData,
      createdAt: new Date().toISOString()
    };
    local.push(newAccount);
    saveLocalAccounts(uid, local);
    return newAccount.id;
  }
};

export const getAllAccounts = async (uid) => {
  try {
    const accountsRef = collection(db, `users/${uid}/accounts`);
    const q = query(accountsRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const firestoreAccounts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const localAccounts = getLocalAccounts(uid);
    // Combine and deduplicate
    const combinedMap = new Map();
    [...firestoreAccounts, ...localAccounts].forEach(acc => combinedMap.set(acc.id, acc));
    return Array.from(combinedMap.values());
  } catch (err) {
    console.warn('Firestore read permission restricted — loading local accounts:', err?.message);
    return getLocalAccounts(uid);
  }
};

export const updateAccountById = async (uid, id, accountData) => {
  try {
    if (!id.startsWith('local_acc_')) {
      const docRef = doc(db, `users/${uid}/accounts`, id);
      await updateDoc(docRef, accountData);
      return;
    }
  } catch (err) {
    console.warn('Firestore update restricted — updating locally:', err?.message);
  }
  const local = getLocalAccounts(uid);
  const updated = local.map(a => a.id === id ? { ...a, ...accountData } : a);
  saveLocalAccounts(uid, updated);
};

export const deleteAccountById = async (uid, id) => {
  try {
    if (!id.startsWith('local_acc_')) {
      const docRef = doc(db, `users/${uid}/accounts`, id);
      await deleteDoc(docRef);
    }
  } catch (err) {
    console.warn('Firestore delete restricted — deleting locally:', err?.message);
  }
  const local = getLocalAccounts(uid);
  const updated = local.filter(a => a.id !== id);
  saveLocalAccounts(uid, updated);
};

export const ensureDefaultAccount = async (uid) => {
  const existing = await getAllAccounts(uid);
  if (existing.length > 0) return existing;

  // Seed default Funding Pips 100k account if none exists
  const defaultAccount = {
    ...PROP_FIRM_TEMPLATES.FUNDING_PIPS_100K,
    isDefault: true,
    createdAt: new Date().toISOString()
  };
  const id = await createAccount(uid, defaultAccount);
  return [{ id, ...defaultAccount }];
};
