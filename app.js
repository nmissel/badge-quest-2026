// ============================================================
//  BADGE QUEST 2026 — app.js
// ============================================================
import { initAuth, signOutUser, currentUser, currentProfile } from './auth.js';
import {
  loadUserData, loadGroupData, loadPartnerData,
  syncAllToFirestore, saveUserGoal, saveGroupGoal,
  getPendingInvitesForEmail, getSentInvites, addGroupToUser
} from './db.js';
import {
  BADGE_DEFS, COMBINED_BADGE_DEFS, BALANCE_BADGE_DEFS, TEAM_BADGE_DEFS,
  SECRET_BADGE_DEFS, checkAndAwardSecretBadge,
  makeBadgeSVG, badgeSlotHTML,
  countDone, getPct, totalDoneAll, totalGoalsAll,
  earnedBadges, recalcBadges, checkAndAwardBadges,
  earnedTeamBadges, recalcTeamBadges, checkAndAwardTeamBadges,
  earnedTeamGroupBadges
} from './badges.js';
import {
  sfxClick, sfxCount, sfxMonthTick, sfxGoalComplete, sfxBadgeUnlock,
  resizeImage, launchConfetti,
  openPhotoViewer, closePhotoViewer,
  updateClock, updateYearWidget,
  enableNotifications, updateNotifBtn, checkInactivity
} from './ui.js';
import {
  initPartners,
  openPartnersPanel, closePartnersPanel,
  handlePartnersClick, handleAcceptInvite, handleDeclineInvite,
  handleSendInvite, renderInviteBanner
} from './partners.js';

const MONTHS = ['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AUG','SEP','OKT','NOV','DEC'];

// Escape user-controlled strings before inserting into innerHTML
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// Block-style progress bar for quest rows (RPG log aesthetic)
const blockBar = (current, target, width = 8) => {
  const filled = target > 0 ? Math.round((current / target) * width) : 0;
  return '█'.repeat(Math.min(filled, width)) + '░'.repeat(Math.max(width - filled, 0));
};

// ── GOAL TYPE REGISTRY ─────────────────────────────────────────
// To add a new goal type: add one entry here. Nothing else to touch.
// Each type defines:
//   label          — display name shown on card type badge
//   modalFields    — (optional) true if the modal shows extra fields (currently only 'count')
//   initialState() — returns type-specific fields to spread onto a new/switched goal
//   updateFields(goal) — updates type-specific fields when editing same type in modal
//   clearFields(goal)  — deletes all type-specific fields (called when switching type)
//   listItemHTML(g, ctx) — renders the list-view item; ctx has: num, ta, noteHTML, photoHTML, wrap
//   cardControlsHTML(g, realTab) — renders the card-view interactive controls
//   applyChange(goal, action) — mutates goal, returns 'complete' | 'uncomplete' | null
const GOAL_TYPES = {

  binary: {
    label: 'QUEST',

    initialState: () => ({}),
    updateFields() {},
    clearFields(goal) { delete goal.target; delete goal.current; delete goal.unit; delete goal.months; },

    listItemHTML(g, { num, ta, wrap, tab }) {
      return wrap(`
        <div class="goal-item goal-binary ${g.done ? 'done' : ''}" data-id="${g.id}" data-tab="${tab}" style="--pct:${g.done ? 100 : 0}%">
          <span class="goal-num">${num}</span>
          <span class="goal-title">${esc(g.title)}</span>
          <div class="goal-action"><span class="goal-progress${g.done ? ' maxed' : ''}">${g.done ? 1 : 0}/1</span></div>
        </div>`);
    },

    cardControlsHTML(g, realTab) {
      return g.done
        ? `<button class="goal-check card-check-btn card-done-btn" data-id="${g.id}" data-tab="${realTab}" data-type="binary">
             ✓ QUEST COMPLETE!
             <span class="card-btn-sub">tap to undo</span>
           </button>`
        : `<button class="goal-check card-check-btn" data-id="${g.id}" data-tab="${realTab}" data-type="binary">
             ◻ MARK AS DONE
           </button>`;
    },

    applyChange(goal, action) {
      if (action.type === 'toggle') {
        if (goal.done) {
          goal.done = false; goal.doneDate = null;
          return 'uncomplete';
        }
        goal.done = true; goal.doneDate = new Date().toISOString();
        return 'complete';
      }
      return null;
    },
  },

  count: {
    label: 'COUNT',
    modalFields: true,

    initialState: () => ({
      target:  parseInt(document.getElementById('gm-target').value) || 10,
      unit:    document.getElementById('gm-unit').value.trim() || 'times',
      current: 0,
    }),
    updateFields(goal) {
      goal.target = parseInt(document.getElementById('gm-target').value) || 10;
      goal.unit   = document.getElementById('gm-unit').value.trim() || 'times';
    },
    clearFields(goal) { delete goal.months; },

    listItemHTML(g, { num, wrap, tab }) {
      const maxed = g.current >= g.target;
      const bar   = blockBar(g.current, g.target);
      return wrap(`
        <div class="goal-item count-goal ${g.done ? 'done' : ''}" data-id="${g.id}" data-tab="${tab}" style="--pct:${g.target > 0 ? Math.round((g.current / g.target) * 100) : 0}%">
          <span class="goal-num">${num}</span>
          <span class="goal-title">${esc(g.title)}</span>
          <div class="goal-action"><span class="goal-progress${maxed ? ' maxed' : ''}">${g.current}/${g.target}</span></div>
        </div>`);
    },

    cardControlsHTML(g, realTab) {
      const maxed = g.current >= g.target;
      const pct   = g.target > 0 ? (g.current / g.target) * 100 : 0;
      return `
        <div class="card-count-row">
          <button class="cnt-btn card-cnt-btn" data-id="${g.id}" data-tab="${realTab}" data-action="dec" ${g.current === 0 ? 'disabled' : ''}>−</button>
          <div class="card-count-bar-wrap">
            <div class="card-count-track">
              <div class="card-count-fill ${maxed ? 'maxed' : ''}" style="width:${pct}%"></div>
            </div>
            <div class="card-count-label">
              <span class="card-count-num ${maxed ? 'maxed' : ''}">${g.current} / ${g.target}</span>
              <span class="card-count-unit">${esc(g.unit)}</span>
            </div>
          </div>
          <button class="cnt-btn card-cnt-btn" data-id="${g.id}" data-tab="${realTab}" data-action="inc" ${maxed ? 'disabled' : ''}>+</button>
        </div>`;
    },

    applyChange(goal, action) {
      if (action.type === 'adjust') {
        const { delta } = action;
        const wasDone   = goal.done;
        goal.current    = Math.max(0, Math.min(goal.target, goal.current + delta));
        sfxCount(delta > 0);
        const justCompleted = !wasDone && goal.current >= goal.target;
        if (justCompleted)                         { goal.done = true;  goal.doneDate = new Date().toISOString(); return 'complete';   }
        if (wasDone && goal.current < goal.target) { goal.done = false; goal.doneDate = null;                    return 'uncomplete'; }
      }
      return null;
    },
  },

  monthly: {
    label: 'MONTHLY',

    initialState: () => ({ months: Array(12).fill(false) }),
    updateFields() {},
    clearFields(goal) { delete goal.target; delete goal.current; delete goal.unit; },

    listItemHTML(g, { num, wrap, tab }) {
      const checked = (g.months || []).filter(Boolean).length;
      return wrap(`
        <div class="goal-item monthly-goal ${g.done ? 'done' : ''}" data-id="${g.id}" data-tab="${tab}" style="--pct:${Math.round((checked / 12) * 100)}%">
          <span class="goal-num">${num}</span>
          <span class="goal-title">${esc(g.title)}</span>
          <div class="goal-action"><span class="goal-progress${checked >= 12 ? ' maxed' : ''}">${checked}/12</span></div>
        </div>`);
    },

    cardControlsHTML(g, realTab) {
      const checked = g.months.filter(Boolean).length;
      const maxed   = checked >= 12;
      const cells   = MONTHS.map((m, i) => `
        <div class="month-cell ${g.months[i] ? 'checked' : ''}"
             data-id="${g.id}" data-tab="${realTab}" data-month="${i}">${m}</div>`).join('');
      return `
        <div class="card-monthly-wrap">
          <div class="month-grid card-month-grid">${cells}</div>
          <div class="card-monthly-count">
            <span class="card-monthly-count-label ${maxed ? 'maxed' : ''}">${checked} / 12 mdr.</span>
          </div>
        </div>`;
    },

    applyChange(goal, action) {
      const wasDone = goal.done;
      if (action.type === 'month') {
        goal.months[action.index] = !goal.months[action.index];
        sfxMonthTick();
      } else if (action.type === 'adjust') {
        const { delta } = action;
        if (delta > 0) {
          const idx = goal.months.findIndex(m => !m);
          if (idx === -1) return null;
          goal.months[idx] = true;
        } else {
          let last = -1;
          for (let i = 11; i >= 0; i--) { if (goal.months[i]) { last = i; break; } }
          if (last === -1) return null;
          goal.months[last] = false;
        }
        sfxMonthTick();
      }
      const checked       = goal.months.filter(Boolean).length;
      const justCompleted = !wasDone && checked >= 12;
      if (justCompleted)             { goal.done = true;  goal.doneDate = new Date().toISOString(); return 'complete';   }
      if (wasDone && checked < 12)   { goal.done = false; goal.doneDate = null;                    return 'uncomplete'; }
      return null;
    },
  },
};

// ── GOAL INTERACTION DISPATCHER ───────────────────────────────
// Single entry point for all goal state changes. Calls the type's
// applyChange(), then handles save/render/badges/celebrations.
function applyGoalInteraction(tab, id, action) {
  if (tab === 'partner') return; // partner goals are read-only
  const goal = data[tab]?.goals.find(g => g.id === id);
  if (!goal) return;
  const typeDef = GOAL_TYPES[goal.type];
  if (!typeDef) return;

  const result = typeDef.applyChange(goal, action);

  if (result === 'uncomplete') {
    recalcBadges(data, tab);
    recalcTeamBadges(data);
    saveData(); render();
  } else if (result === 'complete') {
    // Sink completed goal to bottom of list
    const goals = data[tab].goals;
    const idx = goals.indexOf(goal);
    if (idx !== -1) { goals.splice(idx, 1); goals.push(goal); }
    goals.forEach((g, i) => { g.order = i; });
    // Check badges first so badge unlock fires BEFORE quest complete overlay
    // Only run personal badge check for 'me' — together/team have their own badge logic
    const newIndivBadges = tab === 'me' ? checkAndAwardBadges(data, tab) : [];
    const newTeamBadges  = checkAndAwardTeamBadges(data);
    newIndivBadges.forEach(b => pendingCelebrations.push({ type: 'badge', badge: b }));
    newTeamBadges.forEach(b  => pendingCelebrations.push({ type: 'badge', badge: b }));
    pendingCelebrations.push({ type: 'goal', title: goal.title, goalRef: goal, tab });
    saveData(); render();
    flashGoalRow(goal.id);
    if (!celebrating) processCelebrations();
  } else {
    saveData(); render();
  }
}

function flashGoalRow(goalId) {
  const el = document.querySelector(`.goal-item[data-id="${goalId}"]`);
  if (!el) return;
  el.classList.add('flash-complete');
  el.addEventListener('animationend', () => el.classList.remove('flash-complete'), { once: true });
}

// ── STARTER QUEST PRESETS ─────────────────────────────────────
// Sample goals shown to new users on empty tabs.
// Keys are generic (a / b / party) — not tied to any specific user.
const STARTER_PRESETS = {
  party: { goals: [
    { id: 1, title: 'Byt lejligheden',                type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 2, title: 'Lang togtur',                    type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 3, title: 'Planlæg Japan (ihvertfald lidt)', type: 'binary',  done: false, doneDate: null, note: '' },
    { id: 4, title: '12 dates: arranger 6 hver',      type: 'count',   target: 12, current: 0, unit: 'dates', done: false, doneDate: null, note: '' },
    { id: 5, title: 'Spise mere hjemmelavet mad',     type: 'monthly', months: Array(12).fill(false), done: false, doneDate: null, note: '' },
    { id: 6, title: 'Mere (spontan) sex',             type: 'monthly', months: Array(12).fill(false), done: false, doneDate: null, note: '' },
    { id: 7, title: 'Læs højt for hinanden',          type: 'monthly', months: Array(12).fill(false), done: false, doneDate: null, note: '' },
  ] },
};

// ── STATE ─────────────────────────────────────────────────────
let currentGroupId  = null;
let currentTeamId   = null;  // active team group (for TEAMS tab switcher)
let allGroups       = [];    // [{ id, name, members, ... }] for all user's groups
let _pendingInvites = [];    // invites waiting for this user
let data = {
  me:       { name: 'ME', color: '#cc0000', goals: [], unlockedBadges: [], badgeDates: {} },
  partner:  null,
  together: { name: 'PARTY', goals: [], unlockedCombinedBadges: [], unlockedBalanceBadges: [], badgeDates: {} },
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
let _cardFlipped        = false;   // card showing calendar instead of content
let _calYear            = new Date().getFullYear();
let _calMonth           = new Date().getMonth(); // 0-indexed
let _qdGoal     = null;  // goal currently open in the quest dialog
let _qdTab      = null;  // its data tab
let _qdIdx      = null;  // display index (1-based)
let _qdMetaOpen = false; // whether the DETAILS section is expanded

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
    `<div class="deadline-warning-item">${x.u === 'overdue' ? '🚨' : '⚡'} ${esc(x.title)} — ${x.dayStr}</div>`
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

async function seedGoals(presetKey) {
  const presetMap = {
    party: { tab: 'together', goals: STARTER_PRESETS.party.goals }
  };
  const preset = presetMap[presetKey];
  if (!preset) return;

  setStatus('SEEDING QUESTS…');
  // Stamp order onto goals
  const goalsWithOrder = preset.goals.map((g, i) => ({ ...g, order: i }));
  if (preset.tab === 'me') {
    data.me.goals = goalsWithOrder;
  } else {
    data.together.goals = goalsWithOrder;
  }
  saveData();
  // Reload fresh from Firestore so we get proper _fsId stamps
  if (preset.tab === 'me') {
    data.me = await loadUserData(currentUser.uid);
  } else if (currentGroupId) {
    const gd = await loadGroupData(currentGroupId);
    gd.id    = currentGroupId;
    data.together = gd;
    const idx = allGroups.findIndex(g => g.id === currentGroupId);
    if (idx >= 0) allGroups[idx] = gd;
  }
  setStatus('QUESTS LOADED ✓', 2000);
  render();
}


function setStatus(msg, resetAfter = 0) {
  const el = document.getElementById('sb-text');
  el.textContent = msg;
  if (resetAfter) setTimeout(() => { el.textContent = 'READY TO QUEST'; }, resetAfter);
}


// ── GOAL ITEM TEMPLATE ────────────────────────────────────────
// Single source of truth for goal HTML.
// Used by both renderGoalList() (individual tabs) and renderAllTab().
// options.showTag  — show the owner chip (party / partner / me)
// options.tagCls / options.tagText — owner chip styling
function goalItemHTML(g, index, tab, options = {}) {
  const { showTag = false, tagCls = '', tagText = '' } = options;
  const num      = String(index + 1).padStart(3, '0');
  const noteHTML = g.done && g.note  ? `<span class="goal-note-text">✎ ${esc(g.note)}</span>` : '';
  const photoHTML= g.done && g.photo ? `<img class="goal-photo-thumb" src="${g.photo}" data-photo alt="Memory">` : '';
  const dlBadge  = !g.done ? deadlineBadgeHTML(g) : '';
  const dlBtn    = !g.done ? `<button class="deadline-btn" data-id="${g.id}" data-tab="${tab}" title="Set deadline">📅</button>` : '';
  const tag      = showTag ? `<span class="owner-tag ${tagCls}">${esc(tagText)}</span>` : '';
  const ta       = `data-tab="${tab}"`;
  const wrap = inner => inner;

  const typeDef = GOAL_TYPES[g.type];
  let html = typeDef ? typeDef.listItemHTML(g, { num, ta, noteHTML, photoHTML, wrap, tab }) : '';
  if (tab === 'partner') html = html.replace('class="goal-item ', 'class="goal-item partner-readonly ');
  return html;
}

// ── CARD VIEW HELPERS ─────────────────────────────────────────

// Returns a flat array of goals enriched with _tab / _tagCls / _tagText.
// For individual tabs, just wraps each goal; for 'all' flattens all three tabs.
function getCardGoals(tab) {
  if (tab === 'all') {
    return [
      ...data.together.goals.map(g   => ({ ...g, _tab: 'together', _tagCls: 'owner-party',  _tagText: (data.together?.name || 'PARTY').toUpperCase() })),
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
    ? `<span class="owner-tag ${g._tagCls}" style="font-size:4.5px">${esc(g._tagText)}</span>`
    : '';

  // Human-readable type label
  const typeLabel = GOAL_TYPES[g.type]?.label || g.type.toUpperCase();

  // ── Controls (type-specific) ──────────────────────────────────
  const controlsHTML = GOAL_TYPES[g.type]?.cardControlsHTML(g, realTab) ?? '';

  // ── Meta (note + photo — deadline has its own bar) ───────────
  const dlBadge  = !g.done ? deadlineBadgeHTML(g) : '';
  const noteHTML = g.done && g.note  ? `<div class="card-note">✎ ${esc(g.note)}</div>` : '';
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
            <span class="card-tb-title">${esc(g.title)}</span>
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
  const partyBtn   = document.getElementById('gm-party-btn');
  const partyHint  = document.getElementById('gm-party-hint');
  const hasGroup    = !!currentGroupId;
  ownerField.style.display  = 'block';
  partyBtn.disabled        = !hasGroup;
  partyBtn.style.opacity   = hasGroup ? '1' : '0.45';
  partyHint.style.display  = hasGroup ? 'none' : 'block';

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
  document.getElementById('gm-count-fields').style.display = GOAL_TYPES[type]?.modalFields ? 'flex' : 'none';
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
      Object.values(GOAL_TYPES).forEach(t => t.clearFields(goal));
      Object.assign(goal, GOAL_TYPES[type].initialState());
    } else {
      GOAL_TYPES[type]?.updateFields(goal);
      if (goal.done) { goal.done = false; goal.doneDate = null; }
    }

    // Owner changed — move goal between tabs
    if (newTab !== oldTab) {
      data[oldTab].goals = data[oldTab].goals.filter(g => g.id !== goalId);
      data[newTab].goals.push(goal);
      recalcBadges(data, oldTab);
    }
    recalcBadges(data, newTab);

  } else {
    // ── Create new ─────────────────────────────────────────────
    const goals  = data[newTab].goals;
    if (goals.length >= 25) {
      errEl.textContent = 'Quest log full! Remove a quest to add another (max 25).';
      return;
    }
    const newId  = goals.length > 0 ? Math.max(...goals.map(g => g.id)) + 1 : 1;
    const newGoal = { id: newId, title, type, done: false, doneDate: null, note: '', photo: null, deadline: null, order: goals.length,
                      ...GOAL_TYPES[type].initialState() };
    data[newTab].goals.push(newGoal);

    // Secret badge: fire on very first personal quest ever
    if (newTab === 'me' && data.me.goals.length === 1) {
      const secret = checkAndAwardSecretBadge(data, 's0');
      if (secret) pendingCelebrations.push({ type: 'badge', badge: secret });
    }
  }

  saveData();
  render();
  closeGoalModal();
  if (pendingCelebrations.length && !celebrating) processCelebrations();
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
  recalcBadges(data, tab);
  document.getElementById('delete-overlay').style.display = 'none';
  closeGoalModal();
  render();
}

function shuffleGoals(tab) {
  const goals = data[tab]?.goals;
  if (!goals || goals.length < 2) return;
  // Only shuffle undone — done quests stay pinned at the bottom
  const undone = goals.filter(g => !g.done);
  const done   = goals.filter(g => g.done);
  for (let i = undone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [undone[i], undone[j]] = [undone[j], undone[i]];
  }
  data[tab].goals = [...undone, ...done];
  data[tab].goals.forEach((g, i) => { g.order = i; });
  saveData();
  const list = document.getElementById('goal-list');
  if (list) { list.style.animation = 'none'; list.offsetHeight; list.style.animation = 'shuffle-flash 0.35s ease'; }
  render();
}

// ── RENDER ────────────────────────────────────────────────────
function render() {
  if (activeTab === 'all') {
    renderAllTab();
  } else if (activeTab === 'badges') {
    renderBadgesTab();
  } else if (activeTab === 'teams') {
    renderTeamsTab();
  } else {
    ensureWinBodyStructure();
    renderProgress();
    renderGoalList();
  }
  updateTitleBarColor();
  updateYearWidget();
}

function ensureWinBodyStructure() {
  const wb = document.getElementById('win-body');
  if (!wb.querySelector('#goal-list') || !wb.querySelector('#prog-label')) {
    const groupSwitcherHTML = (activeTab === 'together' && allGroups.length > 1) ? `
      <div class="group-switcher-row">
        <span class="group-switcher-label">GROUP:</span>
        <select class="group-switcher" id="group-switcher">
          ${allGroups.map(g => `<option value="${g.id}" ${g.id === currentGroupId ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}
        </select>
      </div>` : '';

    wb.innerHTML = `
      ${groupSwitcherHTML}
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
          </div>
        </div>
        <div class="goal-list" id="goal-list"></div>
      </div>`;

    // Wire group switcher change event
    const switcher = wb.querySelector('#group-switcher');
    if (switcher) {
      switcher.addEventListener('change', async () => {
        const gid = switcher.value;
        if (gid === currentGroupId) return;
        currentGroupId = gid;
        const groupData = allGroups.find(g => g.id === gid);
        data.together   = groupData || { name: 'PARTY', goals: [], unlockedCombinedBadges: [], unlockedBalanceBadges: [], badgeDates: {} };
        // Load partner for this group
        const partnerUid = (groupData?.members || []).find(uid => uid !== currentUser?.uid);
        data.partner = partnerUid ? await loadPartnerData(partnerUid) : null;
        updateTabLabels();
        // Force structure rebuild on next render
        wb.innerHTML = '';
        render();
      });
    }
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
    teams:    colorToGradient('#C88000'),
    badges:   colorToGradient('#1848BE'),
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
  }).join('') + (tab === 'me' ? SECRET_BADGE_DEFS.filter(b => unlocked.includes(b.id)).map(b => {
    const isSelected = selectedBadge?.badgeId === b.id && selectedBadge?.tab === tab;
    return badgeSlotHTML(b, true, '✦ SECRET', isSelected);
  }).join('') : '');

  renderBadgeDetail();
}

function renderBadgeDetail() {
  const el = document.getElementById('badge-detail');
  if (!el) return;
  if (!selectedBadge) { el.innerHTML = ''; return; }

  const { badgeId, tab } = selectedBadge;
  const b = BADGE_DEFS.find(bd => bd.id === badgeId) || SECRET_BADGE_DEFS.find(bd => bd.id === badgeId);
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
  const goals = data[tab]?.goals || [];
  const done  = goals.length ? countDone(data, tab) : 0;
  const total = goals.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('prog-label').textContent = `QUESTS: ${done} / ${total}`;
  document.getElementById('prog-fill').style.width  = `${pct}%`;
  document.getElementById('prog-pct').textContent   = `${pct}%`;
}

function renderGoalList() {
  const tab   = activeTab;
  const goals = data[tab]?.goals || [];
  const list  = document.getElementById('goal-list');
  if (!list) return;

  if (!goals.length) {
    const wb = document.getElementById('win-body');

    // ME tab — full-body render, bypasses inset-panel, matches ALL tab
    if (tab === 'me') {
      wb.className = 'win-body team-body';
      wb.innerHTML = `
        <div class="locked-panel">
          <div class="locked-icon">🗺️</div>
          <div class="locked-title">YOUR LEGEND BEGINS HERE</div>
          <div class="locked-sub">A blank map stretches before you. No roads marked. No quests assigned. Just you, and twelve months to write your legend.</div>
          <div class="starter-row">
            <button class="starter-btn" id="empty-add-quest-btn">⚔️ WRITE YOUR FIRST QUEST ▶</button>
          </div>
        </div>`;
      document.getElementById('empty-add-quest-btn').addEventListener('click', () => openGoalModal('me'));
      return;
    }

    // Together tab with no group yet
    if (tab === 'together' && !currentGroupId) {
      wb.className = 'win-body party-body';
      wb.innerHTML = `
        <div class="locked-panel">
          <div class="locked-icon">💎</div>
          <div class="locked-title">NO PARTY YET</div>
          <div class="locked-sub">Invite someone to start your party and unlock shared quests!</div>
          <button class="starter-btn" id="empty-invite-btn" style="margin-top:12px">💎 INVITE SOMEONE ▶</button>
        </div>`;
      document.getElementById('empty-invite-btn')?.addEventListener('click', openPartnersPanel);
      return;
    }

    // Together-with-group or partner — render inside the inset panel
    const label = tab === 'partner' ? (data.partner?.name || 'Partner') : (data.together?.name || 'PARTY');
    if (tab === 'together') wb.className = 'win-body party-body';

    const starterHTML = (tab === 'together') ? `
      <div class="starter-row">
        <button class="starter-btn" id="empty-add-quest-btn">💎 ADD A PARTY QUEST ▶</button>
        <div class="starter-label">— or load a starter set —</div>
        <button class="starter-btn" data-seed="party">💎 PARTY (${STARTER_PRESETS.party.goals.length} quests)</button>
      </div>` : '';

    list.innerHTML = `
      <div class="locked-panel">
        <div class="locked-icon">${tab === 'together' ? '💎' : '🌸'}</div>
        <div class="locked-title">${tab === 'partner' ? label.toUpperCase() + ' HAS NO QUESTS YET' : 'YOUR LEGEND BEGINS HERE'}</div>
        <div class="locked-sub">${tab === 'partner' ? label + " hasn't written any quests yet." : 'A blank map stretches before you. No roads marked. No quests assigned. Just you, and twelve months to write your legend.'}</div>
        ${starterHTML}
      </div>`;
    document.getElementById('empty-add-quest-btn')?.addEventListener('click', () => openGoalModal('together'));
    return;
  }

  document.getElementById('win-body')?.classList.remove('card-mode');
  list.innerHTML = urgentWarningsHTML([tab])
    + goals.map((g, i) => goalItemHTML(g, i, tab)).join('');
}

// ── ALL TAB RENDER ────────────────────────────────────────────
function renderAllTab() {
  const wb = document.getElementById('win-body');
  wb.className = 'win-body';

  const allDone  = totalDoneAll(data);
  const allTotal = totalGoalsAll(data);
  const allPct   = allTotal ? Math.round((allDone / allTotal) * 100) : 0;

  if (allTotal === 0) {
    wb.className = 'win-body team-body';
    wb.innerHTML = `
      <div class="locked-panel">
        <div class="locked-icon">🗺️</div>
        <div class="locked-title">YOUR LEGEND BEGINS HERE</div>
        <div class="locked-sub">A blank map stretches before you. No roads marked. No quests assigned. Just you, and twelve months to write your legend.</div>
        <div class="starter-row">
          <button class="starter-btn" id="empty-add-quest-btn">⚔️ WRITE YOUR FIRST QUEST ▶</button>
        </div>
      </div>`;
    document.getElementById('empty-add-quest-btn').addEventListener('click', () => openGoalModal('me'));
    return;
  }

  const meName      = (data.me?.name      || 'ME').toUpperCase();
  const partnerName = (data.partner?.name || '').toUpperCase();
  const sections = [
    { tab: 'together', label: '💎 ' + (data.together?.name || 'PARTY').toUpperCase(), cls: 'party-header', tagCls: 'owner-party', tagText: (data.together?.name || 'PARTY').toUpperCase() },
    ...(data.partner ? [{ tab: 'partner', label: '👤 ' + partnerName, cls: 'partner-header', tagCls: 'owner-partner', tagText: partnerName }] : []),
    { tab: 'me', label: '👤 ' + meName, cls: 'me-header', tagCls: 'owner-me', tagText: meName },
  ];

  const goalsHTML = sections.map(sec => {
    const goals = data[sec.tab].goals;
    const done  = countDone(data, sec.tab);
    const total = goals.length;
    const header = `<div class="all-section-header ${sec.cls}">
      <span class="all-section-label">${sec.label}</span>
      <span class="all-section-count">${total === 0 ? 'No quests yet' : `${done} / ${total} done`}</span>
    </div>`;
    const items = goals.map((g, i) => goalItemHTML(g, i, sec.tab, {
      showTag: true, tagCls: sec.tagCls, tagText: sec.tagText
    })).join('');
    return header + items;
  }).join('');

  wb.innerHTML = `
    <div class="progress-section">
      <span class="prog-label">ALL QUESTS: ${allDone} / ${allTotal || '?'}</span>
      <div class="prog-track"><div class="prog-fill" id="prog-fill" style="width:${allPct}%"></div></div>
      <span class="prog-pct">${allPct}%</span>
    </div>
    <div class="inset-panel quest-panel">
      <div class="panel-title-row">
        <span class="panel-title">📋 ALL QUESTS</span>
      </div>
      <div class="goal-list" id="goal-list">${urgentWarningsHTML(['me', 'together', ...(data.partner ? ['partner'] : [])]) + goalsHTML}</div>
    </div>`;
}

// ── TEAM TAB RENDER ───────────────────────────────────────────
function renderTeamTab() {
  const wb = document.getElementById('win-body');
  wb.className = 'win-body team-body';

  const meDone      = countDone(data, 'me');
  const partnerDone = data.partner ? countDone(data, 'partner') : 0;
  const togDone     = countDone(data, 'together');
  const allDone     = meDone + partnerDone + togDone;
  const allTotal    = totalGoalsAll(data);
  const allPct      = allTotal ? Math.round((allDone / allTotal) * 100) : 0;

  const mePct      = getPct(data, 'me');
  const partnerPct = data.partner ? getPct(data, 'partner') : 0;
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
          const bothAt   = mePct >= b.threshold && partnerPct >= b.threshold;
          return badgeSlotHTML(b, unlocked, unlocked ? b.name : `BOTH @ ${b.threshold}%`);
        }).join('')}
      </div>
    </div>
  `;

  // Reset win-body class on tab switch away
  wb.className = 'win-body team-body';
}


// ── BADGES TAB RENDER ─────────────────────────────────────────
function renderBadgesTab() {
  const wb = document.getElementById('win-body');
  wb.className = 'win-body badges-body';

  const meUnlocked       = data.me?.unlockedBadges        || [];
  const combinedUnlocked = data.team?.unlockedCombinedBadges || [];
  const balanceUnlocked  = data.team?.unlockedBalanceBadges  || [];
  const meDates          = data.me?.badgeDates    || {};
  const teamDates        = data.team?.badgeDates  || {};

  // ── Recent unlocks strip ────────────────────────────────────
  const allBadgeDefs = [...BADGE_DEFS, ...COMBINED_BADGE_DEFS, ...BALANCE_BADGE_DEFS, ...TEAM_BADGE_DEFS];
  const recentEntries = [
    ...Object.entries(meDates).map(([id, date]) => ({ id: isNaN(id) ? id : Number(id), date })),
    ...Object.entries(teamDates).map(([id, date]) => ({ id, date })),
  ]
    .filter(e => allBadgeDefs.some(b => String(b.id) === String(e.id)))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const recentHTML = recentEntries.length ? `
    <div class="badges-recent-strip">
      <div class="badges-recent-label">✦ RECENTLY EARNED</div>
      <div class="badges-recent-row">
        ${recentEntries.map(e => {
          const b = allBadgeDefs.find(bd => String(bd.id) === String(e.id));
          const d = new Date(e.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
          return `<div class="badges-recent-item" data-badge-id="${b.id}">
            <div class="badges-recent-gem">${makeBadgeSVG(b, 56)}</div>
            <div class="badges-recent-name">${b.name.split(' ')[0]}</div>
            <div class="badges-recent-date">${d}</div>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // ── Personal badges (with progress hints on locked) ─────────
  const meDone  = countDone(data, 'me');
  const meTotal = data.me?.goals?.length || 0;
  const personalHTML = BADGE_DEFS.map(b => {
    const unlocked = meUnlocked.includes(b.id);
    const slot     = badgeSlotHTML(b, unlocked);
    if (unlocked) return slot;
    const needed = b.threshold(meTotal) - meDone;
    const hint   = needed > 0 ? `<div class="badge-progress-hint">${needed} more quest${needed !== 1 ? 's' : ''}</div>` : '';
    return `<div class="badge-hint-wrap">${slot}${hint}</div>`;
  }).join('');

  // ── Party badges ────────────────────────────────────────────
  const partyBadgesHTML = currentGroupId
    ? [...COMBINED_BADGE_DEFS.map(b => badgeSlotHTML(b, combinedUnlocked.includes(b.id))),
       ...BALANCE_BADGE_DEFS.map(b  => badgeSlotHTML(b, balanceUnlocked.includes(b.id)))].join('')
    : `<div class="badges-empty">Start a party to unlock these badges.</div>`;

  // ── Team badges ─────────────────────────────────────────────
  const activeTeamGroup = allGroups.filter(g => g.type === 'team').find(g => g.id === currentTeamId);
  const teamMembers     = activeTeamGroup?._members || [];
  const teamEarned      = earnedTeamGroupBadges(teamMembers).map(b => b.id);
  const teamBadgesHTML  = allGroups.some(g => g.type === 'team')
    ? TEAM_BADGE_DEFS.map(b => badgeSlotHTML(b, teamEarned.includes(b.id))).join('')
    : `<div class="badges-empty">Form a team to unlock these badges.</div>`;

  wb.innerHTML = `
    ${recentHTML}
    <div class="badges-section">
      <div class="badges-section-header">✦ PERSONAL</div>
      <div class="badge-case badges-grid" id="badges-personal">${personalHTML}</div>
    </div>
    <div class="badges-section">
      <div class="badges-section-header">💎 PARTY</div>
      <div class="badge-case badges-grid" id="badges-party">${partyBadgesHTML}</div>
    </div>
    <div class="badges-section">
      <div class="badges-section-header">👥 TEAM</div>
      <div class="badge-case badges-grid" id="badges-team">${teamBadgesHTML}</div>
    </div>`;

  // ── Badge slot clicks → open detail modal ───────────────────
  wb.querySelectorAll('.badge-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const badgeId  = slot.dataset.badgeId;
      const b        = allBadgeDefs.find(bd => String(bd.id) === String(badgeId));
      if (!b) return;
      const isUnlocked = !slot.classList.contains('locked');
      const allDates   = { ...meDates, ...teamDates };
      const earnedDate = allDates[String(b.id)] || allDates[b.id];
      // Hint for locked personal badges
      let hint = null;
      if (!isUnlocked && BADGE_DEFS.some(bd => bd.id === b.id)) {
        const needed = b.threshold(meTotal) - meDone;
        if (needed > 0) hint = `${needed} more quest${needed !== 1 ? 's' : ''} to unlock`;
      }
      openBadgeDetailModal(b, isUnlocked, earnedDate, hint);
    });
  });

  // ── Recent strip clicks → open modal ───────────────────────
  wb.querySelectorAll('.badges-recent-item').forEach(item => {
    item.addEventListener('click', () => {
      const badgeId = item.dataset.badgeId;
      const b       = allBadgeDefs.find(bd => String(bd.id) === String(badgeId));
      if (!b) return;
      const allDates   = { ...meDates, ...teamDates };
      const earnedDate = allDates[String(b.id)] || allDates[b.id];
      openBadgeDetailModal(b, true, earnedDate, null);
    });
  });

  // ── Scroll-reveal via IntersectionObserver ──────────────────
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('badge-revealed');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  wb.querySelectorAll('.badge-slot').forEach((slot, i) => {
    slot.style.transitionDelay = `${Math.min(i * 0.045, 0.4)}s`;
    observer.observe(slot);
  });
}

function openBadgeDetailModal(b, isUnlocked, earnedDate, hint) {
  document.getElementById('bdm-name').textContent  = b.name;
  const rarityEl = document.getElementById('bdm-rarity-label');
  rarityEl.textContent = b.rarity ? b.rarity.toUpperCase() : '';
  rarityEl.className   = `bdm-rarity-label rarity-${b.rarity}`;

  const svgWrap = document.getElementById('bdm-svg');
  svgWrap.innerHTML  = makeBadgeSVG(b, 80);
  svgWrap.className  = `bdm-svg-wrap ${isUnlocked ? 'unlocked' : 'locked'}`;

  document.getElementById('bdm-desc').textContent = b.desc;

  const loreEl = document.getElementById('bdm-lore');
  loreEl.textContent   = b.lore || '';
  loreEl.style.display = b.lore ? '' : 'none';

  const dateEl = document.getElementById('bdm-date');
  if (isUnlocked && earnedDate) {
    dateEl.textContent   = `Earned ${new Date(earnedDate).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    dateEl.style.display = '';
  } else {
    dateEl.style.display = 'none';
  }

  const hintEl = document.getElementById('bdm-hint');
  if (hint) {
    hintEl.textContent   = hint;
    hintEl.style.display = '';
  } else {
    hintEl.style.display = 'none';
  }

  document.getElementById('badge-detail-overlay').style.display = 'flex';
}

// ── TEAMS TAB RENDER ──────────────────────────────────────────
function renderTeamsTab() {
  const wb = document.getElementById('win-body');
  wb.className = 'win-body team-body';

  const teamGroups = allGroups.filter(g => g.type === 'team');
  if (!teamGroups.length) {
    wb.innerHTML = `
      <div class="locked-panel">
        <div class="locked-icon">👥</div>
        <div class="locked-title">NO TEAMS YET</div>
        <div class="locked-sub">Form a team with friends to travel the same road — each on your own quest, together.</div>
        <button class="starter-btn" id="teams-invite-btn" style="margin-top:12px">👥 FORM A TEAM ▶</button>
      </div>`;
    document.getElementById('teams-invite-btn')?.addEventListener('click', openPartnersPanel);
    return;
  }

  // Switcher if multiple teams
  const switcherHTML = teamGroups.length > 1 ? `
    <div class="group-switcher-row">
      <span class="group-switcher-label">TEAM:</span>
      <select class="group-switcher" id="team-switcher">
        ${teamGroups.map(g => `<option value="${g.id}" ${g.id === currentTeamId ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}
      </select>
    </div>` : `<div class="group-switcher-row"><span class="group-switcher-label">👥 ${esc(teamGroups[0].name)}</span></div>`;

  const activeTeam = teamGroups.find(g => g.id === currentTeamId) || teamGroups[0];
  if (!currentTeamId || !teamGroups.find(g => g.id === currentTeamId)) currentTeamId = activeTeam.id;

  // Member cards
  const membersHTML = (activeTeam._members || []).map(m => {
    const done  = m.goals?.filter(g => g.done).length || 0;
    const total = m.goals?.length || 0;
    const pct   = total ? Math.round((done / total) * 100) : 0;
    const badges = (m.unlockedBadges || []).length;
    return `
      <div class="team-member-card">
        <div class="team-member-name">👤 ${esc((m.name || 'PLAYER').toUpperCase())}</div>
        <div class="team-member-prog-track">
          <div class="team-member-prog-fill" style="width:${pct}%"></div>
        </div>
        <div class="team-member-stats">
          <span>${done}/${total} quests</span>
          <span>${badges} badges</span>
          <span>${pct}%</span>
        </div>
      </div>`;
  }).join('');

  // Team badges
  const members     = activeTeam._members || [];
  const earnedIds   = earnedTeamGroupBadges(members).map(b => b.id);
  const teamBadgesHTML = TEAM_BADGE_DEFS.map(b => {
    const unlocked = earnedIds.includes(b.id);
    return badgeSlotHTML(b, unlocked);
  }).join('');

  wb.innerHTML = `
    ${switcherHTML}
    <div class="inset-panel" style="margin-bottom:8px">
      <div class="panel-title">🗺️ YOUR CREW</div>
      ${membersHTML || '<div class="partners-empty" style="padding:12px">Member data loading…</div>'}
    </div>
    <div class="inset-panel">
      <div class="panel-title">🏅 TEAM BADGES — earn these together</div>
      <div class="badge-case">${teamBadgesHTML}</div>
    </div>`;

  // Wire team switcher
  document.getElementById('team-switcher')?.addEventListener('change', e => {
    currentTeamId = e.target.value;
    render();
  });
}


// ── QUEST DIALOG ──────────────────────────────────────────────
function openQuestDialog(tab, goalId) {
  const goals = data[tab]?.goals;
  if (!goals) return;
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return;
  _qdGoal     = goal;
  _qdTab      = tab;
  _qdIdx      = goals.indexOf(goal) + 1;
  _qdMetaOpen = false;
  renderQuestDialog();
  document.getElementById('quest-dialog').style.display = 'flex';
}

function closeQuestDialog() {
  document.getElementById('quest-dialog').style.display = 'none';
  _qdGoal = null;
  _qdTab  = null;
}

function renderQuestDialog() {
  if (!_qdGoal) return;
  const g   = _qdGoal;
  const tab = _qdTab;

  document.getElementById('qd-num').textContent  = String(_qdIdx).padStart(3, '0');
  document.getElementById('qd-type').textContent = GOAL_TYPES[g.type]?.label || 'QUEST';
  document.getElementById('qd-title').textContent = g.title;

  const controls = document.getElementById('qd-controls');
  if (g.type === 'binary') {
    controls.innerHTML = g.done
      ? `<button class="goal-check card-check-btn card-done-btn" data-id="${g.id}" data-tab="${tab}" data-type="binary">✓ QUEST COMPLETE!<span class="card-btn-sub">tap to undo</span></button>`
      : `<button class="goal-check card-check-btn" data-id="${g.id}" data-tab="${tab}" data-type="binary">◻ MARK AS DONE</button>`;
  } else if (g.type === 'count') {
    const maxed = g.current >= g.target;
    const pct   = g.target > 0 ? (g.current / g.target) * 100 : 0;
    controls.innerHTML = `
      <div class="card-count-row">
        <button class="cnt-btn card-cnt-btn" data-id="${g.id}" data-tab="${tab}" data-action="dec" ${g.current === 0 ? 'disabled' : ''}>−</button>
        <div class="card-count-bar-wrap">
          <div class="card-count-track">
            <div class="card-count-fill ${maxed ? 'maxed' : ''}" style="width:${pct}%"></div>
          </div>
          <div class="card-count-label">
            <span class="card-count-num ${maxed ? 'maxed' : ''}">${g.current} / ${g.target}</span>
            <span class="card-count-unit">${esc(g.unit)}</span>
          </div>
        </div>
        <button class="cnt-btn card-cnt-btn" data-id="${g.id}" data-tab="${tab}" data-action="inc" ${maxed ? 'disabled' : ''}>+</button>
      </div>`;
  } else if (g.type === 'monthly') {
    const checked = (g.months || []).filter(Boolean).length;
    const maxed   = checked >= 12;
    controls.innerHTML = `
      <div class="qd-monthly-ctrl">
        <button class="cnt-btn card-cnt-btn" data-id="${g.id}" data-tab="${tab}" data-action="dec" data-type="monthly" ${checked === 0 ? 'disabled' : ''}>−</button>
        <span class="qd-month-count${maxed ? ' maxed' : ''}">${checked} / 12 months</span>
        <button class="cnt-btn card-cnt-btn" data-id="${g.id}" data-tab="${tab}" data-action="inc" data-type="monthly" ${maxed ? 'disabled' : ''}>+</button>
      </div>`;
  }

  // Meta section (note, photo, deadline) — collapsible
  const meta    = document.getElementById('qd-meta');
  const moreBtn = document.getElementById('qd-more-btn');
  const hasMeta = g.note || g.photo || g.deadline;
  if (hasMeta) {
    moreBtn.style.display  = '';
    moreBtn.textContent    = _qdMetaOpen ? '▲ HIDE' : '▼ DETAILS';
    meta.innerHTML = _qdMetaOpen ? `
      ${g.note     ? `<div class="card-note">✎ ${esc(g.note)}</div>` : ''}
      ${g.deadline ? `<div class="qd-deadline">📅 ${g.deadline}</div>` : ''}
      ${g.photo    ? `<img class="qd-photo" src="${g.photo}" alt="Memory">` : ''}
    ` : '';
  } else {
    moreBtn.style.display = 'none';
    meta.innerHTML        = '';
  }
}

// ── CELEBRATIONS ─────────────────────────────────────────────
function processCelebrations() {
  if (!pendingCelebrations.length) { celebrating = false; return; }
  celebrating = true;
  // Close any open modals so celebrations aren't blocked
  document.getElementById('badge-detail-overlay').style.display = 'none';
  closeQuestDialog();
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

    saveData(); // saves note + photo; badges already checked and queued
    render();

    overlay.style.display = 'none';
    photoBtn.textContent = '📷 Add Photo';

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


// ── EVENT DELEGATION ──────────────────────────────────────────
// Attached once to win-body in init(). Handles all dynamic goal/badge interactions
// so renderGoalList() and renderAllTab() don't need to re-attach handlers every render.
function handleWinBodyClick(e) {

  // Invite banner — ACCEPT
  const bannerAccept = e.target.closest('[data-banner-accept]');
  if (bannerAccept) {
    handleAcceptInvite(bannerAccept.dataset.bannerAccept);
    return;
  }
  // Invite banner — DECLINE
  const bannerDecline = e.target.closest('[data-banner-decline]');
  if (bannerDecline) {
    handleDeclineInvite(bannerDecline.dataset.bannerDecline);
    return;
  }

  // Group switcher (party tab)
  const groupSwitcher = e.target.closest('.group-switcher');
  if (groupSwitcher) return; // handled by 'change' event

  // Starter preset seed button
  const seedBtn = e.target.closest('.starter-btn[data-seed]');
  if (seedBtn) {
    seedGoals(seedBtn.dataset.seed);
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

  // Badge slot — handled in renderBadgesTab directly
  const badgeSlot = e.target.closest('.badge-slot');
  if (badgeSlot) {
    return;
  }

  // Binary goal toggle
  const checkBtn = e.target.closest('.goal-check[data-type="binary"]');
  if (checkBtn) {
    applyGoalInteraction(checkBtn.dataset.tab || activeTab, parseInt(checkBtn.dataset.id), { type: 'toggle' });
    if (_qdGoal) renderQuestDialog();
    return;
  }

  // Count +/− buttons (count and monthly goals)
  const cntBtn = e.target.closest('.cnt-btn');
  if (cntBtn) {
    applyGoalInteraction(
      cntBtn.dataset.tab || activeTab,
      parseInt(cntBtn.dataset.id),
      { type: 'adjust', delta: cntBtn.dataset.action === 'inc' ? 1 : -1 }
    );
    if (_qdGoal) renderQuestDialog();
    return;
  }

  // Month grid cells
  const monthCell = e.target.closest('.month-cell');
  if (monthCell) {
    applyGoalInteraction(
      monthCell.dataset.tab || activeTab,
      parseInt(monthCell.dataset.id),
      { type: 'month', index: parseInt(monthCell.dataset.month) }
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

  // Quest row tap → open dialog (anywhere on row except the check button)
  const goalRow = e.target.closest('.goal-item[data-id]');
  if (goalRow && !e.target.closest('.goal-check')) {
    const tab = goalRow.dataset.tab || activeTab;
    openQuestDialog(tab, parseInt(goalRow.dataset.id));
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

  // Partners module init
  initPartners({
    render,
    setStatus,
    updateTabLabels,
    getAppState: () => ({ data, currentGroupId, currentTeamId, allGroups, _pendingInvites }),
    setAppState: (patch) => {
      if ('data'           in patch) data             = patch.data;
      if ('currentGroupId' in patch) currentGroupId   = patch.currentGroupId;
      if ('currentTeamId'  in patch) currentTeamId    = patch.currentTeamId;
      if ('allGroups'      in patch) allGroups        = patch.allGroups;
      if ('_pendingInvites' in patch) _pendingInvites = patch._pendingInvites;
    },
  });

  // Quest dialog
  document.getElementById('qd-close').addEventListener('click', closeQuestDialog);
  document.getElementById('quest-dialog').addEventListener('click', e => {
    if (e.target.id === 'quest-dialog') { closeQuestDialog(); return; }
    handleWinBodyClick(e);
  });
  document.getElementById('qd-edit').addEventListener('click', () => {
    if (_qdGoal && _qdTab) {
      const tab = _qdTab, id = _qdGoal.id;
      closeQuestDialog();
      openGoalModal(tab, id);
    }
  });
  document.getElementById('qd-more-btn').addEventListener('click', () => {
    _qdMetaOpen = !_qdMetaOpen;
    renderQuestDialog();
  });

  // Partners panel
  document.getElementById('partners-btn').addEventListener('click', openPartnersPanel);
  document.getElementById('partners-close').addEventListener('click', closePartnersPanel);

  // Badge detail modal
  const bdmClose = () => { document.getElementById('badge-detail-overlay').style.display = 'none'; };
  document.getElementById('bdm-close').addEventListener('click', bdmClose);
  document.getElementById('badge-detail-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('badge-detail-overlay')) bdmClose();
  });
  document.getElementById('partners-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('partners-overlay')) closePartnersPanel();
  });
  document.getElementById('partners-overlay').addEventListener('click', handlePartnersClick);
  document.getElementById('invite-send-btn').addEventListener('click', handleSendInvite);

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

  updateClock();
  setInterval(updateClock, 30000);
  render();

  // Notification bell button
  const notifBtn = document.getElementById('notif-btn');
  notifBtn.addEventListener('click', () => enableNotifications(setStatus));
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


// ── Tab label helper ─────────────────────────────────────────
function updateTabLabels() {
  // PARTY tab — always visible
  const partyTab = document.getElementById('tab-together');
  if (partyTab) partyTab.textContent = '💎 PARTY';

  // ME tab label — show username
  const meTab = document.getElementById('tab-me');
  if (meTab && data.me?.name) meTab.textContent = `👤 ${data.me.name.toUpperCase()}`;

  // TEAM tab — always visible (shows empty state if not in a team)
  const teamTab = document.getElementById('tab-teams');
  if (teamTab) teamTab.style.display = '';
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth(async (user, profile) => {
    setStatus('LOADING QUESTS…');

    // Load personal goals from Firestore
    data.me = await loadUserData(user.uid);

    // Load ALL groups this user belongs to
    allGroups = [];
    if (profile.groups?.length > 0) {
      for (const gid of profile.groups) {
        try {
          const gd  = await loadGroupData(gid);
          gd.id     = gid;
          allGroups.push(gd);
        } catch (_) {}
      }

      // Set active party group
      const partyGroups = allGroups.filter(g => g.type !== 'team');
      const teamGroups  = allGroups.filter(g => g.type === 'team');

      if (partyGroups.length > 0) {
        currentGroupId = partyGroups[0].id;
        data.together  = partyGroups[0];
        const partnerUid = partyGroups[0].members?.find(uid => uid !== user.uid);
        if (partnerUid) data.partner = await loadPartnerData(partnerUid);
      }

      // Load member data for team groups
      if (teamGroups.length > 0) {
        currentTeamId = teamGroups[0].id;
        for (const tg of teamGroups) {
          const memberUids = (tg.members || []).filter(uid => uid !== user.uid);
          tg._members = [
            { name: data.me.name, goals: data.me.goals, unlockedBadges: data.me.unlockedBadges },
            ...await Promise.all(memberUids.map(uid => loadPartnerData(uid)))
          ];
        }
      }
    }

    // Self-heal: load groups from accepted sent invites
    // Covers the case where the inviter's groups array wasn't updated due to security rules
    try {
      const acceptedSent = await getSentInvites(user.uid);
      for (const inv of acceptedSent.filter(i => i.status === 'accepted' && i.groupId)) {
        if (!allGroups.find(g => g.id === inv.groupId)) {
          try {
            const gd = await loadGroupData(inv.groupId);
            gd.id    = inv.groupId;
            allGroups.push(gd);
            addGroupToUser(user.uid, inv.groupId).catch(() => {});
            if (!currentGroupId && gd.type !== 'team') {
              currentGroupId = inv.groupId;
              data.together  = gd;
              const partnerUid = gd.members?.find(uid => uid !== user.uid);
              if (partnerUid) data.partner = await loadPartnerData(partnerUid);
            }
            if (!currentTeamId && gd.type === 'team') {
              currentTeamId = inv.groupId;
              const memberUids = (gd.members || []).filter(uid => uid !== user.uid);
              gd._members = [
                { name: data.me.name, goals: data.me.goals, unlockedBadges: data.me.unlockedBadges },
                ...await Promise.all(memberUids.map(uid => loadPartnerData(uid)))
              ];
            }
          } catch (_) {}
        }
      }
    } catch (_) {}

    // Check for pending invites
    if (profile.email) {
      try {
        _pendingInvites = await getPendingInvitesForEmail(profile.email);
      } catch (_) { _pendingInvites = []; }
    }

    // Update header + tabs
    document.querySelector('.title-text').textContent =
      `BADGE QUEST — ${profile.username.toUpperCase()}`;
    updateTabLabels();

    init();

    // Show invite banner if there are pending invites
    if (_pendingInvites.length > 0) renderInviteBanner();
  });

  // Sign-out button
  document.getElementById('signout-btn').addEventListener('click', async () => {
    await signOutUser();
  });
});
