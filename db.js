// ============================================================
//  BADGE QUEST 2026 — Firestore data layer
// ============================================================
import { db } from './firebase.js';
import {
  doc, collection, getDocs, getDoc,
  setDoc, updateDoc, deleteDoc,
  writeBatch, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── User ─────────────────────────────────────────────────────

export async function loadUserData(uid) {
  const userSnap  = await getDoc(doc(db, 'users', uid));
  const userData  = userSnap.exists() ? userSnap.data() : {};
  const goalsSnap = await getDocs(collection(db, 'users', uid, 'goals'));
  const goals     = goalsSnap.docs
    .map(d => ({ ...d.data(), _fsId: d.id }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return {
    name:           userData.username    || 'ME',
    color:          userData.color       || '#cc0000',
    goals,
    unlockedBadges: userData.unlockedBadges || [],
    badgeDates:     userData.badgeDates     || {},
    groups:         userData.groups         || []
  };
}

export async function saveUserBadges(uid, unlockedBadges, badgeDates) {
  await updateDoc(doc(db, 'users', uid), { unlockedBadges, badgeDates });
}

// ── Group ─────────────────────────────────────────────────────

export async function loadGroupData(groupId) {
  const groupSnap = await getDoc(doc(db, 'groups', groupId));
  const gd        = groupSnap.exists() ? groupSnap.data() : {};
  const goalsSnap = await getDocs(collection(db, 'groups', groupId, 'goals'));
  const goals     = goalsSnap.docs
    .map(d => ({ ...d.data(), _fsId: d.id }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return {
    name:                    gd.name                    || 'COUPLE',
    members:                 gd.members                 || [],
    pendingInvites:          gd.pendingInvites           || [],
    goals,
    unlockedCombinedBadges:  gd.unlockedCombinedBadges  || [],
    unlockedBalanceBadges:   gd.unlockedBalanceBadges    || [],
    badgeDates:              gd.badgeDates               || {}
  };
}

export async function saveGroupBadges(groupId, combined, balance, dates) {
  await updateDoc(doc(db, 'groups', groupId), {
    unlockedCombinedBadges: combined,
    unlockedBalanceBadges:  balance,
    badgeDates:             dates
  });
}

// ── Partner (read-only) ───────────────────────────────────────

export async function loadPartnerData(partnerUid) {
  const userSnap  = await getDoc(doc(db, 'users', partnerUid));
  const userData  = userSnap.exists() ? userSnap.data() : {};
  const goalsSnap = await getDocs(collection(db, 'users', partnerUid, 'goals'));
  const goals     = goalsSnap.docs
    .map(d => ({ ...d.data(), _fsId: d.id }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return {
    name:           userData.username    || 'PARTNER',
    color:          userData.color       || '#2E7D32',
    goals,
    unlockedBadges: userData.unlockedBadges || [],
    badgeDates:     userData.badgeDates     || {}
  };
}

// ── Batch sync (called by saveData) ──────────────────────────
// Writes all in-memory data to Firestore in one batch per section.

export async function syncAllToFirestore(uid, groupId, data) {
  // Personal goals + badges
  const userBatch = writeBatch(db);
  data.me.goals.forEach(goal => {
    const { _fsId, ...clean } = goal;
    userBatch.set(
      doc(db, 'users', uid, 'goals', String(goal.id)),
      clean,
      { merge: true }
    );
  });
  userBatch.update(doc(db, 'users', uid), {
    unlockedBadges: data.me.unlockedBadges || [],
    badgeDates:     data.me.badgeDates     || {}
  });
  await userBatch.commit();

  // Couple goals + badges
  if (groupId && data.together) {
    const groupBatch = writeBatch(db);
    data.together.goals.forEach(goal => {
      const { _fsId, ...clean } = goal;
      groupBatch.set(
        doc(db, 'groups', groupId, 'goals', String(goal.id)),
        clean,
        { merge: true }
      );
    });
    groupBatch.update(doc(db, 'groups', groupId), {
      unlockedCombinedBadges: data.together.unlockedCombinedBadges || [],
      unlockedBalanceBadges:  data.together.unlockedBalanceBadges  || [],
      badgeDates:             data.together.badgeDates             || {}
    });
    await groupBatch.commit();
  }
}

// ── Single-goal helpers (used by CRUD in later phases) ────────

export async function saveUserGoal(uid, goal) {
  const { _fsId, ...clean } = goal;
  await setDoc(
    doc(db, 'users', uid, 'goals', String(goal.id)),
    clean,
    { merge: true }
  );
}

export async function deleteUserGoal(uid, goalId) {
  await deleteDoc(doc(db, 'users', uid, 'goals', String(goalId)));
}

export async function saveGroupGoal(groupId, goal) {
  const { _fsId, ...clean } = goal;
  await setDoc(
    doc(db, 'groups', groupId, 'goals', String(goal.id)),
    clean,
    { merge: true }
  );
}

export async function deleteGroupGoal(groupId, goalId) {
  await deleteDoc(doc(db, 'groups', groupId, 'goals', String(goalId)));
}
