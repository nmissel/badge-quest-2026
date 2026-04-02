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

// ── Hero screen ────────────────────────────────────────────
let _heroTimeouts = [];
function _ht(fn, ms) { _heroTimeouts.push(setTimeout(fn, ms)); }
function _clearHeroTimeouts() { _heroTimeouts.forEach(clearTimeout); _heroTimeouts = []; }

// ── Hero audio (Web Audio API, no files needed) ─────────────
let _heroAudio = null;
function _sfx(notes) {
  try {
    if (!_heroAudio) _heroAudio = new (window.AudioContext || window.webkitAudioContext)();
    if (_heroAudio.state === 'suspended') _heroAudio.resume();
    notes.forEach(([freq, dur, type, vol, delay]) => {
      const osc = _heroAudio.createOscillator();
      const gain = _heroAudio.createGain();
      osc.connect(gain); gain.connect(_heroAudio.destination);
      osc.type = type; osc.frequency.value = freq;
      const t = _heroAudio.currentTime + (delay || 0);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  } catch (_) {}
}

function _sfxOpenFanfare() {
  _sfx([
    [130,  0.80, 'sine',    0.15, 0.00], // C3 bass rumble
    [392,  0.12, 'square',  0.11, 0.00], // G4
    [494,  0.12, 'square',  0.11, 0.18], // B4
    [659,  0.12, 'square',  0.11, 0.36], // E5
    [784,  0.45, 'square',  0.13, 0.52], // G5 — held
  ]);
}
function _sfxHeroIn() {
  _sfx([
    [523,  0.08, 'square', 0.12, 0.00], // C5
    [659,  0.08, 'square', 0.12, 0.09], // E5
    [784,  0.08, 'square', 0.12, 0.18], // G5
    [1047, 0.16, 'square', 0.14, 0.27], // C6
  ]);
}
function _sfxDragonIn() {
  _sfx([
    [311, 0.10, 'square', 0.14, 0.00], // Eb4
    [247, 0.10, 'square', 0.14, 0.12], // B3
    [196, 0.10, 'square', 0.14, 0.24], // G3
    [131, 0.22, 'square', 0.16, 0.36], // C3
    [98,  0.35, 'sine',   0.15, 0.48], // G2 — bass hit
  ]);
}
function _sfxFlash() {
  _sfx([
    [60,   0.55, 'sine',     0.30, 0.00], // bass boom
    [180,  0.30, 'sine',     0.20, 0.00], // mid thud
    [1760, 0.04, 'sawtooth', 0.18, 0.00], // crack
    [440,  0.20, 'sawtooth', 0.12, 0.04], // harsh mid
  ]);
}
function _sfxWindowIn() {
  _sfx([
    [659,  0.20, 'triangle', 0.11, 0.00], // E5
    [988,  0.25, 'triangle', 0.11, 0.16], // B5
    [1319, 0.35, 'triangle', 0.09, 0.34], // E6
  ]);
}

function _generateStars() {
  const bg = document.getElementById('hero-bg');
  if (!bg || bg.querySelector('.hero-star')) return;
  for (let i = 0; i < 55; i++) {
    const s = document.createElement('div');
    s.className = 'hero-star';
    const size = Math.random() > 0.7 ? 3 : 2;
    s.style.cssText = `left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*70).toFixed(1)}%;width:${size}px;height:${size}px;animation-delay:${(Math.random()*4).toFixed(1)}s;animation-duration:${(2+Math.random()*3).toFixed(1)}s`;
    bg.appendChild(s);
  }
}

function _skipHeroToEnd() {
  _clearHeroTimeouts();
  document.getElementById('hero-scene-wrap')?.classList.add('scene-out');
  _showHeroBtn();
}

function _showHeroBtn() {
  const btn = document.getElementById('hero-begin-btn');
  if (!btn || btn.dataset.wired) return;
  btn.dataset.wired = '1';
  document.getElementById('hero-title-wrap')?.classList.add('show');
  _sfxWindowIn();
  document.getElementById('hero-skip-hint').style.display = 'none';
  // Remove the click-to-skip listener and wire the button
  document.getElementById('hero-screen').removeEventListener('click', _skipHeroToEnd);
  btn.addEventListener('click', e => {
    e.stopPropagation();
    sessionStorage.setItem('bq_hero_seen', '1');
    _hideHeroScreen(() => { showAuthOverlay(); goToStep(1); });
  }, { once: true });
}

function _hideHeroScreen(cb) {
  const screen = document.getElementById('hero-screen');
  if (!screen) { cb?.(); return; }
  screen.classList.add('exiting');
  setTimeout(() => {
    screen.style.display = 'none';
    screen.classList.remove('exiting');
    cb?.();
  }, 680);
}

function showHeroScreen() {
  const screen = document.getElementById('hero-screen');
  if (!screen) { showAuthOverlay(); goToStep(1); return; }

  screen.style.display = 'flex';
  _generateStars();

  // Show "CLICK TO BEGIN" immediately — first click unlocks audio
  const hint = document.getElementById('hero-skip-hint');
  if (hint) { hint.style.opacity = '1'; hint.style.animation = 'none'; hint.style.color = 'rgba(255,255,255,0.55)'; hint.style.fontSize = '6px'; }

  screen.addEventListener('click', _startHeroTimeline, { once: true });
}

function _startHeroTimeline() {
  // This runs inside a user gesture — AudioContext is now allowed
  if (!_heroAudio) _heroAudio = new (window.AudioContext || window.webkitAudioContext)();

  // Switch hint to "CLICK TO SKIP" after a moment
  const hint = document.getElementById('hero-skip-hint');
  if (hint) {
    hint.style.opacity = '0';
    hint.textContent = 'CLICK ANYWHERE TO SKIP';
    setTimeout(() => { if (hint.style.display !== 'none') hint.style.opacity = '1'; }, 1200);
  }

  // Allow skip after a short delay (prevent accidental double-click)
  setTimeout(() => {
    document.getElementById('hero-screen')?.addEventListener('click', _skipHeroToEnd, { once: true });
  }, 400);

  // Animation + audio timeline
  _ht(() => _sfxOpenFanfare(), 80);
  _ht(() => document.getElementById('hero-ground')?.classList.add('ground-in'), 600);
  _ht(() => { document.getElementById('hero-sprite-hero')?.classList.add('sprite-in');   _sfxHeroIn();   }, 1200);
  _ht(() => { document.getElementById('hero-sprite-dragon')?.classList.add('sprite-in'); _sfxDragonIn(); }, 2200);

  // Confrontation flash
  _ht(() => { document.getElementById('hero-flash')?.classList.add('flash-on'); _sfxFlash(); }, 4000);
  _ht(() => {
    const f = document.getElementById('hero-flash');
    f?.classList.remove('flash-on');
    f?.classList.add('flash-off');
  }, 4350);

  // XP window fades in over the battle scene
  _ht(_showHeroBtn, 5200);
}

// ── Taskbar clock ──────────────────────────────────────────
let _clockInterval = null;
function startAuthClock() {
  if (_clockInterval) clearInterval(_clockInterval); // prevent accumulating intervals on re-show
  function tick() {
    const el = document.getElementById('auth-clock');
    if (!el) return;
    const now = new Date();
    const h = now.getHours() % 12 || 12;
    const m = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `${h}:${m} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
  }
  tick();
  _clockInterval = setInterval(tick, 10000);
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
      // Show the hero screen once per session, then go straight to auth
      if (!sessionStorage.getItem('bq_hero_seen')) {
        showHeroScreen();
      } else {
        showAuthOverlay();
        goToStep(1);
      }
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
