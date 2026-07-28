import { db } from '../config/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, writeBatch, where } from 'firebase/firestore';

export const createTrade = async (uid, data) => {
  if (!data.accountId) {
    console.warn('Warning: Trade created without explicit accountId.');
  }
  const tradesRef = collection(db, `users/${uid}/trades`);
  const docRef = await addDoc(tradesRef, {
    ...data,
    isDeleted: false,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getAllTrades = async (uid) => {
  const tradesRef = collection(db, `users/${uid}/trades`);
  const q = query(tradesRef, orderBy('tradeDate', 'desc'));
  const querySnapshot = await getDocs(q);
  const allDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return allDocs.filter(t => t.isDeleted !== true);
};

export const getTradeById = async (uid, id) => {
  const docRef = doc(db, `users/${uid}/trades`, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data()?.isDeleted !== true) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const updateTradeById = async (uid, id, data) => {
  const docRef = doc(db, `users/${uid}/trades`, id);
  await updateDoc(docRef, data);
};

export const deleteTradeById = async (uid, id) => {
  const docRef = doc(db, `users/${uid}/trades`, id);
  await updateDoc(docRef, { isDeleted: true, deletedAt: new Date().toISOString() });
};

export const bulkAssignAccountToTrades = async (uid, tradeIds = [], targetAccountId) => {
  if (!uid || !tradeIds.length || !targetAccountId) return;
  const tradesCol = collection(db, 'users', uid, 'trades');
  for (let i = 0; i < tradeIds.length; i += 500) {
    const chunk = tradeIds.slice(i, i + 500);
    const batch = writeBatch(db);
    chunk.forEach((id) => {
      const ref = doc(tradesCol, id);
      batch.update(ref, { accountId: targetAccountId });
    });
    await batch.commit();
  }
};

export async function importMt5Trades(uid, newTrades, accountId = null) {
  const existing = await getAllTrades(uid);
  const alreadyImported = new Set(
    existing.filter((t) => t.mt5PositionId).map((t) => String(t.mt5PositionId))
  );
  const toImport = newTrades.filter((t) => !alreadyImported.has(t.mt5PositionId));

  let imported = 0;
  const tradesCol = collection(db, 'users', uid, 'trades');
  for (let i = 0; i < toImport.length; i += 500) {
    const chunk = toImport.slice(i, i + 500);
    const batch = writeBatch(db);
    chunk.forEach((trade) => {
      const ref = doc(tradesCol);
      batch.set(ref, {
        ...trade,
        accountId: accountId || trade.accountId || null,
        isDeleted: false,
        createdAt: new Date().toISOString()
      });
    });
    await batch.commit();
    imported += chunk.length;
  }
  return { imported, skipped: newTrades.length - toImport.length, total: newTrades.length };
}

export async function importJsonTrades(uid, newTrades, accountId = null) {
  let imported = 0;
  const tradesCol = collection(db, 'users', uid, 'trades');
  for (let i = 0; i < newTrades.length; i += 500) {
    const chunk = newTrades.slice(i, i + 500);
    const batch = writeBatch(db);
    chunk.forEach((t) => {
      const ref = doc(tradesCol);
      const { id, ...cleanTrade } = t;
      batch.set(ref, {
        ...cleanTrade,
        accountId: accountId || cleanTrade.accountId || null,
        isDeleted: false,
        createdAt: cleanTrade.createdAt || new Date().toISOString()
      });
    });
    await batch.commit();
    imported += chunk.length;
  }
  return { imported, total: newTrades.length };
}
