// ============================================================
//  BADGE QUEST 2026 — Firestore data layer
// ============================================================
import { db } from './firebase.js';
import {
  doc, collection, getDocs, getDoc,
  setDoc, updateDoc, deleteDoc,
  writeBatch, serverTimestamp,
  query, where, arrayUnion, arrayRemove
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

// ── Group ─────────────────────────────────────────────────────

export async function loadGroupData(groupId) {
  const groupSnap = await getDoc(doc(db, 'groups', groupId));
  const gd        = groupSnap.exists() ? groupSnap.data() : {};
  const goalsSnap = await getDocs(collection(db, 'groups', groupId, 'goals'));
  const goals     = goalsSnap.docs
    .map(d => ({ ...d.data(), _fsId: d.id }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return {
    name:                    gd.name                    || 'PARTY',
    type:                    gd.type                    || 'party',
    members:                 gd.members                 || [],
    memberEmails:            gd.memberEmails             || [],
    pendingInvites:          gd.pendingInvites           || [],
    goals,
    unlockedCombinedBadges:  gd.unlockedCombinedBadges  || [],
    unlockedBalanceBadges:   gd.unlockedBalanceBadges    || [],
    badgeDates:              gd.badgeDates               || {}
  };
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

// ── Saving (called by saveData) ──────────────────────────────
// Each save writes only what changed. Party quests are shared, and each phone holds
// its own copy: writing every quest from that copy (as the app used to) let an old
// copy on one phone undo what the other person had just done, or bring back a quest
// they'd deleted.
//   goal + tab — one quest, all its fields
//   moved      — { tab, id } where a quest that changed boards used to live: removed
//   order      — a board whose quest order changed: only each quest's `order` field
//   seed       — a board that was just filled with starter quests: all of them
// Your own badge fields are written every time (only you ever change them).

const goalsPath = (uid, groupId, tab) =>
  tab === 'me' ? ['users', uid, 'goals'] : (tab === 'together' && groupId) ? ['groups', groupId, 'goals'] : null;

export async function saveChanges(uid, groupId, data, { goal, tab, moved, order, seed } = {}) {
  const batch = writeBatch(db);
  const setGoal = (path, g) => {
    const { _fsId, ...clean } = g;
    batch.set(doc(db, ...path, String(g.id)), clean, { merge: true });
  };

  const goalPath = goal && goalsPath(uid, groupId, tab);
  if (goalPath) setGoal(goalPath, goal);

  const movedPath = moved && goalsPath(uid, groupId, moved.tab);
  if (movedPath) batch.delete(doc(db, ...movedPath, String(moved.id)));

  const seedPath = seed && goalsPath(uid, groupId, seed);
  if (seedPath) data[seed].goals.forEach(g => setGoal(seedPath, g));

  batch.update(doc(db, 'users', uid), {
    unlockedBadges: data.me.unlockedBadges || [],
    badgeDates:     data.me.badgeDates     || {}
  });
  await batch.commit();

  // Order goes quest by quest with update(), not set(): update fails (quietly) for a
  // quest someone else deleted, where set() would bring it back as an empty ghost.
  const orderPath = order && goalsPath(uid, groupId, order);
  if (orderPath) {
    await Promise.all(data[order].goals.map(g =>
      updateDoc(doc(db, ...orderPath, String(g.id)), { order: g.order }).catch(() => {})
    ));
  }
}

// ── Deleting a quest ──────────────────────────────────────────

export async function deleteUserGoal(uid, goalId) {
  await deleteDoc(doc(db, 'users', uid, 'goals', String(goalId)));
}

export async function deleteGroupGoal(groupId, goalId) {
  await deleteDoc(doc(db, 'groups', groupId, 'goals', String(goalId)));
}

// ── Profile ───────────────────────────────────────────────────

export async function saveUserProfile(uid, username, color) {
  await updateDoc(doc(db, 'users', uid), { username, color });
}

// ── Invite management ─────────────────────────────────────────

export async function sendGroupInvite(fromUid, fromEmail, fromUsername, toEmail, groupName, groupType = 'party') {
  const inviteRef = doc(collection(db, 'invites'));
  await setDoc(inviteRef, {
    fromUid,
    fromEmail,
    fromUsername,
    toEmail:   toEmail.toLowerCase().trim(),
    groupName,
    groupType,
    status:    'pending',
    createdAt: serverTimestamp()
  });
  return inviteRef.id;
}

export async function getPendingInvitesForEmail(email) {
  const q    = query(
    collection(db, 'invites'),
    where('toEmail', '==', email.toLowerCase().trim())
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(inv => inv.status === 'pending');
}

export async function getSentInvites(fromUid) {
  const q    = query(collection(db, 'invites'), where('fromUid', '==', fromUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function acceptGroupInvite(inviteId, invite, acceptingUid, acceptingEmail) {
  const groupRef = doc(collection(db, 'groups'));
  const groupId  = groupRef.id;
  const batch    = writeBatch(db);

  batch.set(groupRef, {
    name:                   invite.groupName,
    type:                   invite.groupType || 'party',
    members:                [invite.fromUid, acceptingUid],
    memberEmails:           [invite.fromEmail, acceptingEmail],
    createdAt:              serverTimestamp(),
    unlockedCombinedBadges: [],
    unlockedBalanceBadges:  [],
    badgeDates:             {}
  });
  batch.update(doc(db, 'invites', inviteId), { status: 'accepted', groupId });
  await batch.commit();

  // Update acceptor's own doc first (always allowed — own document)
  await updateDoc(doc(db, 'users', acceptingUid), { groups: arrayUnion(groupId) });
  // Try to update inviter's doc — may fail if Firestore security rules block cross-user writes.
  // If it fails, the group exists and the acceptor is in it, but the inviter's groups[] won't
  // include the new groupId — they won't see the group in their list until a server-side fix.
  try {
    await updateDoc(doc(db, 'users', invite.fromUid), { groups: arrayUnion(groupId) });
  } catch (e) {
    console.warn('⚠️ Could not update inviter groups[] — security rules may block cross-user writes. groupId:', groupId, e);
  }

  return groupId;
}

export async function addGroupToUser(uid, groupId) {
  await updateDoc(doc(db, 'users', uid), { groups: arrayUnion(groupId) });
}

export async function declineGroupInvite(inviteId) {
  await updateDoc(doc(db, 'invites', inviteId), { status: 'declined' });
}

export async function leaveGroup(groupId, uid) {
  await updateDoc(doc(db, 'users', uid),      { groups: arrayRemove(groupId) });
  await updateDoc(doc(db, 'groups', groupId), { members: arrayRemove(uid) });
}

// ── Challenges ────────────────────────────────────────────────

export async function sendChallenge(fromUid, fromName, toUid, questTitle) {
  const ref = doc(collection(db, 'challenges'));
  await setDoc(ref, {
    fromUid, fromName, toUid,
    questTitle,
    status: 'pending',
    createdAt: serverTimestamp()
  });
}

export async function getPendingChallenges(uid) {
  const q = query(
    collection(db, 'challenges'),
    where('toUid', '==', uid),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function dismissChallenge(id) {
  await updateDoc(doc(db, 'challenges', id), { status: 'dismissed' });
}
