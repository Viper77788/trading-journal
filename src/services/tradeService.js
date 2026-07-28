import { db } from '../config/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';

export const createTrade = async (uid, data) => {
  const tradesRef = collection(db, `users/${uid}/trades`);
  const docRef = await addDoc(tradesRef, {
    ...data,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getAllTrades = async (uid) => {
  const tradesRef = collection(db, `users/${uid}/trades`);
  const q = query(tradesRef, orderBy('tradeDate', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getTradeById = async (uid, id) => {
  const docRef = doc(db, `users/${uid}/trades`, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
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
  await deleteDoc(docRef);
};

export async function importMt5Trades(uid, newTrades) {
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
      batch.set(ref, { ...trade, createdAt: new Date().toISOString() });
    });
    await batch.commit();
    imported += chunk.length;
  }
  return { imported, skipped: newTrades.length - toImport.length, total: newTrades.length };
}

export async function importJsonTrades(uid, newTrades) {
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
        createdAt: cleanTrade.createdAt || new Date().toISOString()
      });
    });
    await batch.commit();
    imported += chunk.length;
  }
  return { imported, total: newTrades.length };
}
