// ============================================================
//  BADGE QUEST 2026 — Partners panel
//  Invite flow, group management, invite banner
// ============================================================
import { currentUser, currentProfile } from './auth.js';
import {
  sendGroupInvite, getPendingInvitesForEmail, getSentInvites,
  acceptGroupInvite, declineGroupInvite, leaveGroup,
  loadGroupData, loadPartnerData
} from './db.js';

// Callbacks wired by app.js on init
let _render          = null;
let _setStatus       = null;
let _updateTabLabels = null;
let _getAppState     = null;  // () => { data, currentGroupId, allGroups, _pendingInvites }
let _setAppState     = null;  // (patch) => Object.assign(appState, patch)
let _selectedGroupType = 'party'; // set when user picks type in invite flow

export function initPartners({ render, setStatus, updateTabLabels, getAppState, setAppState }) {
  _render          = render;
  _setStatus       = setStatus;
  _updateTabLabels = updateTabLabels;
  _getAppState     = getAppState;
  _setAppState     = setAppState;
}

// ── Open / close ──────────────────────────────────────────────
export function openPartnersPanel() {
  document.getElementById('partners-overlay').style.display = 'flex';
  renderPartnersPanel();
}

export function closePartnersPanel() {
  document.getElementById('partners-overlay').style.display = 'none';
}

// ── Render partners panel ─────────────────────────────────────
export async function renderPartnersPanel() {
  const { allGroups, currentGroupId, _pendingInvites } = _getAppState();
  const uid = currentUser?.uid;
  if (!uid) return;

  // Groups
  const groupsEl = document.getElementById('partners-groups-list');
  if (allGroups.length === 0) {
    groupsEl.innerHTML = '<div class="partners-empty">No groups yet. Invite someone below!</div>';
  } else {
    groupsEl.innerHTML = allGroups.map(g => {
      const memberStr  = (g.memberEmails || g.members || []).join(', ');
      const typeLabel  = g.type === 'team' ? '👥 TEAM' : '💎 PARTY';
      const typeCls    = g.type === 'team' ? 'group-type-team' : 'group-type-party';
      return `
        <div class="partners-group-row" data-group-row="${g.id}">
          <div style="flex:1;min-width:0">
            <div class="partners-group-name" id="group-name-display-${g.id}">${g.name || 'PARTY'} <span class="group-type-badge ${typeCls}">${typeLabel}</span></div>
            <div class="partners-group-members">${memberStr}</div>
            <div class="partners-rename-row" id="group-rename-row-${g.id}" style="display:none">
              <input class="partners-input partners-rename-input" id="group-rename-input-${g.id}"
                     value="${g.name || 'PARTY'}" maxlength="30">
              <button class="partners-accept-btn" data-rename-save="${g.id}">✓ SAVE</button>
              <button class="partners-decline-btn" data-rename-cancel="${g.id}">✕</button>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
            <button class="partners-rename-btn" data-rename-group="${g.id}">✏️ RENAME</button>
            <button class="partners-leave-btn"  data-group-id="${g.id}">🚪 LEAVE</button>
          </div>
        </div>`;
    }).join('');
  }

  // Sent invites
  let sentInvites = [];
  try { sentInvites = await getSentInvites(uid); } catch (_) {}
  const sentSection = document.getElementById('partners-sent-section');
  const sentList    = document.getElementById('partners-sent-list');
  if (sentInvites.length === 0) {
    sentSection.style.display = 'none';
  } else {
    sentSection.style.display = '';
    sentList.innerHTML = sentInvites.map(inv => {
      const statusCls = inv.status === 'accepted' ? 'accepted' : inv.status === 'declined' ? 'declined' : 'pending';
      const statusLbl = inv.status === 'accepted' ? '✓ ACCEPTED' : inv.status === 'declined' ? '✕ DECLINED' : '⏳ PENDING';
      return `
        <div class="partners-sent-row">
          <div>
            <span class="partners-sent-to">${inv.toEmail}</span>
            <span style="font-family:VT323,monospace;font-size:14px;color:#888"> — ${inv.groupName || ''}</span>
          </div>
          <span class="partners-sent-status ${statusCls}">${statusLbl}</span>
        </div>`;
    }).join('');
  }

  // Incoming invites
  const incomingSection = document.getElementById('partners-incoming-section');
  const incomingList    = document.getElementById('partners-incoming-list');
  if (_pendingInvites.length === 0) {
    incomingSection.style.display = 'none';
  } else {
    incomingSection.style.display = '';
    incomingList.innerHTML = _pendingInvites.map(inv => `
      <div class="partners-invite-row">
        <div class="partners-invite-from">${inv.fromUsername || inv.fromEmail} invited you to:</div>
        <div class="partners-invite-name">"${inv.groupName}"</div>
        <div class="partners-invite-actions">
          <button class="partners-accept-btn" data-invite-id="${inv.id}">✓ ACCEPT</button>
          <button class="partners-decline-btn" data-invite-id="${inv.id}">✕ DECLINE</button>
        </div>
      </div>`).join('');
  }

  // Reset invite flow to type picker
  const typePicker  = document.getElementById('invite-type-picker');
  const formStep    = document.getElementById('invite-form-step');
  if (typePicker) typePicker.style.display = '';
  if (formStep)   formStep.style.display   = 'none';
}

// ── Click handler (delegated from partners overlay) ───────────
export async function handlePartnersClick(e) {

  // Invite type picker — card or button click
  const typeBtn = e.target.closest('[data-invite-type]');
  if (typeBtn) {
    _selectedGroupType = typeBtn.dataset.inviteType;
    const label = _selectedGroupType === 'party' ? '💎 PARTY selected' : '👥 TEAM selected';
    document.getElementById('invite-type-picker').style.display = 'none';
    document.getElementById('invite-form-step').style.display   = '';
    document.getElementById('invite-type-chosen').textContent   = label;
    document.getElementById('invite-name-input').focus();
    return;
  }

  // Back button — return to type picker
  const backBtn = e.target.closest('#invite-back-btn');
  if (backBtn) {
    document.getElementById('invite-type-picker').style.display = '';
    document.getElementById('invite-form-step').style.display   = 'none';
    document.getElementById('invite-status').textContent        = '';
    return;
  }

  // Rename — show input
  const renameBtn = e.target.closest('[data-rename-group]');
  if (renameBtn) {
    const gid = renameBtn.dataset.renameGroup;
    document.getElementById(`group-rename-row-${gid}`).style.display = 'flex';
    document.getElementById(`group-rename-input-${gid}`).focus();
    return;
  }

  // Rename — save
  const renameSave = e.target.closest('[data-rename-save]');
  if (renameSave) {
    const gid   = renameSave.dataset.renameSave;
    const input = document.getElementById(`group-rename-input-${gid}`);
    const name  = input?.value.trim();
    if (!name) return;
    renameSave.disabled = true;
    try {
      const { db }        = await import('./firebase.js');
      const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      await updateDoc(doc(db, 'groups', gid), { name });
      const { allGroups, currentGroupId, data } = _getAppState();
      const g = allGroups.find(g => g.id === gid);
      if (g) g.name = name;
      if (currentGroupId === gid) data.together.name = name;
      _updateTabLabels();
      _render();
      renderPartnersPanel();
    } catch (err) { console.error('Rename error:', err); }
    renameSave.disabled = false;
    return;
  }

  // Rename — cancel
  const renameCancel = e.target.closest('[data-rename-cancel]');
  if (renameCancel) {
    document.getElementById(`group-rename-row-${renameCancel.dataset.renameCancel}`).style.display = 'none';
    return;
  }

  // Leave group
  const leaveBtn = e.target.closest('.partners-leave-btn');
  if (leaveBtn) {
    const groupId = leaveBtn.dataset.groupId;
    if (!confirm("Leave this group? Your shared quests will remain but you won't be linked.")) return;
    leaveBtn.textContent = '…';
    leaveBtn.disabled    = true;
    try {
      await leaveGroup(groupId, currentUser.uid);
      const { allGroups, currentGroupId, data } = _getAppState();
      const newGroups = allGroups.filter(g => g.id !== groupId);
      const newGroupId = currentGroupId === groupId ? (newGroups[0]?.id || null) : currentGroupId;
      const newTogether = newGroups[0] || { name: 'PARTY', goals: [], unlockedCombinedBadges: [], unlockedBalanceBadges: [], badgeDates: {} };
      _setAppState({ allGroups: newGroups, currentGroupId: newGroupId, data: { ...data, together: newTogether, partner: null } });
      _updateTabLabels();
      _render();
      renderPartnersPanel();
    } catch (err) {
      alert('Could not leave group. Try again.');
      leaveBtn.disabled    = false;
      leaveBtn.textContent = '🚪 LEAVE';
    }
    return;
  }

  // Accept invite (in panel)
  const acceptBtn = e.target.closest('.partners-accept-btn');
  if (acceptBtn) { await handleAcceptInvite(acceptBtn.dataset.inviteId); return; }

  // Decline invite (in panel)
  const declineBtn = e.target.closest('.partners-decline-btn');
  if (declineBtn) { await handleDeclineInvite(declineBtn.dataset.inviteId); return; }
}

// ── Accept / decline ─────────────────────────────────────────
export async function handleAcceptInvite(inviteId) {
  const { _pendingInvites, allGroups, data } = _getAppState();
  const invite = _pendingInvites.find(i => i.id === inviteId);
  if (!invite) return;
  _setStatus('JOINING GROUP…');
  try {
    const groupId = await acceptGroupInvite(inviteId, invite, currentUser.uid, currentProfile.email);
    const newPending = _pendingInvites.filter(i => i.id !== inviteId);
    const groupData  = await loadGroupData(groupId);
    groupData.id     = groupId;
    const newGroups  = [...allGroups, groupData];
    const partnerUid = groupData.members.find(uid => uid !== currentUser.uid);
    const partner    = partnerUid ? await loadPartnerData(partnerUid) : null;
    _setAppState({
      _pendingInvites: newPending,
      allGroups:       newGroups,
      currentGroupId:  groupId,
      data:            { ...data, together: groupData, partner }
    });
    _updateTabLabels();
    renderInviteBanner();
    _render();
    renderPartnersPanel();
    _setStatus('GROUP JOINED ✓', 3000);
  } catch (err) {
    console.error('Accept invite error:', err);
    _setStatus('ERROR JOINING GROUP', 3000);
  }
}

export async function handleDeclineInvite(inviteId) {
  try {
    await declineGroupInvite(inviteId);
    const { _pendingInvites } = _getAppState();
    _setAppState({ _pendingInvites: _pendingInvites.filter(i => i.id !== inviteId) });
    renderInviteBanner();
    renderPartnersPanel();
  } catch (_) {}
}

// ── Send invite ───────────────────────────────────────────────
export async function handleSendInvite() {
  const nameInput  = document.getElementById('invite-name-input');
  const emailInput = document.getElementById('invite-email-input');
  const statusEl   = document.getElementById('invite-status');
  const groupName  = nameInput.value.trim();
  const toEmail    = emailInput.value.trim();
  statusEl.className   = 'partners-status';
  statusEl.textContent = '';

  if (!groupName)  { statusEl.className = 'partners-status err'; statusEl.textContent = 'Enter a group name.'; return; }
  if (!toEmail || !toEmail.includes('@')) { statusEl.className = 'partners-status err'; statusEl.textContent = 'Enter a valid email.'; return; }
  if (toEmail.toLowerCase() === currentProfile?.email?.toLowerCase()) {
    statusEl.className = 'partners-status err'; statusEl.textContent = "That's your own email!"; return;
  }

  const sendBtn = document.getElementById('invite-send-btn');
  sendBtn.disabled    = true;
  sendBtn.textContent = '⏳ SENDING…';
  try {
    await sendGroupInvite(currentUser.uid, currentProfile.email, currentProfile.username, toEmail, groupName, _selectedGroupType);
    statusEl.className   = 'partners-status ok';
    statusEl.textContent = "✓ Invite sent! They'll see it when they log in.";
    nameInput.value  = '';
    emailInput.value = '';
    renderPartnersPanel();
  } catch (err) {
    console.error('Send invite error:', err);
    statusEl.className   = 'partners-status err';
    statusEl.textContent = 'Could not send. Try again.';
  }
  sendBtn.disabled    = false;
  sendBtn.textContent = 'SEND INVITE ▶';
}

// ── Invite banner ─────────────────────────────────────────────
export function renderInviteBanner() {
  const existing = document.getElementById('invite-banner');
  if (existing) existing.remove();
  const { _pendingInvites } = _getAppState();
  if (!_pendingInvites.length) return;

  const wb  = document.getElementById('win-body');
  if (!wb)  return;
  const tpl    = document.getElementById('invite-banner-tpl');
  const banner = tpl.content.cloneNode(true);
  banner.querySelector('#invite-banner-content').innerHTML = _pendingInvites.map(inv => `
    <div class="invite-banner-item">
      <span class="invite-banner-text">🎯 <b>${inv.fromUsername || inv.fromEmail}</b> invited you to <b>"${inv.groupName}"</b>!</span>
      <div class="invite-banner-actions">
        <button class="invite-banner-accept"  data-banner-accept="${inv.id}">ACCEPT</button>
        <button class="invite-banner-decline" data-banner-decline="${inv.id}">IGNORE</button>
      </div>
    </div>`).join('');
  wb.insertBefore(banner, wb.firstChild);
}
