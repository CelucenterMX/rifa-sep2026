import { CRITERIA, MAX_SCORE, MAX_STARS, getTeams, getTeam, setScore } from './state.js';
import { totalScore, percentage, criterionLabel, overallLabel, medal, getLeaderboard } from './scoring.js';

// ── DOM refs ─────────────────────────────────────────────────────────────────
const teamListEl    = document.getElementById('team-list');
const emptyStateEl  = document.getElementById('empty-state');
const leaderboardEl = document.getElementById('leaderboard');
const lbEmptyEl     = document.getElementById('lb-empty');
const dialog        = document.getElementById('scoring-dialog');
const dialogTitle   = document.getElementById('dialog-team-name');
const dialogProduct = document.getElementById('dialog-product');
const criteriaEl    = document.getElementById('criteria-list');
const totalValueEl  = document.getElementById('total-score-value');
const pctBarEl      = document.getElementById('pct-bar');
const saveBtnEl     = document.getElementById('btn-save');

let activeTeamId  = null;
const pending     = {};  // criterion id → star value (1-5 or 0)

// ── Public: render teams ───────────────────────────────────────────────────
export function renderTeams() {
  const teams = getTeams();
  emptyStateEl.hidden = teams.length > 0;
  teamListEl.innerHTML = '';
  for (const team of teams) {
    const li = document.createElement('li');
    li.className = 'team-card';
    li.innerHTML = `
      <button class="team-card__body" data-action="score" data-id="${team.id}" aria-label="Calificar ${esc(team.name)}">
        <span class="team-card__avatar">${team.name.trim().charAt(0).toUpperCase()}</span>
        <div class="team-card__info">
          <span class="team-card__name">${esc(team.name)}</span>
          <span class="team-card__product">📦 ${esc(team.product)}</span>
        </div>
        <div class="team-card__status">
          ${team.rated
            ? `<span class="team-score-chip">${totalScore(team.scores)}<small>/${MAX_SCORE}</small></span>
               <span class="rated-badge">✓ Calificado</span>`
            : `<span class="pending-badge">Sin calificar</span>`}
        </div>
      </button>
      <button class="team-card__delete" data-action="delete" data-id="${team.id}" aria-label="Eliminar ${esc(team.name)}">✕</button>
    `;
    teamListEl.appendChild(li);
  }
}

// ── Public: render leaderboard ────────────────────────────────────────────
export function renderLeaderboard() {
  const board = getLeaderboard(getTeams());
  lbEmptyEl.hidden = board.length > 0;
  leaderboardEl.innerHTML = '';
  board.forEach((team, i) => {
    const pct   = percentage(team.scores);
    const total = totalScore(team.scores);
    const lbl   = overallLabel(pct);
    const cls   = i === 0 ? 'lb-row--gold' : i === 1 ? 'lb-row--silver' : i === 2 ? 'lb-row--bronze' : '';
    const row   = document.createElement('div');
    row.className = `lb-row ${cls}`;
    row.innerHTML = `
      <span class="lb-rank">${medal(i)}</span>
      <div class="lb-info">
        <span class="lb-name">${esc(team.name)}</span>
        <span class="lb-product">📦 ${esc(team.product)}</span>
        <div class="lb-breakdown">
          ${CRITERIA.map(c =>
            `<span class="lb-criterion" title="${c.label}">${c.icon} ${starsReadOnly(team.scores[c.id])}</span>`
          ).join('')}
        </div>
      </div>
      <div class="lb-score-block">
        <span class="lb-total">${total}<small>/${MAX_SCORE}</small></span>
        <span class="badge ${lbl.cls}">${lbl.text}</span>
        <div class="lb-bar-wrap"><div class="lb-bar" style="width:${pct}%"></div></div>
      </div>
    `;
    leaderboardEl.appendChild(row);
  });
}

// ── Public: open/close dialog ─────────────────────────────────────────────
export function openScoringDialog(teamId) {
  const team = getTeam(teamId);
  if (!team) return;
  activeTeamId = teamId;
  CRITERIA.forEach(c => { pending[c.id] = team.scores[c.id]; });
  dialogTitle.textContent   = team.name;
  dialogProduct.textContent = `📦 ${team.product}`;
  renderCriteria();
  updateLiveTotal();
  dialog.showModal();
}

export function closeScoringDialog() {
  dialog.close();
  activeTeamId = null;
}

export function saveScores() {
  if (!activeTeamId) return;
  CRITERIA.forEach(c => setScore(activeTeamId, c.id, pending[c.id]));
  closeScoringDialog();
}

export function resetPendingScores() {
  CRITERIA.forEach(c => { pending[c.id] = 0; });
  renderCriteria();
  updateLiveTotal();
}

// ── Internal ──────────────────────────────────────────────────────────────
function renderCriteria() {
  criteriaEl.innerHTML = '';
  for (const c of CRITERIA) {
    const div = document.createElement('div');
    div.className = 'criterion';
    div.innerHTML = `
      <div class="criterion__header">
        <span class="criterion__icon">${c.icon}</span>
        <div class="criterion__text">
          <span class="criterion__label">${c.label}</span>
          <span class="criterion__desc">${c.desc}</span>
        </div>
        <span class="criterion__tag" id="ctag-${c.id}">${criterionLabel(pending[c.id])}</span>
      </div>
      <div class="stars" role="group" aria-label="Puntuación para ${c.label}" data-cid="${c.id}">
        ${starsInteractive(pending[c.id], c.id)}
      </div>
    `;
    criteriaEl.appendChild(div);
  }
  wireStars();
}

function wireStars() {
  criteriaEl.querySelectorAll('.stars').forEach(group => {
    const cid = group.dataset.cid;

    group.addEventListener('click', e => {
      const btn = e.target.closest('[data-val]');
      if (!btn) return;
      const val = Number(btn.dataset.val);
      pending[cid] = pending[cid] === val ? 0 : val;  // toggle same star off
      refreshGroup(group, pending[cid]);
      document.getElementById(`ctag-${cid}`).textContent = criterionLabel(pending[cid]);
      updateLiveTotal();
    });

    group.addEventListener('mouseover', e => {
      const btn = e.target.closest('[data-val]');
      if (btn) hoverGroup(group, Number(btn.dataset.val));
    });
    group.addEventListener('mouseleave', () => refreshGroup(group, pending[cid]));
    group.addEventListener('focusin', e => {
      const btn = e.target.closest('[data-val]');
      if (btn) hoverGroup(group, Number(btn.dataset.val));
    });
    group.addEventListener('focusout', e => {
      if (!group.contains(e.relatedTarget)) refreshGroup(group, pending[cid]);
    });
    group.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const btn = e.target.closest('[data-val]');
        if (btn) btn.click();
      }
    });
  });
}

function starsInteractive(value, cid) {
  return Array.from({ length: MAX_STARS }, (_, i) => {
    const v = i + 1;
    return `<button class="star ${v <= value ? 'star--on' : ''}" data-val="${v}" tabindex="0" aria-label="${v} estrella${v > 1 ? 's' : ''}">★</button>`;
  }).join('');
}

function starsReadOnly(value) {
  return Array.from({ length: MAX_STARS }, (_, i) =>
    `<span class="star star--sm ${i + 1 <= value ? 'star--on' : ''}">★</span>`
  ).join('');
}

function refreshGroup(group, value) {
  group.querySelectorAll('.star').forEach(s => {
    s.classList.toggle('star--on',    Number(s.dataset.val) <= value);
    s.classList.toggle('star--hover', false);
  });
}

function hoverGroup(group, hoverVal) {
  group.querySelectorAll('.star').forEach(s => {
    const v = Number(s.dataset.val);
    s.classList.toggle('star--hover', v <= hoverVal);
    s.classList.toggle('star--on',    false);
  });
}

function updateLiveTotal() {
  const total = CRITERIA.reduce((s, c) => s + (pending[c.id] ?? 0), 0);
  const pct   = Math.round((total / MAX_SCORE) * 100);
  totalValueEl.textContent  = `${total} / ${MAX_SCORE}`;
  pctBarEl.style.width      = `${pct}%`;
  saveBtnEl.disabled        = CRITERIA.some(c => (pending[c.id] ?? 0) === 0);
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
