// ============================================================
//  BADGE QUEST 2026 — Auth module
// ============================================================
import { auth, db, googleProvider } from './firebase.js';
import {
  signInWithPopup,
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
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    console.error('❌ Popup sign-in error:', e);
    document.getElementById('auth-error').textContent = 'Sign-in failed: ' + e.message;
  }
}

// ── Sign out ───────────────────────────────────────────────
export function signOutUser() {
  return signOut(auth);
}

// ── Main init — call once on page load ────────────────────
export function initAuth(onReady) {
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
    console.log('✅ Signed in as:', user.email);

    let profile = null;
    try {
      console.log('📖 Reading Firestore profile...');
      profile = await getProfile(user.uid);
      console.log('📖 Profile result:', profile);
    } catch (e) {
      console.error('❌ Firestore read error:', e);
      document.getElementById('auth-error').textContent =
        'Database error: ' + e.message;
      showAuthOverlay();
      showScreen('auth-login-screen');
      return;
    }

    if (!profile?.username) {
      console.log('👤 No username yet — showing setup screen');
      showAuthOverlay();
      initUsernameScreen(user, onReady);
    } else {
      console.log('🚀 Profile loaded, entering app');
      currentProfile = profile;
      hideAuthOverlay();
      onReady(user, profile);
    }
  });
}
