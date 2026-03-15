// ============================================================
//  BADGE QUEST 2026 — Auth module
// ============================================================
import { auth, db, googleProvider } from './firebase.js';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, getDoc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Exported state ─────────────────────────────────────────
export let currentUser    = null;
export let currentProfile = null;

// ── Screen helpers ─────────────────────────────────────────
function showScreen(id) {
  ['auth-login-screen', 'auth-username-screen'].forEach(s => {
    document.getElementById(s).style.display = s === id ? 'flex' : 'none';
  });
}

function showAuthOverlay() {
  document.getElementById('auth-overlay').style.display = 'flex';
  document.querySelector('.app').style.display = 'none';
}

function hideAuthOverlay() {
  document.getElementById('auth-overlay').style.display = 'none';
  document.querySelector('.app').style.display = 'flex';
}

// ── Firestore helpers ──────────────────────────────────────
async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

async function saveProfile(uid, username) {
  await setDoc(doc(db, 'users', uid), {
    username,
    createdAt: serverTimestamp(),
    groups: []
  }, { merge: true });
}

// ── Username setup ─────────────────────────────────────────
function initUsernameScreen(user, onReady) {
  showScreen('auth-username-screen');

  // Pre-fill with first name from Google
  const input = document.getElementById('username-input');
  if (user.displayName) input.value = user.displayName.split(' ')[0];

  async function submit() {
    const username = input.value.trim();
    const errEl    = document.getElementById('username-error');
    errEl.textContent = '';

    if (username.length < 2) {
      errEl.textContent = 'Must be at least 2 characters.';
      return;
    }
    try {
      await saveProfile(user.uid, username);
      currentProfile = { username, groups: [] };
      hideAuthOverlay();
      onReady(user, currentProfile);
    } catch (e) {
      errEl.textContent = 'Could not save. Try again.';
    }
  }

  document.getElementById('username-submit').onclick = submit;
  input.onkeydown = e => { if (e.key === 'Enter') submit(); };
}

// ── Google sign-in ─────────────────────────────────────────
async function signInWithGoogle() {
  document.getElementById('auth-error').textContent = '';
  try {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider);
    } else {
      await signInWithPopup(auth, googleProvider);
    }
  } catch (e) {
    document.getElementById('auth-error').textContent = 'Sign-in failed. Please try again.';
  }
}

// ── Sign out ───────────────────────────────────────────────
export function signOutUser() {
  return signOut(auth);
}

// ── Main init — call once on page load ────────────────────
export function initAuth(onReady) {
  // Handle mobile redirect (no-op on desktop)
  getRedirectResult(auth).catch(() => {});

  // Wire Google button
  document.getElementById('google-signin-btn').addEventListener('click', signInWithGoogle);

  // Watch auth state
  onAuthStateChanged(auth, async user => {
    if (!user) {
      currentUser    = null;
      currentProfile = null;
      showAuthOverlay();
      showScreen('auth-login-screen');
      return;
    }

    currentUser = user;
    const profile = await getProfile(user.uid);

    if (!profile?.username) {
      showAuthOverlay();
      initUsernameScreen(user, onReady);
    } else {
      currentProfile = profile;
      hideAuthOverlay();
      onReady(user, profile);
    }
  });
}
