// ============================================================
//  BADGE QUEST 2026 — Badge definitions, logic, SVG renderer
// ============================================================

// ── Individual badge definitions ─────────────────────────────
export const BADGE_DEFS = [
  { id: 0, name: 'BOULDER BADGE', desc: 'Complete your very first quest!',             emoji: '🪨', color: '#9E9E9E', color2: '#424242', shape: 'octagon', rarity: 'common',    threshold: ()  => 1,                  lore: 'The first stone turned. The road ahead is long and unmapped — but it has begun.' },
  { id: 1, name: 'CASCADE BADGE', desc: 'Complete 4 quests — the momentum builds!',    emoji: '💧', color: '#42A5F5', color2: '#0D47A1', shape: 'drop',    rarity: 'common',    threshold: ()  => 4,                  lore: 'Four rivers crossed, four vows kept. The world opens to those who show up.' },
  { id: 2, name: 'THUNDER BADGE', desc: 'Complete 8 quests — crackling energy!',       emoji: '⚡', color: '#FFEE58', color2: '#E65100', shape: 'star',    rarity: 'rare',      threshold: ()  => 8,                  lore: 'Eight strikes of will. You have become the kind of person who finishes what they start.' },
  { id: 3, name: 'RAINBOW BADGE', desc: 'Halfway there! Keep shining!',                emoji: '🌈', color: '#FF80AB', color2: '#880E4F', shape: 'diamond', rarity: 'rare',      threshold: (n) => Math.ceil(n * 0.5), lore: 'Halfway across the bridge of light. The far shore is closer than the one you left.' },
  { id: 4, name: 'SOUL BADGE',    desc: 'Complete 16 quests — your spirit is strong!', emoji: '✨', color: '#CE93D8', color2: '#6A1B9A', shape: 'circle',  rarity: 'epic',      threshold: ()  => 16,                 lore: 'Sixteen candles burned through the dark. Something in you is forged now, and cannot be undone.' },
  { id: 5, name: 'MARSH BADGE',   desc: 'Complete 19 quests — deep in the quest!',     emoji: '🌿', color: '#81C784', color2: '#1B5E20', shape: 'hexagon', rarity: 'epic',      threshold: ()  => 19,                 lore: 'Nineteen deep steps into the fog. Most turned back at the edge. You did not.' },
  { id: 6, name: 'VOLCANO BADGE', desc: 'Complete 22 quests — unstoppable!',           emoji: '🌋', color: '#EF5350', color2: '#B71C1C', shape: 'shield',  rarity: 'epic',      threshold: ()  => 22,                 lore: 'Twenty-two trials by fire. You are not the same person who started this journey.' },
  { id: 7, name: 'EARTH BADGE',   desc: '🏆 ALL quests complete! TRUE CHAMPION!',      emoji: '🏆', color: '#FFD700', color2: '#E65100', shape: 'star6',   rarity: 'legendary', threshold: (n) => n,                  lore: 'Every road walked. Every vow kept. The earth does not forget those who honour their word.' },
];

// ── Team badge definitions ────────────────────────────────────
// Combined: unlock when total done across all tabs hits X
export const COMBINED_BADGE_DEFS = [
  { id: 'c0', name: 'STARTER TEAM', desc: "Together you've completed 10 quests!",              color: '#B0C4DE', color2: '#4A6FA5', shape: 'ring',  rarity: 'common',    threshold: ()      => 10,    lore: 'Ten acts, two hearts. A fellowship is not declared — it is built, one deed at a time.' },
  { id: 'c1', name: 'POWER PARTY',  desc: "Together you've completed 30 quests — unstoppable!", color: '#FFD060', color2: '#A86000', shape: 'cross', rarity: 'rare',      threshold: ()      => 30,    lore: 'Thirty deeds between you. Smaller things have been sung about for a long time.' },
  { id: 'c2', name: 'DREAM TEAM',   desc: 'LEGENDARY! Every single quest complete! 🎊',         color: '#FFD700', color2: '#CC4400', shape: 'star4', rarity: 'legendary', threshold: (total) => total, lore: 'Nothing left undone. The chronicles will struggle to find the right word for what you are.' },
];

// Balance: unlock when BOTH players are each at ≥ X% done
export const BALANCE_BADGE_DEFS = [
  { id: 'b0', name: 'IN SYNC',  desc: 'Both of you hit 25%! Matching energy! ⚡',     color: '#64D8FF', color2: '#005A8A', shape: 'heart',  rarity: 'common', threshold: 25, lore: 'A quarter of the mountain climbed, and still side by side. This is what choosing the same road looks like.' },
  { id: 'b1', name: 'PARTNERS', desc: 'Both of you hit 50%! Perfect partnership! 💞', color: '#FF8FAB', color2: '#9A0030', shape: 'arrow',  rarity: 'rare',   threshold: 50, lore: 'Halfway and still together — not by chance, but by choice, every single day.' },
  { id: 'b2', name: 'LEGENDS',  desc: 'Both of you hit 75%! Absolute legends! 👑',    color: '#D070FF', color2: '#5A0090', shape: 'crown',  rarity: 'epic',   threshold: 75, lore: 'Three quarters of the way and neither one has faltered. The title is not given. It is earned.' },
];

// ── Team group badge definitions ─────────────────────────────
// These scale with team size. check(members) receives the _members array.
// members[i]: { name, goals, unlockedBadges }
const _done  = m => (m.goals?.filter(g => g.done).length || 0);
const _total = m => (m.goals?.length || 0);
const _pct   = m => { const t = _total(m); return t ? Math.round(_done(m) / t * 100) : 0; };

export const TEAM_BADGE_DEFS = [
  {
    id: 't0', name: 'FIRST STEPS',
    desc: 'Every crew member has finished their first quest. The journey begins!',
    color: '#FF9933', color2: '#CC5500', shape: 'shield', rarity: 'common',
    check: ms => ms.length > 0 && ms.every(m => _done(m) >= 1),
    lore: 'Every soul in the company has drawn first blood. The adventure is no longer a dream.',
  },
  {
    id: 't1', name: 'PACKED & READY',
    desc: 'Everyone has loaded up 5+ quests. Adventure officially awaits!',
    color: '#66BB6A', color2: '#1B5E20', shape: 'hexagon', rarity: 'common',
    check: ms => ms.length > 0 && ms.every(m => _total(m) >= 5),
    lore: 'Each traveller carries their full load willingly. The company is ready to march.',
  },
  {
    id: 't2', name: 'RISING HEROES',
    desc: "Every crew member has unlocked their first badge. Heroes, one and all!",
    color: '#26C6DA', color2: '#00607A', shape: 'star', rarity: 'rare',
    check: ms => ms.length > 0 && ms.every(m => (m.unlockedBadges?.length || 0) >= 1),
    lore: 'Honours earned by every soul in the band. Strangers no more — this is a fellowship.',
  },
  {
    id: 't3', name: 'ROAD WARRIORS',
    desc: 'Together your crew has smashed 10 quests per person. Unstoppable!',
    color: '#AB47BC', color2: '#4A148C', shape: 'ring', rarity: 'epic',
    check: ms => ms.length > 0 && ms.reduce((s, m) => s + _done(m), 0) >= ms.length * 10,
    lore: 'Ten quests each and still counting. The road has tested this company and found it wanting for nothing.',
  },
  {
    id: 't4', name: 'HALL OF LEGENDS',
    desc: 'Every hero is 75%+ done. This crew is going down in history. 👑',
    color: '#FFD700', color2: '#B8600A', shape: 'crown', rarity: 'legendary',
    check: ms => ms.length > 0 && ms.every(m => _pct(m) >= 75),
    lore: 'Three quarters done, every single one. History will not forget a company like this.',
  },
];

// ── Secret badge definitions ──────────────────────────────────
// Hidden from the badge case until unlocked — surprise rewards only.
export const SECRET_BADGE_DEFS = [
  {
    id: 's0',
    name: 'ADVENTURE BEGINS',
    desc: 'You wrote your first quest. Every legend starts somewhere.',
    color: '#FFD700', color2: '#8B4513', shape: 'burst', rarity: 'secret',
    lore: 'Before the first step, there was a blank page. You picked up the pen. That changes everything.',
  },
  {
    id: 's1',
    name: 'NIGHT OWL',
    desc: 'Completed a quest in the dead of night (midnight–5 AM). The dark hours have their own power.',
    color: '#9575CD', color2: '#1A0033', shape: 'moon', rarity: 'secret',
    lore: 'While the world slept, you kept your word. Some vows are made in starlight.',
  },
  {
    id: 's2',
    name: 'SPEEDRUNNER',
    desc: 'Completed 3 quests within 60 seconds. The universe barely had time to react.',
    color: '#29B6F6', color2: '#003344', shape: 'lightning', rarity: 'secret',
    lore: 'Three in the blink of an eye. The chronicles will omit the timestamp — out of disbelief.',
  },
  {
    id: 's3',
    name: 'PROFESSOR OAK',
    desc: 'Inspected every single badge in the hall. Knowledge is its own trophy.',
    color: '#FFA726', color2: '#3E1F00', shape: 'scroll', rarity: 'secret',
    lore: 'There are those who collect badges, and those who study them. You are the second kind.',
  },
  {
    id: 's4',
    name: 'PHOTO JOURNALIST',
    desc: 'Attached photos to 5 quests. You turned proof into poetry.',
    color: '#F4511E', color2: '#6A1000', shape: 'gem', rarity: 'secret',
    lore: 'Five moments preserved. The quest is the caption; the photo is the truth behind it.',
  },
  {
    id: 's5',
    name: 'WRONG TURN',
    desc: 'You hit the 25-quest limit. Even ambition has a horizon.',
    color: '#78909C', color2: '#1C313A', shape: 'hourglass', rarity: 'secret',
    lore: 'The road is full. Not all who wander are lost — but some do need a bigger map.',
  },
  {
    id: 's6',
    name: 'NOVELIST',
    desc: 'Added notes to 10 quests. Every quest has a story behind it.',
    color: '#26A69A', color2: '#00251A', shape: 'pentagon', rarity: 'secret',
    lore: 'Ten quests with their secrets committed to ink. The journey, annotated for posterity.',
  },
  {
    id: 's7',
    name: 'COMPANION',
    desc: 'Sent your first party invite. The adventure is better together.',
    color: '#FF7043', color2: '#6A1E00', shape: 'flame', rarity: 'secret',
    lore: 'You opened the door and said: come with me. That is the bravest sentence in the language.',
  },
  {
    id: 's8',
    name: 'HAUNTED',
    desc: 'Opened the app at the stroke of midnight. You and the ghosts.',
    color: '#90CAF9', color2: '#1A3A5C', shape: 'ghost', rarity: 'secret',
    lore: 'The witching hour. The app glowed. You were there. We will not speak of it further.',
  },
  {
    id: 's9',
    name: 'DRAFT MODE',
    desc: 'Deleted a quest. All great plans require revision.',
    color: '#AB47BC', color2: '#3A0052', shape: 'prism', rarity: 'secret',
    lore: 'Even the greatest heroes have crossed a name from the list. The unwritten quest haunts them still.',
  },
];

// ── Secret counter helpers (localStorage) ────────────────────
const _COUNTER_KEY = 'bq_secret_counters';
function _getCounters() {
  try { return JSON.parse(localStorage.getItem(_COUNTER_KEY) || '{}'); } catch { return {}; }
}
function _saveCounters(c) {
  try { localStorage.setItem(_COUNTER_KEY, JSON.stringify(c)); } catch {}
}
export function bumpSecretCounter(key, by = 1) {
  const c = _getCounters(); c[key] = (c[key] || 0) + by; _saveCounters(c); return c[key];
}
export function getSecretCounter(key) { return _getCounters()[key] || 0; }
export function setSecretCounter(key, val) { const c = _getCounters(); c[key] = val; _saveCounters(c); }

export function checkAndAwardSecretBadge(data, badgeId) {
  if (!data.me.unlockedBadges) data.me.unlockedBadges = [];
  if (data.me.unlockedBadges.includes(badgeId)) return null;
  const badge = SECRET_BADGE_DEFS.find(b => b.id === badgeId);
  if (!badge) return null;
  data.me.unlockedBadges = [...data.me.unlockedBadges, badgeId];
  if (!data.me.badgeDates) data.me.badgeDates = {};
  data.me.badgeDates[badgeId] = new Date().toISOString();
  return badge;
}

export function earnedTeamGroupBadges(members) {
  if (!members || !members.length) return [];
  return TEAM_BADGE_DEFS.filter(b => b.check(members));
}

// ── Stats helpers (used by badge logic and render) ────────────
export function countDone(data, tab) {
  return data[tab].goals.filter(g => g.done).length;
}

export function getPct(data, tab) {
  const total = data[tab].goals.length;
  if (!total) return 0;
  return Math.round((countDone(data, tab) / total) * 100);
}

export function totalDoneAll(data) {
  return countDone(data, 'me') + countDone(data, 'together') + (data.partner ? countDone(data, 'partner') : 0);
}

export function totalGoalsAll(data) {
  return data.me.goals.length + data.together.goals.length + (data.partner ? data.partner.goals.length : 0);
}

// ── Badge logic ───────────────────────────────────────────────

export function earnedBadges(data, tab) {
  const total = data[tab].goals.length;
  const done  = countDone(data, tab);
  return BADGE_DEFS.filter(b => done >= b.threshold(total));
}

export function recalcBadges(data, tab) {
  data[tab].unlockedBadges = earnedBadges(data, tab).map(b => b.id);
}

export function checkAndAwardBadges(data, tab) {
  const prev      = data[tab].unlockedBadges || [];
  const nowEarned = earnedBadges(data, tab);
  const newOnes   = nowEarned.filter(b => !prev.includes(b.id));
  data[tab].unlockedBadges = nowEarned.map(b => b.id);
  if (!data[tab].badgeDates) data[tab].badgeDates = {};
  newOnes.forEach(b => { data[tab].badgeDates[b.id] = new Date().toISOString(); });
  return newOnes;
}

export function earnedTeamBadges(data) {
  if (!data.team) data.team = { unlockedCombinedBadges: [], unlockedBalanceBadges: [] };
  const totalDone  = totalDoneAll(data);
  const totalGoals = totalGoalsAll(data);
  const mePct      = getPct(data, 'me');
  const partnerPct = data.partner ? getPct(data, 'partner') : 0;
  const combined = COMBINED_BADGE_DEFS.filter(b => totalDone  >= b.threshold(totalGoals));
  const balance  = BALANCE_BADGE_DEFS.filter(b  => mePct >= b.threshold && partnerPct >= b.threshold);
  return { combined, balance };
}

export function recalcTeamBadges(data) {
  const { combined, balance } = earnedTeamBadges(data);
  data.team.unlockedCombinedBadges = combined.map(b => b.id);
  data.team.unlockedBalanceBadges  = balance.map(b => b.id);
}

export function checkAndAwardTeamBadges(data) {
  const prevC = data.team?.unlockedCombinedBadges || [];
  const prevB = data.team?.unlockedBalanceBadges  || [];
  const { combined, balance } = earnedTeamBadges(data);
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

// ── SVG badge renderer ────────────────────────────────────────
export function makeBadgeSVG(badge, size = 52) {
  const { color: c, color2: c2, shape, id } = badge;
  const h = size / 2, r = h - 2;
  const gId  = `g${String(id).replace(/[^a-z0-9]/gi,'')}_${size}`;
  const cpId = `cp${String(id).replace(/[^a-z0-9]/gi,'')}_${size}`;
  let inner = '';
  let clipEl = ''; // same geometry, no fill/stroke — used for clipPath

  switch (shape) {
    case 'octagon': {
      const o = size * 0.28;
      const pts = `${o},0 ${size-o},0 ${size},${o} ${size},${size-o} ${size-o},${size} ${o},${size} 0,${size-o} 0,${o}`;
      inner  = `<polygon points="${pts}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<polygon points="${pts}"/>`;
      break;
    }
    case 'drop': {
      const d = `M${h} ${size} C${size*0.08} ${size*0.7},${size*0.08} ${size*0.25},${h} 0 C${size*0.92} ${size*0.25},${size*0.92} ${size*0.7},${h} ${size}Z`;
      inner  = `<path d="${d}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<path d="${d}"/>`;
      break;
    }
    case 'star': {
      const pts = Array.from({length:10}, (_,i) => {
        const rad = i%2===0 ? r : r*0.42;
        const a   = (i*36 - 90) * Math.PI/180;
        return `${h+rad*Math.cos(a)},${h+rad*Math.sin(a)}`;
      }).join(' ');
      inner  = `<polygon points="${pts}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>`;
      clipEl = `<polygon points="${pts}"/>`;
      break;
    }
    case 'star6': {
      const pts6 = Array.from({length:12}, (_,i) => {
        const rad = i%2===0 ? r : r*0.5;
        const a   = (i*30 - 90) * Math.PI/180;
        return `${h+rad*Math.cos(a)},${h+rad*Math.sin(a)}`;
      }).join(' ');
      inner  = `<polygon points="${pts6}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>`;
      clipEl = `<polygon points="${pts6}"/>`;
      break;
    }
    case 'star4': {
      const pts4 = Array.from({length:8}, (_,i) => {
        const rad = i%2===0 ? r : r*0.35;
        const a   = (i*45 - 45) * Math.PI/180;
        return `${h+rad*Math.cos(a)},${h+rad*Math.sin(a)}`;
      }).join(' ');
      inner  = `<polygon points="${pts4}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>`;
      clipEl = `<polygon points="${pts4}"/>`;
      break;
    }
    case 'diamond': {
      const pts = `${h},2 ${size-2},${h} ${h},${size-2} 2,${h}`;
      inner  = `<polygon points="${pts}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<polygon points="${pts}"/>`;
      break;
    }
    case 'circle':
      inner  = `<circle cx="${h}" cy="${h}" r="${r}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<circle cx="${h}" cy="${h}" r="${r}"/>`;
      break;
    case 'hexagon': {
      const pts2 = Array.from({length:6}, (_,i) => {
        const a = (i*60 - 90) * Math.PI/180;
        return `${h+r*Math.cos(a)},${h+r*Math.sin(a)}`;
      }).join(' ');
      inner  = `<polygon points="${pts2}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<polygon points="${pts2}"/>`;
      break;
    }
    case 'shield': {
      const d = `M${h} 2 L${size-2} ${size*0.28} L${size-2} ${size*0.6} Q${h} ${size-2} ${h} ${size-2} Q2 ${size*0.6} 2 ${size*0.6} L2 ${size*0.28} Z`;
      inner  = `<path d="${d}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<path d="${d}"/>`;
      break;
    }
    case 'ring': {
      inner  = `<circle cx="${h}" cy="${h}" r="${r}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>
               <circle cx="${h}" cy="${h}" r="${r*0.48}" fill="#ECE9D8" stroke="${c2}" stroke-width="1.5"/>`;
      clipEl = `<circle cx="${h}" cy="${h}" r="${r}"/>`;
      break;
    }
    case 'cross': {
      const t3 = size/3;
      const pts = `${t3},0 ${t3*2},0 ${t3*2},${t3} ${size},${t3} ${size},${t3*2} ${t3*2},${t3*2} ${t3*2},${size} ${t3},${size} ${t3},${t3*2} 0,${t3*2} 0,${t3} ${t3},${t3}`;
      inner  = `<polygon points="${pts}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>`;
      clipEl = `<polygon points="${pts}"/>`;
      break;
    }
    case 'heart': {
      const d = `M${h} ${size-4} C${h} ${size-4},4 ${size*0.55},4 ${size*0.32} C4 ${size*0.12},${h*0.5} ${size*0.08},${h} ${size*0.28} C${h*1.5} ${size*0.08},${size-4} ${size*0.12},${size-4} ${size*0.32} C${size-4} ${size*0.55},${h} ${size-4},${h} ${size-4}Z`;
      inner  = `<path d="${d}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<path d="${d}"/>`;
      break;
    }
    case 'arrow': {
      const pts5 = [
        `2,${h*0.62}`, `${size*0.56},${h*0.62}`,
        `${size*0.56},${h*0.28}`, `${size-2},${h}`,
        `${size*0.56},${h*1.72}`, `${size*0.56},${h*1.38}`,
        `2,${h*1.38}`
      ].join(' ');
      inner  = `<polygon points="${pts5}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<polygon points="${pts5}"/>`;
      break;
    }
    case 'crown': {
      const baseY = size * 0.70, rimY = size * 0.82;
      const ptsCr = [
        `2,${size-3}`, `2,${baseY}`,
        `${h*0.4},${h*0.52}`, `${h*0.28},${baseY}`,
        `${h},${3}`,
        `${h*1.72},${baseY}`, `${h*1.6},${h*0.52}`,
        `${size-2},${baseY}`, `${size-2},${size-3}`
      ].join(' ');
      inner  = `<polygon points="${ptsCr}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>
               <rect x="2" y="${rimY}" width="${size-4}" height="${size-3-rimY}" rx="2" fill="${c2}" opacity="0.45"/>`;
      clipEl = `<polygon points="${ptsCr}"/>`;
      break;
    }
    case 'moon': {
      // Crescent: outer circle minus offset inner circle (evenodd fill rule)
      const r2 = r * 0.72, offX = r * 0.32, offY = r * 0.22;
      const moonPath =
        `M ${h+r} ${h} A ${r} ${r} 0 1 0 ${h-r} ${h} A ${r} ${r} 0 1 0 ${h+r} ${h} Z ` +
        `M ${h+offX+r2} ${h-offY} A ${r2} ${r2} 0 1 0 ${h+offX-r2} ${h-offY} A ${r2} ${r2} 0 1 0 ${h+offX+r2} ${h-offY} Z`;
      inner  = `<path fill-rule="evenodd" d="${moonPath}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>`;
      clipEl = `<path fill-rule="evenodd" d="${moonPath}"/>`;
      break;
    }
    case 'lightning': {
      // Classic zigzag bolt — 6 vertices forming an S-band
      const pts = [
        `${h+4},2`, `${size-4},${h-2}`, `${h+2},${h-2}`,
        `${h-4},${size-2}`, `4,${h+2}`, `${h-2},${h+2}`
      ].join(' ');
      inner  = `<polygon points="${pts}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>`;
      clipEl = `<polygon points="${pts}"/>`;
      break;
    }
    case 'gem': {
      // Classic 5-point cut gem: flat top, wide middle, pointed bottom
      const pts = [
        `${h-7},3`, `${h+7},3`,
        `${size-3},${h*0.6}`,
        `${h},${size-2}`,
        `3,${h*0.6}`
      ].join(' ');
      inner  = `<polygon points="${pts}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>
               <line x1="${h-7}" y1="3" x2="${h}" y2="${size-2}" stroke="${c2}" stroke-width="0.8" opacity="0.4"/>
               <line x1="${h+7}" y1="3" x2="${h}" y2="${size-2}" stroke="${c2}" stroke-width="0.8" opacity="0.4"/>
               <line x1="${3}" y1="${h*0.6}" x2="${size-3}" y2="${h*0.6}" stroke="${c2}" stroke-width="0.8" opacity="0.4"/>`;
      clipEl = `<polygon points="${pts}"/>`;
      break;
    }
    case 'scroll': {
      // Parchment scroll with rolled ends
      const mx = size * 0.1, capR = size * 0.11;
      inner  = `<rect x="${mx}" y="${mx+capR}" width="${size-2*mx}" height="${size-2*mx-2*capR}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>
               <ellipse cx="${h}" cy="${mx+capR}" rx="${h-mx}" ry="${capR}" fill="${c}" stroke="${c2}" stroke-width="1.5"/>
               <ellipse cx="${h}" cy="${size-mx-capR}" rx="${h-mx}" ry="${capR}" fill="${c2}" stroke="${c2}" stroke-width="1.5"/>
               <line x1="${mx+5}" y1="${h-4}" x2="${size-mx-5}" y2="${h-4}" stroke="${c2}" stroke-width="1" opacity="0.45"/>
               <line x1="${mx+5}" y1="${h}" x2="${size-mx-5}" y2="${h}" stroke="${c2}" stroke-width="1" opacity="0.45"/>
               <line x1="${mx+5}" y1="${h+4}" x2="${size-mx-5}" y2="${h+4}" stroke="${c2}" stroke-width="1" opacity="0.45"/>`;
      clipEl = `<rect x="${mx}" y="${mx}" width="${size-2*mx}" height="${size-2*mx}" rx="3"/>`;
      break;
    }
    case 'ghost': {
      // Friendly ghost: ellipse dome + straight sides + 2-bump wavy bottom + dot eyes
      const bTop = h * 0.42, bBot = h * 1.38, wBot = size - 5;
      const d = `M 4,${bTop} A ${h-4},${h*0.52} 0 0 1 ${size-4},${bTop} L ${size-4},${bBot} Q ${h*1.5},${wBot} ${h},${bBot} Q ${h*0.5},${wBot} 4,${bBot} Z`;
      inner  = `<path d="${d}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>
               <circle cx="${h-r*0.28}" cy="${h*0.82}" r="${r*0.12}" fill="${c2}" opacity="0.9"/>
               <circle cx="${h+r*0.28}" cy="${h*0.82}" r="${r*0.12}" fill="${c2}" opacity="0.9"/>`;
      clipEl = `<path d="${d}"/>`;
      break;
    }
    case 'burst': {
      // 16-point starburst — radiant, energetic
      const pts = Array.from({length: 32}, (_, i) => {
        const rad = i % 2 === 0 ? r : r * 0.52;
        const a   = (i * 11.25 - 90) * Math.PI / 180;
        return `${h + rad * Math.cos(a)},${h + rad * Math.sin(a)}`;
      }).join(' ');
      inner  = `<polygon points="${pts}" fill="url(#${gId})" stroke="${c2}" stroke-width="1"/>`;
      clipEl = `<polygon points="${pts}"/>`;
      break;
    }
    case 'hourglass': {
      // Two triangles sharing a centre point — time / capacity
      const d = `M 3,3 L ${size-3},3 L ${h},${h} Z M 3,${size-3} L ${size-3},${size-3} L ${h},${h} Z`;
      inner  = `<path d="${d}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>`;
      clipEl = `<path d="${d}"/>`;
      break;
    }
    case 'pentagon': {
      // Regular 5-sided polygon
      const pts = Array.from({length: 5}, (_, i) => {
        const a = (i * 72 - 90) * Math.PI / 180;
        return `${h + r * Math.cos(a)},${h + r * Math.sin(a)}`;
      }).join(' ');
      inner  = `<polygon points="${pts}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<polygon points="${pts}"/>`;
      break;
    }
    case 'flame': {
      // Teardrop flame: pointed top, curved sides, wider base
      const d = `M ${h},3 C ${size},${h*0.45} ${size-3},${h} ${h+r*0.55},${h*1.1} Q ${size-3},${h*1.65} ${h},${size-2} Q ${3},${h*1.65} ${h-r*0.55},${h*1.1} C ${3},${h} ${0},${h*0.45} ${h},3 Z`;
      inner  = `<path d="${d}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<path d="${d}"/>`;
      break;
    }
    case 'prism': {
      // Equilateral triangle — geometric, "cut"
      const pts = `${h},3 ${size-3},${size-3} 3,${size-3}`;
      inner  = `<polygon points="${pts}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<polygon points="${pts}"/>`;
      break;
    }
    default:
      inner  = `<circle cx="${h}" cy="${h}" r="${r}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      clipEl = `<circle cx="${h}" cy="${h}" r="${r}"/>`;
  }

  // Shine clipped to badge shape so it never bleeds into transparent areas
  const shine = `<ellipse cx="${h*0.72}" cy="${h*0.38}" rx="${h*0.18}" ry="${h*0.13}" fill="white" opacity="0.38" clip-path="url(#${cpId})"/>`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <clipPath id="${cpId}">${clipEl}</clipPath>
  </defs>
  ${inner}${shine}
</svg>`;
}

export function badgeSlotHTML(b, isUnlocked, labelOverride = null, isSelected = false) {
  const label = labelOverride ?? (isUnlocked ? b.name.split(' ')[0] : '?');
  const rarityClass = isUnlocked && b.rarity ? `rarity-${b.rarity}` : '';
  return `
    <div class="badge-slot ${isUnlocked ? '' : 'locked'} ${rarityClass} ${isSelected ? 'selected' : ''}"
         data-badge-id="${b.id}" title="${b.name}: ${b.desc}">
      <div class="badge-gem ${isUnlocked ? 'unlocked' : 'locked'}">${makeBadgeSVG(b, 52)}</div>
      <div class="badge-label">${label}</div>
    </div>`;
}
