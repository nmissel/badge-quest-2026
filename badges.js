// ============================================================
//  BADGE QUEST 2026 — Badge definitions, logic, SVG renderer
// ============================================================

// ── Individual badge definitions ─────────────────────────────
export const BADGE_DEFS = [
  { id: 0, name: 'BOULDER BADGE', desc: 'Complete your very first quest!',             emoji: '🪨', color: '#9E9E9E', color2: '#424242', shape: 'octagon', rarity: 'common',    threshold: ()  => 1                  },
  { id: 1, name: 'CASCADE BADGE', desc: 'Complete 4 quests — the momentum builds!',    emoji: '💧', color: '#42A5F5', color2: '#0D47A1', shape: 'drop',    rarity: 'common',    threshold: ()  => 4                  },
  { id: 2, name: 'THUNDER BADGE', desc: 'Complete 8 quests — crackling energy!',       emoji: '⚡', color: '#FFEE58', color2: '#E65100', shape: 'star',    rarity: 'rare',      threshold: ()  => 8                  },
  { id: 3, name: 'RAINBOW BADGE', desc: 'Halfway there! Keep shining!',                emoji: '🌈', color: '#FF80AB', color2: '#880E4F', shape: 'diamond', rarity: 'rare',      threshold: (n) => Math.ceil(n * 0.5) },
  { id: 4, name: 'SOUL BADGE',    desc: 'Complete 16 quests — your spirit is strong!', emoji: '✨', color: '#CE93D8', color2: '#6A1B9A', shape: 'circle',  rarity: 'epic',      threshold: ()  => 16                 },
  { id: 5, name: 'MARSH BADGE',   desc: 'Complete 19 quests — deep in the quest!',     emoji: '🌿', color: '#81C784', color2: '#1B5E20', shape: 'hexagon', rarity: 'epic',      threshold: ()  => 19                 },
  { id: 6, name: 'VOLCANO BADGE', desc: 'Complete 22 quests — unstoppable!',           emoji: '🌋', color: '#EF5350', color2: '#B71C1C', shape: 'shield',  rarity: 'epic',      threshold: ()  => 22                 },
  { id: 7, name: 'EARTH BADGE',   desc: '🏆 ALL quests complete! TRUE CHAMPION!',      emoji: '🏆', color: '#FFD700', color2: '#E65100', shape: 'star6',   rarity: 'legendary', threshold: (n) => n                  },
];

// ── Team badge definitions ────────────────────────────────────
// Combined: unlock when total done across all tabs hits X
export const COMBINED_BADGE_DEFS = [
  { id: 'c0', name: 'STARTER TEAM', desc: "Together you've completed 10 quests!",              color: '#B0C4DE', color2: '#4A6FA5', shape: 'ring',  rarity: 'common', threshold: ()      => 10   },
  { id: 'c1', name: 'POWER PARTY',  desc: "Together you've completed 30 quests — unstoppable!", color: '#FFD060', color2: '#A86000', shape: 'cross', rarity: 'rare',   threshold: ()      => 30   },
  { id: 'c2', name: 'DREAM TEAM',   desc: 'LEGENDARY! Every single quest complete! 🎊',         color: '#FFD700', color2: '#CC4400', shape: 'star4', rarity: 'legendary', threshold: (total) => total },
];

// Balance: unlock when BOTH players are each at ≥ X% done
export const BALANCE_BADGE_DEFS = [
  { id: 'b0', name: 'IN SYNC',  desc: 'Both of you hit 25%! Matching energy! ⚡',     color: '#64D8FF', color2: '#005A8A', shape: 'heart',  rarity: 'common', threshold: 25 },
  { id: 'b1', name: 'PARTNERS', desc: 'Both of you hit 50%! Perfect partnership! 💞', color: '#FF8FAB', color2: '#9A0030', shape: 'arrow',  rarity: 'rare',   threshold: 50 },
  { id: 'b2', name: 'LEGENDS',  desc: 'Both of you hit 75%! Absolute legends! 👑',    color: '#D070FF', color2: '#5A0090', shape: 'crown',  rarity: 'epic',   threshold: 75 },
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
  },
  {
    id: 't1', name: 'PACKED & READY',
    desc: 'Everyone has loaded up 5+ quests. Adventure officially awaits!',
    color: '#66BB6A', color2: '#1B5E20', shape: 'hexagon', rarity: 'common',
    check: ms => ms.length > 0 && ms.every(m => _total(m) >= 5),
  },
  {
    id: 't2', name: 'RISING HEROES',
    desc: "Every crew member has unlocked their first badge. Heroes, one and all!",
    color: '#26C6DA', color2: '#00607A', shape: 'star', rarity: 'rare',
    check: ms => ms.length > 0 && ms.every(m => (m.unlockedBadges?.length || 0) >= 1),
  },
  {
    id: 't3', name: 'ROAD WARRIORS',
    desc: 'Together your crew has smashed 10 quests per person. Unstoppable!',
    color: '#AB47BC', color2: '#4A148C', shape: 'ring', rarity: 'epic',
    check: ms => ms.length > 0 && ms.reduce((s, m) => s + _done(m), 0) >= ms.length * 10,
  },
  {
    id: 't4', name: 'HALL OF LEGENDS',
    desc: 'Every hero is 75%+ done. This crew is going down in history. 👑',
    color: '#FFD700', color2: '#B8600A', shape: 'crown', rarity: 'legendary',
    check: ms => ms.length > 0 && ms.every(m => _pct(m) >= 75),
  },
];

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
      }).join(' ');
      inner = `<polygon points="${pts}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>`;
      break;
    }
    case 'star6': {
      const pts6 = Array.from({length:12}, (_,i) => {
        const rad = i%2===0 ? r : r*0.5;
        const a   = (i*30 - 90) * Math.PI/180;
        return `${h+rad*Math.cos(a)},${h+rad*Math.sin(a)}`;
      }).join(' ');
      inner = `<polygon points="${pts6}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>`;
      break;
    }
    case 'star4': {
      const pts4 = Array.from({length:8}, (_,i) => {
        const rad = i%2===0 ? r : r*0.35;
        const a   = (i*45 - 45) * Math.PI/180;
        return `${h+rad*Math.cos(a)},${h+rad*Math.sin(a)}`;
      }).join(' ');
      inner = `<polygon points="${pts4}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>`;
      break;
    }
    case 'diamond': {
      inner = `<polygon points="${h},2 ${size-2},${h} ${h},${size-2} 2,${h}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    }
    case 'circle':
      inner = `<circle cx="${h}" cy="${h}" r="${r}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    case 'hexagon': {
      const pts2 = Array.from({length:6}, (_,i) => {
        const a = (i*60 - 90) * Math.PI/180;
        return `${h+r*Math.cos(a)},${h+r*Math.sin(a)}`;
      }).join(' ');
      inner = `<polygon points="${pts2}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    }
    case 'shield': {
      inner = `<path d="M${h} 2 L${size-2} ${size*0.28} L${size-2} ${size*0.6} Q${h} ${size-2} ${h} ${size-2} Q2 ${size*0.6} 2 ${size*0.6} L2 ${size*0.28} Z" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    }
    case 'ring': {
      inner = `<circle cx="${h}" cy="${h}" r="${r}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>
               <circle cx="${h}" cy="${h}" r="${r*0.48}" fill="#ECE9D8" stroke="${c2}" stroke-width="1.5"/>`;
      break;
    }
    case 'cross': {
      const t3 = size/3;
      inner = `<polygon points="${t3},0 ${t3*2},0 ${t3*2},${t3} ${size},${t3} ${size},${t3*2} ${t3*2},${t3*2} ${t3*2},${size} ${t3},${size} ${t3},${t3*2} 0,${t3*2} 0,${t3} ${t3},${t3}" fill="url(#${gId})" stroke="${c2}" stroke-width="1.5"/>`;
      break;
    }
    case 'heart': {
      inner = `<path d="M${h} ${size-4} C${h} ${size-4},4 ${size*0.55},4 ${size*0.32} C4 ${size*0.12},${h*0.5} ${size*0.08},${h} ${size*0.28} C${h*1.5} ${size*0.08},${size-4} ${size*0.12},${size-4} ${size*0.32} C${size-4} ${size*0.55},${h} ${size-4},${h} ${size-4}Z" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
      break;
    }
    case 'arrow': {
      const pts5 = [
        `2,${h*0.62}`, `${size*0.56},${h*0.62}`,
        `${size*0.56},${h*0.28}`, `${size-2},${h}`,
        `${size*0.56},${h*1.72}`, `${size*0.56},${h*1.38}`,
        `2,${h*1.38}`
      ].join(' ');
      inner = `<polygon points="${pts5}" fill="url(#${gId})" stroke="${c2}" stroke-width="2"/>`;
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
