import { db } from '../config/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

/**
 * Notes are stored at: users/{uid}/notes/{YYYY-MM-DD}
 * Each document: { date, content, mood, createdAt, updatedAt }
 */

export const getNote = async (uid, date) => {
  if (!uid || !date) return null;
  try {
    const ref = doc(db, `users/${uid}/notes`, date);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.warn('notesService.getNote error:', err?.message);
    return null;
  }
};

export const saveNote = async (uid, date, content, mood = 'Neutral') => {
  if (!uid || !date) return;
  try {
    const ref = doc(db, `users/${uid}/notes`, date);
    const now = new Date().toISOString();
    const existing = await getDoc(ref);
    await setDoc(ref, {
      date,
      content,
      mood,
      updatedAt: now,
      createdAt: existing.exists() ? existing.data().createdAt : now
    }, { merge: true });
  } catch (err) {
    console.warn('notesService.saveNote error:', err?.message);
  }
};

export const deleteNote = async (uid, date) => {
  if (!uid || !date) return;
  try {
    await deleteDoc(doc(db, `users/${uid}/notes`, date));
  } catch (err) {
    console.warn('notesService.deleteNote error:', err?.message);
  }
};

export const getAllNotes = async (uid) => {
  if (!uid) return {};
  try {
    const colRef = collection(db, `users/${uid}/notes`);
    const snap = await getDocs(colRef);
    const map = {};
    snap.docs.forEach(d => { map[d.id] = d.data(); });
    return map;
  } catch (err) {
    console.warn('notesService.getAllNotes error:', err?.message);
    return {};
  }
};
