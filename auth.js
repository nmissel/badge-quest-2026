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
  doc, getDoc, setDoc, updateDoc, serverTimestamp
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

async function saveProfile(uid, username, color, email) {
  await setDoc(doc(db, 'users', uid), {
    username,
    color,
    email:     email || '',
    createdAt: serverTimestamp(),
    groups:    []
  }, { merge: true });
}

// ── Username setup ─────────────────────────────────────────
function initUsernameScreen(user, onReady) {
  showScreen('auth-username-screen');

  // Pre-fill with first name from Google
  const input = document.getElementById('username-input');
  if (user.displayName) input.value = user.displayName.split(' ')[0];

  async function submit() {
    const username  = input.value.trim();
    const errEl     = document.getElementById('username-error');
    const activeCol = document.querySelector('.color-swatch.selected');
    const color     = activeCol ? activeCol.dataset.color : '#cc0000';
    errEl.textContent = '';

    if (username.length < 2) {
      errEl.textContent = 'Must be at least 2 characters.';
      return;
    }
    try {
      await saveProfile(user.uid, username, color, user.email);
      currentProfile = { username, color, email: user.email, groups: [] };
      hideAuthOverlay();
      onReady(user, currentProfile);
    } catch (e) {
      errEl.textContent = 'Could not save. Try again.';
    }
  }

  // Color swatch selection
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
    });
  });

  document.getElementById('username-submit').onclick = submit;
  input.onkeydown = e => { if (e.key === 'Enter') submit(); };
}

// ── Google sign-in ─────────────────────────────────────────
async function signInWithGoogle() {
  document.getElementById('auth-error').textContent = '';
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-cancelled-by-user') {
      // In-app browsers (Messenger, Instagram etc) block popups — fall back to redirect
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr) {
        console.error('❌ Redirect sign-in error:', redirectErr);
        document.getElementById('auth-error').textContent = 'Sign-in failed: ' + redirectErr.message;
      }
    } else {
      console.error('❌ Popup sign-in error:', e);
      document.getElementById('auth-error').textContent = 'Sign-in failed: ' + e.message;
    }
  }
}

// ── Sign out ───────────────────────────────────────────────
export function signOutUser() {
  return signOut(auth);
}

// ── Main init — call once on page load ────────────────────
export function initAuth(onReady) {
  // Handle return from signInWithRedirect (in-app browser fallback)
  getRedirectResult(auth).catch(e => {
    if (e.code && e.code !== 'auth/no-current-user') {
      document.getElementById('auth-error').textContent = 'Sign-in failed: ' + e.message;
    }
  });

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

    let profile = null;
    try {
      profile = await getProfile(user.uid);
    } catch (e) {
      console.error('❌ Firestore read error:', e);
      document.getElementById('auth-error').textContent =
        'Database error: ' + e.message;
      showAuthOverlay();
      showScreen('auth-login-screen');
      return;
    }

    if (!profile?.username) {
      showAuthOverlay();
      initUsernameScreen(user, onReady);
    } else {
      currentProfile = { ...profile, email: user.email };
      // Silently ensure email is stored (needed for invite matching)
      if (!profile.email || profile.email !== user.email) {
        updateDoc(doc(db, 'users', user.uid), { email: user.email }).catch(() => {});
      }
      hideAuthOverlay();
      onReady(user, currentProfile);
    }
  });
}
