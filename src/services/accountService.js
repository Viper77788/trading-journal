import { db } from '../config/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, setDoc } from 'firebase/firestore';

export const PROP_FIRM_TEMPLATES = {
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
    dailyResetTimezone: 'Europe/Prague', // FTMO server time GMT+2/3
    consistencyRuleLimit: 0, // No consistency rule on FTMO
    overtradingThreshold: 6,
    revengeTradeTimeWindow: 30,
    riskWarningThresholdPct: 80,
  },
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
    trailingFreezeEnabled: true, // Apex freezes trailing floor at startingBalance + $100
    dailyResetTimezone: 'America/New_York',
    consistencyRuleLimit: 30,
    overtradingThreshold: 8,
    revengeTradeTimeWindow: 20,
    riskWarningThresholdPct: 80,
  },
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

export const createAccount = async (uid, accountData) => {
  const accountsRef = collection(db, `users/${uid}/accounts`);
  const docRef = await addDoc(accountsRef, {
    ...accountData,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getAllAccounts = async (uid) => {
  const accountsRef = collection(db, `users/${uid}/accounts`);
  const q = query(accountsRef, orderBy('createdAt', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateAccountById = async (uid, id, accountData) => {
  const docRef = doc(db, `users/${uid}/accounts`, id);
  await updateDoc(docRef, accountData);
};

export const deleteAccountById = async (uid, id) => {
  const docRef = doc(db, `users/${uid}/accounts`, id);
  await deleteDoc(docRef);
};

export const ensureDefaultAccount = async (uid) => {
  const existing = await getAllAccounts(uid);
  if (existing.length > 0) return existing;

  // Seed default FTMO 100k account if none exists
  const defaultAccount = {
    ...PROP_FIRM_TEMPLATES.FTMO_100K,
    isDefault: true,
    createdAt: new Date().toISOString()
  };
  const id = await createAccount(uid, defaultAccount);
  return [{ id, ...defaultAccount }];
};
