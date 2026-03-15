// ============================================================
//  BADGE QUEST 2026 — app.js
// ============================================================
import { initAuth, signOutUser, currentUser, currentProfile } from './auth.js';
import {
  loadUserData, loadGroupData, loadPartnerData,
  syncAllToFirestore, saveUserGoal, saveGroupGoal
} from './db.js';

const MONTHS = ['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AUG','SEP','OKT','NOV','DEC'];

// ── CHARACTER AVATARS (pixel-art SVG heads) ────────────────────
const SOF_SVG = `<svg class="char-svg" width="18" height="22" viewBox="0 0 18 22" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="3" width="3" height="16" fill="#B82200"/><rect x="14" y="3" width="3" height="16" fill="#B82200"/><rect x="2" y="1" width="14" height="5" fill="#B82200"/><rect x="3" y="5" width="12" height="11" fill="#FACBA0"/><rect x="5" y="8" width="2" height="2" fill="#1A0808"/><rect x="11" y="8" width="2" height="2" fill="#1A0808"/><rect x="6" y="13" width="5" height="1" fill="#C0607A"/><circle cx="16.5" cy="10" r="1.5" fill="#FFD700"/><rect x="7" y="16" width="4" height="2" fill="#FACBA0"/><rect x="4" y="18" width="10" height="1" fill="#5599EE" opacity="0.7"/><rect x="6" y="19" width="6" height="1" fill="#5599EE" opacity="0.6"/></svg>`;

const LAS_SVG = `<svg class="char-svg" width="18" height="22" viewBox="0 0 18 22" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="4" width="3" height="14" fill="#6B3A1F"/><rect x="14" y="4" width="3" height="9" fill="#6B3A1F"/><rect x="2" y="1" width="14" height="7" fill="#6B3A1F"/><rect x="4" y="1" width="10" height="3" fill="#8B4A25"/><rect x="3" y="7" width="12" height="10" fill="#F0C880"/><rect x="5" y="10" width="2" height="2" fill="#1A0808"/><rect x="11" y="10" width="2" height="2" fill="#1A0808"/><rect x="7" y="14" width="4" height="1" fill="#B07850"/><rect x="5" y="15" width="2" height="1" fill="#9A7060" opacity="0.6"/><rect x="8" y="16" width="2" height="1" fill="#9A7060" opacity="0.55"/><rect x="11" y="15" width="2" height="1" fill="#9A7060" opacity="0.6"/><rect x="7" y="17" width="4" height="2" fill="#F0C880"/></svg>`;

// ── DEFAULT DATA ──────────────────────────────────────────────
const DEFAULT_DATA = {
  las: {
    name: 'LAS', color: '#cc0000',
    goals: [
      // ── BINARY GOALS ──
      { id: 1,  title: 'Lancér noget (produkt/idé) sammen med en ven',                                type: 'binary',  done: false, doneDate: null, note: '' },
      { id: 2,  title: 'Brug en hel weekend på at bygge i Cursor/Gemini/Claude',                      type: 'binary',  done: false, doneDate: null, note: '' },
      { id: 3,  title: 'Offentliggør noget du selv har lavet, før det føles klart',                   type: 'binary',  done: false, doneDate: null, note: '' },
      { id: 4,  title: 'Gå én uge uden amerikansk tech (Google, Meta, Apple osv.)',                   type: 'binary',  done: false, doneDate: null, note: '' },
      { id: 5,  title: 'Sov i shelter én nat (alene eller med en ven) 🌲🔥',                          type: 'binary',  done: false, doneDate: null, note: '' },
      { id: 6,  title: 'Få en nostalgisk tatovering',                                                 type: 'binary',  done: false, doneDate: null, note: '' },
      { id: 7,  title: 'Gennemfør Pokémon Yellow på GameBoy Color (8 gym badges + Elite Four)',        type: 'count',   target: 12, current: 0, unit: 'badges', done: false, doneDate: null, note: '' },
      { id: 8,  title: 'Løb CPH Half under 1.45',                                                     type: 'binary',  done: false, doneDate: null, note: '' },
      { id: 9,  title: 'Brug mere tid med dine søskende',                                             type: 'binary',  done: false, doneDate: null, note: '' },
      { id: 10, title: 'Se hele Ringenes Herre + Hobbitten (extended edition ellers tæller det ikke)', type: 'count',   target: 6, current: 0, unit: 'film', done: false, doneDate: null, note: '' },
      { id: 11, title: "Lær det basale i at DJ'e og lav ét 20–30 min sæt 🎧",                        type: 'binary',  done: false, doneDate: null, note: '' },
      { id: 12, title: 'Tag en hel uge fri kun til at skabe eller lege – ikke slappe af',             type: 'binary',  done: false, doneDate: null, note: '' },
      { id: 13, title: 'Kør din første 100 km cykeltur',                                               type: 'binary',  done: false, doneDate: null, note: '' },
      // ── COUNT GOALS ──
      { id: 14, title: 'Spis vegetarisk i 30 dage (lav mindst 10 af måltiderne selv)', type: 'count',   target: 30, current: 0, unit: 'dage',      done: false, doneDate: null, note: '' },
      { id: 15, title: 'Arrangér startup-weekender med kreativ kaos',                   type: 'count',   target:  3, current: 0, unit: 'weekender', done: false, doneDate: null, note: '' },
      { id: 16, title: 'Løb 10 km med en øl pr. km (1 bar pr. km) 🍻',                type: 'binary',  done: false, doneDate: null, note: '' },
      { id: 17, title: 'Solo-ture på din egen tandemcykel',                             type: 'count',   target:  5, current: 0, unit: 'ture',      done: false, doneDate: null, note: '' },
      { id: 18, title: 'Sig "nej" til ting du normalt ville sige "ja" til',             type: 'count',   target: 10, current: 0, unit: "nej'er",    done: false, doneDate: null, note: '' },
      { id: 19, title: 'Følg et træningsprogram i sammenhængende måneder',              type: 'count',   target:  3, current: 0, unit: 'måneder',   done: false, doneDate: null, note: '' },
      { id: 20, title: 'Se fodboldkampe på stadion',                                    type: 'count',   target: 12, current: 0, unit: 'kampe',     done: false, doneDate: null, note: '' },
      { id: 23, title: 'Gaming-date med venner (hver anden uge)',                        type: 'count',   target: 26, current: 0, unit: 'dates',     done: false, doneDate: null, note: '' },
      { id: 24, title: 'Hold en "money date" med dig selv 💸',                          type: 'count',   target:  4, current: 0, unit: 'kvartaler', done: false, doneDate: null, note: '' },
      // ── MONTHLY GOALS (track by individual month) ──
      { id: 21, title: 'Læs 1 bog hver måned',                                          type: 'monthly', months: Array(12).fill(false), done: false, doneDate: null, note: '' },
      { id: 22, title: 'Spar/invester 3.000 DKK pr. måned (mål: 36.000 DKK/år)',       type: 'monthly', months: Array(12).fill(false), done: false, doneDate: null, note: '' },
      { id: 25, title: 'Lav et fysisk minde med dit instant-kamera 📸',                 type: 'monthly', months: Array(12).fill(false), done: false, doneDate: null, note: '' },
    ],
    unlockedBadges: [], badgeDates: {}
  },
  together: { name: 'TOGETHER', color: '#7B2D8B', goals: [
    { id: 1, title: 'Byt lejligheden',                type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 2, title: 'Lang togtur',                    type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 3, title: 'Planlæg Japan (ihvertfald lidt)', type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 4, title: '12 dates: arranger 6 hver',      type: 'count',   target: 12, current: 0, unit: 'dates', done: false, doneDate: null, note: '' },
    { id: 5, title: 'Spise mere hjemmelavet mad',     type: 'monthly', months: Array(12).fill(false), done: false, doneDate: null, note: '' },
    { id: 6, title: 'Mere (spontan) sex',             type: 'monthly', months: Array(12).fill(false), done: false, doneDate: null, note: '' },
    { id: 7, title: 'Læs højt for hinanden',          type: 'monthly', months: Array(12).fill(false), done: false, doneDate: null, note: '' },
  ], unlockedBadges: [], badgeDates: {} },
  sof: { name: 'SOF', color: '#2E7D32', goals: [
    // ── BINARY GOALS ──
    { id: 1,  title: 'Byt lejlighed',                                    type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 2,  title: 'Vær glad for hele mit hjem',                       type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 3,  title: 'Bliv midlevel til boksning',                       type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 4,  title: 'Føle mig stærkere',                                type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 5,  title: 'Bookclub meetup',                                   type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 6,  title: 'Begynd at investere',                              type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 7,  title: 'Spare mere end 65k',                               type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 8,  title: 'Glastatovøren: insta',                             type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 9,  title: 'Glastatovøren: loppemarked',                       type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 10, title: 'Bedre morgenrutine',                               type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 11, title: 'Give flere hjemmelavede gaver',                    type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 12, title: 'Strik noget større',                               type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 13, title: 'Scrolle mindre',                                   type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 14, title: 'Keramikkursus',                                    type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 15, title: 'Closet cleanout',                                  type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 16, title: 'Logbog: køb til migselv',                         type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 17, title: 'Mindre kalender, mere spontanitet',                type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 18, title: 'Husk dage uden planer',                            type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 19, title: 'Hvile mere i mit arbejde',                         type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 20, title: 'Være tro mod mig selv i familierelationer',        type: 'binary',  done: false, doneDate: null, note: '' },
    // ── COUNT GOALS ──
    { id: 21, title: 'Boks 90+ gange',    type: 'count', target: 90, current: 0, unit: 'gange',       done: false, doneDate: null, note: '' },
    { id: 22, title: '5 nye tatoveringer', type: 'count', target:  5, current: 0, unit: 'tatoveringer', done: false, doneDate: null, note: '' },
    { id: 23, title: '10+ koncerter',     type: 'count', target: 10, current: 0, unit: 'koncerter',   done: false, doneDate: null, note: '' },
    // ── MONTHLY GOALS ──
    { id: 24, title: '1 bog om måneden', type: 'monthly', months: Array(12).fill(false), done: false, doneDate: null, note: '' },
    { id: 25, title: 'Fredagsløbeture',  type: 'monthly', months: Array(12).fill(false), done: false, doneDate: null, note: '' },
  ], unlockedBadges: [], badgeDates: {} },
  team: {
    unlockedCombinedBadges: [],
    unlockedBalanceBadges:  [],
    badgeDates: {}
  },
  goalsShuffled: false
};

// ── INDIVIDUAL BADGE DEFINITIONS ─────────────────────────────
const BADGE_DEFS = [
  { id: 0, name: 'BOULDER BADGE', desc: 'Complete your very first quest!',             emoji: '🪨', color: '#9E9E9E', color2: '#424242', shape: 'octagon', threshold: ()  => 1                  },
  { id: 1, name: 'CASCADE BADGE', desc: 'Complete 4 quests — the momentum builds!',    emoji: '💧', color: '#42A5F5', color2: '#0D47A1', shape: 'drop',    threshold: ()  => 4                  },
  { id: 2, name: 'THUNDER BADGE', desc: 'Complete 8 quests — crackling energy!',       emoji: '⚡', color: '#FFEE58', color2: '#E65100', shape: 'star',    threshold: ()  => 8                  },
  { id: 3, name: 'RAINBOW BADGE', desc: 'Halfway there! Keep shining!',                emoji: '🌈', color: '#FF80AB', color2: '#880E4F', shape: 'diamond', threshold: (n) => Math.ceil(n * 0.5) },
  { id: 4, name: 'SOUL BADGE',    desc: 'Complete 16 quests — your spirit is strong!', emoji: '✨', color: '#CE93D8', color2: '#6A1B9A', shape: 'circle',  threshold: ()  => 16                 },
  { id: 5, name: 'MARSH BADGE',   desc: 'Complete 19 quests — deep in the quest!',     emoji: '🌿', color: '#81C784', color2: '#1B5E20', shape: 'hexagon', threshold: ()  => 19                 },
  { id: 6, name: 'VOLCANO BADGE', desc: 'Complete 22 quests — unstoppable!',           emoji: '🌋', color: '#EF5350', color2: '#B71C1C', shape: 'shield',  threshold: ()  => 22                 },
  { id: 7, name: 'EARTH BADGE',   desc: '🏆 ALL quests complete! TRUE CHAMPION!',      emoji: '🏆', color: '#FFD700', color2: '#E65100', shape: 'star6',   threshold: (n) => n                  },
];

// ── TEAM BADGE DEFINITIONS ────────────────────────────────────
// All team badges use UNIQUE shapes not found in individual badges:
// ring, cross, star4, heart, arrow, crown

// Combined: unlock when total done across all tabs hits X
const COMBINED_BADGE_DEFS = [
  { id: 'c0', name: 'STARTER TEAM', desc: "Together you've completed 10 quests!",              color: '#B0C4DE', color2: '#4A6FA5', shape: 'ring',  threshold: ()      => 10   },
  { id: 'c1', name: 'POWER COUPLE', desc: "Together you've completed 30 quests — unstoppable!", color: '#FFD060', color2: '#A86000', shape: 'cross', threshold: ()      => 30   },
  { id: 'c2', name: 'DREAM TEAM',   desc: 'LEGENDARY! Every single quest complete! 🎊',         color: '#FFD700', color2: '#CC4400', shape: 'star4', threshold: (total) => total },
];

// Balance: unlock when BOTH Las AND Sof are each at ≥ X% done
const BALANCE_BADGE_DEFS = [
  { id: 'b0', name: 'IN SYNC',  desc: 'Both of you hit 25%! Matching energy! ⚡',     color: '#64D8FF', color2: '#005A8A', shape: 'heart',  threshold: 25 },
  { id: 'b1', name: 'PARTNERS', desc: 'Both of you hit 50%! Perfect partnership! 💞', color: '#FF8FAB', color2: '#9A0030', shape: 'arrow',  threshold: 50 },
  { id: 'b2', name: 'LEGENDS',  desc: 'Both of you hit 75%! Absolute legends! 👑',    color: '#D070FF', color2: '#5A0090', shape: 'crown',  threshold: 75 },
];

// ── STATE ─────────────────────────────────────────────────────
let currentGroupId = null;
let data = {
  me:       { name: 'ME', color: '#cc0000', goals: [], unlockedBadges: [], badgeDates: {} },
  partner:  null,
  together: { name: 'COUPLE', goals: [], unlockedCombinedBadges: [], unlockedBalanceBadges: [], badgeDates: {} },
  team:     { unlockedCombinedBadges: [], unlockedBalanceBadges: [], badgeDates: {} }
};
let activeTab           = 'all';
let pendingCelebrations = [];
let celebrating         = false;
let expandedMonthGoal   = null; // id of currently expanded monthly goal
let selectedBadge       = null; // { badgeId, tab } — Pokédex detail panel
let _deadlineCtx        = null; // { tab, id } for floating deadline popup
let viewMode            = 'list';  // 'list' | 'card'
let cardIndex           = {};      // { [tab]: number } — current card per tab
let _cardSlideDir       = 'none';  // 'right' | 'left' | 'none' — slide animation direction
let badgeCaseOpen       = false;   // badge case collapsed by default
let _editCtx            = null;    // { tab, goalId } for edit modal, null = new goal
let _swipedItem         = null;    // currently swiped goal item DOM element
let _cardFlipped        = false;   // card showing calendar instead of content
let _calYear            = new Date().getFullYear();
let _calMonth           = new Date().getMonth(); // 0-indexed

// ── AUDIO ENGINE (8-bit chiptune) ─────────────────────────────
let _audioCtx = null;
function _audio() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}
function playTone(freq, dur, type = 'square', vol = 0.15, delay = 0) {
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
function sfxClick()        { playTone(440, 0.06, 'square', 0.10); }
function sfxCount(up)      { playTone(up ? 660 : 400, 0.05, 'square', 0.08); }
function sfxMonthTick()    { playTone(880, 0.06, 'square', 0.10); }
function sfxGoalComplete() {
  [[523,0],[659,0.10],[784,0.20],[1047,0.33]].forEach(([f,d]) => playTone(f, 0.20, 'square', 0.22, d));
}
function sfxBadgeUnlock() {
  [[392,0],[523,0.12],[659,0.25],[784,0.38],[1047,0.52],[1319,0.68]].forEach(([f,d]) => playTone(f, 0.25, 'square', 0.28, d));
}

// ── DEADLINE HELPERS ──────────────────────────────────────────
// Single source of truth for the days calculation used by all deadline functions.
function deadlineDays(goal) {
  if (!goal.deadline || goal.done) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dl    = new Date(goal.deadline + 'T00:00:00');
  return Math.round((dl - today) / (1000 * 60 * 60 * 24));
}

function deadlineUrgency(goal) {
  const days = deadlineDays(goal);
  if (days === null) return null;
  if (days < 0)   return 'overdue';
  if (days <= 14) return 'urgent';
  if (days <= 30) return 'warning';
  if (days <= 60) return 'soon';
  return 'info';
}

function deadlineBadgeHTML(goal) {
  const u = deadlineUrgency(goal);
  if (!u) return '';
  const days  = deadlineDays(goal);
  const label = days < 0  ? `🚨 ${-days}d OVERDUE`
              : days === 0 ? '🚨 DUE TODAY'
              : days === 1 ? '⚡ TOMORROW'
              : `${days}d left`;
  return `<span class="deadline-badge deadline-${u}">${label}</span>`;
}

function showDeadlinePopup(tab, id, btnEl) {
  const goal = data[tab]?.goals?.find(g => g.id === id);
  if (!goal) return;
  _deadlineCtx = { tab, id };
  const popup    = document.getElementById('deadline-popup');
  const input    = document.getElementById('dl-popup-input');
  const clearBtn = document.getElementById('dl-popup-clear');
  input.value = goal.deadline || '';
  input.min   = new Date().toISOString().split('T')[0];
  input.max   = '2026-12-31';
  clearBtn.style.display = goal.deadline ? 'inline-block' : 'none';
  const r = btnEl.getBoundingClientRect();
  popup.style.top  = (r.bottom + 6) + 'px';
  popup.style.left = Math.max(8, r.left - 80) + 'px';
  popup.style.display = 'flex';
}

function hideDeadlinePopup() {
  const p = document.getElementById('deadline-popup');
  if (p) p.style.display = 'none';
  _deadlineCtx = null;
}

function urgentWarningsHTML(tabs) {
  const items = [];
  tabs.forEach(tab => {
    (data[tab]?.goals || []).forEach(g => {
      const u = deadlineUrgency(g);
      if (u === 'urgent' || u === 'overdue') {
        const days   = deadlineDays(g);
        const dayStr = days < 0 ? `${-days}d overdue` : days === 0 ? 'due TODAY' : `${days}d left`;
        const title  = g.title.length > 36 ? g.title.slice(0, 36) + '…' : g.title;
        items.push({ u, title, dayStr });
      }
    });
  });
  if (!items.length) return '';
  const hasOverdue = items.some(x => x.u === 'overdue');
  const rows = items.map(x =>
    `<div class="deadline-warning-item">${x.u === 'overdue' ? '🚨' : '⚡'} ${x.title} — ${x.dayStr}</div>`
  ).join('');
  return `
    <div class="deadline-warning-panel ${hasOverdue ? 'deadline-warning-overdue' : ''}">
      <div class="deadline-warning-title">${hasOverdue ? '🚨 OVERDUE QUESTS' : '⚡ URGENT QUESTS'}</div>
      ${rows}
    </div>`;
}

function setDeadline(tab, id, dateStr) {
  const goal = data[tab].goals.find(g => g.id === id);
  if (!goal) return;
  goal.deadline = dateStr || null;
  hideDeadlinePopup();
  saveData();
  render();
}

// ── IMAGE RESIZE (compress before storing) ────────────────────
function resizeImage(file) {
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

// ── STORAGE ───────────────────────────────────────────────────
function saveData() {
  if (!currentUser) return;
  setStatus('SAVING…');
  syncAllToFirestore(currentUser.uid, currentGroupId, data)
    .then(() => {
      localStorage.setItem('badgequest_lastSave', Date.now().toString());
      setStatus('SAVED ✓', 2000);
    })
    .catch(e => {
      console.error('Save error:', e);
      setStatus('SAVE FAILED!');
    });
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'badge-quest-2026.json'; a.click();
  URL.revokeObjectURL(url);
  setStatus('EXPORTED ✓', 2000);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      data = JSON.parse(e.target.result);
      if (!data.team) data.team = { unlockedCombinedBadges: [], unlockedBalanceBadges: [] };
      localStorage.setItem('badgequest2026', JSON.stringify(data));
      render(); setStatus('LOADED ✓', 2000);
    } catch (_) { setStatus('LOAD FAILED!', 3000); }
  };
  reader.readAsText(file);
}

function setStatus(msg, resetAfter = 0) {
  const el = document.getElementById('sb-text');
  el.textContent = msg;
  if (resetAfter) setTimeout(() => { el.textContent = 'READY TO QUEST'; }, resetAfter);
}

// ── HELPERS ───────────────────────────────────────────────────
function countDone(tab) {
  return data[tab].goals.filter(g => g.done).length;
}

function getPct(tab) {
  const total = data[tab].goals.length;
  if (!total) return 0;
  return Math.round((countDone(tab) / total) * 100);
}

function totalDoneAll() {
  return countDone('me') + countDone('together') + (data.partner ? countDone('partner') : 0);
}

function totalGoalsAll() {
  return data.me.goals.length + data.together.goals.length + (data.partner ? data.partner.goals.length : 0);
}

// ── BADGE LOGIC ───────────────────────────────────────────────
// Badges always reflect current state — they're removed if you un-complete goals.

// Returns which individual badges SHOULD be earned right now
function earnedBadges(tab) {
  const total = data[tab].goals.length;
  const done  = countDone(tab);
  return BADGE_DEFS.filter(b => done >= b.threshold(total));
}

// Silently sync badges to current state (called on un-complete)
function recalcBadges(tab) {
  data[tab].unlockedBadges = earnedBadges(tab).map(b => b.id);
}

// Check for NEWLY earned badges, update stored list, return new ones for celebration
function checkAndAwardBadges(tab) {
  const prev      = data[tab].unlockedBadges || [];
  const nowEarned = earnedBadges(tab);
  const newOnes   = nowEarned.filter(b => !prev.includes(b.id));
  data[tab].unlockedBadges = nowEarned.map(b => b.id);
  if (!data[tab].badgeDates) data[tab].badgeDates = {};
  newOnes.forEach(b => { data[tab].badgeDates[b.id] = new Date().toISOString(); });
  return newOnes;
}

// Returns which team badges SHOULD be earned right now
function earnedTeamBadges() {
  if (!data.team) data.team = { unlockedCombinedBadges: [], unlockedBalanceBadges: [] };
  const totalDone  = totalDoneAll();
  const totalGoals = totalGoalsAll();
  const mePct      = getPct('me');
  const partnerPct = data.partner ? getPct('partner') : 0;
  const combined = COMBINED_BADGE_DEFS.filter(b => totalDone >= b.threshold(totalGoals));
  const balance  = BALANCE_BADGE_DEFS.filter(b => mePct >= b.threshold && partnerPct >= b.threshold);
  return { combined, balance };
}

// Silently sync team badges to current state (called on un-complete)
function recalcTeamBadges() {
  const { combined, balance } = earnedTeamBadges();
  data.team.unlockedCombinedBadges = combined.map(b => b.id);
  data.team.unlockedBalanceBadges  = balance.map(b => b.id);
}

// Check for NEWLY earned team badges, return new ones for celebration
function checkAndAwardTeamBadges() {
  const prevC = data.team?.unlockedCombinedBadges || [];
  const prevB = data.team?.unlockedBalanceBadges  || [];
  const { combined, balance } = earnedTeamBadges();
  const newOnes = [
    ...combined.filter(b => !prevC.includes(b.id)),
    ...balance.filter(b  => !prevB.includes(b.id)),
  ];
  data.team.unlockedCombinedBadges = combined.map(b => b.id);
  data.team.unlockedBalanceBadges  = balance.map(b => b.id);
  if (!data.team.badgeDates) data.team.badgeDates = {};
  newOnes.forEach(b => { data.team.badgeDates[b.id] = new Date().toISOString(); });
  return newOnes;
}

// ── SVG BADGE RENDERER ────────────────────────────────────────
function makeBadgeSVG(badge, size = 52) {
  const { color: c, color2: c2, shape, id } = badge;
  const h = size / 2, r = h - 2;
  const gId = `g${String(id).replace(/[^a-z0-9]/gi,'')}_${size}`;
  let inner = '';

  switch (shape) {
    case 'octagon': {
      const o = size * 0.28;
      inner = `<polygon points="${o},0 ${size-o},0 ${size},${o} ${size},${size-o} ${size-o},${size} ${o},${size} 0,${size-o} 0,${o}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    }
    case 'drop':
      inner = `<path d="M${h} ${size} C${size*0.08} ${size*0.7},${size*0.08} ${size*0.25},${h} 0 C${size*0.92} ${size*0.25},${size*0.92} ${size*0.7},${h} ${size}Z" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    case 'star': {
      const pts = Array.from({length:10}, (_,i) => {
        const rad = i%2===0 ? r : r*0.42;
        const a   = (i*36 - 90) * Math.PI/180;
        return `${h+rad*Math.cos(a)},${h+rad*Math.sin(a)}`;
      });
      inner = `<polygon points="${pts.join(' ')}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    }
    case 'diamond':
      inner = `<polygon points="${h},2 ${size-2},${h} ${h},${size-2} 2,${h}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    case 'circle':
      inner = `<circle cx="${h}" cy="${h}" r="${r}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>
               <circle cx="${h}" cy="${h}" r="${r*0.5}" fill="none" stroke="${c2}" stroke-width="1.5" opacity="0.45"/>`;
      break;
    case 'hexagon': {
      const hpts = Array.from({length:6}, (_,i) => {
        const a = (i*60 - 30) * Math.PI/180;
        return `${h+r*Math.cos(a)},${h+r*Math.sin(a)}`;
      });
      inner = `<polygon points="${hpts.join(' ')}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    }
    case 'shield':
      inner = `<path d="M${h} 0 L${size-2} ${size*0.22} L${size-2} ${size*0.65} L${h} ${size} L2 ${size*0.65} L2 ${size*0.22}Z" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    case 'star6': {
      const s6 = Array.from({length:12}, (_,i) => {
        const rad = i%2===0 ? r : r*0.48;
        const a   = (i*30 - 90) * Math.PI/180;
        return `${h+rad*Math.cos(a)},${h+rad*Math.sin(a)}`;
      });
      inner = `<polygon points="${s6.join(' ')}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    }

    // ── TEAM-ONLY SHAPES (never used for individual badges) ──────
    case 'ring':
      // Donut / ring — silver team badge
      inner = `<circle cx="${h}" cy="${h}" r="${r}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>
               <circle cx="${h}" cy="${h}" r="${r*0.44}" fill="#ECE9D8" stroke="${c2}" stroke-width="1.5"/>`;
      break;

    case 'cross': {
      // Plus / cross sign — power couple badge
      const t = size * 0.28;
      const pts = [
        `${h-t},2`,        `${h+t},2`,
        `${h+t},${h-t}`,   `${size-2},${h-t}`,
        `${size-2},${h+t}`, `${h+t},${h+t}`,
        `${h+t},${size-2}`, `${h-t},${size-2}`,
        `${h-t},${h+t}`,   `2,${h+t}`,
        `2,${h-t}`,         `${h-t},${h-t}`
      ].join(' ');
      inner = `<polygon points="${pts}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    }

    case 'star4': {
      // 4-pointed star burst (✦) — dream team badge
      const pts4 = Array.from({length:8}, (_,i) => {
        const rad = i%2===0 ? r : r*0.32;
        const a   = (i*45 - 90) * Math.PI/180;
        return `${h+rad*Math.cos(a)},${h+rad*Math.sin(a)}`;
      });
      inner = `<polygon points="${pts4.join(' ')}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    }

    case 'heart':
      // Heart — in sync badge
      inner = `<path d="M ${h} ${h+r*0.95}
        C ${h-r*0.45} ${h+r*0.35}, ${2} ${h+r*0.1}, ${2} ${h-r*0.1}
        A ${r*0.58} ${r*0.58} 0 0 1 ${h} ${h-r*0.62}
        A ${r*0.58} ${r*0.58} 0 0 1 ${size-2} ${h-r*0.1}
        C ${size-2} ${h+r*0.1}, ${h+r*0.45} ${h+r*0.35}, ${h} ${h+r*0.95} Z"
        fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;

    case 'arrow': {
      // Right-pointing arrow — partners badge
      const pts5 = [
        `2,${h*0.62}`,         `${size*0.56},${h*0.62}`,
        `${size*0.56},${h*0.28}`, `${size-2},${h}`,
        `${size*0.56},${h*1.72}`, `${size*0.56},${h*1.38}`,
        `2,${h*1.38}`
      ].join(' ');
      inner = `<polygon points="${pts5}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    }

    case 'crown': {
      // Crown with 3 peaks — legends badge
      const baseY = size * 0.70;
      const rimY  = size * 0.82;
      const ptsCr = [
        `2,${size-3}`,        `2,${baseY}`,
        `${h*0.4},${h*0.52}`, `${h*0.28},${baseY}`,
        `${h},${3}`,
        `${h*1.72},${baseY}`, `${h*1.6},${h*0.52}`,
        `${size-2},${baseY}`, `${size-2},${size-3}`
      ].join(' ');
      inner = `<polygon points="${ptsCr}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>
               <rect x="2" y="${rimY}" width="${size-4}" height="${size-3-rimY}" rx="2" fill="${c2}" opacity="0.45"/>`;
      break;
    }

    default:
      inner = `<circle cx="${h}" cy="${h}" r="${r}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
  }

  const shine = `<ellipse cx="${h*0.72}" cy="${h*0.38}" rx="${h*0.18}" ry="${h*0.13}" fill="white" opacity="0.38"/>`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  ${inner}${shine}
</svg>`;
}

function badgeSlotHTML(b, isUnlocked, labelOverride = null, isSelected = false) {
  const label = labelOverride ?? (isUnlocked ? b.name.split(' ')[0] : '?');
  return `
    <div class="badge-slot ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}"
         data-badge-id="${b.id}" title="${b.name}: ${b.desc}">
      <div class="badge-gem ${isUnlocked ? 'unlocked' : 'locked'}">${makeBadgeSVG(b, 52)}</div>
      <div class="badge-label">${label}</div>
    </div>`;
}

// ── GOAL ITEM TEMPLATE ────────────────────────────────────────
// Single source of truth for goal HTML.
// Used by both renderGoalList() (individual tabs) and renderAllTab().
// options.showTag  — show the COUPLE/SOF/LAS owner chip
// options.tagCls / options.tagText — owner chip styling
function goalItemHTML(g, index, tab, options = {}) {
  const { showTag = false, tagCls = '', tagText = '' } = options;
  const num      = String(index + 1).padStart(2, '0');
  const noteHTML = g.done && g.note  ? `<span class="goal-note-text">✎ ${g.note}</span>` : '';
  const photoHTML= g.done && g.photo ? `<img class="goal-photo-thumb" src="${g.photo}" data-photo alt="Memory">` : '';
  const dlBadge  = !g.done ? deadlineBadgeHTML(g) : '';
  const dlBtn    = !g.done ? `<button class="deadline-btn" data-id="${g.id}" data-tab="${tab}" title="Set deadline">📅</button>` : '';
  const tag      = showTag ? `<span class="owner-tag ${tagCls}">${tagText}</span>` : '';
  const ta       = `data-tab="${tab}"`;
  const editable = tab === 'me' || tab === 'together';
  const swipeActions = editable ? `
    <div class="swipe-actions">
      <button class="swipe-edit-btn" data-id="${g.id}" data-tab="${tab}">✎<br><span>EDIT</span></button>
      <button class="swipe-del-btn"  data-id="${g.id}" data-tab="${tab}">🗑<br><span>DEL</span></button>
    </div>` : '';

  const wrap = inner => editable
    ? `<div class="swipe-wrapper">${swipeActions}<div class="swipe-content">${inner}</div></div>`
    : inner;

  if (g.type === 'binary') {
    return wrap(`
      <div class="goal-item goal-binary ${g.done ? 'done' : ''}" data-id="${g.id}">
        <span class="goal-num">${num}</span>
        <div class="goal-title-wrap">
          <span class="goal-title">${g.title}</span>
          ${noteHTML}
        </div>
        <div class="gi-actions">
          ${photoHTML}
          <button class="goal-check" data-id="${g.id}" ${ta} data-type="binary">${g.done ? '✓' : ''}</button>
        </div>
      </div>`);
  }

  if (g.type === 'count') {
    const maxed = g.current >= g.target;
    return wrap(`
      <div class="goal-item count-goal ${g.done ? 'done' : ''}" data-id="${g.id}">
        <span class="goal-num">${num}</span>
        <div class="goal-title-wrap">
          <span class="goal-title">${g.title}</span>
          ${noteHTML}
        </div>
        <div class="gi-actions">
          <div class="gi-count-inline">
            <button class="cnt-btn gi-cnt-btn" data-id="${g.id}" ${ta} data-action="dec" ${g.current===0?'disabled':''}>−</button>
            <span class="gi-count-num ${maxed?'maxed':''}">${g.current}/${g.target}</span>
            <button class="cnt-btn gi-cnt-btn" data-id="${g.id}" ${ta} data-action="inc" ${maxed?'disabled':''}>+</button>
          </div>
          ${photoHTML}
        </div>
      </div>`);
  }

  if (g.type === 'monthly') {
    const checked = g.months.filter(Boolean).length;
    const maxed   = checked >= 12;
    return wrap(`
      <div class="goal-item monthly-goal ${g.done ? 'done' : ''}" data-id="${g.id}">
        <span class="goal-num">${num}</span>
        <div class="goal-title-wrap">
          <span class="goal-title">${g.title}</span>
          ${noteHTML}
        </div>
        <div class="gi-actions">
          <div class="gi-count-inline">
            <button class="cnt-btn gi-cnt-btn" data-id="${g.id}" ${ta} data-action="dec" data-type="monthly" ${checked===0?'disabled':''}>−</button>
            <span class="gi-count-num ${maxed?'maxed':''}">${checked}/12</span>
            <button class="cnt-btn gi-cnt-btn" data-id="${g.id}" ${ta} data-action="inc" data-type="monthly" ${maxed?'disabled':''}>+</button>
          </div>
          ${photoHTML}
        </div>
      </div>`);
  }

  return '';
}

// ── CARD VIEW HELPERS ─────────────────────────────────────────

// Returns a flat array of goals enriched with _tab / _tagCls / _tagText.
// For individual tabs, just wraps each goal; for 'all' flattens all three tabs.
function getCardGoals(tab) {
  if (tab === 'all') {
    return [
      ...data.together.goals.map(g   => ({ ...g, _tab: 'together', _tagCls: 'owner-couple',  _tagText: 'COUPLE'              })),
      ...(data.partner?.goals || []).map(g => ({ ...g, _tab: 'partner',  _tagCls: 'owner-partner', _tagText: (data.partner?.name || 'PARTNER').toUpperCase() })),
      ...data.me.goals.map(g         => ({ ...g, _tab: 'me',       _tagCls: 'owner-me',      _tagText: (data.me?.name || 'ME').toUpperCase()               })),
    ];
  }
  return (data[tab]?.goals || []).map(g => ({ ...g, _tab: tab }));
}

// Navigate the card view by delta (+1 = next, -1 = prev).
function navigateCard(tab, delta) {
  const goals  = getCardGoals(tab);
  const idx    = cardIndex[tab] ?? 0;
  const newIdx = Math.max(0, Math.min(goals.length - 1, idx + delta));
  if (newIdx === idx) return;
  _cardFlipped   = false;
  _cardSlideDir  = delta > 0 ? 'right' : 'left';
  cardIndex[tab] = newIdx;
  sfxClick();
  render();
  _cardSlideDir = 'none'; // reset after synchronous render
}

// Builds the calendar "back face" HTML for the card deadline picker.
function buildCalendarHTML(g, realTab) {
  const MNAMES = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const DNAMES = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  const year  = _calYear, month = _calMonth;
  const first = new Date(year, month, 1).getDay();
  const startCol  = (first + 6) % 7; // Mon-start offset
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selected = g.deadline;

  const dowCells = DNAMES.map(d => `<div class="cal-dow">${d}</div>`).join('');
  let dayCells = '';
  for (let i = 0; i < startCol; i++) dayCells += `<div class="cal-day cal-empty"></div>`;
  for (let d = 1; d <= daysInMon; d++) {
    const ds   = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const date = new Date(year, month, d);
    const past = date < today;
    const sel  = ds === selected;
    const tod  = date.getTime() === today.getTime();
    const cls  = ['cal-day', past ? 'cal-past' : '', sel ? 'cal-selected' : '', tod ? 'cal-today' : ''].filter(Boolean).join(' ');
    const attrs = past ? '' : ` data-cal-date="${ds}" data-id="${g.id}" data-tab="${realTab}"`;
    dayCells += `<div class="${cls}"${attrs}>${d}</div>`;
  }

  const footer = selected
    ? `<button class="cal-clear-btn" data-id="${g.id}" data-tab="${realTab}">✕ CLEAR DATE</button>`
    : `<span class="cal-hint">tap a date to set deadline</span>`;

  return `
    <div class="card-titlebar">
      <div class="card-tb-left">
        <span class="card-tb-icon">📅</span>
        <span class="card-tb-title">SET DEADLINE</span>
      </div>
      <div class="card-tb-right">
        <button class="card-tb-x cal-flip-back">✕</button>
      </div>
    </div>
    <div class="card-calendar-body">
      <div class="cal-nav-row">
        <button class="cal-nav" data-cal-dir="-1">‹</button>
        <span class="cal-month-label">${MNAMES[month]} ${year}</span>
        <button class="cal-nav" data-cal-dir="1">›</button>
      </div>
      <div class="cal-grid">${dowCells}${dayCells}</div>
      <div class="cal-footer">${footer}</div>
    </div>`;
}

// Renders the Pokédex-style card for the current goal in the list.
function renderCardView(goals, tab) {
  if (!goals.length) {
    return `
      <div class="locked-panel">
        <div class="locked-icon">🃏</div>
        <div class="locked-title">NO QUESTS YET</div>
        <div class="locked-sub">Add goals to see them in card view!</div>
      </div>`;
  }

  const idx      = Math.max(0, Math.min(goals.length - 1, cardIndex[tab] ?? 0));
  cardIndex[tab] = idx; // clamp & persist
  const g        = goals[idx];
  const realTab  = g._tab || tab; // actual data tab for event handlers
  const total    = goals.length;

  // Slide animation class (only set during navigateCard calls)
  const slideClass = _cardSlideDir === 'right' ? 'slide-right'
                   : _cardSlideDir === 'left'  ? 'slide-left' : '';

  // Owner tag (visible in ALL tab card view)
  const ownerTag = g._tagText
    ? `<span class="owner-tag ${g._tagCls}" style="font-size:4.5px">${g._tagText}</span>`
    : '';

  // Human-readable type label
  const typeLabel = { binary: 'QUEST', count: 'COUNT', monthly: 'MONTHLY' }[g.type] || g.type.toUpperCase();

  // ── Controls (type-specific) ──────────────────────────────────
  let controlsHTML = '';

  if (g.type === 'binary') {
    if (g.done) {
      controlsHTML = `
        <button class="goal-check card-check-btn card-done-btn" data-id="${g.id}" data-tab="${realTab}" data-type="binary">
          ✓ QUEST COMPLETE!
          <span class="card-btn-sub">tap to undo</span>
        </button>`;
    } else {
      controlsHTML = `
        <button class="goal-check card-check-btn" data-id="${g.id}" data-tab="${realTab}" data-type="binary">
          ◻ MARK AS DONE
        </button>`;
    }
  } else if (g.type === 'count') {
    const maxed = g.current >= g.target;
    const pct   = g.target > 0 ? (g.current / g.target) * 100 : 0;
    controlsHTML = `
      <div class="card-count-row">
        <button class="cnt-btn card-cnt-btn" data-id="${g.id}" data-tab="${realTab}" data-action="dec" ${g.current === 0 ? 'disabled' : ''}>−</button>
        <div class="card-count-bar-wrap">
          <div class="card-count-track">
            <div class="card-count-fill ${maxed ? 'maxed' : ''}" style="width:${pct}%"></div>
          </div>
          <div class="card-count-label">
            <span class="card-count-num ${maxed ? 'maxed' : ''}">${g.current} / ${g.target}</span>
            <span class="card-count-unit">${g.unit}</span>
          </div>
        </div>
        <button class="cnt-btn card-cnt-btn" data-id="${g.id}" data-tab="${realTab}" data-action="inc" ${maxed ? 'disabled' : ''}>+</button>
      </div>`;
  } else if (g.type === 'monthly') {
    const checked = g.months.filter(Boolean).length;
    const maxed   = checked >= 12;
    const cells   = MONTHS.map((m, i) => `
      <div class="month-cell ${g.months[i] ? 'checked' : ''}"
           data-id="${g.id}" data-tab="${realTab}" data-month="${i}">${m}</div>`).join('');
    controlsHTML = `
      <div class="card-monthly-wrap">
        <div class="month-grid card-month-grid">${cells}</div>
        <div class="card-monthly-count">
          <span class="card-monthly-count-label ${maxed ? 'maxed' : ''}">${checked} / 12 mdr.</span>
        </div>
      </div>`;
  }

  // ── Meta (note + photo — deadline has its own bar) ───────────
  const dlBadge  = !g.done ? deadlineBadgeHTML(g) : '';
  const noteHTML = g.done && g.note  ? `<div class="card-note">✎ ${g.note}</div>` : '';
  const photoHTML= g.done && g.photo ? `<img class="card-photo goal-photo-thumb" src="${g.photo}" alt="Memory">` : '';
  const hasMeta  = noteHTML || photoHTML;

  // ── Card inner: normal front or calendar back ─────────────────
  const dlBtnLabel = g.deadline ? g.deadline : 'SET DEADLINE';
  const cardInner = _cardFlipped
    ? buildCalendarHTML(g, realTab)
    : `
        <div class="card-titlebar ${g.done ? 'done' : ''}">
          <div class="card-tb-left">
            <span class="card-tb-icon">🎯</span>
            <span class="card-tb-title">${g.title}</span>
          </div>
          <div class="card-tb-right">
            ${ownerTag}
            <span class="card-type-badge card-type-${g.type}">${typeLabel}</span>
            <button class="card-tb-x" title="Back to list">✕</button>
          </div>
        </div>
        <div class="card-body">
          <div class="card-controls">${controlsHTML}</div>
          ${hasMeta ? `<div class="card-meta">${noteHTML}${photoHTML}</div>` : ''}
        </div>
        ${!g.done ? `
        <div class="card-deadline-bar">
          ${dlBadge}
          <button class="card-dl-btn" data-id="${g.id}" data-tab="${realTab}">📅 ${dlBtnLabel}</button>
        </div>` : ''}`;

  // ── Progress dots (max 40 goals before switching to counter) ──
  const dotsHTML = total <= 40
    ? `<div class="card-dots">
        ${goals.map((gd, i) => `<div class="card-dot ${i === idx ? 'current' : ''} ${gd.done ? 'done' : ''}"
          data-card-dot="${i}" data-card-tab="${tab}" title="Quest ${i + 1}"></div>`).join('')}
      </div>`
    : `<div class="card-counter-text">Quest ${idx + 1} of ${total}</div>`;

  // ── Adjacent goals for peek strips ───────────────────────────
  const prevGoal = idx > 0         ? goals[idx - 1] : null;
  const nextGoal = idx < total - 1 ? goals[idx + 1] : null;
  function peekHtml(adj, navDir) {
    if (!adj) return `<div class="card-side-peek card-side-empty"></div>`;
    return `
      <div class="card-side-peek ${adj.done ? 'done' : ''}" data-nav="${navDir}" data-card-tab="${tab}">
        <div class="peek-inner">
          <span class="card-tb-icon">🎯</span>
          <span class="card-peek-title">${adj.title}</span>
        </div>
        <div class="peek-body"></div>
      </div>`;
  }

  return `
    <div class="card-view">
      <div class="card-carousel">
        ${peekHtml(prevGoal, 'prev')}
        <div class="quest-card ${g.done ? 'done' : ''} ${slideClass} ${_cardFlipped ? 'card-cal-mode' : ''}">
          ${cardInner}
        </div>
        ${peekHtml(nextGoal, 'next')}
      </div>
      ${dotsHTML}
    </div>`;
}

// ── GOAL CRUD ─────────────────────────────────────────────────

function openGoalModal(tab = 'me', goalId = null) {
  const isNew = goalId === null;
  _editCtx = isNew ? null : { tab, goalId };

  document.getElementById('gm-titlebar-text').textContent = isNew ? 'NEW QUEST' : 'EDIT QUEST';
  document.getElementById('gm-delete-btn').style.display  = isNew ? 'none' : 'inline-flex';
  document.getElementById('gm-error').textContent = '';

  // Owner field: always show so user can assign/reassign
  const ownerField  = document.getElementById('gm-owner-field');
  const coupleBtn   = document.getElementById('gm-couple-btn');
  const coupleHint  = document.getElementById('gm-couple-hint');
  const hasGroup    = !!currentGroupId;
  ownerField.style.display  = 'block';
  coupleBtn.disabled        = !hasGroup;
  coupleBtn.style.opacity   = hasGroup ? '1' : '0.45';
  coupleHint.style.display  = hasGroup ? 'none' : 'block';

  if (isNew) {
    document.getElementById('gm-title-input').value = '';
    _setModalType('binary');
    document.getElementById('gm-target').value = '10';
    document.getElementById('gm-unit').value   = '';
    _setModalOwner(tab === 'together' ? 'together' : 'me');
  } else {
    const goal = data[tab].goals.find(g => g.id === goalId);
    if (!goal) return;
    document.getElementById('gm-title-input').value = goal.title;
    _setModalType(goal.type);
    if (goal.type === 'count') {
      document.getElementById('gm-target').value = goal.target ?? 10;
      document.getElementById('gm-unit').value   = goal.unit   ?? '';
    }
    _setModalOwner(tab === 'together' ? 'together' : 'me');
  }

  document.getElementById('goal-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('gm-title-input').focus(), 50);
}

function _setModalType(type) {
  document.querySelectorAll('#gm-type-row .gm-seg').forEach(b =>
    b.classList.toggle('active', b.dataset.type === type)
  );
  document.getElementById('gm-count-fields').style.display = type === 'count' ? 'flex' : 'none';
}

function _setModalOwner(owner) {
  document.querySelectorAll('#gm-owner-row .gm-seg').forEach(b =>
    b.classList.toggle('active', b.dataset.owner === owner)
  );
}

function closeGoalModal() {
  document.getElementById('goal-modal').style.display = 'none';
  _editCtx = null;
}

function saveGoalModal() {
  const title  = document.getElementById('gm-title-input').value.trim();
  const errEl  = document.getElementById('gm-error');
  errEl.textContent = '';
  if (!title) { errEl.textContent = 'Quest title is required.'; return; }

  const type      = document.querySelector('#gm-type-row .gm-seg.active')?.dataset.type  || 'binary';
  const ownerSel  = document.querySelector('#gm-owner-row .gm-seg.active')?.dataset.owner || 'me';
  const newTab    = (ownerSel === 'together' && currentGroupId) ? 'together' : 'me';

  if (_editCtx) {
    // ── Edit existing ──────────────────────────────────────────
    const oldTab = _editCtx.tab;
    const goalId = _editCtx.goalId;
    let goal = data[oldTab].goals.find(g => g.id === goalId);
    if (!goal) return;

    goal.title = title;

    // If type changed, reset progress silently
    if (type !== goal.type) {
      goal.type = type;
      goal.done = false; goal.doneDate = null;
      if (type === 'count')   { goal.target = parseInt(document.getElementById('gm-target').value) || 10; goal.unit = document.getElementById('gm-unit').value.trim() || 'times'; goal.current = 0; delete goal.months; }
      else if (type === 'monthly') { goal.months = Array(12).fill(false); delete goal.target; delete goal.current; delete goal.unit; }
      else                    { delete goal.target; delete goal.current; delete goal.unit; delete goal.months; }
    } else {
      // Same type — just update count fields
      if (type === 'count') {
        goal.target = parseInt(document.getElementById('gm-target').value) || 10;
        goal.unit   = document.getElementById('gm-unit').value.trim() || 'times';
      }
      // Editing a completed goal auto-unmarks it
      if (goal.done) { goal.done = false; goal.doneDate = null; }
    }

    // Owner changed — move goal between tabs
    if (newTab !== oldTab) {
      data[oldTab].goals = data[oldTab].goals.filter(g => g.id !== goalId);
      data[newTab].goals.push(goal);
      recalcBadges(oldTab);
    }
    recalcBadges(newTab);

  } else {
    // ── Create new ─────────────────────────────────────────────
    const goals  = data[newTab].goals;
    const newId  = goals.length > 0 ? Math.max(...goals.map(g => g.id)) + 1 : 1;
    const newGoal = { id: newId, title, type, done: false, doneDate: null, note: '', photo: null, deadline: null, order: goals.length };
    if (type === 'count')        { newGoal.target = parseInt(document.getElementById('gm-target').value) || 10; newGoal.unit = document.getElementById('gm-unit').value.trim() || 'times'; newGoal.current = 0; }
    else if (type === 'monthly') { newGoal.months = Array(12).fill(false); }
    data[newTab].goals.push(newGoal);
  }

  saveData();
  render();
  closeGoalModal();
  sfxClick();
}

function openDeleteConfirm() {
  document.getElementById('delete-overlay').style.display = 'flex';
}

async function executeDelete() {
  if (!_editCtx) return;
  const { tab, goalId } = _editCtx;

  // Delete from Firestore directly (syncAllToFirestore won't remove it)
  if (currentUser) {
    const { deleteUserGoal, deleteGroupGoal } = await import('./db.js');
    if (tab === 'me')                  await deleteUserGoal(currentUser.uid, goalId);
    else if (tab === 'together' && currentGroupId) await deleteGroupGoal(currentGroupId, goalId);
  }

  data[tab].goals = data[tab].goals.filter(g => g.id !== goalId);
  recalcBadges(tab);
  document.getElementById('delete-overlay').style.display = 'none';
  closeGoalModal();
  render();
  sfxClick();
}

function shuffleGoals(tab) {
  const goals = data[tab]?.goals;
  if (!goals || goals.length < 2) return;
  for (let i = goals.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [goals[i], goals[j]] = [goals[j], goals[i]];
  }
  goals.forEach((g, i) => { g.order = i; });
  saveData();
  const list = document.getElementById('goal-list');
  if (list) { list.style.animation = 'none'; list.offsetHeight; list.style.animation = 'shuffle-flash 0.35s ease'; }
  render();
  sfxClick();
}

// ── RENDER ────────────────────────────────────────────────────
function render() {
  if (activeTab === 'all') {
    renderAllTab();
  } else if (activeTab === 'team') {
    renderTeamTab();
  } else {
    ensureWinBodyStructure();
    renderBadgeCase();
    renderProgress();
    renderGoalList();
  }
  updateTitleBarColor();
  updateYearWidget();
}

function ensureWinBodyStructure() {
  const wb = document.getElementById('win-body');
  if (!wb.querySelector('#badge-case')) {
    wb.innerHTML = `
      <div class="inset-panel badge-case-panel">
        <div class="panel-title badge-case-toggle">
          <span>✦ BADGE CASE ✦</span>
          <span class="badge-case-summary" id="badge-case-summary"></span>
          <span class="badge-case-arrow" id="badge-case-arrow">▼</span>
        </div>
        <div id="badge-case-body" style="display:none">
          <div class="badge-case" id="badge-case"></div>
          <div id="badge-detail"></div>
        </div>
      </div>
      <div class="progress-section">
        <span class="prog-label" id="prog-label">QUESTS: 0 / 0</span>
        <div class="prog-track"><div class="prog-fill" id="prog-fill" style="width:0%"></div></div>
        <span class="prog-pct" id="prog-pct">0%</span>
      </div>
      <div class="inset-panel quest-panel">
        <div class="panel-title-row">
          <span class="panel-title">📜 QUEST LOG</span>
          <div class="panel-title-actions">
            ${(activeTab === 'me' || activeTab === 'together') ? `
              <button class="shuffle-btn" id="shuffle-btn" title="Shuffle quest order">🔀</button>
              <button class="add-quest-btn" id="add-quest-btn" title="Add new quest">+ NEW</button>
            ` : ''}
            <div class="view-toggle">
              <button class="view-btn ${viewMode === 'list' ? 'active' : ''}" data-view="list" title="List view">☰</button>
              <button class="view-btn ${viewMode === 'card' ? 'active' : ''}" data-view="card" title="Card view">▣</button>
            </div>
          </div>
        </div>
        <div class="goal-list" id="goal-list"></div>
      </div>`;
  }
}

function colorToGradient(hex) {
  // Build an XP-style sweep gradient from a base hex color
  return `linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%),
          linear-gradient(90deg, ${hex}CC 0%, ${hex} 30%, ${hex}FF 50%, ${hex} 70%, ${hex}CC 100%)`;
}

function updateTitleBarColor() {
  const gradients = {
    all:      colorToGradient('#1848BE'),
    together: colorToGradient('#7818BE'),
    team:     colorToGradient('#C88000'),
    me:       colorToGradient(data.me?.color      || '#cc0000'),
    partner:  colorToGradient(data.partner?.color || '#2E7D32'),
  };
  document.getElementById('title-bar').style.background = gradients[activeTab] || gradients.all;
}

function renderBadgeCase() {
  const tab      = activeTab;
  const unlocked = (data[tab]?.unlockedBadges || []);

  // Always update the summary chip and arrow (visible even when collapsed)
  const summaryEl = document.getElementById('badge-case-summary');
  if (summaryEl) summaryEl.textContent = `${unlocked.length} / ${BADGE_DEFS.length}`;
  const arrowEl = document.getElementById('badge-case-arrow');
  if (arrowEl) arrowEl.textContent = badgeCaseOpen ? '▲' : '▼';

  // Show/hide the body
  const bodyEl = document.getElementById('badge-case-body');
  if (bodyEl) bodyEl.style.display = badgeCaseOpen ? '' : 'none';

  if (!badgeCaseOpen) return; // skip rendering badge grids when collapsed

  const container = document.getElementById('badge-case');
  if (!container) return;
  const total = data[tab].goals.length;

  if (total === 0) {
    container.innerHTML = `<div style="font-family:VT323,monospace;font-size:20px;color:#aaa;padding:8px 0;width:100%;text-align:center">Add goals to unlock badges!</div>`;
    renderBadgeDetail();
    return;
  }

  container.innerHTML = BADGE_DEFS.map(b => {
    const isUnlocked = unlocked.includes(b.id);
    const req        = b.threshold(total);
    const isSelected = selectedBadge?.badgeId === b.id && selectedBadge?.tab === tab;
    return badgeSlotHTML(b, isUnlocked, isUnlocked ? b.name.split(' ')[0] : `${req} DONE`, isSelected);
  }).join('');

  renderBadgeDetail();
}

function renderBadgeDetail() {
  const el = document.getElementById('badge-detail');
  if (!el) return;
  if (!selectedBadge) { el.innerHTML = ''; return; }

  const { badgeId, tab } = selectedBadge;
  const b = BADGE_DEFS.find(bd => bd.id === badgeId);
  if (!b) { el.innerHTML = ''; return; }

  const unlocked = (data[tab]?.unlockedBadges || []).includes(badgeId);
  const dateStr  = data[tab]?.badgeDates?.[badgeId];
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const totalGoals = data[tab]?.goals.length || 0;
  const req = b.threshold(totalGoals);

  if (unlocked) {
    el.innerHTML = `
      <div class="badge-detail-card">
        <div class="badge-detail-svg">${makeBadgeSVG(b, 44)}</div>
        <div class="badge-detail-info">
          <div class="badge-detail-name">${b.name}</div>
          <div class="badge-detail-desc">${b.desc}</div>
          <div class="badge-detail-date">${formattedDate ? `✓ Earned ${formattedDate}` : '✓ Earned (date unknown)'}</div>
        </div>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="badge-detail-card locked-detail">
        <div class="badge-detail-svg locked">${makeBadgeSVG(b, 44)}</div>
        <div class="badge-detail-info">
          <div class="badge-detail-name" style="color:#999">???</div>
          <div class="badge-detail-desc" style="color:#888">Requires ${req} quests done</div>
          <div class="badge-detail-date" style="color:#aaa">Keep questing!</div>
        </div>
      </div>`;
  }
}

function renderProgress() {
  const tab   = activeTab;
  const goals = data[tab].goals;
  if (!goals.length) return;
  const done  = countDone(tab);
  const total = goals.length;
  const pct   = Math.round((done / total) * 100);
  document.getElementById('prog-label').textContent = `QUESTS: ${done} / ${total}`;
  document.getElementById('prog-fill').style.width  = `${pct}%`;
  document.getElementById('prog-pct').textContent   = `${pct}%`;
}

function renderGoalList() {
  const tab   = activeTab;
  const goals = data[tab].goals;
  const list  = document.getElementById('goal-list');
  if (!list) return;

  if (!goals.length) {
    const icon  = tab === 'together' ? '💎' : '🌸';
    const label = tab === 'me' ? data.me.name : tab === 'partner' ? (data.partner?.name || 'Partner') : 'Couple';
    list.innerHTML = `
      <div class="locked-panel">
        <div class="locked-icon">${icon}</div>
        <div class="locked-title">${label.toUpperCase()} QUESTS COMING SOON</div>
        <div class="locked-sub">Add goals to unlock this quest board!</div>
      </div>`;
    return;
  }

  const wb = document.getElementById('win-body');
  if (viewMode === 'card') {
    wb?.classList.add('card-mode');
    list.innerHTML = renderCardView(goals.map(g => ({ ...g, _tab: tab })), tab);
  } else {
    wb?.classList.remove('card-mode');
    // All interaction handled by handleWinBodyClick() delegation.
    list.innerHTML = urgentWarningsHTML([tab])
      + goals.map((g, i) => goalItemHTML(g, i, tab)).join('');
  }

  // Keep toggle button active state in sync (structure may have been rebuilt)
  document.querySelectorAll('.view-btn[data-view]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.view === viewMode)
  );
}

// ── ALL TAB RENDER ────────────────────────────────────────────
function renderAllTab() {
  const wb = document.getElementById('win-body');
  wb.className = viewMode === 'card' ? 'win-body card-mode' : 'win-body';

  const allDone  = totalDoneAll();
  const allTotal = totalGoalsAll();
  const allPct   = allTotal ? Math.round((allDone / allTotal) * 100) : 0;

  const toggleBtnsHTML = `
    <div class="view-toggle">
      <button class="view-btn ${viewMode === 'list' ? 'active' : ''}" data-view="list" title="List view">☰</button>
      <button class="view-btn ${viewMode === 'card' ? 'active' : ''}" data-view="card" title="Card view">▣</button>
    </div>`;

  let goalListContent;
  if (viewMode === 'card') {
    goalListContent = renderCardView(getCardGoals('all'), 'all');
  } else {
    const meName      = (data.me?.name      || 'ME').toUpperCase();
    const partnerName = (data.partner?.name || '').toUpperCase();
    const sections = [
      { tab: 'together', label: '💎 COUPLE',      cls: 'couple-header',  tagCls: 'owner-couple',  tagText: 'COUPLE'      },
      ...(data.partner ? [{ tab: 'partner', label: '👤 ' + partnerName, cls: 'partner-header', tagCls: 'owner-partner', tagText: partnerName }] : []),
      { tab: 'me',       label: '👤 ' + meName,   cls: 'me-header',      tagCls: 'owner-me',      tagText: meName        },
    ];

    const goalsHTML = sections.map(sec => {
      const goals = data[sec.tab].goals;
      const done  = countDone(sec.tab);
      const total = goals.length;

      const header = total === 0
        ? `<div class="all-section-header ${sec.cls}">
             <span class="all-section-label">${sec.label}</span>
             <span class="all-section-count">No goals yet</span>
           </div>`
        : `<div class="all-section-header ${sec.cls}">
             <span class="all-section-label">${sec.label}</span>
             <span class="all-section-count">${done} / ${total} done</span>
           </div>`;

      const items = goals.map((g, i) => goalItemHTML(g, i, sec.tab, {
        showTag: true, tagCls: sec.tagCls, tagText: sec.tagText
      })).join('');

      return header + items;
    }).join('');

    goalListContent = urgentWarningsHTML(['me', 'together', ...(data.partner ? ['partner'] : [])]) + goalsHTML;
  }

  wb.innerHTML = `
    <div class="progress-section">
      <span class="prog-label">ALL QUESTS: ${allDone} / ${allTotal || '?'}</span>
      <div class="prog-track"><div class="prog-fill" id="prog-fill" style="width:${allPct}%"></div></div>
      <span class="prog-pct">${allPct}%</span>
    </div>
    <div class="inset-panel quest-panel">
      <div class="panel-title-row">
        <span class="panel-title">📋 ALL QUESTS</span>
        ${toggleBtnsHTML}
      </div>
      <div class="goal-list" id="goal-list">${goalListContent}</div>
    </div>`;
}

// ── PHOTO VIEWER ──────────────────────────────────────────────
function openPhotoViewer(src) {
  const overlay = document.getElementById('photo-overlay');
  document.getElementById('photo-viewer-img').src = src;
  overlay.style.display = 'flex';
}

function closePhotoViewer() {
  document.getElementById('photo-overlay').style.display = 'none';
  document.getElementById('photo-viewer-img').src = '';
}

// ── TEAM TAB RENDER ───────────────────────────────────────────
function renderTeamTab() {
  const wb = document.getElementById('win-body');
  wb.className = 'win-body team-body';

  const meDone      = countDone('me');
  const partnerDone = data.partner ? countDone('partner') : 0;
  const togDone     = countDone('together');
  const allDone     = meDone + partnerDone + togDone;
  const allTotal    = totalGoalsAll();
  const allPct      = allTotal ? Math.round((allDone / allTotal) * 100) : 0;

  const mePct      = getPct('me');
  const partnerPct = data.partner ? getPct('partner') : 0;
  const meName      = data.me?.name    || 'ME';
  const partnerName = data.partner?.name || 'PARTNER';

  const unlockedC = (data.team || {}).unlockedCombinedBadges || [];
  const unlockedB = (data.team || {}).unlockedBalanceBadges  || [];

  wb.innerHTML = `
    <!-- Stats row -->
    <div class="team-stats-row">
      <div class="team-stat-box">
        <span class="team-stat-num">${meDone}</span>
        <span class="team-stat-label">👤 ${meName.toUpperCase()}</span>
      </div>
      <div class="team-stat-box">
        <span class="team-stat-num">${partnerDone}</span>
        <span class="team-stat-label">👤 ${partnerName.toUpperCase()}</span>
      </div>
      <div class="team-stat-box">
        <span class="team-stat-num">${togDone}</span>
        <span class="team-stat-label">💎 TOGETHER</span>
      </div>
      <div class="team-stat-box" style="background:linear-gradient(180deg,#FFFFF0,#FFFCCC);border-color:#C8A800">
        <span class="team-stat-num" style="color:#7A5500">${allDone}</span>
        <span class="team-stat-label">🏆 TOTAL</span>
      </div>
    </div>

    <!-- Combined progress -->
    <div class="team-prog-section">
      <span class="team-prog-label">COMBINED: ${allDone} / ${allTotal || '?'}</span>
      <div class="team-prog-track">
        <div class="team-prog-fill" style="width:${allPct}%"></div>
      </div>
      <span class="team-prog-pct" style="font-family:'Press Start 2P',monospace;font-size:6.5px;color:#5A3800;min-width:36px;text-align:right">${allPct}%</span>
    </div>

    <!-- Combined total badges -->
    <div class="inset-panel team-badge-panel">
      <div class="panel-title">🏅 COMBINED BADGES — unlock by hitting totals together</div>
      <div class="badge-case">
        ${COMBINED_BADGE_DEFS.map(b => {
          const needed = b.threshold(allTotal);
          const unlocked = unlockedC.includes(b.id);
          return badgeSlotHTML(b, unlocked, unlocked ? b.name.split(' ')[0] : `${needed} DONE`);
        }).join('')}
      </div>
    </div>

    <!-- Balance badges -->
    <div class="inset-panel balance-badge-panel">
      <div class="panel-title">⚖️ BALANCE BADGES — unlock when BOTH players hit the same %</div>
      <div style="font-family:VT323,monospace;font-size:16px;color:#555;margin-bottom:8px;padding:0 4px">
        ${meName}: ${mePct}% · ${partnerName}: ${data.partner ? partnerPct + '%' : '(no partner yet)'}
      </div>
      <div class="badge-case">
        ${BALANCE_BADGE_DEFS.map(b => {
          const unlocked = unlockedB.includes(b.id);
          const bothAt   = lasPct >= b.threshold && sofPct >= b.threshold;
          return badgeSlotHTML(b, unlocked, unlocked ? b.name : `BOTH @ ${b.threshold}%`);
        }).join('')}
      </div>
    </div>
  `;

  // Reset win-body class on tab switch away
  wb.className = 'win-body team-body';
}

// ── YEAR COUNTDOWN WIDGET ─────────────────────────────────────
function updateYearWidget() {
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

// ── GOAL INTERACTIONS ─────────────────────────────────────────
function toggleBinary(tab, id) {
  const goal = data[tab].goals.find(g => g.id === id);
  if (!goal) return;

  if (goal.done) {
    // Un-complete: silently recalc badges so they drop if threshold no longer met
    sfxClick();
    goal.done = false; goal.doneDate = null;
    recalcBadges(tab);
    recalcTeamBadges();
    saveData(); render(); return;
  }

  goal.done     = true;
  goal.doneDate = new Date().toISOString();
  pendingCelebrations.push({ type: 'goal', title: goal.title, goalRef: goal, tab });
  if (!celebrating) processCelebrations();
}

function adjustCount(tab, id, delta) {
  const goal = data[tab].goals.find(g => g.id === id);
  if (!goal) return;
  const wasDone = goal.done;
  goal.current  = Math.max(0, Math.min(goal.target, goal.current + delta));
  sfxCount(delta > 0);

  const justCompleted = !wasDone && goal.current >= goal.target;
  if (justCompleted) { goal.done = true; goal.doneDate = new Date().toISOString(); }

  if (wasDone && goal.current < goal.target) {
    // Un-completing: recalc badges silently
    goal.done = false; goal.doneDate = null;
    recalcBadges(tab);
    recalcTeamBadges();
  }

  saveData(); render();

  if (justCompleted) {
    pendingCelebrations.push({ type: 'goal', title: goal.title, goalRef: goal, tab });
    if (!celebrating) processCelebrations();
  }
}

function adjustMonthly(tab, id, delta) {
  const goal = data[tab].goals.find(g => g.id === id);
  if (!goal || goal.type !== 'monthly') return;
  const wasDone = goal.done;
  if (delta > 0) {
    const idx = goal.months.findIndex(m => !m);
    if (idx === -1) return;
    goal.months[idx] = true;
  } else {
    let lastIdx = -1;
    for (let i = 11; i >= 0; i--) { if (goal.months[i]) { lastIdx = i; break; } }
    if (lastIdx === -1) return;
    goal.months[lastIdx] = false;
  }
  sfxMonthTick();
  const checked = goal.months.filter(Boolean).length;
  const justCompleted = !wasDone && checked >= 12;
  if (justCompleted) { goal.done = true; goal.doneDate = new Date().toISOString(); }
  if (wasDone && checked < 12) {
    goal.done = false; goal.doneDate = null;
    recalcBadges(tab); recalcTeamBadges();
  }
  saveData(); render();
  if (justCompleted) {
    pendingCelebrations.push({ type: 'goal', title: goal.title, goalRef: goal, tab });
    if (!celebrating) processCelebrations();
  }
}

function toggleMonth(tab, id, monthIndex) {
  const goal = data[tab].goals.find(g => g.id === id);
  if (!goal || goal.type !== 'monthly') return;

  const wasDone = goal.done;
  goal.months[monthIndex] = !goal.months[monthIndex];
  sfxMonthTick();
  const checked = goal.months.filter(Boolean).length;

  const justCompleted = !wasDone && checked >= 12;
  if (justCompleted) { goal.done = true; goal.doneDate = new Date().toISOString(); }

  if (wasDone && checked < 12) {
    goal.done = false; goal.doneDate = null;
    recalcBadges(tab);
    recalcTeamBadges();
  }

  saveData(); render();

  if (justCompleted) {
    pendingCelebrations.push({ type: 'goal', title: goal.title, goalRef: goal, tab });
    if (!celebrating) processCelebrations();
  }
}

// ── CELEBRATIONS ─────────────────────────────────────────────
function processCelebrations() {
  if (!pendingCelebrations.length) { celebrating = false; return; }
  celebrating = true;
  const next = pendingCelebrations.shift();
  next.type === 'goal' ? showGoalComplete(next) : showBadgeUnlock(next.badge);
}

function showGoalComplete({ title, goalRef, tab }) {
  sfxGoalComplete();
  const overlay      = document.getElementById('goal-overlay');
  const noteInput    = document.getElementById('goal-note-input');
  const photoPreview = document.getElementById('photo-preview');
  const photoInput   = document.getElementById('goal-photo-input');
  const photoBtn     = document.getElementById('photo-btn');

  document.getElementById('goal-text').textContent = `"${title}"`;
  noteInput.value = goalRef.note || '';

  // Pre-populate photo preview if goal already has one
  photoInput.value = '';
  photoBtn.textContent = '📷 Add Photo';
  photoPreview.innerHTML = goalRef.photo
    ? `<img class="popup-photo-preview" src="${goalRef.photo}" alt=""><button class="photo-remove-btn" type="button">✕ Remove</button>`
    : '';

  overlay.style.display = 'flex';
  overlay.classList.add('flash');
  launchConfetti('confetti-1');
  setTimeout(() => overlay.classList.remove('flash'), 500);
  setTimeout(() => noteInput.focus(), 300);

  // Open file picker
  photoBtn.onclick = () => photoInput.click();

  // File selected → resize and preview
  photoInput.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    photoBtn.textContent = '⏳ Compressing...';
    const dataUrl = await resizeImage(file);
    photoPreview.innerHTML = `<img class="popup-photo-preview" src="${dataUrl}" alt=""><button class="photo-remove-btn" type="button">✕ Remove</button>`;
    photoBtn.textContent = '📷 Change Photo';
  };

  // Remove photo (event delegation on preview div)
  photoPreview.onclick = e => {
    if (e.target.classList.contains('photo-remove-btn')) {
      photoPreview.innerHTML = '';
      photoInput.value = '';
      photoBtn.textContent = '📷 Add Photo';
    }
  };

  document.getElementById('goal-ok').onclick = () => {
    goalRef.note  = noteInput.value.trim();
    const previewImg = photoPreview.querySelector('img');
    goalRef.photo = previewImg ? previewImg.src : null;

    const indivBadges = tab !== 'team' ? checkAndAwardBadges(tab) : [];
    const teamBadges  = checkAndAwardTeamBadges();
    saveData();
    render();

    overlay.style.display = 'none';
    photoBtn.textContent = '📷 Add Photo';

    indivBadges.forEach(b => pendingCelebrations.push({ type: 'badge', badge: b }));
    teamBadges.forEach(b  => pendingCelebrations.push({ type: 'badge', badge: b }));
    processCelebrations();
  };
}

function showBadgeUnlock(badge) {
  sfxBadgeUnlock();
  const overlay = document.getElementById('badge-overlay');
  document.getElementById('badge-big').innerHTML         = makeBadgeSVG(badge, 100);
  document.getElementById('badge-popup-name').textContent = badge.name;
  document.getElementById('badge-popup-desc').textContent = badge.desc;
  overlay.style.display = 'flex';
  overlay.classList.add('flash');
  launchConfetti('confetti-2');
  setTimeout(() => overlay.classList.remove('flash'), 500);

  document.getElementById('badge-ok').onclick = () => {
    overlay.style.display = 'none';
    processCelebrations();
  };
}

function launchConfetti(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const colors = ['#CC0000','#FFD700','#228B22','#42A5F5','#FF69B4','#FF8C00','#ffffff','#CC00CC','#00CCCC'];
  for (let i = 0; i < 65; i++) {
    const el    = document.createElement('div');
    el.className = 'cpce';
    const color  = colors[Math.floor(Math.random() * colors.length)];
    const size   = 6 + Math.random() * 10;
    el.style.cssText = `left:${Math.random()*100}%;width:${size}px;height:${size}px;background:${color};animation-delay:${Math.random()*0.7}s;animation-duration:${1.4+Math.random()*1.6}s;transform:rotate(${Math.random()*360}deg);border-radius:${Math.random()>0.5?'50%':'0'};`;
    container.appendChild(el);
  }
  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

// ── TABS ──────────────────────────────────────────────────────
function switchTab(name) {
  activeTab = name;
  expandedMonthGoal = null;
  selectedBadge = null;
  hideDeadlinePopup();
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));

  // Reset win-body class when switching away from team tab
  const wb = document.getElementById('win-body');
  wb.className = 'win-body';

  render();
}

// ── CLOCK ─────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  document.getElementById('sb-date').textContent =
    now.toLocaleDateString('da-DK', { weekday: 'short', day: '2-digit', month: 'short' });
}

// ── DRAGGABLE (main window + year widget) ─────────────────────
function makeDraggable(handle, target) {
  let dragging = false, sx, sy, sl, st;
  handle.addEventListener('mousedown', e => {
    if (e.target.classList.contains('tbtn')) return;
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    const r = target.getBoundingClientRect();
    sl = r.left; st = r.top;
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    target.style.left = (sl + e.clientX - sx) + 'px';
    target.style.top  = (st + e.clientY - sy) + 'px';
    target.style.right = 'auto'; target.style.bottom = 'auto';
  });
  document.addEventListener('mouseup', () => { dragging = false; document.body.style.userSelect = ''; });
}

// ── EVENT DELEGATION ──────────────────────────────────────────
// Attached once to win-body in init(). Handles all dynamic goal/badge interactions
// so renderGoalList() and renderAllTab() don't need to re-attach handlers every render.
function handleWinBodyClick(e) {

  // Swipe edit button
  const swipeEdit = e.target.closest('.swipe-edit-btn');
  if (swipeEdit) {
    openGoalModal(swipeEdit.dataset.tab, parseInt(swipeEdit.dataset.id));
    return;
  }

  // Swipe delete button
  const swipeDel = e.target.closest('.swipe-del-btn');
  if (swipeDel) {
    _editCtx = { tab: swipeDel.dataset.tab, goalId: parseInt(swipeDel.dataset.id) };
    openDeleteConfirm();
    return;
  }

  // + NEW QUEST button
  if (e.target.closest('#add-quest-btn')) {
    openGoalModal(activeTab === 'together' ? 'together' : 'me');
    return;
  }

  // Shuffle button
  if (e.target.closest('#shuffle-btn')) {
    shuffleGoals(activeTab);
    return;
  }

  // Badge case collapse toggle
  const badgeCaseToggle = e.target.closest('.badge-case-toggle');
  if (badgeCaseToggle) {
    badgeCaseOpen = !badgeCaseOpen;
    renderBadgeCase();
    return;
  }

  // Peek card tap — navigate to adjacent card
  const peekCard = e.target.closest('.card-side-peek[data-nav]');
  if (peekCard) {
    navigateCard(peekCard.dataset.cardTab, peekCard.dataset.nav === 'next' ? 1 : -1);
    return;
  }

  // Card titlebar close (✕) → switch back to list
  if (e.target.closest('.card-tb-x')) {
    viewMode = 'list';
    render();
    return;
  }

  // View mode toggle (☰ list / ▣ card)
  const viewBtn = e.target.closest('.view-btn[data-view]');
  if (viewBtn) {
    viewMode = viewBtn.dataset.view;
    render();
    return;
  }

  // Card navigation (PREV / NEXT buttons)
  const cardNavBtn = e.target.closest('.card-nav-btn');
  if (cardNavBtn) {
    const tab   = cardNavBtn.dataset.cardTab;
    const delta = cardNavBtn.dataset.nav === 'next' ? 1 : -1;
    navigateCard(tab, delta);
    return;
  }

  // Card dot — jump to specific card
  const cardDot = e.target.closest('.card-dot[data-card-dot]');
  if (cardDot) {
    const tab = cardDot.dataset.cardTab;
    cardIndex[tab] = parseInt(cardDot.dataset.cardDot);
    sfxClick();
    render();
    return;
  }

  // Badge slot (Pokédex) — only inside the individual-tab #badge-case
  const badgeSlot = e.target.closest('.badge-slot');
  if (badgeSlot) {
    if (badgeSlot.closest('#badge-case')) {
      sfxClick();
      const id  = parseInt(badgeSlot.dataset.badgeId);
      const tab = activeTab;
      selectedBadge = (selectedBadge?.badgeId === id && selectedBadge?.tab === tab)
        ? null : { badgeId: id, tab };
      renderBadgeCase();
    }
    return; // swallow click whether handled or not (e.g. team tab badges)
  }

  // Binary goal toggle
  const checkBtn = e.target.closest('.goal-check[data-type="binary"]');
  if (checkBtn) {
    toggleBinary(checkBtn.dataset.tab || activeTab, parseInt(checkBtn.dataset.id));
    return;
  }

  // Count +/− buttons (count goals and monthly goals)
  const cntBtn = e.target.closest('.cnt-btn');
  if (cntBtn) {
    const tab   = cntBtn.dataset.tab || activeTab;
    const id    = parseInt(cntBtn.dataset.id);
    const delta = cntBtn.dataset.action === 'inc' ? 1 : -1;
    if (cntBtn.dataset.type === 'monthly') {
      adjustMonthly(tab, id, delta);
    } else {
      adjustCount(tab, id, delta);
    }
    return;
  }

  // Month grid cells
  const monthCell = e.target.closest('.month-cell');
  if (monthCell) {
    toggleMonth(
      monthCell.dataset.tab || activeTab,
      parseInt(monthCell.dataset.id),
      parseInt(monthCell.dataset.month)
    );
    return;
  }

  // Monthly expand — title click or count-display click (only monthly ones have data-id)
  const expandEl = e.target.closest('.monthly-title, .count-display[data-id]');
  if (expandEl) {
    const tab  = expandEl.dataset.tab || activeTab;
    const goal = data[tab]?.goals.find(g => g.id === parseInt(expandEl.dataset.id));
    if (goal?.type === 'monthly') {
      const key = `${tab}-${goal.id}`;
      expandedMonthGoal = expandedMonthGoal === key ? null : key;
      render();
    }
    return;
  }

  // Photo thumbnail
  const photoThumb = e.target.closest('.goal-photo-thumb');
  if (photoThumb) {
    openPhotoViewer(photoThumb.src);
    return;
  }

  // Deadline calendar button (list view — floating popup)
  const deadlineBtn = e.target.closest('.deadline-btn');
  if (deadlineBtn) {
    e.stopPropagation();
    showDeadlinePopup(
      deadlineBtn.dataset.tab || activeTab,
      parseInt(deadlineBtn.dataset.id),
      deadlineBtn
    );
    return;
  }

  // Card deadline button → flip card to calendar
  if (e.target.closest('.card-dl-btn')) {
    const today = new Date();
    _calYear    = today.getFullYear();
    _calMonth   = today.getMonth();
    _cardFlipped = true;
    render();
    return;
  }

  // Calendar back button (✕)
  if (e.target.closest('.cal-flip-back')) {
    _cardFlipped = false;
    render();
    return;
  }

  // Calendar month nav (‹ ›)
  const calNav = e.target.closest('.cal-nav');
  if (calNav) {
    _calMonth += parseInt(calNav.dataset.calDir);
    if (_calMonth > 11) { _calMonth = 0; _calYear++; }
    if (_calMonth < 0)  { _calMonth = 11; _calYear--; }
    render();
    return;
  }

  // Calendar day select
  const calDay = e.target.closest('[data-cal-date]');
  if (calDay && !calDay.classList.contains('cal-past')) {
    setDeadline(calDay.dataset.tab || activeTab, parseInt(calDay.dataset.id), calDay.dataset.calDate);
    _cardFlipped = false;
    return; // setDeadline already calls render()
  }

  // Calendar clear date
  const calClear = e.target.closest('.cal-clear-btn');
  if (calClear) {
    setDeadline(calClear.dataset.tab || activeTab, parseInt(calClear.dataset.id), null);
    _cardFlipped = false;
    return;
  }
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  // Single delegated handler for all goal + badge interactions inside win-body
  document.getElementById('win-body').addEventListener('click', handleWinBodyClick);

  // Tabs
  document.querySelectorAll('.tab').forEach(t =>
    t.addEventListener('click', () => switchTab(t.dataset.tab))
  );

  // Save / Load
  document.getElementById('save-btn').addEventListener('click', exportJSON);
  document.getElementById('load-btn').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('file-input').addEventListener('change', e => {
    if (e.target.files[0]) { importJSON(e.target.files[0]); e.target.value = ''; }
  });

  // Allow Enter to submit note
  document.getElementById('goal-note-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('goal-ok').click();
  });

  // Photo viewer close
  document.getElementById('photo-close').addEventListener('click', closePhotoViewer);
  document.getElementById('photo-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('photo-overlay')) closePhotoViewer();
  });

  // Deadline floating popup
  document.getElementById('dl-popup-input').addEventListener('change', e => {
    if (_deadlineCtx) setDeadline(_deadlineCtx.tab, _deadlineCtx.id, e.target.value);
  });
  document.getElementById('dl-popup-clear').addEventListener('click', () => {
    if (_deadlineCtx) setDeadline(_deadlineCtx.tab, _deadlineCtx.id, null);
  });
  document.getElementById('dl-popup-cancel').addEventListener('click', hideDeadlinePopup);
  document.addEventListener('click', e => {
    const popup = document.getElementById('deadline-popup');
    if (popup && popup.style.display !== 'none' &&
        !popup.contains(e.target) && !e.target.classList.contains('deadline-btn')) {
      hideDeadlinePopup();
    }
  });

  // Tab labels are set dynamically by updateTabLabels() after auth

  // Swipe support for card view (vertical: swipe up = next, swipe down = prev)
  let _touchStartY = 0;
  const wb = document.getElementById('win-body');
  wb.addEventListener('touchstart', e => {
    if (viewMode !== 'card') return;
    _touchStartY = e.touches[0].clientY;
  }, { passive: true });
  wb.addEventListener('touchend', e => {
    if (viewMode !== 'card') return;
    const dy = e.changedTouches[0].clientY - _touchStartY;
    if (Math.abs(dy) > 50) navigateCard(activeTab, dy > 0 ? -1 : 1);
  }, { passive: true });

  // Keyboard arrow keys for card view (up/down)
  document.addEventListener('keydown', e => {
    if (viewMode !== 'card') return;
    if (e.key === 'ArrowUp')   navigateCard(activeTab, -1);
    if (e.key === 'ArrowDown') navigateCard(activeTab,  1);
  });

  // ── Goal modal ───────────────────────────────────────────────
  document.getElementById('gm-cancel').addEventListener('click', closeGoalModal);
  document.getElementById('gm-save').addEventListener('click', saveGoalModal);
  document.getElementById('gm-delete-btn').addEventListener('click', openDeleteConfirm);
  document.getElementById('goal-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('goal-modal')) closeGoalModal();
  });
  document.getElementById('gm-title-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveGoalModal();
  });

  // Type + owner segment buttons
  document.querySelectorAll('#gm-type-row .gm-seg').forEach(btn =>
    btn.addEventListener('click', () => _setModalType(btn.dataset.type))
  );
  document.querySelectorAll('#gm-owner-row .gm-seg').forEach(btn =>
    btn.addEventListener('click', () => { if (!btn.disabled) _setModalOwner(btn.dataset.owner); })
  );

  // Delete confirm
  document.getElementById('delete-cancel').addEventListener('click', () => {
    document.getElementById('delete-overlay').style.display = 'none';
  });
  document.getElementById('delete-ok').addEventListener('click', executeDelete);

  // ── Swipe gestures (win-body) ────────────────────────────────
  let _swipeStartX = 0, _swipeStartY = 0, _swipeEl = null;
  const wb = document.getElementById('win-body');

  wb.addEventListener('touchstart', e => {
    const wrapper = e.target.closest('.swipe-wrapper');
    if (!wrapper) return;
    _swipeStartX = e.touches[0].clientX;
    _swipeStartY = e.touches[0].clientY;
    _swipeEl     = wrapper;
  }, { passive: true });

  wb.addEventListener('touchmove', e => {
    if (!_swipeEl) return;
    const dx = e.touches[0].clientX - _swipeStartX;
    const dy = e.touches[0].clientY - _swipeStartY;
    if (Math.abs(dy) > Math.abs(dx)) { _swipeEl = null; return; }
    if (dx < -8) e.preventDefault();
  }, { passive: false });

  wb.addEventListener('touchend', e => {
    if (!_swipeEl) return;
    const dx = e.changedTouches[0].clientX - _swipeStartX;
    const el = _swipeEl;
    _swipeEl = null;
    if (dx < -55) {
      if (_swipedItem && _swipedItem !== el) _swipedItem.classList.remove('revealed');
      el.classList.add('revealed');
      _swipedItem = el;
    } else if (dx > 20) {
      el.classList.remove('revealed');
      if (_swipedItem === el) _swipedItem = null;
    }
  }, { passive: true });

  // Close swipe on tap outside actions
  document.addEventListener('click', e => {
    if (_swipedItem && !e.target.closest('.swipe-actions')) {
      _swipedItem.classList.remove('revealed');
      _swipedItem = null;
    }
  });

  updateClock();
  setInterval(updateClock, 30000);
  render();

  // Notification bell button
  const notifBtn = document.getElementById('notif-btn');
  notifBtn.addEventListener('click', enableNotifications);
  updateNotifBtn();

  // Check inactivity on load (only if permission already granted)
  checkInactivity();
}

// ── PWA: SERVICE WORKER ───────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Silently fails on file:// — works fine once deployed
    });
  });
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
function updateNotifBtn() {
  const btn = document.getElementById('notif-btn');
  if (!('Notification' in window)) { btn.style.display = 'none'; return; }
  if (Notification.permission === 'granted') {
    btn.title = 'Quest reminders ON';
    btn.style.opacity = '1';
  } else {
    btn.title = 'Enable quest reminders';
    btn.style.opacity = '0.5';
  }
}

async function enableNotifications() {
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
      body: 'Reminders are on! We\'ll nudge you if quests go quiet.',
      icon: './icons/icon.svg'
    });
  } else {
    setStatus('NOTIFICATIONS BLOCKED', 2500);
  }
}

function checkInactivity() {
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

// ── Tab label helper ─────────────────────────────────────────
function updateTabLabels() {
  const meTab      = document.getElementById('tab-me');
  const partnerTab = document.getElementById('tab-partner');
  if (meTab) meTab.textContent = '👤 ' + (data.me?.name || 'ME').toUpperCase();
  if (partnerTab) {
    if (data.partner) {
      partnerTab.textContent    = '👤 ' + data.partner.name.toUpperCase();
      partnerTab.style.display  = '';
    } else {
      partnerTab.style.display  = 'none';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth(async (user, profile) => {
    setStatus('LOADING QUESTS…');

    // Load personal goals from Firestore
    data.me = await loadUserData(user.uid);

    // Load group + partner if in a group
    if (profile.groups?.length > 0) {
      currentGroupId  = profile.groups[0];
      const groupData = await loadGroupData(currentGroupId);
      data.together   = groupData;
      const partnerUid = groupData.members.find(uid => uid !== user.uid);
      if (partnerUid) data.partner = await loadPartnerData(partnerUid);
    }

    // Update header + tabs
    document.querySelector('.title-text').textContent =
      `BADGE QUEST — ${profile.username.toUpperCase()}`;
    updateTabLabels();

    init();
  });

  // Sign-out button
  document.getElementById('signout-btn').addEventListener('click', async () => {
    await signOutUser();
  });
});
