import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

/**
 * Goals stored at: users/{uid}/goals/{YYYY-MM}
 * { month, targetPnl, targetWinRate, createdAt, updatedAt }
 *
 * Achievements stored at: users/{uid}/achievements/{badgeId}
 * { badgeId, label, earnedAt }
 */

// ─── Goals ──────────────────────────────────────────────────────────────────

export const getGoal = async (uid, monthKey) => {
  if (!uid || !monthKey) return null;
  try {
    const ref = doc(db, `users/${uid}/goals`, monthKey);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn('goalsService.getGoal error:', err?.message);
    return null;
  }
};

export const saveGoal = async (uid, monthKey, { targetPnl, targetWinRate }) => {
  if (!uid || !monthKey) return;
  try {
    const ref = doc(db, `users/${uid}/goals`, monthKey);
    const now = new Date().toISOString();
    const existing = await getDoc(ref);
    await setDoc(ref, {
      month: monthKey,
      targetPnl: Number(targetPnl) || 0,
      targetWinRate: Number(targetWinRate) || 0,
      updatedAt: now,
      createdAt: existing.exists() ? existing.data().createdAt : now
    }, { merge: true });
  } catch (err) {
    console.warn('goalsService.saveGoal error:', err?.message);
  }
};

// ─── Achievements ────────────────────────────────────────────────────────────

/**
 * Module-level in-session Set — synchronous check before async Firestore write.
 * Prevents duplicate badge toasts on rapid re-renders or multi-device race conditions.
 */
const awardedInSession = new Set();

export const BADGES = {
  FIRST_WIN:       { id: 'first-win',       label: '🏆 First Win',            desc: 'Closed your first profitable trade' },
  WIN_STREAK_5:    { id: 'win-streak-5',    label: '🔥 5-Win Streak',          desc: 'Won 5 trades in a row' },
  WIN_STREAK_10:   { id: 'win-streak-10',   label: '🚀 10-Win Streak',         desc: 'Won 10 trades in a row' },
  MONTHLY_GOAL:    { id: 'monthly-goal',    label: '🎯 Monthly Goal Reached',  desc: 'Hit your monthly P&L target' },
  GREEN_WEEK_3:    { id: 'green-week-3',    label: '📅 3 Green Weeks',         desc: '3 consecutive profitable weeks' },
  PLAN_FOLLOWER:   { id: 'plan-follower',   label: '📋 Plan Follower',         desc: 'Followed plan on 10+ trades' },
  SHARP_SHOOTER:   { id: 'sharp-shooter',  label: '🎯 Sharp Shooter',         desc: 'Scored 80+ on 5 trades' },
};

export const getAchievements = async (uid) => {
  if (!uid) return {};
  try {
    const colRef = collection(db, `users/${uid}/achievements`);
    const snap = await getDocs(colRef);
    const map = {};
    snap.docs.forEach(d => { map[d.id] = d.data(); });
    return map;
  } catch (err) {
    console.warn('goalsService.getAchievements error:', err?.message);
    return {};
  }
};

/**
 * Award a badge if not already awarded this session or in Firestore.
 * Returns true if newly awarded (caller can show toast), false otherwise.
 */
export const awardBadge = async (uid, badge, existingAchievements = {}) => {
  if (!uid || !badge?.id) return false;

  // Synchronous in-session guard (prevents race conditions on re-render)
  if (awardedInSession.has(badge.id)) return false;

  // Already persisted in Firestore
  if (existingAchievements[badge.id]) {
    awardedInSession.add(badge.id); // sync cache for this session
    return false;
  }

  // Mark in session Set immediately (synchronous, before async write)
  awardedInSession.add(badge.id);

  try {
    const ref = doc(db, `users/${uid}/achievements`, badge.id);
    await setDoc(ref, {
      badgeId: badge.id,
      label: badge.label,
      desc: badge.desc,
      earnedAt: new Date().toISOString()
    });
    return true; // newly awarded
  } catch (err) {
    console.warn('goalsService.awardBadge error:', err?.message);
    return false;
  }
};
