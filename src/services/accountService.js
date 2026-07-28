import { db } from '../config/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, writeBatch, where } from 'firebase/firestore';

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
      isDeleted: false,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.warn('Firestore write permission restricted — using local storage fallback:', err?.message);
    const local = getLocalAccounts(uid);
    const newAccount = {
      id: `local_acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...accountData,
      isDeleted: false,
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
    const combinedMap = new Map();
    [...firestoreAccounts, ...localAccounts].forEach(acc => combinedMap.set(acc.id, acc));

    // Exclude soft-deleted accounts from standard listings
    return Array.from(combinedMap.values()).filter(acc => acc.isDeleted !== true);
  } catch (err) {
    console.warn('Firestore read permission restricted — loading local active accounts:', err?.message);
    return getLocalAccounts(uid).filter(acc => acc.isDeleted !== true);
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

export const getDeletedAccounts = async (uid) => {
  try {
    const accountsRef = collection(db, `users/${uid}/accounts`);
    const querySnapshot = await getDocs(accountsRef);
    const firestoreAccounts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const localAccounts = getLocalAccounts(uid);
    const combinedMap = new Map();
    [...firestoreAccounts, ...localAccounts].forEach(acc => combinedMap.set(acc.id, acc));

    return Array.from(combinedMap.values()).filter(acc => acc.isDeleted === true);
  } catch (err) {
    return getLocalAccounts(uid).filter(acc => acc.isDeleted === true);
  }
};

export const softDeleteAccountById = async (uid, accountId) => {
  const deletedAt = new Date().toISOString();
  try {
    if (!accountId.startsWith('local_acc_')) {
      const docRef = doc(db, `users/${uid}/accounts`, accountId);
      await updateDoc(docRef, { isDeleted: true, deletedAt });

      // Soft delete matching trades
      const tradesRef = collection(db, `users/${uid}/trades`);
      const q = query(tradesRef, where('accountId', '==', accountId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => batch.update(docSnap.ref, { isDeleted: true, deletedAt }));
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn('Firestore soft delete fallback:', err?.message);
  }

  // Update local storage fallback
  const local = getLocalAccounts(uid);
  const updated = local.map(a => a.id === accountId ? { ...a, isDeleted: true, deletedAt } : a);
  saveLocalAccounts(uid, updated);
};

export const restoreAccountById = async (uid, accountId) => {
  try {
    const active = await getAllAccounts(uid);
    let targetAccount = null;

    if (!accountId.startsWith('local_acc_')) {
      const docRef = doc(db, `users/${uid}/accounts`, accountId);
      const snap = await getDoc(docRef);
      if (snap.exists()) targetAccount = snap.data();
    }
    if (!targetAccount) {
      targetAccount = getLocalAccounts(uid).find(a => a.id === accountId);
    }

    let restoredName = targetAccount?.name || 'Account';
    if (active.some(a => a.name === restoredName)) {
      restoredName += ' (Restored)';
    }

    if (!accountId.startsWith('local_acc_')) {
      const docRef = doc(db, `users/${uid}/accounts`, accountId);
      await updateDoc(docRef, { isDeleted: false, deletedAt: null, name: restoredName });

      // Restore matching trades
      const tradesRef = collection(db, `users/${uid}/trades`);
      const q = query(tradesRef, where('accountId', '==', accountId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => batch.update(docSnap.ref, { isDeleted: false, deletedAt: null }));
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn('Firestore restore fallback:', err?.message);
  }

  const local = getLocalAccounts(uid);
  const updated = local.map(a => a.id === accountId ? { ...a, isDeleted: false, deletedAt: null } : a);
  saveLocalAccounts(uid, updated);
};

export const permanentlyDeleteAccountById = async (uid, accountId) => {
  try {
    if (!accountId.startsWith('local_acc_')) {
      const docRef = doc(db, `users/${uid}/accounts`, accountId);
      await deleteDoc(docRef);

      // Hard delete matching trades
      const tradesRef = collection(db, `users/${uid}/trades`);
      const q = query(tradesRef, where('accountId', '==', accountId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn('Firestore permanent delete fallback:', err?.message);
  }

  const local = getLocalAccounts(uid);
  const updated = local.filter(a => a.id !== accountId);
  saveLocalAccounts(uid, updated);
};

export const autoPurgeExpiredTrash = async (uid) => {
  if (!uid) return;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();

  try {
    const deletedAccounts = await getDeletedAccounts(uid);
    for (const acc of deletedAccounts) {
      if (acc.deletedAt) {
        const deletedMs = new Date(acc.deletedAt).getTime();
        if (nowMs - deletedMs > thirtyDaysMs) {
          await permanentlyDeleteAccountById(uid, acc.id);
        }
      }
    }
  } catch (err) {
    console.warn('Auto purge error:', err?.message);
  }
};

export const ensureDefaultAccount = async (uid) => {
  const existing = await getAllAccounts(uid);
  if (existing.length > 0) return existing;

  const defaultAccount = {
    ...PROP_FIRM_TEMPLATES.FUNDING_PIPS_100K,
    isDefault: true,
    createdAt: new Date().toISOString()
  };
  const id = await createAccount(uid, defaultAccount);
  return [{ id, ...defaultAccount }];
};
