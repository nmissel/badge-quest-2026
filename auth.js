// ============================================================
//  BADGE QUEST 2026 — Auth module (Treasure Hunt Wizard)
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

// ── Wizard state ───────────────────────────────────────────
let _wizardStep   = 1;
let _wizardOnReady = null;

// ── Overlay show/hide ──────────────────────────────────────
function showAuthOverlay() {
  document.getElementById('auth-overlay').style.display = 'flex';
  document.querySelector('.app').style.display = 'none';
  startAuthClock();
}

function hideAuthOverlay() {
  document.getElementById('auth-overlay').style.display = 'none';
  document.querySelector('.app').style.display = 'flex';
}

// ── Taskbar clock ──────────────────────────────────────────
function startAuthClock() {
  function tick() {
    const el = document.getElementById('auth-clock');
    if (!el) return;
    const now = new Date();
    const h = now.getHours() % 12 || 12;
    const m = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `${h}:${m} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
  }
  tick();
  setInterval(tick, 10000);
}

// ── Step navigation ────────────────────────────────────────
function goToStep(n) {
  _wizardStep = n;

  // Update step indicators
  document.querySelectorAll('.wizard-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'locked', 'completed');
    if (s < n)  el.classList.add('completed');
    if (s === n) el.classList.add('active');
    if (s > n)  el.classList.add('locked');
  });

  // Update connectors
  document.querySelectorAll('.wizard-connector').forEach(el => {
    const after = parseInt(el.dataset.after);
    el.classList.toggle('passed', after < n);
  });

  // Show correct content
  document.querySelectorAll('.step-content').forEach((el, i) => {
    el.style.display = (i + 1 === n) ? '' : 'none';
  });

  // Update footer buttons
  updateWizardFooter(n);
}

function updateWizardFooter(n) {
  const btns = document.getElementById('wizard-footer-btns');

  if (n === 1 || n === 2) {
    btns.innerHTML = `<button class="auth-nav-btn auth-nav-btn--primary" id="wizard-next-btn">NEXT ▶</button>`;
    document.getElementById('wizard-next-btn').onclick = () => goToStep(n + 1);
  } else if (n === 3) {
    // Sign-in step — no footer next button, sign-in is in content
    btns.innerHTML = '';
  } else if (n === 4) {
    btns.innerHTML = `<button class="auth-nav-btn auth-nav-btn--primary" id="wizard-next-btn">NEXT ▶</button>`;
    document.getElementById('wizard-next-btn').onclick = submitSetup;
  } else if (n === 5) {
    btns.innerHTML = `<button class="auth-nav-btn auth-nav-btn--primary wizard-next-full" id="wizard-begin-btn">⚔️ BEGIN QUEST ▶</button>`;
    document.getElementById('wizard-begin-btn').onclick = () => {
      hideAuthOverlay();
      if (_wizardOnReady && currentUser) _wizardOnReady(currentUser, currentProfile);
    };
  }
}

// ── Setup step (step 4) ────────────────────────────────────
function initSetupStep() {
  const input       = document.getElementById('username-input');
  const previewName = document.getElementById('avatar-preview-name');
  const previewIcon = document.getElementById('avatar-preview-icon');

  if (currentUser?.displayName) {
    input.value = currentUser.displayName.split(' ')[0];
    previewName.textContent = input.value.toUpperCase();
    previewIcon.textContent = input.value.charAt(0).toUpperCase() || '?';
  }

  input.addEventListener('input', () => {
    const val = input.value.trim();
    previewName.textContent = val.toUpperCase() || 'NEW_PLAYER_01';
    previewIcon.textContent = val.charAt(0).toUpperCase() || '?';
  });

  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      previewIcon.style.background = sw.dataset.color;
    });
  });

  input.onkeydown = e => { if (e.key === 'Enter') submitSetup(); };
}

async function submitSetup() {
  const input     = document.getElementById('username-input');
  const errEl     = document.getElementById('username-error');
  const activeCol = document.querySelector('.color-swatch.selected');
  const username  = input.value.trim();
  const color     = activeCol ? activeCol.dataset.color : '#cc0000';
  errEl.textContent = '';

  if (username.length < 2) {
    errEl.textContent = 'Must be at least 2 characters.';
    return;
  }
  try {
    await saveProfile(currentUser.uid, username, color, currentUser.email);
    currentProfile = { username, color, email: currentUser.email, groups: [] };

    // Personalise the X step title
    const titleEl = document.getElementById('begin-title');
    if (titleEl) titleEl.innerHTML = `YOU FOUND IT,<br>${username.toUpperCase()}!`;

    goToStep(5);
  } catch (e) {
    errEl.textContent = 'Could not save. Try again.';
  }
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

// ── Google sign-in ─────────────────────────────────────────
async function signInWithGoogle() {
  document.getElementById('auth-error').textContent = '';
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-cancelled-by-user') {
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
  _wizardOnReady = onReady;

  // Handle return from signInWithRedirect (in-app browser fallback)
  getRedirectResult(auth).catch(e => {
    if (e.code && e.code !== 'auth/no-current-user') {
      document.getElementById('auth-error').textContent = 'Sign-in failed: ' + e.message;
    }
  });

  // Wire Google button and setup step
  document.getElementById('google-signin-btn').addEventListener('click', signInWithGoogle);
  initSetupStep();

  // Watch auth state
  onAuthStateChanged(auth, async user => {
    if (!user) {
      currentUser    = null;
      currentProfile = null;
      showAuthOverlay();
      goToStep(1);
      return;
    }

    currentUser = user;

    let profile = null;
    try {
      profile = await getProfile(user.uid);
    } catch (e) {
      console.error('❌ Firestore read error:', e);
      document.getElementById('auth-error').textContent = 'Database error: ' + e.message;
      showAuthOverlay();
      goToStep(3);
      return;
    }

    if (!profile?.username) {
      // New user — signed in but no profile yet, go to setup
      showAuthOverlay();
      goToStep(4);
    } else {
      // Returning user — go straight to app
      currentProfile = { ...profile, email: user.email };
      if (!profile.email || profile.email !== user.email) {
        updateDoc(doc(db, 'users', user.uid), { email: user.email }).catch(() => {});
      }
      hideAuthOverlay();
      onReady(user, currentProfile);
    }
  });
}
