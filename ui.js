// ============================================================
//  BADGE QUEST 2026 — UI utilities
//  Audio engine, image resize, confetti, photo viewer,
//  notifications, clock, year widget
// ============================================================

// ── Audio engine (8-bit chiptune) ────────────────────────────
let _audioCtx = null;
function _audio() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

export function playTone(freq, dur, type = 'square', vol = 0.15, delay = 0) {
  try {
    const ctx  = _audio();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.01);
  } catch (_) {}
}

export function sfxClick()        { playTone(440, 0.06, 'square', 0.10); }
export function sfxCount(up)      { playTone(up ? 660 : 400, 0.05, 'square', 0.08); }
export function sfxMonthTick()    { playTone(880, 0.06, 'square', 0.10); }
export function sfxGoalComplete() {
  [[523,0],[659,0.10],[784,0.20],[1047,0.33]].forEach(([f,d]) => playTone(f, 0.20, 'square', 0.22, d));
}
export function sfxBadgeUnlock() {
  [[392,0],[523,0.12],[659,0.25],[784,0.38],[1047,0.52],[1319,0.68]].forEach(([f,d]) => playTone(f, 0.25, 'square', 0.28, d));
}

// ── Image resize (compress before storing in Firestore) ───────
export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 600;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
          else        { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.55));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Confetti ──────────────────────────────────────────────────
export function launchConfetti(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#CC0000','#FFD700','#228B22','#42A5F5','#FF69B4','#FF8C00','#ffffff','#CC00CC','#00CCCC'];
  for (let i = 0; i < 65; i++) {
    const el     = document.createElement('div');
    el.className = 'cpce';
    const color  = colors[Math.floor(Math.random() * colors.length)];
    const size   = 6 + Math.random() * 10;
    el.style.cssText = `left:${Math.random()*100}%;width:${size}px;height:${size}px;background:${color};animation-delay:${Math.random()*0.7}s;animation-duration:${1.4+Math.random()*1.6}s;transform:rotate(${Math.random()*360}deg);border-radius:${Math.random()>0.5?'50%':'0'};`;
    container.appendChild(el);
  }
  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

export function launchShimmer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#FFD700','#E0B0FF','#B0E0FF','#FFB6C1','#FFFFFF','#C8FF80','#FFE680'];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'shimmer-particle';
    const size = 4 + Math.random() * 8;
    el.style.cssText = `left:${Math.random()*100}%;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*0.8}s;animation-duration:${1.2+Math.random()*1.2}s;`;
    container.appendChild(el);
  }
  setTimeout(() => { container.innerHTML = ''; }, 3000);
}

// ── Photo viewer ──────────────────────────────────────────────
export function openPhotoViewer(src) {
  const overlay = document.getElementById('photo-overlay');
  document.getElementById('photo-viewer-img').src = src;
  overlay.style.display = 'flex';
}

export function closePhotoViewer() {
  document.getElementById('photo-overlay').style.display = 'none';
  document.getElementById('photo-viewer-img').src = '';
}

// ── Clock & year widget ───────────────────────────────────────
export function updateClock() {
  const now    = new Date();
  const hh     = String(now.getHours()).padStart(2, '0');
  const mm     = String(now.getMinutes()).padStart(2, '0');
  const clockEl = document.getElementById('clock');
  const dateEl  = document.getElementById('sb-date');
  if (clockEl) clockEl.textContent = `${hh}:${mm}`;
  if (dateEl)  dateEl.textContent  = now.toLocaleDateString('da-DK', { weekday: 'short', day: '2-digit', month: 'short' });
}

export function updateYearWidget() {
  const now      = new Date();
  const start    = new Date('2026-01-01');
  const end      = new Date('2027-01-01');
  const total    = end - start;
  const elapsed  = now - start;
  const pct      = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  const daysEl = document.getElementById('year-days');
  const fillEl = document.getElementById('year-fill');
  const subEl  = document.getElementById('year-sub');
  if (!daysEl) return;
  daysEl.textContent = `${daysLeft} DAYS LEFT`;
  fillEl.style.width = `${pct}%`;
  subEl.textContent  = `Year ${pct}% done`;
}

// ── Notifications ─────────────────────────────────────────────
export function updateNotifBtn() {
  const btn = document.getElementById('notif-btn');
  if (!btn) return;
  if (!('Notification' in window)) { btn.style.display = 'none'; return; }
  if (Notification.permission === 'granted') {
    btn.title   = 'Quest reminders ON';
    btn.style.opacity = '1';
  } else {
    btn.title   = 'Enable quest reminders';
    btn.style.opacity = '0.5';
  }
}

export async function enableNotifications(setStatus) {
  if (!('Notification' in window)) {
    setStatus('NOTIFICATIONS NOT SUPPORTED', 3000); return;
  }
  if (Notification.permission === 'granted') {
    setStatus('REMINDERS ALREADY ON ✓', 2000); return;
  }
  const perm = await Notification.requestPermission();
  updateNotifBtn();
  if (perm === 'granted') {
    setStatus('QUEST REMINDERS ENABLED ✓', 2000);
    new Notification('Badge Quest 2026 🎯', {
      body: "Reminders are on! We'll nudge you if quests go quiet.",
      icon: './icons/icon.svg'
    });
  } else {
    setStatus('NOTIFICATIONS BLOCKED', 2500);
  }
}

export function checkInactivity() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const lastSave = localStorage.getItem('badgequest_lastSave');
  if (!lastSave) return;
  const daysSince = (Date.now() - parseInt(lastSave)) / (1000 * 60 * 60 * 24);
  if (daysSince >= 3) {
    const days = Math.floor(daysSince);
    new Notification('Badge Quest 2026 🎯', {
      body: `${days} days without a quest update — your 2026 goals are waiting!`,
      icon: './icons/icon.svg'
    });
  }
}
