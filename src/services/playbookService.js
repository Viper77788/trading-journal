import { db } from '../config/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

export const DEFAULT_PLAYBOOKS = [
  {
    name: 'ICT Silver Bullet',
    description: '1-minute FVG entry within 10-11 AM EST or 2-3 PM EST liquidity sweeps.',
    timeframe: '1M / 5M',
    entryRules: [
      'Liquidity sweep of session high/low',
      'Displacement creating a Fair Value Gap (FVG)',
      'Market Structure Shift (MSS) confirmed'
    ],
    exitRules: [
      'Target opposing session liquidity',
      'Fixed 1:2 or 1:3 Risk:Reward'
    ],
    riskPctPerTrade: 1.0
  },
  {
    name: 'Asia Range Breakout & Retest',
    description: 'Capitalize on London session expansion following Asia consolidation.',
    timeframe: '15M / 1H',
    entryRules: [
      'Define Asian Session High & Low range',
      'Wait for clean candle close outside Asia range',
      'Limit order on range boundary retest'
    ],
    exitRules: [
      '1.5x Asia range extension target',
      'SL placed back inside Asia range'
    ],
    riskPctPerTrade: 1.5
  },
  {
    name: 'Supply & Demand Zone Reclaim',
    description: 'Higher timeframe supply/demand zone reaction aligned with 4H trend.',
    timeframe: '1H / 4H',
    entryRules: [
      'Fresh HTF Supply or Demand zone',
      'Confluence with 61.8% Fibonacci retracement',
      'Bullish/Bearish engulfing candle confirmation'
    ],
    exitRules: [
      'Target next HTF key level',
      'Trail stop loss to breakeven after 1:1'
    ],
    riskPctPerTrade: 2.0
  }
];

// Local storage fallback helpers
const getLocalPlaybooks = (uid) => {
  try {
    const raw = localStorage.getItem(`tj-playbooks-${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalPlaybooks = (uid, list) => {
  try {
    localStorage.setItem(`tj-playbooks-${uid}`, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save local playbooks:', err);
  }
};

export const createPlaybook = async (uid, playbookData) => {
  try {
    const playbooksRef = collection(db, `users/${uid}/playbooks`);
    const docRef = await addDoc(playbooksRef, {
      ...playbookData,
      isDeleted: false,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.warn('Firestore playbook write fallback to local storage:', err?.message);
    const local = getLocalPlaybooks(uid);
    const newPlaybook = {
      id: `local_pb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...playbookData,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    local.push(newPlaybook);
    saveLocalPlaybooks(uid, local);
    return newPlaybook.id;
  }
};

export const getAllPlaybooks = async (uid) => {
  try {
    const playbooksRef = collection(db, `users/${uid}/playbooks`);
    const q = query(playbooksRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const firestorePlaybooks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const localPlaybooks = getLocalPlaybooks(uid);
    const combinedMap = new Map();
    [...firestorePlaybooks, ...localPlaybooks].forEach(pb => combinedMap.set(pb.id, pb));

    return Array.from(combinedMap.values()).filter(pb => pb.isDeleted !== true);
  } catch (err) {
    console.warn('Firestore playbook read fallback to local storage:', err?.message);
    return getLocalPlaybooks(uid).filter(pb => pb.isDeleted !== true);
  }
};

export const updatePlaybookById = async (uid, id, playbookData) => {
  try {
    if (!id.startsWith('local_pb_')) {
      const docRef = doc(db, `users/${uid}/playbooks`, id);
      await updateDoc(docRef, playbookData);
      return;
    }
  } catch (err) {
    console.warn('Firestore playbook update fallback:', err?.message);
  }
  const local = getLocalPlaybooks(uid);
  const updated = local.map(pb => pb.id === id ? { ...pb, ...playbookData } : pb);
  saveLocalPlaybooks(uid, updated);
};

export const softDeletePlaybookById = async (uid, id) => {
  const deletedAt = new Date().toISOString();
  try {
    if (!id.startsWith('local_pb_')) {
      const docRef = doc(db, `users/${uid}/playbooks`, id);
      await updateDoc(docRef, { isDeleted: true, deletedAt });
    }
  } catch (err) {
    console.warn('Firestore playbook soft delete fallback:', err?.message);
  }
  const local = getLocalPlaybooks(uid);
  const updated = local.map(pb => pb.id === id ? { ...pb, isDeleted: true, deletedAt } : pb);
  saveLocalPlaybooks(uid, updated);
};

export const ensureDefaultPlaybooks = async (uid) => {
  const existing = await getAllPlaybooks(uid);
  if (existing.length > 0) return existing;

  const seeded = [];
  for (const tpl of DEFAULT_PLAYBOOKS) {
    const id = await createPlaybook(uid, tpl);
    seeded.push({ id, ...tpl, isDeleted: false });
  }
  return seeded;
};
